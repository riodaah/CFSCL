import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  certificadosProveedor,
  destinos,
  documentos,
  notas,
  operacionesFerrada,
  parametros,
  proveedores,
  usuarios,
  type Entidad,
} from "@/db/schema";

export type Params = Record<string, number>;

export async function getParams(): Promise<Params> {
  const filas = await db.select().from(parametros);
  return Object.fromEntries(filas.map((p) => [p.clave, p.valor]));
}

export const listaParametros = () => db.select().from(parametros).orderBy(asc(parametros.clave));

export const listaOperaciones = () => db.select().from(operacionesFerrada).orderBy(desc(operacionesFerrada.fechaOrden), desc(operacionesFerrada.id));

export async function getOperacion(id: number) {
  const [o] = await db.select().from(operacionesFerrada).where(eq(operacionesFerrada.id, id));
  return o;
}

export const listaProveedores = () => db.select().from(proveedores).orderBy(asc(proveedores.nombre));

export async function getProveedor(id: number) {
  const [p] = await db.select().from(proveedores).where(eq(proveedores.id, id));
  return p;
}

export const listaDestinos = () => db.select().from(destinos).orderBy(asc(destinos.region), asc(destinos.puerto));

export const listaUsuarios = () => db.select().from(usuarios).orderBy(asc(usuarios.email));

export const documentosDe = (entidad: Entidad, id: number) =>
  db
    .select()
    .from(documentos)
    .where(and(eq(documentos.entidad, entidad), eq(documentos.entidadId, id)))
    .orderBy(desc(documentos.creadoEn));

export const notasDe = (entidad: Entidad, id: number | null) =>
  db
    .select()
    .from(notas)
    .where(and(eq(notas.entidad, entidad), id == null ? isNull(notas.entidadId) : eq(notas.entidadId, id)))
    .orderBy(desc(notas.creadoEn))
    .limit(200);

export const certificadosDe = (proveedorId: number) =>
  db.select().from(certificadosProveedor).where(eq(certificadosProveedor.proveedorId, proveedorId));

export const todosLosCertificados = () => db.select().from(certificadosProveedor);

export async function codigoSugerido(fecha: string) {
  const anio = fecha.slice(0, 4);
  const ops = await db.select({ codigo: operacionesFerrada.codigo }).from(operacionesFerrada);
  const max = ops.filter((o) => o.codigo.startsWith(`FE-${anio}-`)).reduce((m, o) => Math.max(m, Number(o.codigo.split("-")[2]) || 0), 0);
  return `FE-${anio}-${String(max + 1).padStart(2, "0")}`;
}
