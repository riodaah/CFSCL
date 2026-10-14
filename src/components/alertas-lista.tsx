"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Check, ExternalLink } from "lucide-react";
import { SeveridadBadge } from "@/components/ui";
import type { Alerta, Severidad } from "@/lib/types";
import { fecha } from "@/lib/format";

const SEVS: (Severidad | "Todas")[] = ["Todas", "Crítica", "Alta", "Media", "Info"];
const MODS = ["Todos", "Productores", "Proceso", "Exportado", "Pagos"] as const;

export function AlertasLista({ alertas }: { alertas: Alerta[] }) {
  const [sev, setSev] = useState<(typeof SEVS)[number]>("Todas");
  const [mod, setMod] = useState<(typeof MODS)[number]>("Todos");
  const [resueltas, setResueltas] = useState<Set<string>>(new Set());

  const lista = useMemo(
    () => alertas.filter((a) => (sev === "Todas" || a.severidad === sev) && (mod === "Todos" || a.modulo === mod)),
    [alertas, sev, mod],
  );

  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {SEVS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSev(s)}
              className={clsx("rounded-full px-3 py-1 text-[13px]", sev === s ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}
            >
              {s}
            </button>
          ))}
        </div>
        <label htmlFor="modulo" className="ml-auto text-[13px] text-ink-500">Módulo</label>
        <select id="modulo" value={mod} onChange={(e) => setMod(e.target.value as (typeof MODS)[number])} className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-[13px]">
          {MODS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <ul className="divide-y divide-ink-100">
        {lista.map((a) => {
          const ok = resueltas.has(a.id);
          return (
            <li key={a.id} className={clsx("flex flex-wrap items-start gap-3 px-4 py-3", ok && "opacity-50")}>
              <div className="w-20 shrink-0 pt-0.5"><SeveridadBadge s={a.severidad} /></div>
              <div className="min-w-0 flex-1 basis-64">
                <div className={clsx("text-[14px] font-medium", ok && "line-through")}>{a.titulo}</div>
                <p className="mt-0.5 text-[13px] text-ink-500">{a.detalle}</p>
                <div className="mt-1 font-mono text-[11.5px] text-ink-400">{a.modulo} · {fecha(a.fecha)}</div>
              </div>
              <div className="flex gap-2">
                <Link href={a.href} className="btn-ghost"><ExternalLink size={14} /> Ver</Link>
                <button
                  type="button"
                  onClick={() => setResueltas((s) => { const n = new Set(s); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; })}
                  className={ok ? "btn-ghost" : "btn-primary"}
                >
                  <Check size={14} /> {ok ? "Reabrir" : "Resolver"}
                </button>
              </div>
            </li>
          );
        })}
        {lista.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-500">No hay alertas con estos filtros.</li>}
      </ul>
    </div>
  );
}
