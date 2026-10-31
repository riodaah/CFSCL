import "server-only";
import { eq } from "drizzle-orm";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios, type Usuario } from "@/db/schema";

// Solo entran los correos registrados y activos en la tabla usuarios.
// ADMIN_EMAILS (separados por coma) se crean como admin en su primer ingreso.
const ADMINS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      let [u] = await db.select().from(usuarios).where(eq(usuarios.email, email));
      if (!u && ADMINS.includes(email)) {
        [u] = await db.insert(usuarios).values({ email, nombre: user.name, rol: "admin" }).returning();
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
