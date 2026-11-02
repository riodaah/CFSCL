// Reglas de negocio de Ferrada. Funciones puras: las usan las pantallas, la API y (a futuro) el MCP.

import type { Certificado, OperacionFerrada, TipoProveedor } from "@/db/schema";
import { addDays } from "./dates";

/** Fecha de hoy en Chile, YYYY-MM-DD */
export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

/** Lo que gana CFSCL: comisión fija + margen de compraventa + rebate de la naviera. */
export function ganancia(o: OperacionFerrada) {
  const comision = o.cajas * o.comisionUsdCaja;
  const conMargen = o.ventaUsdCaja != null && o.compraUsdCaja != null;
  const margen = conMargen ? o.cajas * (o.ventaUsdCaja! - o.compraUsdCaja!) : 0;
  const rebate = o.contenedores * o.rebateUsdContenedor;
  return {
    comision,
    margen,
    rebate,
    total: comision + margen + rebate,
    venta: o.ventaUsdCaja != null ? o.cajas * o.ventaUsdCaja : null,
    compra: o.compraUsdCaja != null ? o.cajas * o.compraUsdCaja : null,
  };
}

export type EstadoPago = { estado: "Pagado" | "Pendiente" | "Vencido" | "Sin fecha"; texto: string; monto: number | null };

const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/**
 * Según la orden de compra de Ferrada:
 * Pago 1: anticipo de USD X por caja contra el full set de documentos (BL, CO, CF, PL, factura, CT).
 * Pago 2: saldo según la cuenta de venta, entre 15 y 20 días después del buen arribo.
 * Sin anticipo registrado se asume 50/50 sobre el precio de venta.
 */
export function pagos(o: OperacionFerrada, dias = { desde: 15, hasta: 20 }, ref = hoy()): [EstadoPago, EstadoPago] {
  const total = o.ventaUsdCaja != null ? o.cajas * o.ventaUsdCaja : null;
  const monto1 = o.anticipoUsdCaja != null ? o.cajas * o.anticipoUsdCaja : total != null ? total / 2 : null;
  const monto2 = total != null && monto1 != null ? total - monto1 : null;
  let p1: EstadoPago;
  if (o.pago1Pagado) p1 = { estado: "Pagado", texto: `Pagado el ${dm(o.pago1Pagado)}`, monto: monto1 };
  else if (o.pago1Vence) {
    const vencido = o.pago1Vence < ref;
    p1 = { estado: vencido ? "Vencido" : "Pendiente", texto: `${vencido ? "Venció" : "Vence"} el ${dm(o.pago1Vence)}`, monto: monto1 };
  } else p1 = { estado: "Sin fecha", texto: o.draftEnviado ? "Documentos enviados, falta fecha" : "Contra el full set de documentos", monto: monto1 };

  let p2: EstadoPago;
  if (o.pago2Pagado) p2 = { estado: "Pagado", texto: `Pagado el ${dm(o.pago2Pagado)}`, monto: monto2 };
  else if (o.eta) {
    const desde = addDays(o.eta, dias.desde);
    const hasta = addDays(o.eta, dias.hasta);
    p2 = { estado: hasta < ref ? "Vencido" : "Pendiente", texto: `Entre el ${dm(desde)} y el ${dm(hasta)}`, monto: monto2 };
  } else p2 = { estado: "Sin fecha", texto: `${dias.desde} a ${dias.hasta} días tras la llegada`, monto: monto2 };
  return [p1, p2];
}

/** Nunca se envía el set oficial antes de que Ferrada pague el primer 50%. */
export function setOficialBloqueado(o: OperacionFerrada) {
  return !!o.draftEnviado && !o.setOficialEnviado && !o.pago1Pagado;
}

export function transitoDias(o: Pick<OperacionFerrada, "etd" | "eta">) {
  if (!o.etd || !o.eta) return null;
  return Math.round((Date.parse(o.eta) - Date.parse(o.etd)) / 86400000);
}

/** Semana lunes a domingo que contiene la fecha */
export function semanaDe(ref = hoy()) {
  const d = new Date(ref + "T12:00:00Z");
  const lunes = addDays(ref, -((d.getUTCDay() + 6) % 7));
  return { lunes, domingo: addDays(lunes, 6) };
}

/** Tipos de documento de una operación (un contenedor) de Ferrada */
export const TIPOS_DOC_OPERACION = [
  "Purchase order de Ferrada",
  "Pedido almacén de Ferrada",
  "Orden CFSCL al proveedor",
  "Confirmación de booking",
  "Guía de remisión",
  "Draft de BL",
  "BL",
  "Certificado fitosanitario",
  "Certificado de origen",
  "Packing list",
  "Factura comercial",
  "Cold treatment",
  "Otro",
] as const;

/** "Full set" que exige la orden de compra de Ferrada para pagar el anticipo */
export const FULL_SET_FERRADA = ["BL", "Certificado de origen", "Certificado fitosanitario", "Packing list", "Factura comercial", "Cold treatment"] as const;

/** Certificados que se exigen según el tipo de proveedor (la PO pide buenas prácticas, trazabilidad y responsabilidad social) */
export const CERTIFICADOS_REQUERIDOS: Record<TipoProveedor, readonly string[]> = {
  Exportadora: ["GlobalG.A.P.", "GRASP", "Lugar de producción (SENASA/SAG)"],
  Productor: ["GlobalG.A.P.", "GRASP", "Lugar de producción (SENASA/SAG)"],
  "Planta de embalaje": ["HACCP", "BRCGS"],
};

export const TIPOS_CERTIFICADO = ["GlobalG.A.P.", "GRASP", "Lugar de producción (SENASA/SAG)", "HACCP", "BRCGS", "SPRING", "Otro"] as const;

export const TIPOS_DOC_PROVEEDOR = ["Ficha del proveedor", "Contrato", "Otro"] as const;

export type EstadoCert = "Vigente" | "Por vencer" | "Vencido" | "Falta";

/** Estado del certificado más reciente de un tipo. Avisa 30 días antes del vencimiento. */
export function estadoCertificado(certs: Certificado[], tipo: string, ref = hoy()): { estado: EstadoCert; cert?: Certificado; dias?: number } {
  const c = certs.filter((x) => x.tipo === tipo).sort((a, b) => (b.vigenteHasta ?? "").localeCompare(a.vigenteHasta ?? ""))[0];
  if (!c) return { estado: "Falta" };
  if (!c.vigenteHasta) return { estado: "Vigente", cert: c };
  const dias = Math.round((Date.parse(c.vigenteHasta) - Date.parse(ref)) / 86400000);
  return { estado: dias < 0 ? "Vencido" : dias <= 30 ? "Por vencer" : "Vigente", cert: c, dias };
}

export function resumenCertificados(tipoProveedor: TipoProveedor, certs: Certificado[], ref = hoy()) {
  const lista = CERTIFICADOS_REQUERIDOS[tipoProveedor].map((t) => ({ tipo: t, ...estadoCertificado(certs, t, ref) }));
  return { lista, ok: lista.filter((x) => x.estado === "Vigente" || x.estado === "Por vencer").length, total: lista.length };
}
