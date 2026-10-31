"use server";

import { and, eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  certificadosProveedor,
  destinos,
  documentos,
  ENTIDADES,
  notas,
  operacionesFerrada,
  ORIGENES,
  parametros,
  PASOS_FERRADA,
  proveedores,
  REGIONES,
  ROLES,
  TIPOS_NOTA,
  usuarios,
  type Entidad,
} from "@/db/schema";
import { admin, editor, nombreDe } from "@/lib/auth";
import { hoy } from "@/lib/ferrada";
import { ErrorForm, fechaISO, int, mensajeDe, num, req, txt, uno, type Resultado } from "@/lib/form";
import { borrarArchivo, guardarArchivo, MAX_BYTES } from "@/lib/storage";

// ───────── Operaciones de Ferrada ─────────

function camposOperacion(fd: FormData) {
  const destinoId = Number(req(fd, "destinoId", "el destino"));
  const proveedor = txt(fd, "proveedorId");
  const etd = fechaISO(fd, "etd");
  const eta = fechaISO(fd, "eta");
  if (etd && eta && eta < etd) throw new ErrorForm("La llegada (ETA) no puede ser antes del zarpe (ETD).");
  return {
    fechaOrden: fechaISO(fd, "fechaOrden") ?? hoy(),
    origenPais: uno(fd, "origenPais", ORIGENES, "el origen"),
    proveedorId: proveedor ? Number(proveedor) : null,
    destinoId,
    producto: req(fd, "producto", "el producto"),
    variedad: txt(fd, "variedad"),
    calibres: txt(fd, "calibres"),
    contenedores: int(fd, "contenedores", "Contenedores", 1),
    palletsPorContenedor: int(fd, "palletsPorContenedor", "Pallets por contenedor", 1),
    cajas: int(fd, "cajas", "Cajas", 0),
    compraUsdCaja: num(fd, "compraUsdCaja"),
    ventaUsdCaja: num(fd, "ventaUsdCaja"),
    comisionUsdCaja: num(fd, "comisionUsdCaja") ?? 0.5,
    rebateUsdContenedor: num(fd, "rebateUsdContenedor") ?? 0,
    paso: uno(fd, "paso", PASOS_FERRADA, "el paso"),
    ocFerrada: txt(fd, "ocFerrada"),
    ocProveedor: txt(fd, "ocProveedor"),
    naviera: txt(fd, "naviera"),
    booking: txt(fd, "booking"),
    barco: txt(fd, "barco"),
    numerosContenedor: txt(fd, "numerosContenedor"),
    etd,
    eta,
    draftEnviado: fechaISO(fd, "draftEnviado"),
    setOficialEnviado: fechaISO(fd, "setOficialEnviado"),
    pago1Vence: fechaISO(fd, "pago1Vence"),
    pago1Pagado: fechaISO(fd, "pago1Pagado"),
    pago2Pagado: fechaISO(fd, "pago2Pagado"),
    notas: txt(fd, "notas"),
  };
}

function validarSetOficial(c: ReturnType<typeof camposOperacion>) {
  if (c.setOficialEnviado && !c.pago1Pagado)
    throw new ErrorForm("No se puede registrar el set oficial sin el pago 1 de Ferrada. Con el set oficial se retira el contenedor.");
}

async function siguienteCodigo(fechaOrden: string) {
  const anio = fechaOrden.slice(0, 4);
  const filas = await db
    .select({ codigo: operacionesFerrada.codigo })
    .from(operacionesFerrada)
    .where(like(operacionesFerrada.codigo, `FE-${anio}-%`));
  const max = filas.reduce((m, f) => Math.max(m, Number(f.codigo.split("-")[2]) || 0), 0);
  return `FE-${anio}-${String(max + 1).padStart(2, "0")}`;
}

export async function crearOperacion(_: Resultado, fd: FormData): Promise<Resultado> {
  let id: number;
  try {
    const u = await editor();
    const c = camposOperacion(fd);
    validarSetOficial(c);
    const codigo = txt(fd, "codigo") ?? (await siguienteCodigo(c.fechaOrden));
    [{ id }] = await db
      .insert(operacionesFerrada)
      .values({ ...c, codigo, creadoPor: nombreDe(u) })
      .returning({ id: operacionesFerrada.id });
    await db.insert(notas).values({ entidad: "operacion", entidadId: id, tipo: "Nota", autor: nombreDe(u), texto: `Operación ${codigo} creada.` });
  } catch (e) {
    if (String(e).includes("operaciones_ferrada_codigo_unique")) return { error: "Ese código de operación ya existe." };
    return { error: mensajeDe(e) };
  }
  revalidatePath("/ferrada");
  redirect(`/ferrada/${id}`);
}

export async function actualizarOperacion(id: number, _: Resultado, fd: FormData): Promise<Resultado> {
  try {
    const u = await editor();
    const c = camposOperacion(fd);
    validarSetOficial(c);
    const codigo = req(fd, "codigo", "el código");
    const [antes] = await db.select().from(operacionesFerrada).where(eq(operacionesFerrada.id, id));
    if (!antes) return { error: "La operación no existe." };
    await db.update(operacionesFerrada).set({ ...c, codigo }).where(eq(operacionesFerrada.id, id));
    if (antes.paso !== c.paso)
      await db.insert(notas).values({ entidad: "operacion", entidadId: id, autor: nombreDe(u), texto: `Paso: ${antes.paso} → ${c.paso}.` });
  } catch (e) {
    if (String(e).includes("operaciones_ferrada_codigo_unique")) return { error: "Ese código de operación ya existe." };
    return { error: mensajeDe(e) };
  }
  revalidatePath("/ferrada");
  redirect(`/ferrada/${id}`);
}

/** Registra un hito con la fecha de hoy y avanza el paso cuando corresponde. */
export async function registrarHito(id: number, hito: "draft" | "pago1" | "set" | "pago2" | "siguiente"): Promise<Resultado> {
  try {
    const u = await editor();
    const [o] = await db.select().from(operacionesFerrada).where(eq(operacionesFerrada.id, id));
    if (!o) return { error: "La operación no existe." };
    const f = hoy();
    const idx = PASOS_FERRADA.indexOf(o.paso);
    const avanzar = (p: (typeof PASOS_FERRADA)[number]) => (PASOS_FERRADA.indexOf(p) > idx ? p : o.paso);
    let cambios: Partial<typeof o> = {};
    let texto = "";
    if (hito === "draft") {
      cambios = { draftEnviado: f, paso: avanzar("Draft enviado") };
      texto = "Draft de documentos enviado a Ferrada.";
    } else if (hito === "pago1") {
      cambios = { pago1Pagado: f, paso: avanzar("Pago 1 recibido") };
      texto = "Ferrada pagó el primer 50%.";
    } else if (hito === "set") {
      if (!o.pago1Pagado) return { error: "Falta el pago 1 de Ferrada: el set oficial sigue bloqueado." };
      cambios = { setOficialEnviado: f, paso: avanzar("Set oficial enviado") };
      texto = "Set oficial enviado a Ferrada.";
    } else if (hito === "pago2") {
      cambios = { pago2Pagado: f, paso: "Cerrada" };
      texto = "Ferrada pagó el segundo 50%. Operación cerrada.";
    } else {
      if (idx >= PASOS_FERRADA.length - 1) return { error: "La operación ya está cerrada." };
      const sig = PASOS_FERRADA[idx + 1];
      if (sig === "Set oficial enviado" && !o.pago1Pagado) return { error: "Falta el pago 1 de Ferrada: el set oficial sigue bloqueado." };
      cambios = { paso: sig };
      texto = `Paso: ${o.paso} → ${sig}.`;
    }
    await db.update(operacionesFerrada).set(cambios).where(eq(operacionesFerrada.id, id));
    await db.insert(notas).values({ entidad: "operacion", entidadId: id, autor: nombreDe(u), texto });
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath(`/ferrada/${id}`);
  revalidatePath("/ferrada");
  return { ok: true };
}

export async function eliminarOperacion(id: number): Promise<Resultado> {
  try {
    await admin();
    const docs = await db.select().from(documentos).where(and(eq(documentos.entidad, "operacion"), eq(documentos.entidadId, id)));
    for (const d of docs) await borrarArchivo(d.storageKey);
    await db.delete(documentos).where(and(eq(documentos.entidad, "operacion"), eq(documentos.entidadId, id)));
    await db.delete(notas).where(and(eq(notas.entidad, "operacion"), eq(notas.entidadId, id)));
    await db.delete(operacionesFerrada).where(eq(operacionesFerrada.id, id));
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/ferrada");
  redirect("/ferrada");
}

// ───────── Documentos ─────────

const RUTA: Record<Entidad, (id: number) => string> = {
  operacion: (id) => `/ferrada/${id}`,
  proveedor: (id) => `/proveedores/${id}`,
  ferrada: () => "/ferrada",
};

export async function subirDocumento(entidad: Entidad, entidadId: number, _: Resultado, fd: FormData): Promise<Resultado> {
  try {
    if (!ENTIDADES.includes(entidad)) throw new ErrorForm("Entidad inválida.");
    const u = await editor();
    const tipo = req(fd, "tipo", "el tipo de documento");
    const archivos = fd.getAll("archivo").filter((f): f is File => f instanceof File && f.size > 0);
    if (archivos.length === 0) throw new ErrorForm("Elige al menos un archivo.");
    for (const f of archivos) if (f.size > MAX_BYTES) throw new ErrorForm(`${f.name} pesa más de 25 MB.`);
    for (const f of archivos) {
      const g = await guardarArchivo(`${entidad}/${entidadId}`, f);
      const [doc] = await db
        .insert(documentos)
        .values({ entidad, entidadId, tipo, nombreArchivo: f.name, mime: g.mime, tamanoBytes: g.tamano, storageKey: g.key, sha256: g.sha256, subidoPor: nombreDe(u) })
        .returning();
      // Un certificado subido desde la ficha del proveedor queda marcado como recibido en el año en curso
      if (entidad === "proveedor" && txt(fd, "certificado") === "1") {
        const anio = Number(txt(fd, "anio") ?? hoy().slice(0, 4));
        await db
          .insert(certificadosProveedor)
          .values({ proveedorId: entidadId, tipo, anio, recibido: hoy(), documentoId: doc.id })
          .onConflictDoUpdate({
            target: [certificadosProveedor.proveedorId, certificadosProveedor.tipo, certificadosProveedor.anio],
            set: { recibido: hoy(), documentoId: doc.id },
          });
      }
    }
    await db.insert(notas).values({
      entidad,
      entidadId,
      autor: nombreDe(u),
      texto: `Documento subido: ${tipo} (${archivos.map((a) => a.name).join(", ")}).`,
    });
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath(RUTA[entidad](entidadId));
  return { ok: true, mensaje: "Documento guardado." };
}

export async function borrarDocumento(id: string): Promise<Resultado> {
  try {
    const u = await editor();
    const [d] = await db.select().from(documentos).where(eq(documentos.id, id));
    if (!d) return { error: "El documento ya no existe." };
    await db.update(certificadosProveedor).set({ recibido: null }).where(eq(certificadosProveedor.documentoId, id));
    await db.delete(documentos).where(eq(documentos.id, id));
    await borrarArchivo(d.storageKey);
    await db.insert(notas).values({ entidad: d.entidad, entidadId: d.entidadId, autor: nombreDe(u), texto: `Documento eliminado: ${d.tipo} (${d.nombreArchivo}).` });
    revalidatePath(RUTA[d.entidad](d.entidadId));
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  return { ok: true };
}

// ───────── Bitácora ─────────

export async function agregarNota(entidad: Entidad, entidadId: number | null, _: Resultado, fd: FormData): Promise<Resultado> {
  try {
    const u = await editor();
    const texto = req(fd, "texto", "el texto de la nota");
    const tipo = uno(fd, "tipo", TIPOS_NOTA, "el tipo");
    await db.insert(notas).values({ entidad, entidadId, tipo, texto, autor: nombreDe(u) });
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath(entidadId == null ? "/ferrada" : RUTA[entidad](entidadId));
  return { ok: true };
}

// ───────── Proveedores ─────────

function camposProveedor(fd: FormData) {
  return {
    nombre: req(fd, "nombre", "el nombre"),
    pais: uno(fd, "pais", ORIGENES, "el país"),
    ciudad: txt(fd, "ciudad"),
    idTributario: txt(fd, "idTributario"),
    contacto: txt(fd, "contacto"),
    cargo: txt(fd, "cargo"),
    telefono: txt(fd, "telefono"),
    email: txt(fd, "email"),
    notas: txt(fd, "notas"),
    activo: fd.get("activo") !== "0",
  };
}

export async function crearProveedor(_: Resultado, fd: FormData): Promise<Resultado> {
  let id: number;
  try {
    await editor();
    [{ id }] = await db.insert(proveedores).values(camposProveedor(fd)).returning({ id: proveedores.id });
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/proveedores");
  redirect(`/proveedores/${id}`);
}

export async function actualizarProveedor(id: number, _: Resultado, fd: FormData): Promise<Resultado> {
  try {
    await editor();
    await db.update(proveedores).set(camposProveedor(fd)).where(eq(proveedores.id, id));
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/proveedores");
  redirect(`/proveedores/${id}`);
}

/** Marca un certificado como recibido (o lo desmarca) sin subir archivo */
export async function marcarCertificado(proveedorId: number, tipo: string, anio: number, recibido: boolean): Promise<Resultado> {
  try {
    await editor();
    await db
      .insert(certificadosProveedor)
      .values({ proveedorId, tipo, anio, recibido: recibido ? hoy() : null })
      .onConflictDoUpdate({
        target: [certificadosProveedor.proveedorId, certificadosProveedor.tipo, certificadosProveedor.anio],
        set: { recibido: recibido ? hoy() : null },
      });
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath(`/proveedores/${proveedorId}`);
  return { ok: true };
}

// ───────── Configuración ─────────

export async function crearDestino(_: Resultado, fd: FormData): Promise<Resultado> {
  try {
    await admin();
    await db.insert(destinos).values({ puerto: req(fd, "puerto", "el puerto"), pais: req(fd, "pais", "el país"), region: uno(fd, "region", REGIONES, "la región") });
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/configuracion");
  return { ok: true, mensaje: "Destino agregado." };
}

export async function cambiarDestino(id: number, activo: boolean): Promise<Resultado> {
  try {
    await admin();
    await db.update(destinos).set({ activo }).where(eq(destinos.id, id));
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function crearUsuario(_: Resultado, fd: FormData): Promise<Resultado> {
  try {
    await admin();
    const email = req(fd, "email", "el correo").toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErrorForm("Correo inválido.");
    await db
      .insert(usuarios)
      .values({ email, nombre: txt(fd, "nombre"), rol: uno(fd, "rol", ROLES, "el rol") })
      .onConflictDoUpdate({ target: usuarios.email, set: { activo: true, rol: uno(fd, "rol", ROLES, "el rol") } });
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/configuracion");
  return { ok: true, mensaje: "Usuario autorizado. Ya puede entrar con su cuenta de Google." };
}

export async function cambiarUsuario(id: number, cambios: { activo?: boolean; rol?: (typeof ROLES)[number] }): Promise<Resultado> {
  try {
    const yo = await admin();
    if (yo.id === id && (cambios.activo === false || (cambios.rol && cambios.rol !== "admin")))
      return { error: "No puedes quitarte tu propio acceso de administrador." };
    await db.update(usuarios).set(cambios).where(eq(usuarios.id, id));
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function guardarParametros(_: Resultado, fd: FormData): Promise<Resultado> {
  try {
    await admin();
    const filas = await db.select().from(parametros);
    for (const p of filas) {
      const v = num(fd, p.clave);
      if (v != null && v !== p.valor) await db.update(parametros).set({ valor: v }).where(eq(parametros.clave, p.clave));
    }
  } catch (e) {
    return { error: mensajeDe(e) };
  }
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Parámetros guardados." };
}
