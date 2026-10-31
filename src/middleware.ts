import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const bypass = process.env.AUTH_DEV_BYPASS === "1" && process.env.NODE_ENV !== "production";

export default bypass
  ? () => NextResponse.next()
  : withAuth({ pages: { signIn: "/login" } });

// Todo protegido salvo login, auth, salud, API con llave propia y estáticos.
export const config = {
  matcher: ["/((?!login|api/auth|api/health|api/v1|_next/static|_next/image|logo-cfs.png|favicon.ico).*)"],
};
