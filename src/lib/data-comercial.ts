// DATOS DE EJEMPLO del lado comercial y de origen alternativo.
// En producción esta capa se reemplaza por llamadas a la API.

import { addDays } from "./dates";
import type {
  Cliente,
  CompraCajaTerminada,
  Exportador,
  NotaGestion,
  OperacionFerrada,
  OrdenCompra,
  PagoCliente,
  ProductorPendiente,
} from "./types";

// ───────── Productores por firmar (próxima temporada) ─────────

export const TEMPORADA_SIGUIENTE = "2027-2028";

export const productoresPendientes: ProductorPendiente[] = [
  { id: "almendral", nombre: "Fundo El Almendral", comuna: "Buin", region: "Metropolitana", contacto: "Patricio Rojas", telefono: "+56 9 8120 5543", variedades: ["Gala", "Fuji"], binsEstimados: 2500, estado: "Por firmar", fecha: "2027-03-09", nota: "Visitado. Buena sanidad del huerto. Pide anticipo de $6.000 por bin." },
  { id: "teno-sur", nombre: "Agrícola Teno Sur", comuna: "Teno", region: "Maule", contacto: "Mónica Araya", telefono: "+56 9 7765 3012", variedades: ["Granny Smith"], binsEstimados: 1800, estado: "Por firmar", fecha: "2027-03-05", nota: "Visitado. Enviará el cuaderno de campo de la temporada pasada antes de firmar." },
  { id: "la-quinta", nombre: "Huertos La Quinta", comuna: "Quinta de Tilcoco", region: "O'Higgins", contacto: "Raúl Pizarro", telefono: "+56 9 9341 7720", variedades: ["Royal Gala", "Cripps Pink"], binsEstimados: 3000, estado: "Por visitar", fecha: "2027-03-17", nota: "Recomendado por Agrícola Lozano." },
  { id: "romeral", nombre: "Frutícola Romeral", comuna: "Romeral", region: "Maule", contacto: "Sergio Tapia", telefono: "+56 9 6612 4408", variedades: ["Fuji"], binsEstimados: 1200, estado: "Por visitar", fecha: "2027-03-19", nota: "Primer contacto por teléfono." },
  { id: "el-peumo", nombre: "Agrícola El Peumo", comuna: "Peumo", region: "O'Higgins", contacto: "Hernán Soto", telefono: "+56 9 5203 1187", variedades: ["Granny Smith"], binsEstimados: 1500, estado: "Por visitar", fecha: "2027-03-23", nota: "No se recontrató en 2025-2026 (69% exportable). Renovó parte del huerto: revisar." },
];

// ───────── Exportadoras de caja terminada ─────────

export const exportadores: Exportador[] = [
  { id: "valle-frio", nombre: "Exportadora Valle Frío S.A.", rut: "96.884.120-3", ciudad: "Rancagua", pais: "Chile", contacto: "Andrés Valenzuela", cargo: "Jefe comercial", telefono: "+56 9 7341 2290", email: "avalenzuela@vallefrio.cl", productos: ["Manzana"], nota: "Responde rápido por WhatsApp. Contenedores listos en 3 a 4 días." },
  { id: "pacifico-sur", nombre: "Frutícola Pacífico Sur Ltda.", rut: "77.302.551-8", ciudad: "Curicó", pais: "Chile", contacto: "Carolina Muñoz", cargo: "Ventas", telefono: "+56 9 6612 0384", email: "cmunoz@pacificosur.cl", productos: ["Manzana"] },
  { id: "berries-sur", nombre: "Berries del Sur SpA", rut: "76.990.212-4", ciudad: "Chillán", pais: "Chile", contacto: "Felipe Ortúzar", cargo: "Gerente comercial", telefono: "+56 9 8870 1123", email: "fortuzar@berriesdelsur.cl", productos: ["Arándano"] },
  { id: "andina-sac", nombre: "Agroexportadora Andina S.A.C.", rut: "RUC 20605512873", ciudad: "Trujillo", pais: "Perú", contacto: "Jorge Quispe", cargo: "Comercial", telefono: "+51 987 220 415", email: "jquispe@agroandina.pe", productos: ["Arándano"] },
];

export const comprasCajaTerminada: CompraCajaTerminada[] = [
  { id: "CT-01", exportadorId: "pacifico-sur", fecha: "2027-01-30", contenedores: 1, cajas: 1029, detalle: "Royal Gala · Extra Fancy 113", costoUsdCaja: 18.6, ocId: "OC-2027-001" },
  { id: "CT-02", exportadorId: "valle-frio", fecha: "2027-03-09", contenedores: 2, cajas: 2058, detalle: "Fuji · Premium 100 y Extra Fancy 113", costoUsdCaja: 21.1, ocId: "OC-2027-006" },
];

// ───────── Clientes ─────────

export const clientes: Cliente[] = [
  { id: "frutas-andinas", nombre: "Frutas Andinas SAS", tipo: "Directo", contacto: "Luis Hernández", telefono: "+57 310 448 2290", email: "luis.hernandez@frutasandinas.co", pais: "Colombia", destinos: ["Buenaventura (Colombia)"], condicionesPago: "30% anticipo · 70% contra documentos", calificacion: 5, clienteDesde: 2017, ultimoContacto: "2027-03-12" },
  { id: "euro-fresh", nombre: "Euro Fresh Trading B.V.", tipo: "Directo", contacto: "Pieter de Vries", telefono: "+31 6 4120 8833", email: "pieter@eurofresh.nl", pais: "Países Bajos", destinos: ["Rotterdam (Países Bajos)", "Callao (Perú)", "Cartagena (Colombia)", "Nhava Sheva (India)"], condicionesPago: "20% anticipo · 80% contra documentos", calificacion: 4, clienteDesde: 2021, ultimoContacto: "2027-03-02" },
  { id: "shenzhen", nombre: "Shenzhen Green Orchard Co.", tipo: "Directo", contacto: "Chen Wei", telefono: "+86 138 2650 7781", email: "chen.wei@sz-greenorchard.cn", pais: "China", destinos: ["Shekou (China)"], condicionesPago: "70% contra documentos · 30% a la llegada", calificacion: 4, clienteDesde: 2023, ultimoContacto: "2027-03-09" },
  { id: "al-waha", nombre: "Al Waha Fresh Foods", tipo: "Directo", contacto: "Omar Al-Harbi", telefono: "+966 55 310 2241", email: "omar@alwahafresh.sa", pais: "Arabia Saudita", destinos: ["Jeddah (Arabia Saudita)"], condicionesPago: "20% anticipo · 50% contra documentos · 30% a la llegada", calificacion: 4, clienteDesde: 2026, ultimoContacto: "2027-03-11" },
  { id: "golfo", nombre: "Distribuidora del Golfo", tipo: "Directo", contacto: "Ana Lucía Ortega", telefono: "+52 33 1880 4410", email: "aortega@delgolfo.mx", pais: "México", destinos: ["Manzanillo (México)"], condicionesPago: "50% contra documentos · 50% a la llegada", calificacion: 3, clienteDesde: 2024, ultimoContacto: "2027-02-27" },
  { id: "ferrada", nombre: "Ferrada", tipo: "Intermediación", contacto: "[Por confirmar]", telefono: "—", email: "—", pais: "Chile", destinos: ["Italia", "Hong Kong", "Taiwán"], condicionesPago: "50% · 50%", calificacion: 5, clienteDesde: 2022, ultimoContacto: "2027-03-10" },
];

// ───────── Órdenes de compra ─────────

export const DOCS_SET_OFICIAL = ["Factura comercial", "Packing list", "Certificado fitosanitario", "BL", "Certificado de origen", "Certificado de seguro"];
function docs(n: number, base: string) {
  return DOCS_SET_OFICIAL.map((tipo, i) => ({ tipo, recibido: i < n ? addDays(base, i % 3) : undefined }));
}
const pg = (hito: PagoCliente["hito"], pct: number, estado: PagoCliente["estado"], vencimiento?: string, pagado?: string): PagoCliente => ({ hito, pct, montoUsd: 0, estado, vencimiento, pagado });
const PK = "Packing" as const;

export const ordenes: OrdenCompra[] = [
  {
    id: "OC-2027-010", clienteId: "euro-fresh", fecha: "2027-03-12", paso: "Orden de compra", contenedores: 2, destinoPuerto: "Callao", destinoPais: "Perú",
    lineas: [
      { calidad: "Extra Fancy", calibre: 125, variedad: "Granny Smith", cajas: 1029, precioUsdCaja: 21.5, origen: PK },
      { calidad: "Fancy", calibre: 138, variedad: "Granny Smith", cajas: 1029, precioUsdCaja: 18.6, origen: PK },
    ],
    negociacion: [{ fecha: "2027-03-02", detalle: "Cotización enviada: 2 contenedores Granny Smith a Callao." }, { fecha: "2027-03-12", detalle: "Orden de compra recibida en formato propio del cliente (Perú)." }],
    documentos: docs(0, "2027-03-12"),
    pagos: [pg("Anticipo", 20, "Sin fecha"), pg("Contra documentos", 80, "Sin fecha")],
  },
  {
    id: "OC-2027-009", clienteId: "al-waha", fecha: "2027-03-11", paso: "Orden de compra", contenedores: 2, destinoPuerto: "Jeddah", destinoPais: "Arabia Saudita",
    lineas: [{ calidad: "Premium", calibre: 100, variedad: "Cripps Pink", cajas: 2058, precioUsdCaja: 27.3, origen: PK }],
    negociacion: [
      { fecha: "2027-03-10", detalle: "Cotización: US$ 27,80 por caja Premium 100." },
      { fecha: "2027-03-11", detalle: "Cliente pidió US$ 0,50 menos por caja. Aceptado: US$ 27,30." },
      { fecha: "2027-03-11", detalle: "Orden de compra recibida." },
    ],
    documentos: docs(0, "2027-03-11"),
    pagos: [pg("Anticipo", 20, "Sin fecha"), pg("Contra documentos", 50, "Sin fecha"), pg("A la llegada", 30, "Sin fecha")],
  },
  {
    id: "OC-2027-008", clienteId: "frutas-andinas", fecha: "2027-03-09", paso: "Disponibilidad", contenedores: 3, destinoPuerto: "Buenaventura", destinoPais: "Colombia",
    lineas: [
      { calidad: "Premium", calibre: 113, variedad: "Fuji", cajas: 2058, precioUsdCaja: 24.1, origen: PK },
      { calidad: "Extra Fancy", calibre: 125, variedad: "Gala", cajas: 1029, precioUsdCaja: 20.7, origen: PK },
    ],
    negociacion: [{ fecha: "2027-03-09", detalle: "Orden de compra recibida. Mismas condiciones que la OC-2027-004." }],
    documentos: docs(0, "2027-03-09"),
    pagos: [pg("Anticipo", 30, "Pendiente", "2027-03-16"), pg("Contra documentos", 70, "Sin fecha")],
  },
  {
    id: "OC-2027-007", clienteId: "golfo", fecha: "2027-03-03", paso: "Reserva naviera", contenedores: 2, destinoPuerto: "Manzanillo", destinoPais: "México",
    lineas: [
      { calidad: "Fancy", calibre: 113, variedad: "Granny Smith", cajas: 1029, precioUsdCaja: 18.9, origen: PK },
      { calidad: "Choice", calibre: 138, variedad: "Granny Smith", cajas: 1029, precioUsdCaja: 15.7, origen: PK },
    ],
    naviera: "CMA CGM", booking: "CMAU-0388412", barco: "CMA CGM Andes", etd: "2027-03-24", eta: "2027-04-08", transitoDias: 15,
    negociacion: [{ fecha: "2027-03-03", detalle: "Orden de compra recibida." }],
    documentos: docs(0, "2027-03-03"),
    pagos: [pg("Contra documentos", 50, "Sin fecha"), pg("A la llegada", 50, "Sin fecha")],
  },
  {
    id: "OC-2027-006", clienteId: "shenzhen", fecha: "2027-02-25", paso: "Reserva naviera", contenedores: 6, destinoPuerto: "Shekou", destinoPais: "China",
    lineas: [
      { calidad: "Premium", calibre: 100, variedad: "Fuji", cajas: 2058, precioUsdCaja: 25.6, origen: PK },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Fuji", cajas: 1029, precioUsdCaja: 22.9, origen: PK },
      { calidad: "Extra Fancy", calibre: 125, variedad: "Cripps Pink", cajas: 1029, precioUsdCaja: 23.4, origen: PK },
      { calidad: "Premium", calibre: 100, variedad: "Fuji", cajas: 1029, precioUsdCaja: 25.6, origen: { exportadorId: "valle-frio", compraId: "CT-02" } },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Fuji", cajas: 1029, precioUsdCaja: 22.9, origen: { exportadorId: "valle-frio", compraId: "CT-02" } },
    ],
    naviera: "Maersk", booking: "MAEU-262044718", barco: "Maersk Kowloon", etd: "2027-03-16", eta: "2027-04-21", transitoDias: 36,
    negociacion: [
      { fecha: "2027-02-24", detalle: "Chen pidió pago 70/30 en vez de 50/50 por el volumen. Aceptado." },
      { fecha: "2027-02-25", detalle: "Orden de compra recibida por 6 contenedores." },
      { fecha: "2027-03-09", detalle: "Packing propio alcanza para 4. Se compran 2 contenedores de caja terminada a Valle Frío." },
    ],
    documentos: docs(0, "2027-02-25"),
    pagos: [pg("Contra documentos", 70, "Sin fecha"), pg("A la llegada", 30, "Sin fecha")],
  },
  {
    id: "OC-2027-005", clienteId: "al-waha", fecha: "2027-02-18", paso: "Embarcado", contenedores: 3, destinoPuerto: "Jeddah", destinoPais: "Arabia Saudita",
    lineas: [
      { calidad: "Premium", calibre: 88, variedad: "Royal Gala", cajas: 1029, precioUsdCaja: 26.0, origen: PK },
      { calidad: "Premium", calibre: 100, variedad: "Royal Gala", cajas: 1029, precioUsdCaja: 25.2, origen: PK },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Gala", cajas: 1029, precioUsdCaja: 22.1, origen: PK },
    ],
    naviera: "Hapag-Lloyd", booking: "HLCU-SAI-551902", barco: "Santos Express", etd: "2027-03-10", eta: "2027-04-12", transitoDias: 33,
    negociacion: [{ fecha: "2027-02-18", detalle: "Orden de compra recibida." }],
    documentos: docs(3, "2027-03-10"),
    pagos: [pg("Anticipo", 20, "Pagado", "2027-02-22", "2027-02-22"), pg("Contra documentos", 50, "Sin fecha"), pg("A la llegada", 30, "Pendiente", "2027-04-12")],
  },
  {
    id: "OC-2027-004", clienteId: "frutas-andinas", fecha: "2027-02-10", paso: "Draft enviado", contenedores: 4, destinoPuerto: "Buenaventura", destinoPais: "Colombia",
    lineas: [
      { calidad: "Premium", calibre: 100, variedad: "Fuji", cajas: 1029, precioUsdCaja: 24.5, origen: PK },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Fuji", cajas: 1029, precioUsdCaja: 21.8, origen: PK },
      { calidad: "Extra Fancy", calibre: 125, variedad: "Gala", cajas: 1029, precioUsdCaja: 20.9, origen: PK },
      { calidad: "Fancy", calibre: 125, variedad: "Granny Smith", cajas: 1029, precioUsdCaja: 18.4, origen: PK },
    ],
    naviera: "MSC", booking: "MSC-VAP-882140", barco: "MSC Valeria", etd: "2027-03-04", eta: "2027-03-18", transitoDias: 14,
    negociacion: [
      { fecha: "2027-02-08", detalle: "Cotización: US$ 25,00 por caja Premium 100." },
      { fecha: "2027-02-09", detalle: "Luis pidió US$ 0,50 menos por caja en Premium. Cerrado en US$ 24,50." },
      { fecha: "2027-02-10", detalle: "Orden de compra recibida." },
    ],
    draftEnviado: "2027-03-08",
    documentos: docs(6, "2027-03-05"),
    pagos: [pg("Anticipo", 30, "Pagado", "2027-02-15", "2027-02-14"), pg("Contra documentos", 70, "Vencido", "2027-03-11")],
  },
  {
    id: "OC-2027-003", clienteId: "euro-fresh", fecha: "2027-02-02", paso: "Set oficial enviado", contenedores: 2, destinoPuerto: "Rotterdam", destinoPais: "Países Bajos",
    lineas: [
      { calidad: "Premium", calibre: 100, variedad: "Royal Gala", cajas: 1029, precioUsdCaja: 25.8, origen: PK },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Royal Gala", cajas: 1029, precioUsdCaja: 22.6, origen: PK },
    ],
    naviera: "Hapag-Lloyd", booking: "HLCU-SAI-548113", barco: "Cap San Lorenzo", etd: "2027-02-24", eta: "2027-03-20", transitoDias: 24,
    negociacion: [{ fecha: "2027-02-02", detalle: "Orden de compra recibida." }],
    draftEnviado: "2027-02-26", setOficialEnviado: "2027-03-02",
    documentos: docs(6, "2027-02-25"),
    pagos: [pg("Anticipo", 20, "Pagado", "2027-02-05", "2027-02-05"), pg("Contra documentos", 80, "Pagado", "2027-03-01", "2027-03-01")],
  },
  {
    id: "OC-2027-002", clienteId: "golfo", fecha: "2027-01-28", paso: "En destino", contenedores: 2, destinoPuerto: "Manzanillo", destinoPais: "México",
    lineas: [
      { calidad: "Extra Fancy", calibre: 113, variedad: "Gala", cajas: 1029, precioUsdCaja: 21.2, origen: PK },
      { calidad: "Fancy", calibre: 125, variedad: "Gala", cajas: 1029, precioUsdCaja: 18.1, origen: PK },
    ],
    naviera: "CMA CGM", booking: "CMAU-0381177", barco: "CMA CGM Tolteca", etd: "2027-02-14", eta: "2027-03-01", transitoDias: 15,
    negociacion: [{ fecha: "2027-01-28", detalle: "Orden de compra recibida." }],
    draftEnviado: "2027-02-16", setOficialEnviado: "2027-02-20",
    documentos: docs(6, "2027-02-15"),
    pagos: [pg("Contra documentos", 50, "Pagado", "2027-02-19", "2027-02-20"), pg("A la llegada", 50, "Vencido", "2027-03-01")],
    recepcionCliente: "Llegada conforme. Reporta 1,5% de cajas con golpe en calibre 125.",
  },
  {
    id: "OC-2027-001", clienteId: "frutas-andinas", fecha: "2027-01-20", paso: "Cerrada", contenedores: 3, destinoPuerto: "Buenaventura", destinoPais: "Colombia",
    lineas: [
      { calidad: "Premium", calibre: 100, variedad: "Royal Gala", cajas: 2058, precioUsdCaja: 24.0, origen: PK },
      { calidad: "Extra Fancy", calibre: 113, variedad: "Royal Gala", cajas: 1029, precioUsdCaja: 21.0, origen: { exportadorId: "pacifico-sur", compraId: "CT-01" } },
    ],
    naviera: "MSC", booking: "MSC-VAP-871022", barco: "MSC Aurora", etd: "2027-02-06", eta: "2027-02-20", transitoDias: 14,
    negociacion: [{ fecha: "2027-01-20", detalle: "Orden de compra recibida." }],
    draftEnviado: "2027-02-08", setOficialEnviado: "2027-02-12",
    documentos: docs(6, "2027-02-07"),
    pagos: [pg("Anticipo", 30, "Pagado", "2027-01-25", "2027-01-24"), pg("Contra documentos", 70, "Pagado", "2027-02-11", "2027-02-11")],
    recepcionCliente: "Llegada conforme, sin reclamos.",
  },
];

ordenes.forEach((o) => {
  const total = o.lineas.reduce((a, l) => a + l.cajas * l.precioUsdCaja, 0);
  o.pagos.forEach((p) => (p.montoUsd = Math.round((total * p.pct) / 100)));
});

// ───────── Ferrada ─────────

export const operacionesFerrada: OperacionFerrada[] = [
  { id: "FE-2027-05", fecha: "2027-03-10", producto: "Manzana Fuji", origenPais: "Chile", exportadorId: "pacifico-sur", destino: "Génova (Italia)", contenedores: 2, cajas: 2058, compraUsdCaja: 23.1, ventaUsdCaja: 23.15, comisionUsdCaja: 0.05, estado: "Buscando fruta" },
  { id: "FE-2027-04", fecha: "2027-03-04", producto: "Arándano", origenPais: "Perú", exportadorId: "andina-sac", destino: "Hong Kong", contenedores: 2, cajas: 9240, compraUsdCaja: 10.95, ventaUsdCaja: 11.0, comisionUsdCaja: 0.05, estado: "Embarcada" },
  { id: "FE-2027-03", fecha: "2027-02-21", producto: "Manzana Royal Gala", origenPais: "Chile", exportadorId: "valle-frio", destino: "Génova (Italia)", contenedores: 3, cajas: 3087, compraUsdCaja: 22.4, ventaUsdCaja: 22.45, comisionUsdCaja: 0.05, estado: "Draft enviado" },
  { id: "FE-2027-02", fecha: "2027-02-03", producto: "Arándano", origenPais: "Chile", exportadorId: "berries-sur", destino: "Kaohsiung (Taiwán)", contenedores: 1, cajas: 4620, compraUsdCaja: 11.6, ventaUsdCaja: 11.65, comisionUsdCaja: 0.05, estado: "Pagada", setOficialEnviado: "2027-02-28" },
  { id: "FE-2027-01", fecha: "2027-01-18", producto: "Arándano", origenPais: "Perú", exportadorId: "andina-sac", destino: "Hong Kong", contenedores: 2, cajas: 9240, compraUsdCaja: 10.8, ventaUsdCaja: 10.85, comisionUsdCaja: 0.05, estado: "Cerrada", setOficialEnviado: "2027-02-10" },
];

// ───────── Registro de gestión ─────────

export const bitacora: Record<string, NotaGestion[]> = {
  "prod:los-andes": [
    { id: "n1", fecha: "2027-03-12T08:42", autor: "Agente de correos", tipo: "Agente", texto: "Recepción guía 30349 registrada desde el correo de la romana: 72 bins en guía, 69 recibidos. Alerta de descuadre creada." },
    { id: "n2", fecha: "2027-03-11T10:20", autor: "Anita", tipo: "Llamada", texto: "Rodrigo confirma que los bins faltantes de la semana pasada quedaron en el campo. Vuelven en el próximo camión." },
    { id: "n3", fecha: "2027-03-08T16:05", autor: "Francisco Padilla", tipo: "Nota", texto: "Pedir que el camión KXPT-21 salga con 72 bins: está llegando con menos." },
  ],
  "prod:lozano": [{ id: "n4", fecha: "2027-03-10T12:30", autor: "Anita", tipo: "Correo", texto: "Se pidió el certificado Syngenta a Marcela por correo. Sin respuesta todavía." }],
  "prod:molina": [
    { id: "n5", fecha: "2027-03-07T09:10", autor: "Anita", tipo: "Nota", texto: "Coordinar el retiro de los bins vacíos que quedan en el huerto." },
    { id: "n6", fecha: "2027-03-05T18:40", autor: "Francisco Padilla", tipo: "Llamada", texto: "Carolina avisa que el granizo del 4 de marzo dañó la fruta restante. Se cierra la cosecha con 1.210 bins." },
  ],
  "prod:san-clemente": [{ id: "n7", fecha: "2027-03-09T15:00", autor: "Anita", tipo: "Llamada", texto: "Andrés envía el análisis de residuos esta semana." }],
  "oc:OC-2027-004": [
    { id: "n8", fecha: "2027-03-12T09:15", autor: "Anita", tipo: "Correo", texto: "Recordatorio de pago enviado a Luis." },
    { id: "n9", fecha: "2027-03-11T18:00", autor: "Francisco Padilla", tipo: "Nota", texto: "No enviar el set oficial hasta que Luis pague el 70%." },
  ],
  "oc:OC-2027-006": [{ id: "n10", fecha: "2027-03-09T11:20", autor: "Francisco Padilla", tipo: "Nota", texto: "Se compran 2 contenedores a Valle Frío para completar los 6. Andrés los tiene listos el 13." }],
  "cli:euro-fresh": [{ id: "n11", fecha: "2027-03-02T17:45", autor: "Francisco Padilla", tipo: "Correo", texto: "Enviada cotización de 2 contenedores Granny Smith a Callao. Esperando respuesta." }],
  "cli:golfo": [{ id: "n12", fecha: "2027-02-27T10:05", autor: "Anita", tipo: "Correo", texto: "Se pidió confirmación de recepción en Manzanillo y el pago de llegada." }],
  "cli:frutas-andinas": [{ id: "n13", fecha: "2027-03-12T09:15", autor: "Anita", tipo: "Correo", texto: "Recordatorio de pago de la OC-2027-004." }],
  ferrada: [{ id: "n14", fecha: "2027-03-10T13:30", autor: "Francisco Padilla", tipo: "Nota", texto: "Ferrada pide 2 contenedores Fuji para Italia. Consultar a Pacífico Sur." }],
};
