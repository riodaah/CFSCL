"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { Camera, Check, Loader2 } from "lucide-react";
import type { Resultado } from "@/lib/form";

type Accion = (prev: Resultado, fd: FormData) => Promise<Resultado>;

function Enviar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={clsx(className ?? "btn-primary", pending && "opacity-70")} disabled={pending}>
      {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Formulario con estado: muestra errores del servidor y se limpia al guardar si resetear=true. */
export function FormAccion({
  action,
  children,
  submit,
  submitClassName,
  className,
  resetear = false,
  pie,
  fijo = false,
}: {
  action: Accion;
  children: React.ReactNode;
  submit: React.ReactNode;
  submitClassName?: string;
  className?: string;
  resetear?: boolean;
  pie?: React.ReactNode;
  /** Formularios largos: el botón queda fijo abajo en teléfono y tablet */
  fijo?: boolean;
}) {
  const [estado, accion] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok && resetear) ref.current?.reset();
  }, [estado, resetear]);
  return (
    <form ref={ref} action={accion} className={className}>
      {children}
      <div
        className={clsx(
          "mt-4 flex flex-wrap items-center gap-2",
          fijo && "sticky z-10 -mx-4 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none [&>button]:flex-1 lg:[&>button]:flex-none",
        )}
        style={fijo ? { bottom: "var(--nav-h)" } : undefined}
      >
        {estado?.error && (
          <p role="alert" className="basis-full rounded-lg bg-brand-50 px-3 py-2 text-[13.5px] text-brand-700">
            {estado.error}
          </p>
        )}
        {estado?.ok && estado.mensaje && <p className="basis-full text-[13px] text-leaf-700">{estado.mensaje}</p>}
        <Enviar className={submitClassName}>{submit}</Enviar>
        {pie}
      </div>
    </form>
  );
}

/** Botón que ejecuta una acción del servidor. Con confirmar, pide un segundo clic. */
export function BotonAccion({
  accion,
  children,
  className,
  confirmar,
  title,
}: {
  accion: () => Promise<Resultado>;
  children: React.ReactNode;
  className?: string;
  confirmar?: string;
  title?: string;
}) {
  const [pendiente, start] = useTransition();
  const [error, setError] = useState("");
  const [armado, setArmado] = useState(false);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        title={title}
        disabled={pendiente}
        className={clsx(className ?? "btn-ghost", pendiente && "opacity-60")}
        onClick={() => {
          if (confirmar && !armado) {
            setArmado(true);
            setTimeout(() => setArmado(false), 4000);
            return;
          }
          setArmado(false);
          setError("");
          start(async () => {
            const r = await accion();
            if (r?.error) setError(r.error);
          });
        }}
      >
        {pendiente && <Loader2 size={14} className="animate-spin" aria-hidden />}
        {armado ? confirmar : children}
      </button>
      {error && <span role="alert" className="text-[12.5px] text-brand-600">{error}</span>}
    </span>
  );
}

export function Campo({
  label,
  children,
  ayuda,
  className,
}: {
  label: string;
  children: React.ReactNode;
  ayuda?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("flex flex-col gap-1", className)}>
      <span className="text-[12.5px] font-medium text-ink-700">{label}</span>
      {children}
      {ayuda && <span className="text-[12px] text-ink-500">{ayuda}</span>}
    </label>
  );
}

/** Botón de cámara para teléfono y tablet: abre la cámara trasera y avisa cuando la foto quedó lista. */
export function TomarFoto({ name = "archivo" }: { name?: string }) {
  const [n, setN] = useState(0);
  return (
    <label className={clsx("btn-ghost cursor-pointer lg:hidden", n > 0 && "border-leaf-500 text-leaf-700")}>
      {n > 0 ? <Check size={16} aria-hidden /> : <Camera size={16} aria-hidden />}
      {n > 0 ? "Foto lista" : "Tomar foto"}
      <input type="file" name={name} accept="image/*" capture="environment" className="sr-only" onChange={(e) => setN(e.target.files?.length ?? 0)} />
    </label>
  );
}
