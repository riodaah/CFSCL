// Modelo de dominio CFSCL. Refleja las tablas que tendrá Cloud SQL (PostgreSQL).
// Montos en CLP como enteros; kilos con decimales; precios de venta en USD.

export type Calidad = "Premium" | "Extra Fancy" | "Fancy" | "Choice" | "Comercial";
export const CALIDADES: Calidad[] = ["Premium", "Extra Fancy", "Fancy", "Choice", "Comercial"];
export const CALIBRES = [88, 100, 113, 125, 138, 150] as const;
export type Calibre = (typeof CALIBRES)[number];

export type Fuente = "correo" | "manual" | "agente";

// ───────── Módulo 1 · Productores (origen de la fruta) ─────────

export interface Productor {
  id: string;
  nombre: string;
  rut: string;
  comuna: string;
  region: string;
  contacto: string;
  telefono: string;
  email: string;
  codigoSag: string; // así identifica el packing al productor en sus reportes
  variedades: string[];
  tamano: "Grande" | "Mediano" | "Pequeño";
}

export type EstadoTemporada = "Contrato firmado" | "En cosecha" | "Cosecha terminada" | "Cosecha cerrada" | "Liquidada";

export interface Temporada {
  id: string;
  productorId: string;
  nombre: string; // "2026-2027"
  inicio: string;
  fin: string;
  fechaContrato: string;
  binsContratados: number;
  binsEnviados: number; // bins vacíos que el packing despachó al productor
  binsDevueltosVacios: number;
  condicionesEspeciales?: string;
  estado: EstadoTemporada;
  /** Cierre anticipado: no llegarán más bins (ej. granizo) */
  cierre?: { fecha: string; motivo: string };
}

/** Productores en conversación para la próxima temporada */
export interface ProductorPendiente {
  id: string;
  nombre: string;
  comuna: string;
  region: string;
  contacto: string;
  telefono: string;
  variedades: string[];
  binsEstimados: number;
  estado: "Por visitar" | "Por firmar";
  fecha: string; // visita agendada o realizada
  nota: string;
}

/** Exportadoras que venden caja terminada (no pasan por el packing propio) */
export interface Exportador {
  id: string;
  nombre: string;
  rut: string;
  ciudad: string;
  pais: "Chile" | "Perú";
  contacto: string;
  cargo: string;
  telefono: string;
  email: string;
  productos: string[];
  nota?: string;
}

export interface CompraCajaTerminada {
  id: string;
  exportadorId: string;
  fecha: string;
  contenedores: number;
  cajas: number;
  detalle: string; // variedad, calidades y calibres
  costoUsdCaja: number;
  ocId?: string;
}

export interface HistorialTemporada {
  productorId: string;
  temporada: string;
  binsContratados: number;
  binsEntregados: number;
  pctExportable: number;
  pctPremiumExtra: number;
  recontratado: boolean;
}

export interface Recepcion {
  id: string;
  temporadaId: string;
  productorId: string;
  fecha: string;
  numeroGuia: string;
  patente: string;
  conductor: string;
  variedad: string;
  binsGuia: number;
  binsRecibidos: number;
  kgRecibidos: number;
  fuente: Fuente;
  fleteId?: string;
}

export interface Flete {
  id: string;
  recepcionId: string;
  transportista: string;
  numeroFactura: string;
  montoClp: number;
  fecha: string;
  estado: "Asociada" | "Pendiente de factura";
}

export interface LoteProceso {
  id: string;
  fecha: string;
  productorId: string;
  variedad: string;
  binsProcesados: number;
  kgEntrada: number;
  kgIndustrial: number;
  cajasPorCalidad: Record<Calidad, number>;
  fuente: Fuente;
}

export type TipoPagoProductor = "Anticipo" | "Cosecha" | "Embalado" | "Liquidación";

export interface PagoProductor {
  id: string;
  productorId: string;
  tipo: TipoPagoProductor;
  base: string;
  montoClp: number;
  vencimiento: string;
  estado: "Pagado" | "Por pagar" | "Programado";
}

export interface DocumentoProductor {
  tipo: string;
  requerido: boolean;
  recibido?: string;
  fuente?: Fuente;
}

// ───────── Módulo 3 · Clientes ─────────

export interface Cliente {
  id: string;
  nombre: string;
  tipo: "Directo" | "Intermediación";
  contacto: string;
  telefono: string;
  email: string;
  pais: string;
  destinos: string[]; // un cliente puede reenviar a varios países
  condicionesPago: string;
  calificacion: number; // 1 a 5
  clienteDesde: number;
  ultimoContacto: string;
}

/** Pasos de una orden de compra. Se agrupan en 3 columnas en el tablero. */
export const PASOS_OC = [
  "Orden de compra",
  "Disponibilidad",
  "Reserva naviera",
  "Embarcado",
  "Draft enviado",
  "Pago recibido",
  "Set oficial enviado",
  "En destino",
  "Cerrada",
] as const;
export type PasoOC = (typeof PASOS_OC)[number];

export const COLUMNAS_OC = [
  { id: "oc", titulo: "Orden de compra", descripcion: "Recibida y verificando fruta", pasos: ["Orden de compra", "Disponibilidad"] },
  { id: "embarque", titulo: "Embarque", descripcion: "Naviera, carga y draft", pasos: ["Reserva naviera", "Embarcado", "Draft enviado"] },
  { id: "cobro", titulo: "Pago y entrega", descripcion: "Pago, set oficial y llegada", pasos: ["Pago recibido", "Set oficial enviado", "En destino"] },
] as const;

export type HitoPago = "Anticipo" | "Contra documentos" | "A la llegada" | "Al contado";

export interface PagoCliente {
  hito: HitoPago;
  pct: number;
  montoUsd: number;
  vencimiento?: string;
  pagado?: string;
  estado: "Pagado" | "Pendiente" | "Vencido" | "Sin fecha";
}

export interface LineaOC {
  calidad: Calidad;
  calibre: Calibre;
  variedad: string;
  cajas: number;
  precioUsdCaja: number;
  /** De dónde sale la fruta: packing propio o caja terminada de una exportadora */
  origen: "Packing" | { exportadorId: string; compraId: string };
}

export interface OrdenCompra {
  id: string;
  clienteId: string;
  fecha: string;
  paso: PasoOC;
  contenedores: number;
  destinoPuerto: string;
  destinoPais: string;
  lineas: LineaOC[];
  naviera?: string;
  booking?: string;
  barco?: string;
  etd?: string;
  eta?: string;
  transitoDias?: number;
  negociacion: { fecha: string; detalle: string }[];
  draftEnviado?: string;
  setOficialEnviado?: string;
  documentos: { tipo: string; recibido?: string }[];
  pagos: PagoCliente[];
  recepcionCliente?: string;
}

// ───────── Ferrada · intermediación ─────────

export interface OperacionFerrada {
  id: string;
  fecha: string;
  producto: string;
  origenPais: "Chile" | "Perú";
  exportadorId: string;
  destino: string;
  contenedores: number;
  cajas: number;
  compraUsdCaja: number;
  ventaUsdCaja: number;
  comisionUsdCaja: number;
  estado: "Buscando fruta" | "Fruta comprada" | "Embarcada" | "Draft enviado" | "Pagada" | "Cerrada";
  setOficialEnviado?: string;
}

// ───────── Transversal ─────────

export interface NotaGestion {
  id: string;
  fecha: string; // YYYY-MM-DDTHH:mm
  autor: string;
  texto: string;
  tipo: "Nota" | "Llamada" | "Correo" | "Agente";
}

export type Severidad = "Crítica" | "Alta" | "Media" | "Info";

export interface Alerta {
  id: string;
  fecha: string;
  severidad: Severidad;
  modulo: "Productores" | "Proceso" | "Clientes" | "Ferrada";
  titulo: string;
  detalle: string;
  href: string;
}
