import { Download, FileText, Trash2, Upload } from "lucide-react";
import { borrarDocumento, subirDocumento } from "@/app/acciones";
import type { Documento, Entidad } from "@/db/schema";
import { fechaLarga } from "@/lib/format";
import { BotonAccion, Campo, FormAccion } from "./form-accion";

const peso = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Lista de documentos de una ficha + formulario para subir. */
export function Documentos({
  entidad,
  entidadId,
  docs,
  tipos,
  puedeEditar,
  descripcion,
}: {
  entidad: Entidad;
  entidadId: number;
  docs: Documento[];
  tipos: readonly string[];
  puedeEditar: boolean;
  descripcion?: string;
}) {
  const accion = subirDocumento.bind(null, entidad, entidadId);
  return (
    <section className="card min-w-0">
      <div className="border-b border-ink-100 px-4 py-3">
        <h2 className="font-display text-[15.5px] font-bold text-ink-900">Documentos</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">{descripcion ?? "PDF, imágenes, Excel o Word. Hasta 25 MB por archivo."}</p>
      </div>
      {puedeEditar && (
        <FormAccion action={accion} resetear className="border-b border-ink-100 px-4 py-3" submit={<><Upload size={15} /> Subir</>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Tipo de documento">
              <select name="tipo" required className="input" defaultValue="">
                <option value="" disabled>Elegir…</option>
                {tipos.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Campo>
            <Campo label="Archivo">
              <input type="file" name="archivo" multiple required className="input py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-leaf-50 file:px-2.5 file:py-1 file:text-[13px] file:text-leaf-700" />
            </Campo>
          </div>
        </FormAccion>
      )}
      <ul className="divide-y divide-ink-100">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <FileText size={17} className="shrink-0 text-leaf-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium">{d.tipo}</div>
              <div className="truncate text-[12px] text-ink-500">
                {d.nombreArchivo} · {peso(d.tamanoBytes)} · {d.subidoPor} · {fechaLarga(d.creadoEn.toISOString())}
              </div>
            </div>
            <a href={`/api/documentos/${d.id}`} target="_blank" rel="noreferrer" className="btn-ghost py-1">
              <Download size={14} /> Ver
            </a>
            {puedeEditar && (
              <BotonAccion accion={borrarDocumento.bind(null, d.id)} className="btn-ghost py-1 text-brand-700" confirmar="¿Eliminar? Clic de nuevo" title="Eliminar">
                <Trash2 size={14} /> <span className="sr-only">Eliminar</span>
              </BotonAccion>
            )}
          </li>
        ))}
        {docs.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-ink-500">Sin documentos todavía.</li>}
      </ul>
    </section>
  );
}
