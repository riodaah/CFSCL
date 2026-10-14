// Lógica de negocio: cuadraturas, rendimientos y alertas.
// Es la misma capa que usarán la interfaz, la API REST y el servidor MCP.

import { addDays, diffDays } from "./dates";
import {
  clientes,
  documentosProductor,
  fletes,
  lotes,
  ordenes,
  pagosProductor,
  productores,
  recepciones,
  temporadas,
} from "./data";
import { HOY, P } from "./params";
import { CALIDADES, type Alerta, type Calidad, type OrdenCompra } from "./types";
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

export function semaforoOC(o: OrdenCompra): "verde" | "amarillo" | "rojo" {
  if (o.pagos.some((p) => p.estado === "Vencido")) return "rojo";
  if (o.pagos.some((p) => p.estado === "Pendiente" && p.vencimiento && diffDays(p.vencimiento, HOY) <= 3)) return "amarillo";
  return "verde";
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
          modulo: "Exportado",
          titulo: `${c.contacto} va ${dias} ${dias === 1 ? "día" : "días"} atrasado · ${o.id}`,
          detalle: `Pago "${p.hito}" (${p.pct}%) por US$ ${n(p.montoUsd)} venció el ${p.vencimiento!.slice(8, 10)}/${p.vencimiento!.slice(5, 7)}.`,
          href: `/exportado/${o.id}`,
        });
      });
  });
  out.push({
    id: "AL-RET-1",
    fecha: "2027-03-01",
    severidad: "Media",
    modulo: "Proceso",
    titulo: "Producto terminado lleva 11 de 15 días en packing",
    detalle: "2 contenedores de Fuji Premium/Extra Fancy listos desde el 1 de marzo. Asignar a OC antes del 16 de marzo para evitar cobro de almacenaje.",
    href: "/proceso",
  });
  out.push({
    id: "AL-LIQ-1",
    fecha: HOY,
    severidad: "Info",
    modulo: "Pagos",
    titulo: "Primeras liquidaciones (pago 4) vencen en los próximos 10 días",
    detalle: "Corresponden a los lotes embalados a mediados de enero. Revisar flujo de caja.",
    href: "/pagos",
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
