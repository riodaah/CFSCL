// Lógica de negocio: cuadraturas, rendimientos y alertas.
// Es la misma capa que usarán la interfaz, la API REST y el servidor MCP.

import { addDays, diffDays } from "./dates";
import {
  certificadosProveedor,
  clientes,
  destinosFerrada,
  distribucionCalibre,
  documentosProductor,
  exportadores,
  operacionesFerrada,
  fletes,
  lotes,
  ordenes,
  pagosProductor,
  productores,
  recepciones,
  temporadas,
} from "./data";
import { HOY, P } from "./params";
import { CALIBRES, CALIDADES, COLUMNAS_OC, type Alerta, type Calidad, type OperacionFerrada, type OrdenCompra, type PasoOC } from "./types";
import { n } from "./format";

export const cajasDeLote = (l: { cajasPorCalidad: Record<Calidad, number> }) =>
  Object.values(l.cajasPorCalidad).reduce((a, b) => a + b, 0);

export function resumenProductor(productorId: string) {
  const t = temporadas.find((x) => x.productorId === productorId)!;
  const recs = recepciones.filter((r) => r.productorId === productorId);
  const ls = lotes.filter((l) => l.productorId === productorId);
  const binsGuia = recs.reduce((a, r) => a + r.binsGuia, 0);
  const binsRecibidos = recs.reduce((a, r) => a + r.binsRecibidos, 0);
  const kgRecibidos = recs.reduce((a, r) => a + r.kgRecibidos, 0);
  const descuadres = recs.filter((r) => r.binsGuia !== r.binsRecibidos);
  const kgEntradaProc = ls.reduce((a, l) => a + l.kgEntrada, 0);
  const kgIndustrial = ls.reduce((a, l) => a + l.kgIndustrial, 0);
  const cajas = ls.reduce((a, l) => a + cajasDeLote(l), 0);
  const kgEmbalados = Math.round(cajas * P.kgNetoCaja);
  const binsProcesados = ls.reduce((a, l) => a + l.binsProcesados, 0);
  const porCalidad = Object.fromEntries(
    CALIDADES.map((c) => [c, ls.reduce((a, l) => a + l.cajasPorCalidad[c], 0)]),
  ) as Record<Calidad, number>;
  const fs = fletes.filter((f) => recs.some((r) => r.id === f.recepcionId));
  const costoFletes = fs.reduce((a, f) => a + f.montoClp, 0);
  const kgConFactura = recs.filter((r) => fs.find((f) => f.recepcionId === r.id)?.estado === "Asociada").reduce((a, r) => a + r.kgRecibidos, 0);
  const pagos = pagosProductor.filter((p) => p.productorId === productorId);
  const pagado = pagos.filter((p) => p.estado === "Pagado").reduce((a, p) => a + p.montoClp, 0);
  const porPagar = pagos.filter((p) => p.estado !== "Pagado").reduce((a, p) => a + p.montoClp, 0);
  const docs = documentosProductor(productorId);
  const saldoBins = t.binsEnviados - binsRecibidos - t.binsDevueltosVacios;
  const binsNoEntregados = Math.max(0, t.binsContratados - binsRecibidos);
  return {
    temporada: t,
    recepciones: recs,
    lotes: ls,
    binsGuia,
    binsRecibidos,
    kgRecibidos,
    kgPorBin: binsRecibidos ? kgRecibidos / binsRecibidos : 0,
    descuadres,
    binsFaltantes: binsGuia - binsRecibidos,
    avance: binsRecibidos / t.binsContratados,
    binsProcesados,
    kgEntradaProc,
    kgIndustrial,
    cajas,
    kgEmbalados,
    pctExportable: kgEntradaProc ? 1 - kgIndustrial / kgEntradaProc : 0,
    porCalidad,
    pctPremiumExtra: cajas ? (porCalidad.Premium + porCalidad["Extra Fancy"]) / cajas : 0,
    fletes: fs,
    costoFletes,
    fletePorKg: kgConFactura ? costoFletes / kgConFactura : 0,
    costoKgCosecha: binsRecibidos ? (binsRecibidos * P.cosechaPorBin) / kgRecibidos : 0,
    pagos,
    pagado,
    porPagar,
    docs,
    docsFaltantes: docs.filter((d) => d.requerido && !d.recibido),
    saldoBins,
    // El anticipo se pagó por bins contratados; lo no entregado se descuenta en la liquidación
    ajusteAnticipo: binsNoEntregados * P.anticipoPorBin,
  };
}

export type ResumenProductor = ReturnType<typeof resumenProductor>;

export function resumenTemporada() {
  const rs = productores.map((p) => resumenProductor(p.id));
  const sum = (f: (r: ResumenProductor) => number) => rs.reduce((a, r) => a + f(r), 0);
  const porCalidad = Object.fromEntries(CALIDADES.map((c) => [c, sum((r) => r.porCalidad[c])])) as Record<Calidad, number>;
  return {
    porProductor: rs,
    binsContratados: sum((r) => r.temporada.binsContratados),
    binsRecibidos: sum((r) => r.binsRecibidos),
    binsGuia: sum((r) => r.binsGuia),
    kgRecibidos: sum((r) => r.kgRecibidos),
    binsProcesados: sum((r) => r.binsProcesados),
    kgEntradaProc: sum((r) => r.kgEntradaProc),
    kgIndustrial: sum((r) => r.kgIndustrial),
    cajas: sum((r) => r.cajas),
    kgEmbalados: sum((r) => r.kgEmbalados),
    porCalidad,
    camiones: recepciones.length,
    descuadres: recepciones.filter((r) => r.binsGuia !== r.binsRecibidos).length,
  };
}

export function totalOC(o: OrdenCompra) {
  return o.lineas.reduce((a, l) => a + l.cajas * l.precioUsdCaja, 0);
}
export const cajasOC = (o: OrdenCompra) => o.lineas.reduce((a, l) => a + l.cajas, 0);
export const clienteDe = (o: OrdenCompra) => clientes.find((c) => c.id === o.clienteId)!;
export const exportadorDe = (id: string) => exportadores.find((e) => e.id === id)!;

export function columnaDe(paso: PasoOC) {
  return COLUMNAS_OC.find((c) => (c.pasos as readonly string[]).includes(paso))?.id ?? "cerrada";
}

/** El set oficial no se envía mientras no esté pagado el hito contra documentos. */
export function pagoContraDocumentos(o: OrdenCompra) {
  return o.pagos.find((p) => p.hito === "Contra documentos");
}
export function setOficialBloqueado(o: OrdenCompra) {
  if (o.setOficialEnviado) return false;
  const p = pagoContraDocumentos(o);
  return !!p && p.estado !== "Pagado";
}

export function semaforoOC(o: OrdenCompra): "verde" | "amarillo" | "rojo" {
  if (o.pagos.some((p) => p.estado === "Vencido")) return "rojo";
  if (o.pagos.some((p) => p.estado === "Pendiente" && p.vencimiento && diffDays(p.vencimiento, HOY) <= 3)) return "amarillo";
  return "verde";
}

/** Cajas embaladas en los últimos 14 días por calidad y calibre: lo que se puede ofrecer. */
export function stockDisponible() {
  const desde = addDays(HOY, -14);
  const m = {} as Record<Calidad, Record<number, number>>;
  CALIDADES.forEach((c) => {
    const cajas = lotes.filter((l) => l.fecha >= desde).reduce((a, l) => a + l.cajasPorCalidad[c], 0);
    m[c] = Object.fromEntries(CALIBRES.map((cal) => [cal, Math.round(cajas * distribucionCalibre[cal])]));
  });
  // Lo ya comprometido en órdenes con naviera reservada sale del packing propio
  ordenes
    .filter((o) => o.paso === "Reserva naviera")
    .flatMap((o) => o.lineas)
    .filter((l) => l.origen === "Packing")
    .forEach((l) => (m[l.calidad][l.calibre] = Math.max(0, (m[l.calidad][l.calibre] ?? 0) - l.cajas)));
  return m;
}

export type EstadoLinea = { pedido: number; asignado: number; disponibleAntes: number; estado: "Cubierto" | "Parcial" | "Sin fruta" };

/** Revisa las OC en la primera columna en orden de llegada contra el stock de los últimos 14 días. */
export function disponibilidad(): Record<string, EstadoLinea[]> {
  const stock = stockDisponible();
  const out: Record<string, EstadoLinea[]> = {};
  [...ordenes]
    .filter((o) => columnaDe(o.paso) === "oc")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .forEach((o) => {
      out[o.id] = o.lineas.map((l) => {
        const disp = stock[l.calidad][l.calibre] ?? 0;
        const asignado = Math.min(disp, l.cajas);
        stock[l.calidad][l.calibre] = disp - asignado;
        return { pedido: l.cajas, asignado, disponibleAntes: disp, estado: asignado >= l.cajas ? "Cubierto" : asignado > 0 ? "Parcial" : "Sin fruta" };
      });
    });
  return out;
}

export function seguimientos() {
  return clientes
    .map((c) => {
      const activas = ordenes.filter((o) => o.clienteId === c.id && o.paso !== "Cerrada");
      const dias = diffDays(HOY, c.ultimoContacto);
      return { cliente: c, activas, dias };
    })
    .filter((x) => x.activas.length > 0 && x.dias >= P.diasSeguimiento && x.cliente.tipo === "Directo")
    .sort((a, b) => b.dias - a.dias);
}


// ───────── Ferrada ─────────

export const destinoDe = (id: string) => destinosFerrada.find((d) => d.id === id)!;

/** Lo que gana CFSCL en una operación: comisión fija + margen de compraventa + rebate de la naviera. */
export function gananciaFerrada(o: OperacionFerrada) {
  const comision = o.cajas * o.comisionUsdCaja;
  const margen = o.ventaUsdCaja ? o.cajas * (o.ventaUsdCaja - o.compraUsdCaja) : 0;
  const rebate = o.contenedores * o.rebateUsdContenedor;
  return { comision, margen, rebate, total: comision + margen + rebate, venta: o.cajas * o.ventaUsdCaja, compra: o.cajas * o.compraUsdCaja };
}

export type EstadoPagoF = { estado: "Pagado" | "Pendiente" | "Vencido" | "Sin fecha"; texto: string; monto: number };

/** Pago 1: 50% contra el draft. Pago 2: 50% entre 5 y 10 días después de la llegada. */
export function pagosFerrada(o: OperacionFerrada): [EstadoPagoF, EstadoPagoF] {
  const mitad = (o.cajas * o.ventaUsdCaja) / 2;
  let p1: EstadoPagoF;
  if (o.pago1?.pagado) p1 = { estado: "Pagado", texto: `Pagado el ${o.pago1.pagado.slice(8, 10)}/${o.pago1.pagado.slice(5, 7)}`, monto: mitad };
  else if (o.pago1?.vence) p1 = { estado: o.pago1.vence < HOY ? "Vencido" : "Pendiente", texto: `${o.pago1.vence < HOY ? "Venció" : "Vence"} el ${o.pago1.vence.slice(8, 10)}/${o.pago1.vence.slice(5, 7)}`, monto: mitad };
  else p1 = { estado: "Sin fecha", texto: "Al enviar el draft", monto: mitad };
  let p2: EstadoPagoF;
  if (o.pago2?.pagado) p2 = { estado: "Pagado", texto: `Pagado el ${o.pago2.pagado.slice(8, 10)}/${o.pago2.pagado.slice(5, 7)}`, monto: mitad };
  else if (o.eta) {
    const desde = addDays(o.eta, 5), hasta = addDays(o.eta, 10);
    const f = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
    p2 = { estado: hasta < HOY ? "Vencido" : "Pendiente", texto: `Entre el ${f(desde)} y el ${f(hasta)}`, monto: mitad };
  } else p2 = { estado: "Sin fecha", texto: "5 a 10 días después de la llegada", monto: mitad };
  return [p1, p2];
}

export function setOficialBloqueadoF(o: OperacionFerrada) {
  return !!o.draftEnviado && !o.setOficialEnviado && !o.pago1?.pagado;
}

/** Semana lunes a domingo que contiene HOY */
export function semanaActual() {
  const d = new Date(HOY + "T12:00:00Z");
  const lunes = addDays(HOY, -((d.getUTCDay() + 6) % 7));
  return { lunes, domingo: addDays(lunes, 6) };
}

/** Meta: N contenedores por destino cada semana, contados por fecha de zarpe (ETD). */
export function metaSemanalFerrada() {
  const { lunes, domingo } = semanaActual();
  return destinosFerrada.map((d) => {
    const ops = operacionesFerrada.filter((o) => o.destinoId === d.id && o.etd && o.etd >= lunes && o.etd <= domingo);
    return { destino: d, contenedores: ops.reduce((a, o) => a + o.contenedores, 0), ops };
  });
}

export function certificadosDe(proveedorId?: string) {
  return proveedorId ? certificadosProveedor.filter((c) => c.proveedorId === proveedorId) : [];
}

export function pagosProductorPorEstado() {
  const hoy = pagosProductor.filter((p) => p.vencimiento === HOY && p.estado !== "Pagado");
  const proximos = pagosProductor
    .filter((p) => p.estado === "Programado" && p.vencimiento <= addDays(HOY, 30))
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
  return { hoy, proximos };
}

export function alertas(): Alerta[] {
  const out: Alerta[] = [];
  recepciones
    .filter((r) => r.binsGuia !== r.binsRecibidos)
    .forEach((r) => {
      const p = productores.find((x) => x.id === r.productorId)!;
      out.push({
        id: `AL-DQ-${r.id}`,
        fecha: r.fecha,
        severidad: diffDays(HOY, r.fecha) <= 7 ? "Alta" : "Media",
        modulo: "Productores",
        titulo: `Descuadre guía vs romana · ${p.nombre}`,
        detalle: `Guía ${r.numeroGuia} declara ${r.binsGuia} bins y llegaron ${r.binsRecibidos} (camión ${r.patente}, ${r.conductor}). Se paga lo recibido.`,
        href: `/productores/${p.id}?tab=recepciones`,
      });
    });
  recepciones
    .filter((r) => r.kgRecibidos / r.binsRecibidos < P.kgPorBinEstandar * 0.92)
    .forEach((r) => {
      const p = productores.find((x) => x.id === r.productorId)!;
      out.push({
        id: `AL-KG-${r.id}`,
        fecha: r.fecha,
        severidad: "Media",
        modulo: "Productores",
        titulo: `Peso por bin bajo · ${p.nombre}`,
        detalle: `${n(r.kgRecibidos / r.binsRecibidos)} kg/bin en guía ${r.numeroGuia}; el estándar es ~${P.kgPorBinEstandar} kg. Revisar llenado de bins.`,
        href: `/productores/${p.id}?tab=recepciones`,
      });
    });
  productores.forEach((p) => {
    documentosProductor(p.id)
      .filter((d) => !d.recibido)
      .forEach((d) =>
        out.push({
          id: `AL-DOC-${p.id}-${d.tipo}`,
          fecha: HOY,
          severidad: "Alta",
          modulo: "Productores",
          titulo: `Falta ${d.tipo} · ${p.nombre}`,
          detalle: `Llamar a ${p.contacto} (${p.telefono}) para que lo envíe.`,
          href: `/productores/${p.id}?tab=documentos`,
        }),
      );
    const r = resumenProductor(p.id);
    if (r.temporada.cierre && r.saldoBins > 0) {
      out.push({
        id: `AL-BINS-${p.id}`,
        fecha: r.temporada.cierre.fecha,
        severidad: "Media",
        modulo: "Productores",
        titulo: `${n(r.saldoBins)} bins prestados sin devolver · ${p.nombre}`,
        detalle: `La cosecha terminó el ${r.temporada.cierre.fecha.slice(8, 10)}/${r.temporada.cierre.fecha.slice(5, 7)}. Coordinar el retiro de los bins vacíos.`,
        href: `/productores/${p.id}`,
      });
    }
  });
  fletes
    .filter((f) => f.estado === "Pendiente de factura" && diffDays(HOY, f.fecha) > 3)
    .forEach((f) => {
      const r = recepciones.find((x) => x.id === f.recepcionId)!;
      const p = productores.find((x) => x.id === r.productorId)!;
      out.push({
        id: `AL-FL-${f.id}`,
        fecha: f.fecha,
        severidad: "Info",
        modulo: "Productores",
        titulo: `Factura de flete pendiente · ${p.nombre}`,
        detalle: `Camión ${r.patente} del ${r.fecha.slice(8, 10)}/${r.fecha.slice(5, 7)} sin factura de ${f.transportista}. El costo por kilo queda incompleto.`,
        href: `/productores/${p.id}?tab=fletes`,
      });
    });
  ordenes.forEach((o) => {
    const c = clienteDe(o);
    o.pagos
      .filter((p) => p.estado === "Vencido")
      .forEach((p) => {
        const dias = diffDays(HOY, p.vencimiento!);
        out.push({
          id: `AL-PC-${o.id}-${p.hito}`,
          fecha: p.vencimiento!,
          severidad: "Crítica",
          modulo: "Clientes",
          titulo: `${c.contacto} va ${dias} ${dias === 1 ? "día" : "días"} atrasado · ${o.id}`,
          detalle: `Pago "${p.hito}" (${p.pct}%) por US$ ${n(p.montoUsd)} venció el ${p.vencimiento!.slice(8, 10)}/${p.vencimiento!.slice(5, 7)}.`,
          href: `/clientes/oc/${o.id}`,
        });
      });
    if (o.paso === "Draft enviado" && setOficialBloqueado(o)) {
      out.push({
        id: `AL-SET-${o.id}`,
        fecha: o.draftEnviado ?? HOY,
        severidad: "Crítica",
        modulo: "Clientes",
        titulo: `No enviar el set oficial · ${o.id}`,
        detalle: `${c.nombre} tiene el draft, pero no ha pagado el hito contra documentos. Con el set oficial puede retirar el contenedor.`,
        href: `/clientes/oc/${o.id}`,
      });
    }
  });
  const disp = disponibilidad();
  Object.entries(disp).forEach(([id, lineas]) => {
    const falta = lineas.reduce((a, l) => a + (l.pedido - l.asignado), 0);
    if (falta > 0) {
      const o = ordenes.find((x) => x.id === id)!;
      out.push({
        id: `AL-DISP-${id}`,
        fecha: o.fecha,
        severidad: "Alta",
        modulo: "Clientes",
        titulo: `Faltan ${n(falta)} cajas para ${id} · ${clienteDe(o).nombre}`,
        detalle: `Lo embalado en los últimos 14 días no alcanza. Opciones: esperar proceso o comprar caja terminada a una exportadora.`,
        href: `/clientes/oc/${id}`,
      });
    }
  });
  seguimientos().forEach((s) =>
    out.push({
      id: `AL-SEG-${s.cliente.id}`,
      fecha: s.cliente.ultimoContacto,
      severidad: "Media",
      modulo: "Clientes",
      titulo: `Seguimiento: ${s.dias} días sin contacto con ${s.cliente.contacto}`,
      detalle: `${s.cliente.nombre} tiene ${s.activas.length} ${s.activas.length > 1 ? "órdenes activas" : "orden activa"}. Último contacto el ${s.cliente.ultimoContacto.slice(8, 10)}/${s.cliente.ultimoContacto.slice(5, 7)}.`,
      href: `/clientes/${s.cliente.id}`,
    }),
  );
  operacionesFerrada.forEach((o) => {
    const [p1] = pagosFerrada(o);
    if (p1.estado === "Vencido") {
      out.push({
        id: `AL-FE-P1-${o.id}`,
        fecha: o.pago1?.vence ?? HOY,
        severidad: "Crítica",
        modulo: "Ferrada",
        titulo: `Ferrada no ha pagado el primer 50% · ${o.id}`,
        detalle: `${o.producto} ${o.variedad} a ${destinoDe(o.destinoId).puerto}: US$ ${n(p1.monto)}. ${p1.texto}. No enviar el set oficial.`,
        href: `/ferrada/${o.id}`,
      });
    }
  });
  metaSemanalFerrada()
    .filter((m) => m.contenedores < P.metaSemanalDestino)
    .forEach((m) =>
      out.push({
        id: `AL-FE-META-${m.destino.id}`,
        fecha: HOY,
        severidad: m.contenedores === 0 ? "Alta" : "Media",
        modulo: "Ferrada",
        titulo: `${m.destino.puerto}: ${m.contenedores} de ${P.metaSemanalDestino} contenedores esta semana`,
        detalle: `Meta semanal de Ferrada para ${m.destino.pais}. ${m.contenedores === 0 ? "No hay ningún zarpe programado." : "Falta 1 contenedor."}`,
        href: "/ferrada",
      }),
    );
  const proveedoresActivos = new Set(operacionesFerrada.filter((o) => o.paso !== "Cerrada" && o.proveedorId).map((o) => o.proveedorId!));
  proveedoresActivos.forEach((pid) => {
    const faltan = certificadosDe(pid).filter((c) => !c.recibido);
    if (faltan.length) {
      const e = exportadorDe(pid);
      out.push({
        id: `AL-FE-CERT-${pid}`,
        fecha: HOY,
        severidad: "Alta",
        modulo: "Ferrada",
        titulo: `Faltan certificados 2027 · ${e.nombre}`,
        detalle: `${faltan.map((c) => c.tipo).join(", ")}. Se piden una vez antes del primer contenedor. Contacto: ${e.contacto} (${e.telefono}).`,
        href: "/ferrada",
      });
    }
  });
  out.push({
    id: "AL-RET-1",
    fecha: "2027-03-01",
    severidad: "Media",
    modulo: "Proceso",
    titulo: "Producto terminado lleva 11 de 15 días en packing",
    detalle: "2 contenedores de Fuji Premium/Extra Fancy listos desde el 1 de marzo. Asignar a una orden de compra antes del 16 de marzo para evitar cobro de almacenaje.",
    href: "/proceso",
  });
  out.push({
    id: "AL-LIQ-1",
    fecha: HOY,
    severidad: "Info",
    modulo: "Productores",
    titulo: "Primeras liquidaciones (pago 4) vencen en los próximos 10 días",
    detalle: "Corresponden a los lotes embalados a mediados de enero. Revisar flujo de caja.",
    href: "/productores/pagos",
  });
  const orden = { Crítica: 0, Alta: 1, Media: 2, Info: 3 };
  return out.sort((a, b) => orden[a.severidad] - orden[b.severidad] || b.fecha.localeCompare(a.fecha));
}

export function kgPorSemana() {
  const m = new Map<string, number>();
  recepciones.forEach((r) => {
    const d = new Date(r.fecha + "T12:00:00Z");
    const lunes = addDays(r.fecha, -((d.getUTCDay() + 6) % 7));
    m.set(lunes, (m.get(lunes) ?? 0) + r.kgRecibidos);
  });
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
}
