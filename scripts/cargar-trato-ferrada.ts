// Carga el primer trato real de Ferrada (uva Arra 15 desde Perú, octubre-noviembre 2026)
// con los 20 documentos que envió Francisco. Se puede correr más de una vez: no duplica nada.
//
// Uso:  bash deploy/gcp.sh cargar "<carpeta con los PDF>"
//   o:  DATABASE_URL=... GCS_BUCKET=... npx tsx scripts/cargar-trato-ferrada.ts "<carpeta>"
// Sin GCS_BUCKET los archivos quedan en .uploads/ (solo para desarrollo).

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Storage } from "@google-cloud/storage";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "../src/db/schema";

const AUTOR = "Carga inicial (documentos de Francisco)";

// ───────── Quiénes son ─────────

const PROVEEDORES = [
  {
    clave: "puma",
    nombre: "Agro Exportación Puma S.A.C.",
    tipo: "Exportadora",
    pais: "Perú",
    ciudad: "Lima (San Miguel)",
    idTributario: "20553560927",
    contacto: "Jelissa Mori",
    telefono: "+51 986 924 659",
    email: "jmori@agropuma.com.pe",
    notas:
      "Productor y exportador. Campo: Fundo Sabi, Olmos (Lambayeque), uva Arra 15 en 27 ha. GGN 4059883769296.\nEmbarca por Paita a nombre de Cítricos Gustavo Ferrada (\"on behalf of\").",
  },
  {
    clave: "zeit",
    nombre: "Agrícola Zeit Organisch S.A.C.",
    tipo: "Planta de embalaje",
    pais: "Perú",
    ciudad: "Olmos (Lambayeque)",
    notas: "Planta El Panteón, Fundo La Ladera, Olmos. Embala la uva de Agro Puma: las guías salen desde aquí y el precinto de planta es ZEIT.",
  },
  {
    clave: "jl",
    nombre: "Agroindustrias José & Luis S.A.C.",
    tipo: "Productor",
    pais: "Perú",
    ciudad: "Chepén (La Libertad)",
    notas:
      "Fundo La Copla, Pacanga. GGN 4052852321310. Uva de mesa y palta.\nSus certificados vinieron con la documentación, pero no aparece en las órdenes, guías ni BL de estas operaciones: confirmar con Francisco qué rol tiene.",
  },
] as const;

const CERTIFICADOS = [
  { prov: "puma", tipo: "GlobalG.A.P.", numero: "21453", emisor: "Agrocolor S.L.", desde: "2025-12-07", hasta: "2026-12-06", archivo: "GLOBALGAP-AGRO_EXPORTACION_PUMA" },
  { prov: "puma", tipo: "GRASP", numero: "22039", emisor: "Agrocolor S.L.", desde: "2025-12-06", hasta: "2026-12-05", archivo: "GRASP-AGRO_EXPORTACION_PUMA" },
  { prov: "puma", tipo: "Lugar de producción (SENASA/SAG)", numero: "00009721-2026-MINAGRI-SENASA-DELAM", emisor: "SENASA", desde: "2026-09-18", hasta: "2027-02-28", archivo: "LUGAR_DE_PRODUCCCION" },
  { prov: "zeit", tipo: "HACCP", numero: "HACCP 815/01", emisor: "LSQA S.A.", desde: "2026-09-21", hasta: "2027-09-30", archivo: "HACCP_AGRICOLA_ZEIT" },
  { prov: "zeit", tipo: "BRCGS", numero: "BRC 01031/01 · grado AA", emisor: "LSQA S.A.", desde: "2026-09-21", hasta: "2027-09-30", archivo: "BRCGS_AGRICOLA_ZEIT" },
  { prov: "jl", tipo: "GlobalG.A.P.", numero: "C2026-04160", emisor: "Perry Johnson Registrars", desde: "2026-06-16", hasta: "2027-02-27", archivo: "Final_IFA_Cert" },
  { prov: "jl", tipo: "SPRING", numero: "GGN 4052852321310", emisor: "Perry Johnson Registrars", desde: "2026-06-16", hasta: "2027-02-27", archivo: "Final_SPRING_Cert" },
  // Segunda tanda de documentos
  { prov: "jl", tipo: "GRASP", numero: "GGN 4052852321310", emisor: "Perry Johnson Registrars", desde: "2026-06-16", hasta: "2027-02-27", archivo: "GRASP_Final_Cert" },
  { prov: "zeit", tipo: "Registro FDA", numero: "12939215310 · DUNS 664791914", emisor: "FDA (agente FastForward Trading)", desde: "2025-11-17", hasta: "2026-12-31", archivo: "FDA_ACTUALIZADO" },
  { prov: "zeit", tipo: "Autorización sanitaria (SENASA)", numero: "000024-MINAGRI-SENASA-LAMBAYEQUE", emisor: "SENASA Lambayeque", desde: "2014-03-07", hasta: null, archivo: "AUTORIZACI" },
  { prov: "zeit", tipo: "SMETA (Sedex)", numero: "ZAA600204270 · auditoría 16-17 may 2026", emisor: "LSQA", desde: "2026-05-17", hasta: null, archivo: "SMETA_ZAA600204270" },
];

/** Archivos que se suben a la ficha del proveedor sin datos de vigencia (falta revisarlos). Si no están en la carpeta, se omiten. */
const DOCS_POR_REVISAR = [
  { prov: "zeit", tipo: "Certificado de plantas de tratamiento y/o empaque (por revisar)", archivo: "PLANTAS_DE_TRATAMIENTO" },
  { prov: "jl", tipo: "Certificado FSMA (por revisar)", archivo: "Final_Cert_FSMA" },
];

const DESTINOS = [
  { puerto: "Rotterdam", pais: "Países Bajos", region: "Europa" },
  { puerto: "Philadelphia", pais: "Estados Unidos", region: "Norteamérica" },
] as const;

// ───────── Las 4 operaciones: una por contenedor ─────────

const EU = {
  fechaOrden: "2026-10-28",
  origenPais: "Perú",
  destino: "Rotterdam",
  consignatario: "Schrijvershof B.V. (Oud-Beijerland, Países Bajos)",
  producto: "Uva",
  variedad: "Arra 15",
  calibres: "L up",
  contenedores: 1,
  palletsPorContenedor: 20,
  cajas: 2280,
  anticipoUsdCaja: 11,
  precioMinimoUsdCaja: 17,
  ocFerrada: "28102026",
  naviera: "COSCO",
  barco: "CMA CGM Exemplarity · viaje 0DVQTN1MA",
  etd: "2026-11-04",
  paso: "Reserva naviera",
} as const;

const USA = {
  fechaOrden: "2026-10-22",
  origenPais: "Perú",
  destino: "Philadelphia",
  consignatario: "JV Sunrays Fruits (Tarrytown, NY, EE.UU.)",
  producto: "Uva",
  variedad: "Arra 15",
  calibres: "XL up",
  contenedores: 1,
  palletsPorContenedor: 21,
  cajas: 2160,
  anticipoUsdCaja: 10,
  precioMinimoUsdCaja: null,
  naviera: "ZIM",
  barco: "Oceana · viaje 29N",
  etd: "2026-10-31",
  paso: "Reserva naviera",
} as const;

const OPERACIONES = [
  {
    ...EU,
    codigo: "FE-2026-01",
    booking: "6473374070",
    bl: "EM2611018 (draft)",
    numerosContenedor: "SEKU9023103",
    notas:
      "Europa, contenedor 1 de 2. 2.280 cajas plásticas de 8,2 kg · 18.696 kg netos · 20.588 kg brutos · 20 pallets.\nPrecintos: aduana 004DC129099 · naviera 32977547 · planta Zeit 000048. Termógrafos PD7YN06QX0 / PD7YN06RJ0. -1 °C, ventilación 15 CBM.\nGuía de remisión T001-1005 del 30/10 (DAM 0055-00008025), Olmos → terminal TPE Paita.\nBL emitido por Anicam Cargo Perú. Agente en destino: Ultra Cargo Consultancy B.V.\nPOR CONFIRMAR: la PO 28102026 dice 1 contenedor de 2.260 cajas, pero hay 2 BL de 2.280 cajas. La fecha de zarpe se tomó del draft de BL.",
    docs: [
      ["POGrapes_28102026", "Purchase order de Ferrada"],
      ["DRAFT_EM2611018", "Draft de BL"],
      ["T001-00001005", "Guía de remisión"],
      ["EXPORTACION_VEGETAL-3", "Certificado fitosanitario"],
    ],
  },
  {
    ...EU,
    codigo: "FE-2026-02",
    booking: "6473556290",
    bl: "EM2611021 (draft)",
    numerosContenedor: "SEKU9017029",
    notas:
      "Europa, contenedor 2 de 2. 2.280 cajas plásticas de 8,2 kg · 18.696 kg netos · 20.588 kg brutos · 20 pallets.\nPrecintos: aduana 004DC129079 · naviera 32977651 · planta Zeit 000014. Termógrafos PD7YN06QJ0 / PD7YN06QB0. -1 °C, ventilación 15 CBM.\nGuía de remisión T001-1006 del 30/10 (DAM 0055-00008026), Olmos → terminal TPE Paita.\nPOR CONFIRMAR: el draft de BL dice fecha 04/10/2026 (el del contenedor 1 dice 04/11); parece error de tipeo. ¿Existe una segunda PO para este contenedor?",
    docs: [
      ["POGrapes_28102026", "Purchase order de Ferrada"],
      ["DRAFT_EM2611021", "Draft de BL"],
      ["T001-00001006", "Guía de remisión"],
      ["EXPORTACION_VEGETAL-1", "Certificado fitosanitario"],
    ],
  },
  {
    ...USA,
    codigo: "FE-2026-03",
    ocFerrada: "35V01876",
    booking: "ZIMULMA828608",
    notas:
      "Estados Unidos. Precio «Open» (cuenta de venta): anticipo US$ 10 por caja contra full set.\nPedido almacén de Ferrada: proveedor South American Fruits SpA, 21 pallets, 2.160 cajas de 8,2 kg, US$ 11,00 por caja, carga 24/10. Etiquetar como ARRA.\nBooking ZIM en lista de espera (UNCONF/WTLIST): zarpe 31/10 Paita → Philadelphia. Cold treatment, -0,5 °C, ventilación cerrada. Contrato Agro Reefer Solutions; contenedor vacío en DP World Paita.\nPOR CONFIRMAR: qué booking va con qué PO (se asignaron en orden) y si el buque zarpó.",
    docs: [
      ["POGrapes_35V01876", "Purchase order de Ferrada"],
      ["35V01876_UVA_1", "Pedido almacén de Ferrada"],
      ["ZIMULMA828608", "Confirmación de booking"],
      ["Scan2026-10-28", "Carta de autorización naviera"],
    ],
  },
  {
    ...USA,
    codigo: "FE-2026-04",
    ocFerrada: "35V01877",
    booking: "ZIMULMA828609",
    notas:
      "Estados Unidos. Precio «Open» (cuenta de venta): anticipo US$ 10 por caja contra full set.\nPedido almacén de Ferrada: proveedor South American Fruits SpA, 21 pallets, 2.160 cajas de 8,2 kg, US$ 11,00 por caja, carga 24/10. Etiquetar como ARRA.\nBooking ZIM en lista de espera (UNCONF/WTLIST): zarpe 31/10 Paita → Philadelphia. Cold treatment, -0,5 °C, ventilación cerrada.\nPOR CONFIRMAR: qué booking va con qué PO (se asignaron en orden) y si el buque zarpó.",
    docs: [
      ["PO_Grapes_35V01877", "Purchase order de Ferrada"],
      ["35V01877_UVA_2", "Pedido almacén de Ferrada"],
      ["ZIMULMA828609", "Confirmación de booking"],
      ["Scan2026-10-28", "Carta de autorización naviera"],
    ],
  },
];

const NOTA_FERRADA =
  "Primer trato cargado. Ferrada = Cítricos Gustavo Ferrada y Asoc. S.L. (Burriana, España), firma sus órdenes como «GF Grupo Unión».\nCompra uva Arra 15 a Agro Exportación Puma (Perú), embalada en la planta de Agrícola Zeit Organisch, para Schrijvershof (Rotterdam) y JV Sunrays Fruits (Philadelphia).\nForma de pago de la PO: anticipo por caja contra full set de documentos (BL, origen, fitosanitario, packing list, factura, cold treatment) y saldo por cuenta de venta 15 a 20 días después del arribo.\nAntes de enviar originales, las copias se mandan a revisión a contacto@safruits8.com (South American Fruits SpA).";

// ───────── Carga ─────────

const norm = (x: string) => x.normalize("NFD").replace(/[^a-z0-9]/gi, "").toLowerCase();

async function main() {
  const carpeta = process.argv[2];
  const url = process.env.DATABASE_URL;
  if (!carpeta || !url) throw new Error('Uso: DATABASE_URL=... npx tsx scripts/cargar-trato-ferrada.ts "<carpeta con los PDF>"');
  const bucketName = process.env.GCS_BUCKET;
  const bucket = bucketName ? new Storage().bucket(bucketName) : null;
  const sql = postgres(url, { max: 1, prepare: false });
  const db = drizzle(sql, { schema: s });

  const archivos = (await readdir(carpeta)).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const buscar = (frag: string) => {
    const f = archivos.find((a) => norm(a).includes(norm(frag)));
    if (!f) throw new Error(`No encontré el archivo que contiene «${frag}» en ${carpeta}`);
    return f;
  };
  const existe = (frag: string) => archivos.some((a) => norm(a).includes(norm(frag)));

  // Sube el archivo una sola vez por ficha (mismo contenido = mismo sha256)
  async function documento(entidad: s.Entidad, entidadId: number, tipo: string, frag: string) {
    const nombre = buscar(frag);
    const buf = await readFile(path.join(carpeta, nombre));
    const sha256 = createHash("sha256").update(buf).digest("hex");
    const [ya] = await db
      .select()
      .from(s.documentos)
      .where(and(eq(s.documentos.entidad, entidad), eq(s.documentos.entidadId, entidadId), eq(s.documentos.sha256, sha256)));
    if (ya) return ya.id;
    const limpio = nombre.replace(/^[0-9a-f]{8}-/, "");
    const key = `${entidad}/${entidadId}/${randomUUID()}-${limpio.normalize("NFD").replace(/[^\w.\-]+/g, "_").slice(-80)}`;
    if (bucket) await bucket.file(key).save(buf, { contentType: "application/pdf", resumable: false });
    else {
      const destino = path.join(process.cwd(), ".uploads", key);
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, buf);
    }
    const [d] = await db
      .insert(s.documentos)
      .values({ entidad, entidadId, tipo, nombreArchivo: limpio, mime: "application/pdf", tamanoBytes: buf.length, storageKey: key, sha256, subidoPor: AUTOR })
      .returning({ id: s.documentos.id });
    console.log(`  ↑ ${tipo}: ${limpio}`);
    return d.id;
  }

  // Plazo del saldo según las órdenes de compra de Ferrada (antes 5 a 10 días)
  await db.update(s.parametros).set({ valor: 15, nota: "Según la orden de compra de Ferrada" }).where(and(eq(s.parametros.clave, "dias_pago2_desde"), eq(s.parametros.valor, 5)));
  await db.update(s.parametros).set({ valor: 20, nota: "Según la orden de compra de Ferrada" }).where(and(eq(s.parametros.clave, "dias_pago2_hasta"), eq(s.parametros.valor, 10)));

  console.log("▸ Proveedores y planta");
  const ids: Record<string, number> = {};
  for (const p of PROVEEDORES) {
    const { clave, ...datos } = p;
    const [ya] = await db.select().from(s.proveedores).where(eq(s.proveedores.nombre, p.nombre));
    ids[clave] = ya ? ya.id : (await db.insert(s.proveedores).values(datos).returning({ id: s.proveedores.id }))[0].id;
    console.log(`  ${ya ? "=" : "+"} ${p.nombre}`);
  }

  console.log("▸ Certificados");
  for (const c of CERTIFICADOS) {
    const proveedorId = ids[c.prov];
    const documentoId = await documento("proveedor", proveedorId, `Certificado ${c.tipo}`, c.archivo);
    const [ya] = await db
      .select()
      .from(s.certificadosProveedor)
      .where(and(eq(s.certificadosProveedor.proveedorId, proveedorId), eq(s.certificadosProveedor.tipo, c.tipo), eq(s.certificadosProveedor.numero, c.numero)));
    if (!ya)
      await db.insert(s.certificadosProveedor).values({
        proveedorId,
        tipo: c.tipo,
        numero: c.numero,
        emisor: c.emisor,
        vigenteDesde: c.desde,
        vigenteHasta: c.hasta,
        recibido: "2026-11-02",
        documentoId,
      });
    console.log(`  ${ya ? "=" : "+"} ${c.tipo} ${c.numero}`);
  }

  for (const d of DOCS_POR_REVISAR) {
    if (existe(d.archivo)) await documento("proveedor", ids[d.prov], d.tipo, d.archivo);
    else console.log(`  – No está «${d.archivo}»: se omite`);
  }

  console.log("▸ Destinos");
  const dest: Record<string, number> = {};
  for (const d of DESTINOS) {
    const [ya] = await db.select().from(s.destinos).where(eq(s.destinos.puerto, d.puerto));
    dest[d.puerto] = ya ? ya.id : (await db.insert(s.destinos).values(d).returning({ id: s.destinos.id }))[0].id;
    if (ya && !ya.activo) await db.update(s.destinos).set({ activo: true }).where(eq(s.destinos.id, ya.id));
  }

  console.log("▸ Operaciones");
  for (const o of OPERACIONES) {
    const { destino, docs, ...datos } = o;
    const [ya] = await db.select().from(s.operacionesFerrada).where(eq(s.operacionesFerrada.codigo, o.codigo));
    let id: number;
    if (ya) id = ya.id;
    else {
      [{ id }] = await db
        .insert(s.operacionesFerrada)
        .values({ ...datos, proveedorId: ids.puma, plantaId: ids.zeit, destinoId: dest[destino], comisionUsdCaja: 0.5, rebateUsdContenedor: 0, creadoPor: AUTOR })
        .returning({ id: s.operacionesFerrada.id });
      await db.insert(s.notas).values({ entidad: "operacion", entidadId: id, autor: AUTOR, texto: `Operación ${o.codigo} cargada desde los documentos de Francisco.` });
    }
    console.log(`  ${ya ? "=" : "+"} ${o.codigo} · ${destino} · ${o.booking}`);
    for (const [frag, tipo] of docs) await documento("operacion", id, tipo, frag);
  }

  const [nota] = await db.select().from(s.notas).where(and(eq(s.notas.entidad, "ferrada"), isNull(s.notas.entidadId), eq(s.notas.autor, AUTOR)));
  if (!nota) await db.insert(s.notas).values({ entidad: "ferrada", entidadId: null, autor: AUTOR, texto: NOTA_FERRADA });

  await sql.end();
  console.log("\n✓ Listo: 3 proveedores, 11 certificados, 4 operaciones y sus documentos.");
}

main().catch((e) => {
  console.error("✗", e.message ?? e);
  process.exit(1);
});
