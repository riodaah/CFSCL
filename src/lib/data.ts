// DATOS DE EJEMPLO. En producción esta capa se reemplaza por llamadas a la API (Cloud Run + Cloud SQL).
// Todo se genera de forma determinística para que la maqueta sea estable entre visitas.

import { addDays, diffDays, viernesDeSemana } from "./dates";
import { HOY, P, TEMPORADA_ACTUAL } from "./params";
import {
  CALIDADES,
  type Calidad,
  type Cliente,
  type CorreoIngesta,
  type DocumentoProductor,
  type Flete,
  type HistorialTemporada,
  type LoteProceso,
  type OrdenCompra,
  type PagoProductor,
  type Productor,
  type Recepcion,
  type Temporada,
} from "./types";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Semilla {
  p: Productor;
  contratados: number;
  avance: number; // fracción del contrato ya cosechada al día de hoy
  inicioCosecha: string;
  camiones: { patente: string; conductor: string }[];
  descuadres: Record<number, number>; // índice camión → bins faltantes
  kgBajo?: number; // índice de camión con kg/bin fuera de rango
  pctIndustrial: number;
  pesosCalidad: number[];
  docsFaltantes: string[];
  fechaContrato: string;
  estado: Temporada["estado"];
  binsEnviados: number;
  condiciones?: string;
}

const SEMILLAS: Semilla[] = [
  {
    p: { id: "los-andes", nombre: "Agrícola Los Andes", rut: "76.412.338-5", comuna: "Los Andes", region: "Valparaíso", contacto: "Rodrigo Fuenzalida", telefono: "+56 9 8812 4410", email: "rfuenzalida@agricolalosandes.cl", codigoPacking: "PR-0412", variedades: ["Fuji", "Granny Smith"], tamano: "Grande" },
    contratados: 4000, avance: 0.62, inicioCosecha: "2027-01-18",
    camiones: [{ patente: "KXPT-21", conductor: "Juan Contreras" }, { patente: "JHRV-88", conductor: "Luis Maturana" }, { patente: "LBCS-14", conductor: "Pedro Ávila" }],
    descuadres: { 7: 4, 22: 2 }, pctIndustrial: 0.12, pesosCalidad: [0.34, 0.31, 0.2, 0.11, 0.04],
    docsFaltantes: [], fechaContrato: "2026-09-08", estado: "En cosecha", binsEnviados: 4000,
    condiciones: "Productor grande: flete compartido 50/50 sobre 3.500 bins",
  },
  {
    p: { id: "lozano", nombre: "Agrícola Lozano", rut: "77.105.902-1", comuna: "San Fernando", region: "O'Higgins", contacto: "Marcela Lozano", telefono: "+56 9 7720 1185", email: "mlozano@agricolalozano.cl", codigoPacking: "PR-0377", variedades: ["Gala", "Brookfield"], tamano: "Mediano" },
    contratados: 1800, avance: 0.78, inicioCosecha: "2027-01-12",
    camiones: [{ patente: "GFTR-52", conductor: "Óscar Lozano" }, { patente: "HZPL-09", conductor: "Iván Rojas" }],
    descuadres: { 11: 3 }, kgBajo: 5, pctIndustrial: 0.18, pesosCalidad: [0.22, 0.3, 0.26, 0.15, 0.07],
    docsFaltantes: ["Certificado Syngenta"], fechaContrato: "2026-09-21", estado: "En cosecha", binsEnviados: 1800,
  },
  {
    p: { id: "vina-del-mar", nombre: "Agrícola Viña del Mar", rut: "76.980.441-7", comuna: "Limache", region: "Valparaíso", contacto: "Felipe Aranda", telefono: "+56 9 6631 0927", email: "faranda@agrovina.cl", codigoPacking: "PR-0455", variedades: ["Royal Gala"], tamano: "Pequeño" },
    contratados: 1500, avance: 0.9, inicioCosecha: "2027-01-08",
    camiones: [{ patente: "DRKS-33", conductor: "Manuel Pino" }],
    descuadres: {}, pctIndustrial: 0.09, pesosCalidad: [0.4, 0.33, 0.17, 0.08, 0.02],
    docsFaltantes: [], fechaContrato: "2026-09-15", estado: "En cosecha", binsEnviados: 1500,
  },
  {
    p: { id: "san-clemente", nombre: "Huerto San Clemente", rut: "78.334.120-K", comuna: "San Clemente", region: "Maule", contacto: "Andrés Valdés", telefono: "+56 9 9054 3378", email: "avaldes@huertosc.cl", codigoPacking: "PR-0498", variedades: ["Cripps Pink", "Fuji"], tamano: "Mediano" },
    contratados: 2500, avance: 0.41, inicioCosecha: "2027-02-01",
    camiones: [{ patente: "PTXB-71", conductor: "Ricardo Bravo" }, { patente: "RSVK-26", conductor: "Hugo Salas" }],
    descuadres: { 4: 2 }, pctIndustrial: 0.15, pesosCalidad: [0.28, 0.3, 0.22, 0.14, 0.06],
    docsFaltantes: ["Análisis de residuos", "Cuaderno de campo"], fechaContrato: "2026-10-02", estado: "En cosecha", binsEnviados: 2300,
  },
  {
    p: { id: "molina", nombre: "Frutícola Molina", rut: "76.551.873-2", comuna: "Molina", region: "Maule", contacto: "Carolina Espinoza", telefono: "+56 9 5487 2210", email: "cespinoza@fruticolamolina.cl", codigoPacking: "PR-0431", variedades: ["Granny Smith"], tamano: "Mediano" },
    contratados: 2200, avance: 0.55, inicioCosecha: "2027-01-25",
    camiones: [{ patente: "BBXW-40", conductor: "Sergio Núñez" }, { patente: "KLRT-62", conductor: "Tomás Leiva" }],
    descuadres: {}, pctIndustrial: 0.21, pesosCalidad: [0.18, 0.27, 0.28, 0.18, 0.09],
    docsFaltantes: [], fechaContrato: "2026-09-29", estado: "En cosecha", binsEnviados: 2200,
  },
  {
    p: { id: "santiago", nombre: "Agrícola Santiago", rut: "77.640.215-9", comuna: "Paine", region: "Metropolitana", contacto: "Jorge Vergara", telefono: "+56 9 8173 6604", email: "jvergara@agricolasantiago.cl", codigoPacking: "PR-0502", variedades: ["Gala"], tamano: "Pequeño" },
    contratados: 1200, avance: 1, inicioCosecha: "2027-01-06",
    camiones: [{ patente: "FWPH-18", conductor: "Claudio Mella" }],
    descuadres: { 3: 3 }, pctIndustrial: 0.11, pesosCalidad: [0.36, 0.32, 0.19, 0.1, 0.03],
    docsFaltantes: [], fechaContrato: "2026-09-11", estado: "Cosecha terminada", binsEnviados: 1200,
  },
];

const TRANSPORTISTAS: Record<string, string> = {
  "los-andes": "Transportes Aconcagua Ltda.",
  lozano: "Fletes Colchagua SpA",
  "vina-del-mar": "Transportes Pino e Hijos",
  "san-clemente": "Logística Maule Sur",
  molina: "Transportes Núñez",
  santiago: "Fletes Paine SpA",
};

export const productores: Productor[] = SEMILLAS.map((s) => s.p);

export const temporadas: Temporada[] = SEMILLAS.map((s) => ({
  id: `${s.p.id}-${TEMPORADA_ACTUAL}`,
  productorId: s.p.id,
  nombre: TEMPORADA_ACTUAL,
  inicio: "2026-09-01",
  fin: "2027-08-31",
  fechaContrato: s.fechaContrato,
  binsContratados: s.contratados,
  binsEnviados: s.binsEnviados,
  binsDevueltosVacios: s.estado === "Cosecha terminada" ? 18 : 0,
  condicionesEspeciales: s.condiciones,
  estado: s.estado,
}));

export const recepciones: Recepcion[] = [];
export const fletes: Flete[] = [];

SEMILLAS.forEach((s, si) => {
  const r = rng(100 + si);
  const objetivoBins = Math.round(s.contratados * s.avance * (s.avance === 1 ? 0.94 : 1));
  const n = Math.max(1, Math.round(objetivoBins / P.binsPorCamion));
  const ultimoDia = s.estado === "Cosecha terminada" ? "2027-03-03" : addDays(HOY, -1);
  const span = diffDays(ultimoDia, s.inicioCosecha);
  for (let i = 0; i < n; i++) {
    let fecha = addDays(s.inicioCosecha, Math.round((span * i) / Math.max(1, n - 1)));
    const dow = new Date(fecha + "T12:00:00Z").getUTCDay();
    if (dow === 0) fecha = addDays(fecha, 1);
    const guia = i === n - 1 && objetivoBins % 72 > 30 ? objetivoBins % 72 : 72;
    const falt = s.descuadres[i] ?? 0;
    const recibidos = guia - falt;
    const factor = s.kgBajo === i ? 0.88 : 0.95 + r() * 0.1;
    const kg = Math.round(recibidos * P.kgPorBinEstandar * factor);
    const cam = s.camiones[i % s.camiones.length];
    const id = `REC-${s.p.codigoPacking.slice(3)}-${String(i + 1).padStart(3, "0")}`;
    const tieneFactura = i < n - 2;
    const fleteId = `FL-${id.slice(4)}`;
    recepciones.push({
      id,
      temporadaId: `${s.p.id}-${TEMPORADA_ACTUAL}`,
      productorId: s.p.id,
      fecha,
      numeroGuia: String(30120 + si * 900 + i * 7),
      patente: cam.patente,
      conductor: cam.conductor,
      variedad: s.p.variedades[i % s.p.variedades.length],
      binsGuia: guia,
      binsRecibidos: recibidos,
      kgRecibidos: kg,
      fuente: i % 9 === 4 ? "manual" : "correo",
      fleteId,
    });
    fletes.push({
      id: fleteId,
      recepcionId: id,
      transportista: TRANSPORTISTAS[s.p.id],
      numeroFactura: tieneFactura ? String(4400 + si * 120 + i) : "—",
      montoClp: tieneFactura ? Math.round((280000 + r() * 60000) / 1000) * 1000 : 0,
      fecha: addDays(fecha, 2),
      estado: tieneFactura ? "Asociada" : "Pendiente de factura",
    });
  }
});

// Lotes de proceso: lo recibido en una semana se procesa el lunes siguiente (frío de por medio)
export const lotes: LoteProceso[] = [];
SEMILLAS.forEach((s, si) => {
  const r = rng(500 + si);
  const porSemana = new Map<string, Recepcion[]>();
  recepciones
    .filter((x) => x.productorId === s.p.id)
    .forEach((x) => {
      const v = viernesDeSemana(x.fecha);
      porSemana.set(v, [...(porSemana.get(v) ?? []), x]);
    });
  let k = 0;
  [...porSemana.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([viernes, recs]) => {
      const fecha = addDays(viernes, 3);
      if (fecha > HOY) return;
      const bins = recs.reduce((a, b) => a + b.binsRecibidos, 0);
      const kgEntrada = recs.reduce((a, b) => a + b.kgRecibidos, 0);
      const pctInd = s.pctIndustrial * (0.85 + r() * 0.3);
      const kgIndustrial = Math.round(kgEntrada * pctInd);
      const cajasTot = Math.floor((kgEntrada - kgIndustrial) * 0.985 / P.kgNetoCaja);
      const pesos = s.pesosCalidad.map((w) => w * (0.9 + r() * 0.2));
      const sum = pesos.reduce((a, b) => a + b, 0);
      const cajas = {} as Record<Calidad, number>;
      let acum = 0;
      CALIDADES.forEach((c, i) => {
        const v = i === CALIDADES.length - 1 ? cajasTot - acum : Math.round((cajasTot * pesos[i]) / sum);
        cajas[c] = v;
        acum += v;
      });
      k++;
      lotes.push({
        id: `LP-${s.p.codigoPacking.slice(3)}-${String(k).padStart(2, "0")}`,
        fecha,
        productorId: s.p.id,
        variedad: recs[0].variedad,
        binsProcesados: bins,
        kgEntrada,
        kgIndustrial,
        cajasPorCalidad: cajas,
        fuente: "correo",
      });
    });
});
lotes.sort((a, b) => b.fecha.localeCompare(a.fecha));

// Distribución de calibres de la temporada (participación sobre cajas exportables)
export const distribucionCalibre: Record<number, number> = { 88: 0.07, 100: 0.19, 113: 0.26, 125: 0.24, 138: 0.16, 150: 0.08 };

// Pagos a productores, generados desde recepciones y lotes con la lógica de los 4 hitos
export const pagosProductor: PagoProductor[] = [];
SEMILLAS.forEach((s) => {
  const pid = s.p.id;
  pagosProductor.push({
    id: `PG-${pid}-ANT`,
    productorId: pid,
    tipo: "Anticipo",
    base: `${s.contratados.toLocaleString("es-CL")} bins contratados × $${P.anticipoPorBin.toLocaleString("es-CL")}`,
    montoClp: s.contratados * P.anticipoPorBin,
    vencimiento: addDays(s.fechaContrato, 3),
    estado: "Pagado",
  });
  const sem = new Map<string, number>();
  recepciones.filter((x) => x.productorId === pid).forEach((x) => {
    const v = viernesDeSemana(x.fecha);
    sem.set(v, (sem.get(v) ?? 0) + x.binsRecibidos);
  });
  [...sem.entries()].forEach(([v, bins]) => {
    pagosProductor.push({
      id: `PG-${pid}-COS-${v}`,
      productorId: pid,
      tipo: "Cosecha",
      base: `${bins.toLocaleString("es-CL")} bins recibidos × $${P.cosechaPorBin.toLocaleString("es-CL")}`,
      montoClp: bins * P.cosechaPorBin,
      vencimiento: v,
      estado: v < HOY ? "Pagado" : v === HOY ? "Por pagar" : "Programado",
    });
  });
  lotes.filter((l) => l.productorId === pid).forEach((l) => {
    const kgEmb = Math.round(Object.values(l.cajasPorCalidad).reduce((a, b) => a + b, 0) * P.kgNetoCaja);
    const v = viernesDeSemana(l.fecha);
    pagosProductor.push({
      id: `PG-${pid}-EMB-${l.id}`,
      productorId: pid,
      tipo: "Embalado",
      base: `${kgEmb.toLocaleString("es-CL")} kg embalados × $${P.embaladoPorKg}`,
      montoClp: kgEmb * P.embaladoPorKg,
      vencimiento: v,
      estado: v < HOY ? "Pagado" : v === HOY ? "Por pagar" : "Programado",
    });
    const liq = addDays(l.fecha, P.diasLiquidacion);
    pagosProductor.push({
      id: `PG-${pid}-LIQ-${l.id}`,
      productorId: pid,
      tipo: "Liquidación",
      base: `${kgEmb.toLocaleString("es-CL")} kg × $${P.liquidacionPorKg} · lote ${l.id}`,
      montoClp: kgEmb * P.liquidacionPorKg,
      vencimiento: liq,
      estado: liq < HOY ? "Pagado" : liq === HOY ? "Por pagar" : "Programado",
    });
  });
});

export const TIPOS_DOC_PRODUCTOR = [
  "Contrato firmado",
  "Cuaderno de campo",
  "Certificado Syngenta",
  "Registro de aplicaciones",
  "Análisis de residuos",
  "Certificación GlobalG.A.P.",
];

export function documentosProductor(productorId: string): DocumentoProductor[] {
  const s = SEMILLAS.find((x) => x.p.id === productorId)!;
  return TIPOS_DOC_PRODUCTOR.map((tipo, i) => {
    const falta = s.docsFaltantes.includes(tipo);
    return {
      tipo,
      requerido: true,
      recibido: falta ? undefined : addDays(s.fechaContrato, i * 9),
      fuente: falta ? undefined : i === 0 ? "manual" : i % 2 ? "correo" : "agente",
    };
  });
}

export const historial: HistorialTemporada[] = [
  { productorId: "los-andes", temporada: "2025-2026", binsContratados: 3500, binsEntregados: 3410, pctExportable: 87, pctPremiumExtra: 63, recontratado: true },
  { productorId: "los-andes", temporada: "2024-2025", binsContratados: 3000, binsEntregados: 2780, pctExportable: 84, pctPremiumExtra: 58, recontratado: true },
  { productorId: "lozano", temporada: "2025-2026", binsContratados: 2000, binsEntregados: 1640, pctExportable: 80, pctPremiumExtra: 49, recontratado: true },
  { productorId: "vina-del-mar", temporada: "2025-2026", binsContratados: 1200, binsEntregados: 1195, pctExportable: 91, pctPremiumExtra: 71, recontratado: true },
  { productorId: "molina", temporada: "2025-2026", binsContratados: 2400, binsEntregados: 2010, pctExportable: 78, pctPremiumExtra: 44, recontratado: true },
  { productorId: "santiago", temporada: "2025-2026", binsContratados: 1000, binsEntregados: 990, pctExportable: 88, pctPremiumExtra: 66, recontratado: true },
];

// Productores de temporadas anteriores que no se recontrataron (para mostrar la decisión)
export const productoresInactivos = [
  { nombre: "Agrícola El Peumo", comuna: "Peumo", ultimaTemporada: "2025-2026", pctExportable: 69, motivo: "Rendimiento bajo: 69% exportable" },
  { nombre: "Fundo Las Mercedes", comuna: "Talagante", ultimaTemporada: "2024-2025", pctExportable: 74, motivo: "Entregó 71% de lo contratado" },
];

export const clientes: Cliente[] = [
  { id: "frutas-andinas", nombre: "Frutas Andinas SAS", contacto: "Luis Hernández", pais: "Colombia", puertoDestino: "Buenaventura", condicionesPago: "30% anticipo · 70% contra set de documentos (3 días)", email: "luis.hernandez@frutasandinas.co" },
  { id: "al-waha", nombre: "Al Waha Fresh Foods", contacto: "Omar Al-Harbi", pais: "Arabia Saudita", puertoDestino: "Jeddah", condicionesPago: "20% anticipo · 50% a la carga · 30% a la llegada", email: "omar@alwahafresh.sa" },
  { id: "shenzhen-green", nombre: "Shenzhen Green Orchard Co.", contacto: "Wei Zhang", pais: "China", puertoDestino: "Shekou", condicionesPago: "10% anticipo · 90% a 30 días de la llegada (volumen)", email: "wei.zhang@sz-greenorchard.cn" },
  { id: "golfo", nombre: "Distribuidora del Golfo", contacto: "Ana Lucía Ortega", pais: "México", puertoDestino: "Manzanillo", condicionesPago: "50% contra documentos · 50% a la llegada", email: "aortega@delgolfo.mx" },
];

const DOCS_EXPO = ["Orden de compra", "Factura comercial", "Packing list", "Certificado fitosanitario", "BL", "Certificado de origen"];
function docs(n: number, base: string) {
  return DOCS_EXPO.map((tipo, i) => ({ tipo, recibido: i < n ? addDays(base, i) : undefined }));
}

export const ordenes: OrdenCompra[] = [
  {
    id: "OC-2027-004", clienteId: "frutas-andinas", fecha: "2027-02-10", etapa: "Documentos enviados", contenedores: 4,
    lineas: [
      { calidad: "Premium", calibre: 100, variedad: "Fuji", cajas: 2160, precioUsdCaja: 24.5 },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Fuji", cajas: 2160, precioUsdCaja: 21.8 },
      { calidad: "Extra Fancy", calibre: 125, variedad: "Gala", cajas: 2160, precioUsdCaja: 20.9 },
      { calidad: "Fancy", calibre: 125, variedad: "Granny Smith", cajas: 2160, precioUsdCaja: 18.4 },
    ],
    naviera: "MSC", booking: "MSC-VAP-882140", nave: "MSC Valeria", etd: "2027-03-04", eta: "2027-03-18", costoTransporteClp: 2_640_000,
    documentos: docs(6, "2027-03-05"), fechaEnvioSetDocs: "2027-03-08",
    pagos: [
      { hito: "Anticipo", pct: 30, montoUsd: 0, vencimiento: "2027-02-15", estado: "Pagado" },
      { hito: "Contra set de documentos", pct: 70, montoUsd: 0, vencimiento: "2027-03-11", estado: "Vencido" },
    ],
  },
  {
    id: "OC-2027-005", clienteId: "al-waha", fecha: "2027-02-18", etapa: "Embarcado", contenedores: 3,
    lineas: [
      { calidad: "Premium", calibre: 88, variedad: "Royal Gala", cajas: 2160, precioUsdCaja: 26.0 },
      { calidad: "Premium", calibre: 100, variedad: "Royal Gala", cajas: 2160, precioUsdCaja: 25.2 },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Gala", cajas: 2160, precioUsdCaja: 22.1 },
    ],
    naviera: "Hapag-Lloyd", booking: "HLCU-SAI-551902", nave: "Santos Express", etd: "2027-03-10", eta: "2027-04-12", costoTransporteClp: 2_100_000,
    documentos: docs(3, "2027-03-10"),
    pagos: [
      { hito: "Anticipo", pct: 20, montoUsd: 0, vencimiento: "2027-02-22", estado: "Pagado" },
      { hito: "A la carga", pct: 50, montoUsd: 0, vencimiento: "2027-03-15", estado: "Pendiente" },
      { hito: "A la llegada", pct: 30, montoUsd: 0, vencimiento: "2027-04-12", estado: "Pendiente" },
    ],
  },
  {
    id: "OC-2027-006", clienteId: "shenzhen-green", fecha: "2027-02-25", etapa: "Transporte a puerto", contenedores: 6,
    lineas: [
      { calidad: "Premium", calibre: 100, variedad: "Fuji", cajas: 4320, precioUsdCaja: 25.6 },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Fuji", cajas: 4320, precioUsdCaja: 22.9 },
      { calidad: "Extra Fancy", calibre: 125, variedad: "Cripps Pink", cajas: 4320, precioUsdCaja: 23.4 },
    ],
    naviera: "Maersk", booking: "MAEU-262044718", nave: "Maersk Kowloon", etd: "2027-03-16", eta: "2027-04-21", costoTransporteClp: 3_960_000,
    documentos: docs(1, "2027-02-25"),
    pagos: [
      { hito: "Anticipo", pct: 10, montoUsd: 0, vencimiento: "2027-03-01", estado: "Pagado" },
      { hito: "30 días después de la llegada", pct: 90, montoUsd: 0, vencimiento: "2027-05-21", estado: "Pendiente" },
    ],
  },
  {
    id: "OC-2027-007", clienteId: "golfo", fecha: "2027-03-03", etapa: "Reserva naviera", contenedores: 2,
    lineas: [
      { calidad: "Fancy", calibre: 113, variedad: "Granny Smith", cajas: 2160, precioUsdCaja: 18.9 },
      { calidad: "Choice", calibre: 138, variedad: "Granny Smith", cajas: 2160, precioUsdCaja: 15.7 },
    ],
    naviera: "CMA CGM", booking: "CMAU-0388412", nave: "CMA CGM Andes", etd: "2027-03-24", eta: "2027-04-08",
    documentos: docs(1, "2027-03-03"),
    pagos: [
      { hito: "Contra documentos", pct: 50, montoUsd: 0, estado: "Sin fecha" },
      { hito: "A la llegada", pct: 50, montoUsd: 0, estado: "Sin fecha" },
    ],
  },
  {
    id: "OC-2027-008", clienteId: "frutas-andinas", fecha: "2027-03-09", etapa: "Orden de compra", contenedores: 3,
    lineas: [
      { calidad: "Premium", calibre: 113, variedad: "Fuji", cajas: 3240, precioUsdCaja: 24.1 },
      { calidad: "Extra Fancy", calibre: 125, variedad: "Gala", cajas: 3240, precioUsdCaja: 20.7 },
    ],
    documentos: docs(1, "2027-03-09"),
    pagos: [
      { hito: "Anticipo", pct: 30, montoUsd: 0, vencimiento: "2027-03-16", estado: "Pendiente" },
      { hito: "Contra set de documentos", pct: 70, montoUsd: 0, estado: "Sin fecha" },
    ],
  },
  {
    id: "OC-2027-009", clienteId: "al-waha", fecha: "2027-03-11", etapa: "Orden de compra", contenedores: 2,
    lineas: [{ calidad: "Premium", calibre: 100, variedad: "Cripps Pink", cajas: 4320, precioUsdCaja: 27.3 }],
    documentos: docs(1, "2027-03-11"),
    pagos: [
      { hito: "Anticipo", pct: 20, montoUsd: 0, estado: "Sin fecha" },
      { hito: "A la carga", pct: 50, montoUsd: 0, estado: "Sin fecha" },
      { hito: "A la llegada", pct: 30, montoUsd: 0, estado: "Sin fecha" },
    ],
  },
  {
    id: "OC-2027-002", clienteId: "golfo", fecha: "2027-01-28", etapa: "En destino", contenedores: 2,
    lineas: [
      { calidad: "Extra Fancy", calibre: 113, variedad: "Gala", cajas: 2160, precioUsdCaja: 21.2 },
      { calidad: "Fancy", calibre: 125, variedad: "Gala", cajas: 2160, precioUsdCaja: 18.1 },
    ],
    naviera: "CMA CGM", booking: "CMAU-0381177", nave: "CMA CGM Tolteca", etd: "2027-02-14", eta: "2027-03-01", costoTransporteClp: 1_380_000,
    documentos: docs(6, "2027-02-15"), fechaEnvioSetDocs: "2027-02-17",
    pagos: [
      { hito: "Contra documentos", pct: 50, montoUsd: 0, vencimiento: "2027-02-20", estado: "Pagado" },
      { hito: "A la llegada", pct: 50, montoUsd: 0, vencimiento: "2027-03-01", estado: "Vencido" },
    ],
    recepcionCliente: "Llegada conforme. Reporta 1,5% de cajas con golpe en calibre 125.",
  },
  {
    id: "OC-2027-001", clienteId: "frutas-andinas", fecha: "2027-01-20", etapa: "Cerrada", contenedores: 3,
    lineas: [
      { calidad: "Premium", calibre: 100, variedad: "Royal Gala", cajas: 3240, precioUsdCaja: 24.0 },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Royal Gala", cajas: 3240, precioUsdCaja: 21.0 },
    ],
    naviera: "MSC", booking: "MSC-VAP-871022", nave: "MSC Aurora", etd: "2027-02-06", eta: "2027-02-20", costoTransporteClp: 1_950_000,
    documentos: docs(6, "2027-02-07"), fechaEnvioSetDocs: "2027-02-09",
    pagos: [
      { hito: "Anticipo", pct: 30, montoUsd: 0, vencimiento: "2027-01-25", estado: "Pagado" },
      { hito: "Contra set de documentos", pct: 70, montoUsd: 0, vencimiento: "2027-02-12", estado: "Pagado" },
    ],
    recepcionCliente: "Llegada conforme, sin reclamos.",
  },
];

// Completar montos USD de cada hito desde el total de la OC
ordenes.forEach((o) => {
  const total = o.lineas.reduce((a, l) => a + l.cajas * l.precioUsdCaja, 0);
  o.pagos.forEach((p) => (p.montoUsd = Math.round((total * p.pct) / 100)));
});

export const correos: CorreoIngesta[] = [
  {
    id: "ING-0418", recibido: "2027-03-12T08:42", de: "romana@packingvalleverde.cl",
    asunto: "Recepción 12/03 · Agrícola Los Andes · Guía 30349", tipo: "Romana", estado: "Revisión",
    extraido: [
      { campo: "Productor", valor: "Agrícola Los Andes (PR-0412)" }, { campo: "Patente", valor: "KXPT-21" },
      { campo: "Variedad", valor: "Fuji" }, { campo: "Bins según guía", valor: "72" }, { campo: "Bins recibidos", valor: "69" },
      { campo: "Kg netos", valor: "26.418" },
    ],
    validaciones: [
      { ok: true, texto: "Productor y temporada activa encontrados" },
      { ok: false, texto: "Descuadre: la guía declara 72 bins y llegaron 69" },
      { ok: true, texto: "Peso promedio 383 kg/bin, dentro de rango" },
    ],
    accion: "Crear recepción y alerta de descuadre",
  },
  {
    id: "ING-0417", recibido: "2027-03-12T07:55", de: "procesos@packingvalleverde.cl",
    asunto: "Reporte de proceso 11/03/2027", tipo: "Reporte de proceso", estado: "Confirmado",
    extraido: [
      { campo: "Bins procesados", valor: "144 (PR-0377: 72 · PR-0431: 72)" }, { campo: "Kg industrial", valor: "9.210" },
      { campo: "Cajas Premium", valor: "512" }, { campo: "Cajas Extra Fancy", valor: "688" }, { campo: "Calibres", valor: "100 · 113 · 125 · 138" },
    ],
    validaciones: [
      { ok: true, texto: "Códigos de productor reconocidos" },
      { ok: true, texto: "Bins procesados no superan los recibidos" },
    ],
    accion: "Lotes LP creados automáticamente",
  },
  {
    id: "ING-0416", recibido: "2027-03-11T17:20", de: "facturacion@transaconcagua.cl",
    asunto: "Factura electrónica N° 4512 · Flete Los Andes → Packing", tipo: "Factura de flete", estado: "Confirmado",
    extraido: [
      { campo: "Transportista", valor: "Transportes Aconcagua Ltda." }, { campo: "Factura", valor: "4512" },
      { campo: "Patente", valor: "JHRV-88" }, { campo: "Monto", valor: "$312.000" },
    ],
    validaciones: [{ ok: true, texto: "Asociada a recepción por patente y fecha" }, { ok: true, texto: "Costo flete: $11,7 por kg" }],
    accion: "Flete asociado a REC-412-031",
  },
  {
    id: "ING-0415", recibido: "2027-03-11T12:03", de: "contacto@agricolaelpeumo.cl",
    asunto: "Envío documentos temporada · Agrícola El Peumo", tipo: "Documento productor", estado: "Propuesta",
    extraido: [
      { campo: "Productor", valor: "Agrícola El Peumo" }, { campo: "Documento", valor: "Cuaderno de campo 2026-2027" },
      { campo: "Bins ofrecidos", valor: "1.500" },
    ],
    validaciones: [
      { ok: false, texto: "El productor no tiene temporada activa" },
      { ok: true, texto: "Existe en histórico (2025-2026, no recontratado)" },
    ],
    accion: "Propone crear temporada 2026-2027 para Agrícola El Peumo",
  },
  {
    id: "ING-0414", recibido: "2027-03-11T09:47", de: "mlozano@agricolalozano.cl",
    asunto: "RE: documentos pendientes", tipo: "Documento productor", estado: "Confirmado",
    extraido: [{ campo: "Productor", valor: "Agrícola Lozano" }, { campo: "Documento", valor: "Registro de aplicaciones" }],
    validaciones: [{ ok: true, texto: "Adjunto a la temporada 2026-2027" }, { ok: false, texto: "Sigue faltando: Certificado Syngenta" }],
    accion: "Documento guardado; alerta de faltante se mantiene",
  },
  {
    id: "ING-0413", recibido: "2027-03-10T18:31", de: "docs@hlag.com",
    asunto: "BL draft HLCU-SAI-551902 · Santos Express", tipo: "Documentos exportación", estado: "Confirmado",
    extraido: [{ campo: "Booking", valor: "HLCU-SAI-551902" }, { campo: "Documento", valor: "BL (borrador)" }, { campo: "OC", valor: "OC-2027-005" }],
    validaciones: [{ ok: true, texto: "Booking asociado a OC-2027-005" }],
    accion: "BL adjunto a la OC",
  },
  {
    id: "ING-0412", recibido: "2027-03-10T08:15", de: "romana@packingvalleverde.cl",
    asunto: "Recepción 10/03 · varios productores", tipo: "Romana", estado: "Error",
    extraido: [{ campo: "Archivo", valor: "recepcion_1003.pdf (escaneado, ilegible)" }],
    validaciones: [{ ok: false, texto: "No se pudo leer la tabla del PDF adjunto" }],
    accion: "Requiere carga manual de Anita",
  },
];

export { SEMILLAS as _semillas };
