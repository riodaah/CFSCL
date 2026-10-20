"use client";

import { useState } from "react";
import clsx from "clsx";
import { Bot, Mail, MessageSquarePlus, Phone, StickyNote } from "lucide-react";
import type { NotaGestion } from "@/lib/types";
import { fechaHora } from "@/lib/format";

const ICONO = { Nota: StickyNote, Llamada: Phone, Correo: Mail, Agente: Bot } as const;
const TIPOS: NotaGestion["tipo"][] = ["Nota", "Llamada", "Correo"];

/** Registro de gestión: quién revisó, con quién habló y qué quedó pendiente. */
export function Bitacora({ inicial, titulo = "Registro de gestión", idBase }: { inicial: NotaGestion[]; titulo?: string; idBase: string }) {
  const [notas, setNotas] = useState(inicial);
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<NotaGestion["tipo"]>("Nota");
  const [error, setError] = useState("");

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) {
      setError("Escribe la nota antes de guardarla.");
      return;
    }
    const ahora = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    setNotas((ns) => [
      { id: `nueva-${ns.length}`, fecha: `2027-03-12T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`, autor: "Francisco Padilla", tipo, texto: texto.trim() },
      ...ns,
    ]);
    setTexto("");
  }

  return (
    <section className="card min-w-0 self-start">
      <div className="border-b border-ink-100 px-4 py-3">
        <h2 className="font-display text-[15.5px] font-bold text-ink-900">{titulo}</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">Para que cualquiera del equipo sepa qué pasó, aunque no estés.</p>
      </div>
      <form onSubmit={agregar} className="space-y-2 border-b border-ink-100 px-4 py-3">
        <label htmlFor={`${idBase}-texto`} className="sr-only">Nueva nota</label>
        <textarea
          id={`${idBase}-texto`}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setError(""); }}
          rows={2}
          placeholder="Ej.: Llamé a Rodrigo, los bins faltantes vuelven el lunes."
          className="w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-[13.5px] focus:border-leaf-500 focus:outline-none"
        />
        {error && <p className="text-[12.5px] text-brand-600">{error}</p>}
        <div className="flex items-center gap-2">
          <label htmlFor={`${idBase}-tipo`} className="sr-only">Tipo</label>
          <select id={`${idBase}-tipo`} value={tipo} onChange={(e) => setTipo(e.target.value as NotaGestion["tipo"])} className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[13px]">
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button type="submit" className="btn-primary ml-auto"><MessageSquarePlus size={15} /> Guardar nota</button>
        </div>
      </form>
      <ol className="max-h-[520px] divide-y divide-ink-100 overflow-y-auto">
        {notas.map((x) => {
          const Icon = ICONO[x.tipo];
          return (
            <li key={x.id} className="flex gap-3 px-4 py-3">
              <span className={clsx("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", x.tipo === "Agente" ? "bg-sky-50 text-sky-700" : "bg-leaf-50 text-leaf-600")}>
                <Icon size={14} aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 text-[12px] text-ink-500">
                  <span className="font-medium text-ink-800">{x.autor}</span>
                  <span>{x.tipo}</span>
                  <span className="font-mono">{fechaHora(x.fecha)}</span>
                </div>
                <p className="mt-0.5 text-[13.5px] leading-snug text-ink-800">{x.texto}</p>
              </div>
            </li>
          );
        })}
        {notas.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-ink-500">Sin notas todavía. La primera que guardes queda aquí.</li>}
      </ol>
    </section>
  );
}
