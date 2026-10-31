import Image from "next/image";
import { BotonGoogle } from "./boton-google";

const ERRORES: Record<string, string> = {
  NoAutorizado: "Tu cuenta de Google no está autorizada. Pide acceso a un administrador.",
  AccessDenied: "Tu cuenta de Google no está autorizada. Pide acceso a un administrador.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  const { error, callbackUrl } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-leaf-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <div className="flex items-center gap-3">
          <Image src="/logo-cfs.png" alt="CFS" width={52} height={45} priority />
          <div className="leading-tight">
            <div className="font-display text-[17px] font-bold text-ink-900">Central Frutícola Sur</div>
            <div className="text-[13px] text-ink-500">Sistema de gestión</div>
          </div>
        </div>
        <p className="mt-6 text-[14px] text-ink-600">Entra con tu cuenta de Google de la empresa.</p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-[13.5px] text-brand-700">
            {ERRORES[error] ?? "No se pudo iniciar sesión. Intenta de nuevo."}
          </p>
        )}
        <BotonGoogle callbackUrl={callbackUrl?.startsWith("/") ? callbackUrl : "/"} />
      </div>
    </div>
  );
}
