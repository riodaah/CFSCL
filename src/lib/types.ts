// Modelo de dominio CFSCL. Refleja las tablas que tendrá Cloud SQL (PostgreSQL).
// Montos en CLP como enteros; kilos con decimales.

export type Calidad = "Premium" | "Extra Fancy" | "Fancy" | "Choice" | "Comercial";
export const CALIDADES: Calidad[] = ["Premium", "Extra Fancy", "Fancy", "Choice", "Comercial"];
export const CALIBRES = [88, 100, 113, 125, 138, 150] as const;
export type Calibre = (typeof CALIBRES)[number];

export type Fuente = "correo" | "manual" | "agente";

export interface Productor {
  id: string;
  nombre: string;
  rut: string;
  comuna: string;
  region: string;
  contacto: string;
  telefono: string;
  email: string;
  codigoPacking: string;
  variedades: string[];
  tamano: "Grande" | "Mediano" | "Pequeño";
}

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
  estado: "Contrato firmado" | "En cosecha" | "Cosecha terminada" | "Liquidada";
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
  base: string; // "1.152 bins × $31.500"
  montoClp: number;
  vencimiento: string;
  estado: "Pagado" | "Por pagar" | "Programado";
}

export interface DocumentoProductor {
  tipo: string;
  requerido: boolean;
  recibido?: string; // fecha
  fuente?: Fuente;
}

export interface Cliente {
  id: string;
  nombre: string;
  contacto: string;
  pais: string;
  puertoDestino: string;
  condicionesPago: string;
  email: string;
}

export const ETAPAS_OC = [
  "Orden de compra",
  "Reserva naviera",
  "Transporte a puerto",
  "Embarcado",
  "Documentos enviados",
  "En destino",
  "Cerrada",
] as const;
export type EtapaOC = (typeof ETAPAS_OC)[number];

export interface LineaOC {
  calidad: Calidad;
  calibre: Calibre;
  variedad: string;
  cajas: number;
  precioUsdCaja: number;
}

export interface PagoCliente {
  hito: string;
  pct: number;
  montoUsd: number;
  vencimiento?: string;
  estado: "Pagado" | "Pendiente" | "Vencido" | "Sin fecha";
}

export interface OrdenCompra {
  id: string;
  clienteId: string;
  fecha: string;
  etapa: EtapaOC;
  contenedores: number;
  lineas: LineaOC[];
  naviera?: string;
  booking?: string;
  nave?: string;
  etd?: string;
  eta?: string;
  costoTransporteClp?: number;
  documentos: { tipo: string; recibido?: string }[];
  fechaEnvioSetDocs?: string;
  pagos: PagoCliente[];
  recepcionCliente?: string;
}

export type EstadoIngesta = "Confirmado" | "Revisión" | "Propuesta" | "Error";

export interface CorreoIngesta {
  id: string;
  recibido: string;
  de: string;
  asunto: string;
  tipo: "Romana" | "Reporte de proceso" | "Factura de flete" | "Documento productor" | "Documentos exportación" | "Otro";
  estado: EstadoIngesta;
  extraido: { campo: string; valor: string }[];
  validaciones: { ok: boolean; texto: string }[];
  accion: string;
}

export type Severidad = "Crítica" | "Alta" | "Media" | "Info";

export interface Alerta {
  id: string;
  fecha: string;
  severidad: Severidad;
  modulo: "Productores" | "Proceso" | "Exportado" | "Pagos";
  titulo: string;
  detalle: string;
  href: string;
}
