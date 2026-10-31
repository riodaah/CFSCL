// Reglas de negocio de Ferrada. Funciones puras: las usan las pantallas, la API y (a futuro) el MCP.

import type { OperacionFerrada } from "@/db/schema";
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

/** Pago 1: 50% contra el draft. Pago 2: 50% entre N y M días después de la llegada. */
export function pagos(o: OperacionFerrada, dias = { desde: 5, hasta: 10 }, ref = hoy()): [EstadoPago, EstadoPago] {
  const mitad = o.ventaUsdCaja != null ? (o.cajas * o.ventaUsdCaja) / 2 : null;
  let p1: EstadoPago;
  if (o.pago1Pagado) p1 = { estado: "Pagado", texto: `Pagado el ${dm(o.pago1Pagado)}`, monto: mitad };
  else if (o.pago1Vence) {
    const vencido = o.pago1Vence < ref;
    p1 = { estado: vencido ? "Vencido" : "Pendiente", texto: `${vencido ? "Venció" : "Vence"} el ${dm(o.pago1Vence)}`, monto: mitad };
  } else p1 = { estado: "Sin fecha", texto: o.draftEnviado ? "Draft enviado, falta fecha" : "Al enviar el draft", monto: mitad };

  let p2: EstadoPago;
  if (o.pago2Pagado) p2 = { estado: "Pagado", texto: `Pagado el ${dm(o.pago2Pagado)}`, monto: mitad };
  else if (o.eta) {
    const desde = addDays(o.eta, dias.desde);
    const hasta = addDays(o.eta, dias.hasta);
    p2 = { estado: hasta < ref ? "Vencido" : "Pendiente", texto: `Entre el ${dm(desde)} y el ${dm(hasta)}`, monto: mitad };
  } else p2 = { estado: "Sin fecha", texto: `${dias.desde} a ${dias.hasta} días tras la llegada`, monto: mitad };
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

/** Tipos de documento de una operación de Ferrada */
export const TIPOS_DOC_OPERACION = [
  "Orden de compra de Ferrada",
  "Orden de compra CFSCL al proveedor",
  "Factura del proveedor",
  "Reserva naviera (booking)",
  "Draft de documentos",
  "Factura comercial",
  "Packing list",
  "Certificado fitosanitario",
  "BL",
  "Certificado de origen",
  "Otro",
] as const;

/** Certificados anuales que se piden al proveedor antes del primer contenedor */
export const TIPOS_CERTIFICADO = [
  "GlobalG.A.P.",
  "Especificación de pallet certificado",
  "Especificación de código de barras",
  "Certificado de inocuidad",
] as const;

export const TIPOS_DOC_PROVEEDOR = [...TIPOS_CERTIFICADO, "Contrato", "Otro"] as const;
