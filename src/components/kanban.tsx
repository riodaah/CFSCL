"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Container } from "lucide-react";
import { Dot } from "@/components/ui";
import { ETAPAS_OC, type EtapaOC } from "@/lib/types";

export interface CardOC {
  id: string;
  etapa: EtapaOC;
  cliente: string;
  pais: string;
  contenedores: number;
  cajas: string;
  total: string;
  semaforo: "verde" | "amarillo" | "rojo";
  linea2?: string;
}

export function Kanban({ inicial }: { inicial: CardOC[] }) {
  const [cards, setCards] = useState(inicial);
  const mover = (id: string, dir: 1 | -1) =>
    setCards((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        const i = ETAPAS_OC.indexOf(c.etapa) + dir;
        return i < 0 || i >= ETAPAS_OC.length ? c : { ...c, etapa: ETAPAS_OC[i] };
      }),
    );

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      <div className="flex min-w-max gap-3">
        {ETAPAS_OC.map((etapa, ei) => {
          const col = cards.filter((c) => c.etapa === etapa);
          return (
            <div key={etapa} className="flex w-64 flex-col rounded-xl bg-ink-100/70 p-2">
              <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
                <span className="text-[13px] font-semibold text-ink-700">{etapa}</span>
                <span className="rounded-full bg-white px-2 text-[12px] tabular-nums text-ink-500">{col.length}</span>
              </div>
              <div className="flex min-h-24 flex-col gap-2">
                {col.map((c) => (
                  <article key={c.id} className="card p-3">
                    <div className="flex items-center gap-2">
                      <Dot tono={c.semaforo} />
                      <Link href={`/exportado/${c.id}`} className="font-mono text-[12px] text-ink-500 hover:text-leaf-600">{c.id}</Link>
                      <span className="ml-auto text-[12px] text-ink-400">{c.pais}</span>
                    </div>
                    <Link href={`/exportado/${c.id}`} className="mt-1.5 block text-[14px] font-semibold leading-snug hover:text-leaf-600">{c.cliente}</Link>
                    <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-600">
                      <Container size={13} aria-hidden /> {c.contenedores} cont. · {c.cajas} cajas
                    </div>
                    <div className="mt-1 text-[13px] font-medium tabular-nums">{c.total}</div>
                    {c.linea2 && <div className="mt-1 truncate text-[12px] text-ink-500">{c.linea2}</div>}
                    <div className="mt-2.5 flex justify-between border-t border-ink-100 pt-2">
                      <button
                        type="button"
                        onClick={() => mover(c.id, -1)}
                        disabled={ei === 0}
                        className="inline-flex items-center text-[12px] text-ink-500 hover:text-ink-900 disabled:opacity-30"
                        aria-label="Mover a la etapa anterior"
                      >
                        <ChevronLeft size={14} /> Atrás
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(c.id, 1)}
                        disabled={ei === ETAPAS_OC.length - 1}
                        className="inline-flex items-center text-[12px] font-medium text-leaf-600 hover:text-leaf-700 disabled:opacity-30"
                        aria-label="Avanzar a la siguiente etapa"
                      >
                        Avanzar <ChevronRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
                {col.length === 0 && <div className="rounded-lg border border-dashed border-ink-300 px-3 py-6 text-center text-[12px] text-ink-400">Sin órdenes</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
