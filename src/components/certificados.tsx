import clsx from "clsx";
import { AlertTriangle, CheckCircle2, CircleDashed, FileText, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { borrarCertificado, registrarCertificado } from "@/app/acciones";
import type { Certificado, Proveedor } from "@/db/schema";
import { estadoCertificado, resumenCertificados, TIPOS_CERTIFICADO, type EstadoCert } from "@/lib/ferrada";
import { fechaLarga } from "@/lib/format";
import { BotonAccion, Campo, FormAccion, TomarFoto } from "./form-accion";

const ICONO: Record<EstadoCert, React.ReactNode> = {
  Vigente: <CheckCircle2 size={16} className="shrink-0 text-leaf-500" aria-hidden />,
  "Por vencer": <AlertTriangle size={16} className="shrink-0 text-amber-600" aria-hidden />,
  Vencido: <XCircle size={16} className="shrink-0 text-brand-500" aria-hidden />,
  Falta: <CircleDashed size={16} className="shrink-0 text-brand-500" aria-hidden />,
};

function Vigencia({ estado, cert, dias }: { estado: EstadoCert; cert?: Certificado; dias?: number }) {
  if (estado === "Falta") return <span className="text-[12.5px] font-medium text-brand-600">Falta</span>;
  if (!cert?.vigenteHasta) return <span className="text-[12.5px] text-ink-500">Sin vencimiento</span>;
  const hasta = fechaLarga(cert.vigenteHasta);
  const texto = estado === "Vencido" ? `Venció el ${hasta}` : estado === "Por vencer" ? `Vence en ${dias} días` : `Hasta ${hasta}`;
  return <span className={clsx("text-[12.5px]", estado === "Vigente" ? "text-ink-500" : estado === "Por vencer" ? "font-medium text-amber-700" : "font-medium text-brand-600")}>{texto}</span>;
}

/** Resumen compacto de los certificados exigidos (para la ficha de la operación). */
export function CertificadosResumen({ proveedor, certs }: { proveedor: Proveedor; certs: Certificado[] }) {
  const { lista } = resumenCertificados(proveedor.tipo, certs);
  return (
    <ul className="space-y-1.5">
      {lista.map((x) => (
        <li key={x.tipo} className="flex items-center gap-2 text-[13.5px]">
          {ICONO[x.estado]}
          <span className="min-w-0 flex-1">
            {x.cert?.documentoId ? (
              <a href={`/api/documentos/${x.cert.documentoId}`} target="_blank" rel="noreferrer" className="text-leaf-700 underline-offset-2 hover:underline">{x.tipo}</a>
            ) : (
              x.tipo
            )}
          </span>
          <Vigencia {...x} />
        </li>
      ))}
    </ul>
  );
}

/** Ficha completa de certificados del proveedor o planta, con registro de nuevos. */
export function CertificadosProveedor({ proveedor, certs, puedeEditar }: { proveedor: Proveedor; certs: Certificado[]; puedeEditar: boolean }) {
  const { lista } = resumenCertificados(proveedor.tipo, certs);
  const exigidos = new Set(lista.map((x) => x.tipo));
  const historial = [...certs].sort((a, b) => (b.vigenteHasta ?? "").localeCompare(a.vigenteHasta ?? ""));
  return (
    <section className="card min-w-0">
      <div className="border-b border-ink-100 px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-ink-900">
          <ShieldCheck size={17} className="text-leaf-600" aria-hidden /> Certificados
        </h2>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          {proveedor.tipo === "Planta de embalaje" ? "Buenas prácticas e inocuidad de la planta." : "Trazabilidad, responsabilidad social y lugar de producción."} Se cargan una vez y sirven para todas las operaciones mientras estén vigentes. El sistema avisa 30 días antes de que venzan.
        </p>
      </div>
      <ul className="divide-y divide-ink-100">
        {lista.map((x) => (
          <li key={x.tipo} className="flex items-center gap-3 px-4 py-2.5">
            {ICONO[x.estado]}
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium">{x.tipo}</div>
              {x.cert && (
                <div className="truncate text-[12px] text-ink-500">
                  {[x.cert.numero && `N° ${x.cert.numero}`, x.cert.emisor].filter(Boolean).join(" · ") || "Sin número"}
                </div>
              )}
            </div>
            <Vigencia {...x} />
          </li>
        ))}
        {historial
          .filter((c) => !exigidos.has(c.tipo))
          .map((c) => {
            const e = estadoCertificado([c], c.tipo);
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                {ICONO[e.estado]}
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{c.tipo} <span className="text-[12px] font-normal text-ink-400">adicional</span></div>
                  <div className="truncate text-[12px] text-ink-500">{[c.numero && `N° ${c.numero}`, c.emisor].filter(Boolean).join(" · ")}</div>
                </div>
                <Vigencia {...e} />
              </li>
            );
          })}
      </ul>

      {historial.length > 0 && (
        <details className="border-t border-ink-100 px-4 py-2.5">
          <summary className="cursor-pointer py-1 text-[13px] font-medium text-ink-600">Archivos y detalle ({historial.length})</summary>
          <ul className="mt-2 space-y-2">
            {historial.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                <FileText size={15} className="text-leaf-500" aria-hidden />
                <span className="min-w-0 flex-1">
                  <b className="font-medium">{c.tipo}</b>
                  {c.numero && ` · N° ${c.numero}`}
                  {c.vigenteDesde && ` · ${fechaLarga(c.vigenteDesde)} → ${c.vigenteHasta ? fechaLarga(c.vigenteHasta) : "?"}`}
                </span>
                {c.documentoId && (
                  <a href={`/api/documentos/${c.documentoId}`} target="_blank" rel="noreferrer" className="text-leaf-700 underline">Ver PDF</a>
                )}
                {puedeEditar && (
                  <BotonAccion accion={borrarCertificado.bind(null, c.id)} className="btn-ghost min-h-[36px] px-2 py-0.5 text-[12px] text-brand-700 lg:min-h-0" confirmar="¿Eliminar? Toca de nuevo" title="Eliminar certificado">
                    <Trash2 size={13} />
                  </BotonAccion>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {puedeEditar && (
        <FormAccion action={registrarCertificado.bind(null, proveedor.id)} resetear className="border-t border-ink-100 px-4 py-3" submit="Registrar certificado" submitClassName="btn-ghost" pie={<TomarFoto />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Certificado">
              <select name="tipo" required defaultValue="" className="input">
                <option value="" disabled>Elegir…</option>
                {TIPOS_CERTIFICADO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Campo>
            <Campo label="Número"><input name="numero" className="input" placeholder="Ej.: 21453" /></Campo>
            <Campo label="Organismo certificador"><input name="emisor" className="input" placeholder="Ej.: Agrocolor, SENASA" /></Campo>
            <Campo label="Archivo"><input type="file" name="archivo" className="input py-1.5" /></Campo>
            <Campo label="Vigente desde"><input type="date" name="vigenteDesde" className="input" /></Campo>
            <Campo label="Vence"><input type="date" name="vigenteHasta" required className="input" /></Campo>
          </div>
        </FormAccion>
      )}
    </section>
  );
}
