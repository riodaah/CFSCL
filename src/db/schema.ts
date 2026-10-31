// Esquema de la base de datos CFSCL (PostgreSQL).
// Piloto: operaciones de Ferrada. Productores, proceso y clientes directos se agregan después
// sobre estas mismas tablas base (proveedores, documentos, notas, usuarios).

import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const ORIGENES = ["Chile", "Perú", "Ecuador"] as const;
export const REGIONES = ["Europa", "Medio Oriente", "Asia"] as const;
export const PASOS_FERRADA = [
  "Orden de Ferrada",
  "Fruta comprada",
  "Reserva naviera",
  "Embarcada",
  "Draft enviado",
  "Pago 1 recibido",
  "Set oficial enviado",
  "En destino",
  "Cerrada",
] as const;
export const ROLES = ["admin", "operaciones", "lectura"] as const;
export const TIPOS_NOTA = ["Nota", "Llamada", "Correo", "Agente"] as const;
export const ENTIDADES = ["operacion", "proveedor", "ferrada"] as const;

export const origenPais = pgEnum("origen_pais", ORIGENES);
export const region = pgEnum("region", REGIONES);
export const pasoFerrada = pgEnum("paso_ferrada", PASOS_FERRADA);
export const rol = pgEnum("rol", ROLES);
export const tipoNota = pgEnum("tipo_nota", TIPOS_NOTA);
export const entidad = pgEnum("entidad", ENTIDADES);

const creado = () => timestamp("creado_en", { withTimezone: true }).notNull().defaultNow();
const actualizado = () =>
  timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const usd = (nombre: string) => numeric(nombre, { precision: 12, scale: 2, mode: "number" });

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  nombre: text("nombre"),
  rol: rol("rol").notNull().default("operaciones"),
  activo: boolean("activo").notNull().default(true),
  ultimoAcceso: timestamp("ultimo_acceso", { withTimezone: true }),
  creadoEn: creado(),
});

/** Exportadoras y productores a quienes CFSCL les compra fruta (Chile, Perú, Ecuador). */
export const proveedores = pgTable("proveedores", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  pais: origenPais("pais").notNull(),
  ciudad: text("ciudad"),
  idTributario: text("id_tributario"), // RUT en Chile, RUC en Perú y Ecuador
  contacto: text("contacto"),
  cargo: text("cargo"),
  telefono: text("telefono"),
  email: text("email"),
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: creado(),
  actualizadoEn: actualizado(),
});

/** Puertos de destino de Ferrada. La meta semanal se mide por destino. */
export const destinos = pgTable("destinos", {
  id: serial("id").primaryKey(),
  puerto: text("puerto").notNull(),
  pais: text("pais").notNull(),
  region: region("region").notNull(),
  activo: boolean("activo").notNull().default(true),
  creadoEn: creado(),
});

export const operacionesFerrada = pgTable(
  "operaciones_ferrada",
  {
    id: serial("id").primaryKey(),
    codigo: text("codigo").notNull().unique(), // FE-2026-01
    fechaOrden: date("fecha_orden", { mode: "string" }).notNull(),
    origenPais: origenPais("origen_pais").notNull(),
    proveedorId: integer("proveedor_id").references(() => proveedores.id, { onDelete: "set null" }),
    destinoId: integer("destino_id")
      .notNull()
      .references(() => destinos.id),
    producto: text("producto").notNull(),
    variedad: text("variedad"),
    calibres: text("calibres"),
    contenedores: integer("contenedores").notNull().default(1),
    palletsPorContenedor: integer("pallets_por_contenedor").notNull().default(21),
    cajas: integer("cajas").notNull().default(0),
    compraUsdCaja: usd("compra_usd_caja"),
    ventaUsdCaja: usd("venta_usd_caja"),
    comisionUsdCaja: usd("comision_usd_caja").notNull().default(0.5),
    rebateUsdContenedor: usd("rebate_usd_contenedor").notNull().default(0),
    paso: pasoFerrada("paso").notNull().default("Orden de Ferrada"),
    ocFerrada: text("oc_ferrada"), // número de la orden de Ferrada
    ocProveedor: text("oc_proveedor"), // número de la orden de CFSCL al proveedor
    naviera: text("naviera"),
    booking: text("booking"),
    barco: text("barco"),
    numerosContenedor: text("numeros_contenedor"),
    etd: date("etd", { mode: "string" }),
    eta: date("eta", { mode: "string" }),
    draftEnviado: date("draft_enviado", { mode: "string" }),
    setOficialEnviado: date("set_oficial_enviado", { mode: "string" }),
    pago1Vence: date("pago1_vence", { mode: "string" }),
    pago1Pagado: date("pago1_pagado", { mode: "string" }),
    pago2Pagado: date("pago2_pagado", { mode: "string" }),
    notas: text("notas"),
    creadoPor: text("creado_por"),
    creadoEn: creado(),
    actualizadoEn: actualizado(),
  },
  (t) => [index("op_ferrada_destino_idx").on(t.destinoId), index("op_ferrada_proveedor_idx").on(t.proveedorId), index("op_ferrada_etd_idx").on(t.etd)],
);

/** Archivos guardados en Cloud Storage. entidad + entidadId apuntan a la ficha dueña. */
export const documentos = pgTable(
  "documentos",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    entidad: entidad("entidad").notNull(),
    entidadId: integer("entidad_id").notNull(),
    tipo: text("tipo").notNull(),
    nombreArchivo: text("nombre_archivo").notNull(),
    mime: text("mime").notNull(),
    tamanoBytes: integer("tamano_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    sha256: text("sha256").notNull(),
    subidoPor: text("subido_por"),
    creadoEn: creado(),
  },
  (t) => [index("documentos_entidad_idx").on(t.entidad, t.entidadId)],
);

/** Certificados que se piden al proveedor una vez al año (valen de enero a diciembre). */
export const certificadosProveedor = pgTable(
  "certificados_proveedor",
  {
    id: serial("id").primaryKey(),
    proveedorId: integer("proveedor_id")
      .notNull()
      .references(() => proveedores.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(),
    anio: integer("anio").notNull(),
    recibido: date("recibido", { mode: "string" }),
    documentoId: uuid("documento_id").references(() => documentos.id, { onDelete: "set null" }),
    creadoEn: creado(),
  },
  (t) => [unique("cert_proveedor_tipo_anio").on(t.proveedorId, t.tipo, t.anio)],
);

/** Registro de gestión (bitácora). entidadId nulo = nota general de Ferrada. */
export const notas = pgTable(
  "notas",
  {
    id: serial("id").primaryKey(),
    entidad: entidad("entidad").notNull(),
    entidadId: integer("entidad_id"),
    tipo: tipoNota("tipo").notNull().default("Nota"),
    texto: text("texto").notNull(),
    autor: text("autor").notNull(),
    creadoEn: creado(),
  },
  (t) => [index("notas_entidad_idx").on(t.entidad, t.entidadId)],
);

/** Parámetros de negocio editables desde Configuración. */
export const parametros = pgTable("parametros", {
  clave: text("clave").primaryKey(),
  valor: numeric("valor", { precision: 14, scale: 4, mode: "number" }).notNull(),
  etiqueta: text("etiqueta").notNull(),
  unidad: text("unidad").notNull(),
  nota: text("nota"),
  actualizadoEn: actualizado(),
});

export type Usuario = typeof usuarios.$inferSelect;
export type Proveedor = typeof proveedores.$inferSelect;
export type Destino = typeof destinos.$inferSelect;
export type OperacionFerrada = typeof operacionesFerrada.$inferSelect;
export type Documento = typeof documentos.$inferSelect;
export type Certificado = typeof certificadosProveedor.$inferSelect;
export type Nota = typeof notas.$inferSelect;
export type PasoFerrada = (typeof PASOS_FERRADA)[number];
export type Entidad = (typeof ENTIDADES)[number];
