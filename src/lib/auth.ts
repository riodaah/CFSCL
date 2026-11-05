import "server-only";
import { eq } from "drizzle-orm";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios, type Usuario } from "@/db/schema";

// Entran: los correos registrados y activos en la tabla usuarios, y cualquier cuenta
// de los dominios autorizados (ALLOWED_DOMAINS, por defecto cfscl.cl), que se crea
// con rol "operaciones" en su primer ingreso. Un usuario desactivado queda bloqueado
// aunque sea del dominio. ADMIN_EMAILS (separados por coma) se crean como admin.
const lista = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
const ADMINS = lista(process.env.ADMIN_EMAILS);
export const DOMINIOS = lista(process.env.ALLOWED_DOMAINS ?? "cfscl.cl");
const delDominio = (email: string) => DOMINIOS.some((d) => email.endsWith(`@${d}`));

export const DEV_BYPASS = process.env.AUTH_DEV_BYPASS === "1" && process.env.NODE_ENV !== "production";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  // Explícito para que coincida con el middleware: tras el proxy de Cloud Run el origen es https
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      // Google confirma que el correo es de esa cuenta
      if ((profile as { email_verified?: boolean } | undefined)?.email_verified === false) return "/login?error=NoAutorizado";
      let [u] = await db.select().from(usuarios).where(eq(usuarios.email, email));
      if (!u && (ADMINS.includes(email) || delDominio(email))) {
        [u] = await db
          .insert(usuarios)
          .values({ email, nombre: user.name, rol: ADMINS.includes(email) ? "admin" : "operaciones" })
          .onConflictDoNothing()
          .returning();
        if (!u) [u] = await db.select().from(usuarios).where(eq(usuarios.email, email));
      }
      if (!u || !u.activo) return "/login?error=NoAutorizado";
      await db
        .update(usuarios)
        .set({ ultimoAcceso: new Date(), nombre: u.nombre ?? user.name })
        .where(eq(usuarios.id, u.id));
      return true;
    },
  },
};

const DEV_USER: Usuario = {
  id: 0,
  email: "dev@local",
  nombre: "Desarrollo",
  rol: "admin",
  activo: true,
  ultimoAcceso: null,
  creadoEn: new Date(),
};

/** Usuario actual o redirige al login. */
export async function usuarioActual(): Promise<Usuario> {
  if (DEV_BYPASS) return DEV_USER;
  const s = await getServerSession(authOptions);
  const email = s?.user?.email?.toLowerCase();
  if (!email) redirect("/login");
  const [u] = await db.select().from(usuarios).where(eq(usuarios.email, email));
  if (!u || !u.activo) redirect("/login?error=NoAutorizado");
  return u;
}

/** Para acciones que escriben: admin u operaciones. */
export async function editor(): Promise<Usuario> {
  const u = await usuarioActual();
  if (u.rol === "lectura") throw new Error("Tu usuario es de solo lectura.");
  return u;
}

export async function admin(): Promise<Usuario> {
  const u = await usuarioActual();
  if (u.rol !== "admin") throw new Error("Solo un administrador puede hacer esto.");
  return u;
}

export const nombreDe = (u: Usuario) => u.nombre || u.email;
