import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documentos } from "@/db/schema";
import { usuarioActual } from "@/lib/auth";
import { leerArchivo } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Descarga un documento. Pasa por el servidor para exigir sesión: el bucket es privado. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await usuarioActual();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("No encontrado", { status: 404 });
  const [d] = await db.select().from(documentos).where(eq(documentos.id, id));
  if (!d) return new Response("No encontrado", { status: 404 });
  const data = await leerArchivo(d.storageKey);
  const inline = /^(application\/pdf|image\/)/.test(d.mime);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": d.mime,
      "Content-Length": String(data.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(d.nombreArchivo)}`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
