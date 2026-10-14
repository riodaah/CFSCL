"use client";

import { useState } from "react";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, Mail, Pencil, X } from "lucide-react";
import { Badge, type Tono } from "@/components/ui";
import type { CorreoIngesta, EstadoIngesta } from "@/lib/types";
import { fechaHora } from "@/lib/format";

const TONO: Record<EstadoIngesta | "Aprobado" | "Descartado", Tono> = {
  Confirmado: "verde",
  Revisión: "ambar",
  Propuesta: "azul",
  Error: "rojo",
  Aprobado: "verde",
  Descartado: "gris",
};
const ETIQUETA: Record<string, string> = {
  Confirmado: "Confirmado automático",
  Revisión: "Requiere revisión",
  Propuesta: "Propuesta del agente",
  Error: "No se pudo leer",
  Aprobado: "Aprobado por Anita",
  Descartado: "Descartado",
};

export function Ingesta({ correos }: { correos: CorreoIngesta[] }) {
  const [sel, setSel] = useState(correos[0].id);
  const [estados, setEstados] = useState<Record<string, string>>(Object.fromEntries(correos.map((c) => [c.id, c.estado])));
  const c = correos.find((x) => x.id === sel)!;
  const est = estados[c.id];
  const pendiente = est === "Revisión" || est === "Propuesta" || est === "Error";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <ul className="card divide-y divide-ink-100 self-start">
        {correos.map((x) => (
          <li key={x.id}>
            <button
              type="button"
              onClick={() => setSel(x.id)}
              className={clsx("w-full px-4 py-3 text-left hover:bg-ink-50", sel === x.id && "bg-leaf-50/70")}
            >
              <div className="flex items-center gap-2">
                <Badge tono={TONO[estados[x.id] as EstadoIngesta]}>{ETIQUETA[estados[x.id]]}</Badge>
                <span className="ml-auto font-mono text-[11.5px] text-ink-400">{fechaHora(x.recibido)}</span>
              </div>
              <div className="mt-1.5 truncate text-[13.5px] font-medium">{x.asunto}</div>
              <div className="truncate text-[12px] text-ink-500">{x.tipo} · {x.de}</div>
            </button>
          </li>
        ))}
      </ul>

      <div className="card self-start">
        <div className="border-b border-ink-100 px-4 py-3">
          <div className="flex items-center gap-2 text-[12.5px] text-ink-500"><Mail size={14} /> {c.de} · {fechaHora(c.recibido)}</div>
          <h2 className="mt-1 font-display text-[16px] font-bold">{c.asunto}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tono="gris">{c.tipo}</Badge>
            <Badge tono={TONO[est as EstadoIngesta]}>{ETIQUETA[est]}</Badge>
          </div>
        </div>
        <div className="grid gap-5 p-4 md:grid-cols-2">
          <div>
            <div className="label mb-2">Lo que leyó el agente</div>
            <dl className="divide-y divide-ink-100 rounded-lg border border-ink-200">
              {c.extraido.map((e) => (
                <div key={e.campo} className="flex justify-between gap-3 px-3 py-2 text-[13px]">
                  <dt className="text-ink-500">{e.campo}</dt>
                  <dd className="text-right font-medium">{e.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <div className="label mb-2">Validaciones del sistema</div>
            <ul className="space-y-2">
              {c.validaciones.map((v) => (
                <li key={v.texto} className="flex gap-2 text-[13px]">
                  {v.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-leaf-500" /> : <AlertCircle size={16} className="mt-0.5 shrink-0 text-brand-500" />}
                  <span className={clsx(!v.ok && "text-ink-900")}>{v.texto}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-[13px]">
              <span className="text-ink-500">Acción: </span>{c.accion}
            </div>
          </div>
        </div>
        {pendiente && (
          <div className="flex flex-wrap gap-2 border-t border-ink-100 px-4 py-3">
            <button type="button" className="btn-primary" onClick={() => setEstados((s) => ({ ...s, [c.id]: "Aprobado" }))}>
              <CheckCircle2 size={15} /> {est === "Error" ? "Cargar manualmente" : "Aprobar"}
            </button>
            {est !== "Error" && <button type="button" className="btn-ghost"><Pencil size={15} /> Corregir datos</button>}
            <button type="button" className="btn-ghost" onClick={() => setEstados((s) => ({ ...s, [c.id]: "Descartado" }))}>
              <X size={15} /> Descartar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
