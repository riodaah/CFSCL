// Carga los datos base (usuarios admin, parámetros, destinos). Idempotente.
// Uso: DATABASE_URL=... npm run db:seed
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");
const sql = postgres(url, { max: 1, prepare: false });
await sql.unsafe(readFileSync(new URL("../drizzle/seed.sql", import.meta.url), "utf8"));
console.log("Datos base cargados.");
await sql.end();
