import { Shell } from "@/components/shell";
import { nombreDe, usuarioActual } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await usuarioActual();
  return <Shell usuario={{ nombre: nombreDe(u), email: u.email, rol: u.rol }}>{children}</Shell>;
}
