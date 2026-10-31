import clsx from "clsx";
import { Bot, Mail, MessageSquarePlus, Phone, StickyNote } from "lucide-react";
import { agregarNota } from "@/app/acciones";
import { TIPOS_NOTA, type Entidad, type Nota } from "@/db/schema";
import { FormAccion } from "./form-accion";

const ICONO = { Nota: StickyNote, Llamada: Phone, Correo: Mail, Agente: Bot } as const;

const fechaHora = (d: Date) =>
  new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);

/** Registro de gestión: quién hizo qué y cuándo. */
export function Bitacora({ entidad, entidadId, notas, titulo = "Registro de gestión" }: { entidad: Entidad; entidadId: number | null; notas: Nota[]; titulo?: string }) {
  const accion = agregarNota.bind(null, entidad, entidadId);
  const idBase = `nota-${entidad}-${entidadId ?? "g"}`;
  return (
    <section className="card min-w-0 self-start">
      <div className="border-b border-ink-100 px-4 py-3">
        <h2 className="font-display text-[15.5px] font-bold text-ink-900">{titulo}</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">Cada cambio queda registrado con su autor.</p>
      </div>
      <FormAccion
        action={accion}
        resetear
        className="border-b border-ink-100 px-4 py-3"
        submit={<><MessageSquarePlus size={15} /> Guardar nota</>}
        pie={
          <>
            <label htmlFor={`${idBase}-tipo`} className="sr-only">Tipo</label>
            <select id={`${idBase}-tipo`} name="tipo" defaultValue="Nota" className="input ml-auto w-auto py-1.5">
              {TIPOS_NOTA.filter((t) => t !== "Agente").map((t) => <option key={t}>{t}</option>)}
            </select>
          </>
        }
      >
        <label htmlFor={`${idBase}-texto`} className="sr-only">Nueva nota</label>
        <textarea id={`${idBase}-texto`} name="texto" rows={2} placeholder="Ej.: Gustavo confirma el booking para el jueves." className="input resize-none" />
      </FormAccion>
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
                  <span className="font-mono">{fechaHora(x.creadoEn)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-line text-[13.5px] leading-snug text-ink-800">{x.texto}</p>
              </div>
            </li>
          );
        })}
        {notas.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-ink-500">Sin notas todavía.</li>}
      </ol>
    </section>
  );
}
