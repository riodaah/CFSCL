"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Container, Lock } from "lucide-react";
import { Dot } from "@/components/ui";
import { COLUMNAS_OC, PASOS_OC, type PasoOC } from "@/lib/types";

export interface CardOC {
  id: string;
  paso: PasoOC;
  cliente: string;
  destino: string;
  contenedores: number;
  cajas: string;
  total: string;
  semaforo: "verde" | "amarillo" | "rojo";
  detalle: string;
  /** Hito contra documentos sin pagar: no se puede avanzar más allá del draft */
  bloqueoPago: boolean;
  faltaFruta?: string;
}

const INDICE = (p: PasoOC) => PASOS_OC.indexOf(p);

export function Tablero({ inicial }: { inicial: CardOC[] }) {
  const [cards, setCards] = useState(inicial);
  const [aviso, setAviso] = useState<Record<string, string>>({});

  function mover(id: string, dir: 1 | -1) {
    setCards((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        const i = INDICE(c.paso) + dir;
        if (i < 0 || i >= PASOS_OC.length - 1) return c;
        if (dir === 1 && c.paso === "Draft enviado" && c.bloqueoPago) {
          setAviso((a) => ({ ...a, [id]: "Falta el pago contra documentos. No envíes el set oficial: con él pueden retirar el contenedor." }));
          return c;
        }
        setAviso((a) => ({ ...a, [id]: "" }));
        return { ...c, paso: PASOS_OC[i] };
      }),
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLUMNAS_OC.map((col) => {
        const lista = cards.filter((c) => (col.pasos as readonly string[]).includes(c.paso));
        return (
          <div key={col.id} className="flex min-w-0 flex-col rounded-xl bg-ink-100/70 p-2.5">
            <div className="flex items-start justify-between px-1.5 pb-2.5 pt-1">
              <div>
                <div className="text-[14px] font-semibold text-ink-800">{col.titulo}</div>
                <div className="text-[12px] text-ink-500">{col.descripcion}</div>
              </div>
              <span className="rounded-full bg-white px-2 text-[12px] tabular-nums text-ink-500">{lista.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {lista.map((c) => {
                const pasosCol = col.pasos as readonly PasoOC[];
                const k = pasosCol.indexOf(c.paso);
                return (
                  <article key={c.id} className="card p-3.5">
                    <div className="flex items-center gap-2">
                      <Dot tono={c.semaforo} />
                      <Link href={`/clientes/oc/${c.id}`} className="font-mono text-[12px] text-ink-500 hover:text-leaf-600">{c.id}</Link>
                      <span className="ml-auto truncate text-[12px] text-ink-400">{c.destino}</span>
                    </div>
                    <Link href={`/clientes/oc/${c.id}`} className="mt-1.5 block text-[14.5px] font-semibold leading-snug hover:text-leaf-600">{c.cliente}</Link>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-600">
                      <Container size={13} aria-hidden /> {c.contenedores} cont. · {c.cajas} cajas · <span className="font-medium text-ink-900">{c.total}</span>
                    </div>
                    <div className="mt-1 truncate text-[12px] text-ink-500">{c.detalle}</div>

                    {/* Pasos dentro de la columna */}
                    <ol className="mt-3 flex gap-1" aria-label="Avance en esta etapa">
                      {pasosCol.map((p, i) => (
                        <li key={p} className="min-w-0 flex-1">
                          <div className={clsx("h-1.5 rounded-full", i < k ? "bg-leaf-500" : i === k ? "bg-leaf-500/60" : "bg-ink-200")} />
                          <div className={clsx("mt-1 truncate text-[11px]", i === k ? "font-semibold text-ink-800" : "text-ink-400")}>{p}</div>
                        </li>
                      ))}
                    </ol>

                    {c.faltaFruta && <div className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[12px] text-amber-900">{c.faltaFruta}</div>}
                    {c.paso === "Draft enviado" && c.bloqueoPago && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[12px] font-medium text-brand-700">
                        <Lock size={12} aria-hidden /> Set oficial bloqueado hasta el pago
                      </div>
                    )}
                    {aviso[c.id] && <p className="mt-2 text-[12px] text-brand-600">{aviso[c.id]}</p>}

                    <div className="mt-2.5 flex justify-between border-t border-ink-100 pt-2">
                      <button type="button" onClick={() => mover(c.id, -1)} disabled={INDICE(c.paso) === 0} className="inline-flex items-center text-[12px] text-ink-500 hover:text-ink-900 disabled:opacity-30" aria-label="Volver al paso anterior">
                        <ChevronLeft size={14} /> Atrás
                      </button>
                      <button type="button" onClick={() => mover(c.id, 1)} disabled={INDICE(c.paso) >= PASOS_OC.length - 2} className="inline-flex items-center text-[12px] font-medium text-leaf-600 hover:text-leaf-700 disabled:opacity-30" aria-label="Avanzar al paso siguiente">
                        Avanzar paso <ChevronRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
              {lista.length === 0 && <div className="rounded-lg border border-dashed border-ink-300 px-3 py-6 text-center text-[12px] text-ink-400">Sin órdenes en esta etapa</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
