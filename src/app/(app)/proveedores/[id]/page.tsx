import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleDashed, Mail, MessageCircle, Pencil, Upload } from "lucide-react";
import { marcarCertificado, subirDocumento } from "@/app/acciones";
import { Bitacora } from "@/components/bitacora";
import { Documentos } from "@/components/documentos";
import { BotonAccion, Campo, FormAccion } from "@/components/form-accion";
import { Badge, PageHeader, Section, TableWrap } from "@/components/ui";
import { usuarioActual } from "@/lib/auth";
import { certificadosDe, documentosDe, getProveedor, listaOperaciones, notasDe } from "@/lib/datos";
import { hoy, TIPOS_CERTIFICADO, TIPOS_DOC_PROVEEDOR } from "@/lib/ferrada";
import { fechaLarga, n } from "@/lib/format";

export default async function ProveedorDetalle({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await getProveedor(id) : undefined;
  if (!p) notFound();
  const [u, certs, docs, notas, ops] = await Promise.all([usuarioActual(), certificadosDe(p.id), documentosDe("proveedor", p.id), notasDe("proveedor", p.id), listaOperaciones()]);
  const anio = Number(hoy().slice(0, 4));
  const edita = u.rol !== "lectura";
  const misOps = ops.filter((o) => o.proveedorId === p.id);
  const subirCert = subirDocumento.bind(null, "proveedor", p.id);

  return (
    <>
      <Link href="/proveedores" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Proveedores
      </Link>
      <PageHeader
        etapa={`Proveedor · ${p.pais}${p.activo ? "" : " · inactivo"}`}
        titulo={p.nombre}
        subtitulo={[p.ciudad, p.idTributario].filter(Boolean).join(" · ") || undefined}
        acciones={edita && <Link href={`/proveedores/${p.id}/editar`} className="btn-ghost"><Pencil size={14} /> Editar</Link>}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Section titulo="Contacto">
              {p.contacto || p.telefono || p.email ? (
                <>
                  {p.contacto && <div className="text-[14px] font-medium">{p.contacto}{p.cargo && <span className="font-normal text-ink-500"> · {p.cargo}</span>}</div>}
                  {p.telefono && <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px]"><MessageCircle size={13} aria-hidden /> <span className="select-all">{p.telefono}</span></div>}
                  {p.email && <div className="mt-1 flex items-center gap-1.5 text-[13.5px]"><Mail size={13} aria-hidden /> <span className="select-all break-all">{p.email}</span></div>}
                </>
              ) : (
                <p className="text-[13.5px] text-amber-800">Faltan los datos de contacto.</p>
              )}
              {p.notas && <p className="mt-3 whitespace-pre-line text-[13px] text-ink-600">{p.notas}</p>}
            </Section>
            <Section titulo={`Certificados ${anio}`} descripcion="Valen de enero a diciembre y se reutilizan en todas las operaciones">
              <ul className="space-y-2">
                {TIPOS_CERTIFICADO.map((t) => {
                  const c = certs.find((x) => x.tipo === t && x.anio === anio);
                  return (
                    <li key={t} className="flex flex-wrap items-center gap-2 text-[13.5px]">
                      {c?.recibido ? <CheckCircle2 size={16} className="text-leaf-500" /> : <CircleDashed size={16} className="text-brand-500" />}
                      <span className="flex-1">{t}</span>
                      {c?.recibido ? (
                        <span className="text-[12px] text-ink-500">{c.documentoId ? <a href={`/api/documentos/${c.documentoId}`} target="_blank" rel="noreferrer" className="text-leaf-700 underline">Recibido {fechaLarga(c.recibido)}</a> : `Recibido ${fechaLarga(c.recibido)}`}</span>
                      ) : (
                        <span className="text-[12px] font-medium text-brand-600">Falta</span>
                      )}
                      {edita && (
                        <BotonAccion accion={marcarCertificado.bind(null, p.id, t, anio, !c?.recibido)} className="btn-ghost px-2 py-0.5 text-[12px]">
                          {c?.recibido ? "Desmarcar" : "Marcar recibido"}
                        </BotonAccion>
                      )}
                    </li>
                  );
                })}
              </ul>
              {edita && (
                <FormAccion action={subirCert} resetear className="mt-4 border-t border-ink-100 pt-3" submit={<><Upload size={14} /> Subir certificado</>} submitClassName="btn-ghost">
                  <input type="hidden" name="certificado" value="1" />
                  <input type="hidden" name="anio" value={anio} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo label="Certificado">
                      <select name="tipo" required defaultValue="" className="input">
                        <option value="" disabled>Elegir…</option>
                        {TIPOS_CERTIFICADO.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </Campo>
                    <Campo label="Archivo">
                      <input type="file" name="archivo" required className="input py-1.5" />
                    </Campo>
                  </div>
                </FormAccion>
              )}
            </Section>
          </div>

          <Section titulo={`Operaciones de Ferrada (${misOps.length})`} sinPadding>
            {misOps.length ? (
              <TableWrap>
                <thead className="border-b border-ink-100">
                  <tr><th className="th">Operación</th><th className="th">Fruta</th><th className="th text-right">Cont.</th><th className="th text-right">Cajas</th><th className="th">Paso</th></tr>
                </thead>
                <tbody>
                  {misOps.map((o) => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="td"><Link href={`/ferrada/${o.id}`} className="font-mono text-[12.5px] text-leaf-600 hover:underline">{o.codigo}</Link></td>
                      <td className="td">{o.producto} {o.variedad}</td>
                      <td className="td text-right">{o.contenedores}</td>
                      <td className="td text-right">{n(o.cajas)}</td>
                      <td className="td"><Badge>{o.paso}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            ) : (
              <p className="px-4 py-5 text-[13px] text-ink-500">Sin operaciones todavía.</p>
            )}
          </Section>

          <Documentos entidad="proveedor" entidadId={p.id} docs={docs} tipos={TIPOS_DOC_PROVEEDOR} puedeEditar={edita} />
        </div>
        <Bitacora entidad="proveedor" entidadId={p.id} notas={notas} />
      </div>
    </>
  );
}
