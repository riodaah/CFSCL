import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres() conecta recién en la primera consulta: el build no necesita la base.
const url = process.env.DATABASE_URL ?? "postgres://sin-configurar@localhost:5432/falta_DATABASE_URL";

// Una sola conexión reutilizada entre recargas en desarrollo.
const g = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };
const client =
  g.__sql ??
  postgres(url, {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idle_timeout: 20,
    prepare: false, // compatible con el pooler de Neon (PgBouncer)
  });
if (process.env.NODE_ENV !== "production") g.__sql = client;

export const db = drizzle(client, { schema });
export { schema };
