import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Storage } from "@google-cloud/storage";

// Producción: bucket privado de Cloud Storage (GCS_BUCKET). Desarrollo: carpeta local .uploads/
const BUCKET = process.env.GCS_BUCKET;
const LOCAL_DIR = path.join(process.cwd(), ".uploads");
let gcs: Storage | undefined;
const bucket = () => (gcs ??= new Storage()).bucket(BUCKET!);

export const MAX_BYTES = 25 * 1024 * 1024;

export async function guardarArchivo(prefijo: string, file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const limpio = file.name.normalize("NFD").replace(/[^\w.\-]+/g, "_").slice(-80);
  const key = `${prefijo}/${randomUUID()}-${limpio}`;
  const mime = file.type || "application/octet-stream";
  if (BUCKET) {
    await bucket().file(key).save(buf, { contentType: mime, resumable: false });
  } else {
    const destino = path.join(LOCAL_DIR, key);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, buf);
  }
  return { key, sha256, tamano: buf.length, mime };
}

export async function leerArchivo(key: string): Promise<Buffer> {
  if (BUCKET) {
    const [data] = await bucket().file(key).download();
    return data;
  }
  return readFile(path.join(LOCAL_DIR, key));
}

export async function borrarArchivo(key: string) {
  if (BUCKET) await bucket().file(key).delete({ ignoreNotFound: true });
  else await rm(path.join(LOCAL_DIR, key), { force: true });
}
