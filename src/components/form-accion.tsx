"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
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
}: {
  action: Accion;
  children: React.ReactNode;
  submit: React.ReactNode;
  submitClassName?: string;
  className?: string;
  resetear?: boolean;
  pie?: React.ReactNode;
}) {
  const [estado, accion] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok && resetear) ref.current?.reset();
  }, [estado, resetear]);
  return (
    <form ref={ref} action={accion} className={className}>
      {children}
      {estado?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-[13.5px] text-brand-700">
          {estado.error}
        </p>
      )}
      {estado?.ok && estado.mensaje && <p className="mt-3 text-[13px] text-leaf-700">{estado.mensaje}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
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
