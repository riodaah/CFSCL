import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, CircleDashed, Lock, Mail, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { eliminarOperacion, registrarHito } from "@/app/acciones";
import { Bitacora } from "@/components/bitacora";
import { Documentos } from "@/components/documentos";
import { BotonAccion } from "@/components/form-accion";
import { Badge, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { PASOS_FERRADA } from "@/db/schema";
import { usuarioActual } from "@/lib/auth";
import { certificadosDe, documentosDe, getOperacion, getParams, getProveedor, listaDestinos, notasDe } from "@/lib/datos";
import { ganancia, hoy, pagos, setOficialBloqueado, TIPOS_CERTIFICADO, TIPOS_DOC_OPERACION, transitoDias } from "@/lib/ferrada";
import { fechaLarga, n, usd } from "@/lib/format";

const TONO_PAGO: Record<string, Tono> = { Pagado: "verde", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };
const usd2 = (v: number | null) => (v == null ? "—" : "US$ " + v.toFixed(2).replace(".", ","));

export default async function Operacion({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const o = Number.isInteger(id) ? await getOperacion(id) : undefined;
  if (!o) notFound();
  const [u, destinos, prov, docs, notas, p] = await Promise.all([
    usuarioActual(),
    listaDestinos(),
    o.proveedorId ? getProveedor(o.proveedorId) : undefined,
    documentosDe("operacion", o.id),
    notasDe("operacion", o.id),
    getParams(),
  ]);
  const anio = Number(hoy().slice(0, 4));
  const certs = prov ? await certificadosDe(prov.id) : [];
  const d = destinos.find((x) => x.id === o.destinoId)!;
  const g = ganancia(o);
  const [p1, p2] = pagos(o, { desde: p.dias_pago2_desde ?? 5, hasta: p.dias_pago2_hasta ?? 10 });
  const idx = PASOS_FERRADA.indexOf(o.paso);
  const bloqueado = setOficialBloqueado(o);
  const transito = transitoDias(o);
  const edita = u.rol !== "lectura";
  const hito = (h: Parameters<typeof registrarHito>[1]) => registrarHito.bind(null, o.id, h);
  const tiposCargados = new Set(docs.map((x) => x.tipo));

  return (
    <>
      <Link href="/ferrada" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Operaciones
      </Link>
      <PageHeader
        etapa={`${o.codigo} · Ferrada ${o.origenPais} · orden del ${fechaLarga(o.fechaOrden)}${o.ocFerrada ? ` · OC ${o.ocFerrada}` : ""}`}
        titulo={`${o.producto}${o.variedad ? " " + o.variedad : ""} → ${d.puerto}`}
        subtitulo={`${o.contenedores} contenedor${o.contenedores > 1 ? "es" : ""} · ${o.palletsPorContenedor} pallets c/u · ${n(o.cajas)} cajas${o.calibres ? ` · calibres ${o.calibres}` : ""} · ${d.pais}, ${d.region}`}
        acciones={edita && <Link href={`/ferrada/${o.id}/editar`} className="btn-ghost"><Pencil size={14} /> Editar</Link>}
      />

      <div className="card mb-5 overflow-x-auto p-4">
        <ol className="flex min-w-max items-center gap-2">
          {PASOS_FERRADA.map((e, i) => (
            <li key={e} className="flex items-center gap-2">
              <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold", i < idx || o.paso === "Cerrada" ? "bg-leaf-500 text-white" : i === idx ? "bg-leaf-50 text-leaf-700 ring-2 ring-leaf-500" : "bg-ink-100 text-ink-400")}>
                {i < idx || o.paso === "Cerrada" ? <Check size={13} /> : i + 1}
              </span>
              <span className={clsx("text-[13px]", i === idx ? "font-semibold text-ink-900" : "text-ink-500")}>{e}</span>
              {i < PASOS_FERRADA.length - 1 && <span className={clsx("mx-1 h-px w-5", i < idx ? "bg-leaf-500" : "bg-ink-200")} />}
            </li>
          ))}
        </ol>
        {edita && o.paso !== "Cerrada" && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3">
            {!o.draftEnviado && <BotonAccion accion={hito("draft")}>Draft enviado hoy</BotonAccion>}
            {o.draftEnviado && !o.pago1Pagado && <BotonAccion accion={hito("pago1")} className="btn-primary">Pago 1 recibido hoy</BotonAccion>}
            {o.pago1Pagado && !o.setOficialEnviado && <BotonAccion accion={hito("set")} className="btn-primary">Set oficial enviado hoy</BotonAccion>}
            {o.setOficialEnviado && !o.pago2Pagado && <BotonAccion accion={hito("pago2")} confirmar="¿Cerrar operación? Clic de nuevo">Pago 2 recibido hoy</BotonAccion>}
            <BotonAccion accion={hito("siguiente")} className="btn-ghost ml-auto">
              Avanzar a «{PASOS_FERRADA[Math.min(idx + 1, PASOS_FERRADA.length - 1)]}» <ChevronRight size={14} />
            </BotonAccion>
          </div>
        )}
      </div>

      {bloqueado && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[14px] text-brand-700">
          <Lock size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div><b className="font-semibold">Set oficial bloqueado.</b> Ferrada tiene el draft desde el {fechaLarga(o.draftEnviado!)} y no ha pagado el primer 50% ({p1.texto.toLowerCase()}). Con el set oficial se retira el contenedor.</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ganancia CFSCL" valor={usd(g.total)} tono="ok" detalle="Comisión + margen + rebate" />
        <Stat label="Comisión" valor={usd(g.comision)} detalle={`${n(o.cajas)} cajas × ${usd2(o.comisionUsdCaja)}`} />
        <Stat label="Margen compraventa" valor={o.ventaUsdCaja != null && o.compraUsdCaja != null ? usd(g.margen) : "—"} detalle={o.ventaUsdCaja != null ? `Compra ${usd2(o.compraUsdCaja)} · venta ${usd2(o.ventaUsdCaja)}` : "Sin precio de venta"} />
        <Stat label="Rebate naviera" valor={usd(g.rebate)} detalle={`${o.contenedores} × ${usd(o.rebateUsdContenedor)}`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Section titulo="Proveedor" descripcion="A quién le compra CFSCL">
              {prov ? (
                <>
                  <Link href={`/proveedores/${prov.id}`} className="text-[14.5px] font-semibold text-leaf-700 hover:underline">{prov.nombre}</Link>
                  <div className="text-[12.5px] text-ink-500">{[prov.ciudad, prov.pais, prov.idTributario].filter(Boolean).join(" · ")}</div>
                  {prov.contacto && <div className="mt-2 text-[13.5px] font-medium">{prov.contacto}{prov.cargo && <span className="font-normal text-ink-500"> · {prov.cargo}</span>}</div>}
                  {prov.telefono && <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-700"><MessageCircle size={13} aria-hidden /> <span className="select-all">{prov.telefono}</span></div>}
                  {prov.email && <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-700"><Mail size={13} aria-hidden /> <span className="select-all break-all">{prov.email}</span></div>}
                  {o.ocProveedor && <div className="mt-2 text-[12.5px] text-ink-500">Orden CFSCL al proveedor: <span className="font-mono">{o.ocProveedor}</span></div>}
                  <h3 className="mt-4 text-[13px] font-semibold">Certificados {anio}</h3>
                  <ul className="mt-1.5 space-y-1">
                    {TIPOS_CERTIFICADO.map((t) => {
                      const c = certs.find((x) => x.tipo === t && x.anio === anio);
                      return (
                        <li key={t} className="flex items-center gap-2 text-[13px]">
                          {c?.recibido ? <CheckCircle2 size={15} className="text-leaf-500" /> : <CircleDashed size={15} className="text-brand-500" />}
                          <span className="flex-1">{t}</span>
                          <span className={clsx("text-[12px]", c?.recibido ? "text-ink-500" : "font-medium text-brand-600")}>{c?.recibido ? fechaLarga(c.recibido) : "Falta"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="text-[13.5px] text-amber-800">Proveedor por buscar en {o.origenPais}.</p>
              )}
            </Section>
            <Section titulo="Logística">
              <dl className="space-y-2 text-[13.5px]">
                {[
                  ["Naviera", o.naviera],
                  ["Booking", o.booking],
                  ["Barco", o.barco],
                  ["Zarpe (ETD)", o.etd && fechaLarga(o.etd)],
                  ["Llegada (ETA)", o.eta && fechaLarga(o.eta)],
                  ["Tránsito", transito != null && `${transito} días`],
                  ["Contenedores", o.numerosContenedor],
                  ["Destino", `${d.puerto}, ${d.pais}`],
                ].map(([k, val]) => (
                  <div key={k as string} className="flex justify-between gap-3">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className={clsx("text-right", !val && "text-ink-400")}>{val || "Pendiente"}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          </div>

          <Section titulo="Compra y venta" sinPadding>
            <TableWrap>
              <thead className="border-b border-ink-100">
                <tr><th className="th">Concepto</th><th className="th text-right">Por caja</th><th className="th text-right">Total</th></tr>
              </thead>
              <tbody>
                <tr className="border-b border-ink-100"><td className="td">Compra al proveedor</td><td className="td text-right">{usd2(o.compraUsdCaja)}</td><td className="td text-right">{g.compra != null ? usd(g.compra) : "—"}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Venta a Ferrada</td><td className="td text-right">{usd2(o.ventaUsdCaja)}</td><td className="td text-right">{g.venta != null ? usd(g.venta) : "—"}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Comisión</td><td className="td text-right">{usd2(o.comisionUsdCaja)}</td><td className="td text-right">{usd(g.comision)}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Rebate de la naviera</td><td className="td text-right">—</td><td className="td text-right">{usd(g.rebate)}</td></tr>
                <tr className="bg-ink-50"><td className="td font-semibold">Ganancia CFSCL</td><td className="td" /><td className="td text-right font-semibold text-leaf-700">{usd(g.total)}</td></tr>
              </tbody>
            </TableWrap>
          </Section>

          <Section titulo="Pagos de Ferrada" descripcion="50% contra el draft · 50% tras la llegada" sinPadding>
            <TableWrap>
              <thead className="border-b border-ink-100">
                <tr><th className="th">Hito</th><th className="th text-right">Monto</th><th className="th">Fecha</th><th className="th">Estado</th></tr>
              </thead>
              <tbody>
                {([["Pago 1 · contra draft", p1], ["Pago 2 · tras la llegada", p2]] as const).map(([t, pp]) => (
                  <tr key={t} className={clsx("border-b border-ink-100 last:border-0", pp.estado === "Vencido" && "bg-brand-50/60")}>
                    <td className="td font-medium">{t}</td>
                    <td className="td text-right">{pp.monto != null ? usd(pp.monto) : "Sin precio"}</td>
                    <td className="td">{pp.texto}</td>
                    <td className="td"><Badge tono={TONO_PAGO[pp.estado]}>{pp.estado}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Section>

          <Documentos entidad="operacion" entidadId={o.id} docs={docs} tipos={TIPOS_DOC_OPERACION} puedeEditar={edita} />
          <div className="card p-4">
            <h3 className="text-[13px] font-semibold">Checklist de documentos</h3>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {TIPOS_DOC_OPERACION.filter((t) => t !== "Otro").map((t) => (
                <li key={t} className="flex items-center gap-2 text-[13px]">
                  {tiposCargados.has(t) ? <CheckCircle2 size={15} className="text-leaf-500" /> : <CircleDashed size={15} className="text-ink-300" />}
                  <span className={tiposCargados.has(t) ? "" : "text-ink-500"}>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {o.notas && (
            <Section titulo="Notas de la operación">
              <p className="whitespace-pre-line text-[13.5px] text-ink-700">{o.notas}</p>
            </Section>
          )}
          {u.rol === "admin" && (
            <div className="flex justify-end">
              <BotonAccion accion={eliminarOperacion.bind(null, o.id)} className="btn-danger" confirmar="Se borra con sus documentos. Clic de nuevo">
                <Trash2 size={14} /> Eliminar operación
              </BotonAccion>
            </div>
          )}
        </div>
        <Bitacora entidad="operacion" entidadId={o.id} notas={notas} />
      </div>
    </>
  );
}
