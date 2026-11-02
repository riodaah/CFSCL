import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, CircleDashed, Lock, Mail, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { eliminarOperacion, registrarHito } from "@/app/acciones";
import { Bitacora } from "@/components/bitacora";
import { Documentos } from "@/components/documentos";
import { BotonAccion } from "@/components/form-accion";
import { CertificadosResumen } from "@/components/certificados";
import { Badge, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { PASOS_FERRADA } from "@/db/schema";
import { usuarioActual } from "@/lib/auth";
import { certificadosDe, documentosDe, getOperacion, getParams, getProveedor, listaDestinos, notasDe } from "@/lib/datos";
import { FULL_SET_FERRADA, ganancia, pagos, setOficialBloqueado, TIPOS_DOC_OPERACION, transitoDias } from "@/lib/ferrada";
import { fechaLarga, n, usd } from "@/lib/format";

const TONO_PAGO: Record<string, Tono> = { Pagado: "verde", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };
const usd2 = (v: number | null) => (v == null ? "—" : "US$ " + v.toFixed(2).replace(".", ","));

export default async function Operacion({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const o = Number.isInteger(id) ? await getOperacion(id) : undefined;
  if (!o) notFound();
  const [u, destinos, prov, planta, docs, notas, p] = await Promise.all([
    usuarioActual(),
    listaDestinos(),
    o.proveedorId ? getProveedor(o.proveedorId) : undefined,
    o.plantaId ? getProveedor(o.plantaId) : undefined,
    documentosDe("operacion", o.id),
    notasDe("operacion", o.id),
    getParams(),
  ]);
  const [certs, certsPlanta] = await Promise.all([prov ? certificadosDe(prov.id) : [], planta ? certificadosDe(planta.id) : []]);
  const d = destinos.find((x) => x.id === o.destinoId)!;
  const g = ganancia(o);
  const [p1, p2] = pagos(o, { desde: p.dias_pago2_desde ?? 15, hasta: p.dias_pago2_hasta ?? 20 });
  const idx = PASOS_FERRADA.indexOf(o.paso);
  const bloqueado = setOficialBloqueado(o);
  const transito = transitoDias(o);
  const edita = u.rol !== "lectura";
  const hito = (h: Parameters<typeof registrarHito>[1]) => registrarHito.bind(null, o.id, h);
  const tiposCargados = new Set(docs.map((x) => x.tipo));
  const siguiente = PASOS_FERRADA[Math.min(idx + 1, PASOS_FERRADA.length - 1)];
  const botonesHito = (
    <>
      {!o.draftEnviado && <BotonAccion accion={hito("draft")} className="btn-primary">Draft enviado hoy</BotonAccion>}
      {o.draftEnviado && !o.pago1Pagado && <BotonAccion accion={hito("pago1")} className="btn-primary">Pago 1 recibido hoy</BotonAccion>}
      {o.pago1Pagado && !o.setOficialEnviado && <BotonAccion accion={hito("set")} className="btn-primary">Set oficial enviado hoy</BotonAccion>}
      {o.setOficialEnviado && !o.pago2Pagado && <BotonAccion accion={hito("pago2")} className="btn-primary" confirmar="¿Cerrar? Toca de nuevo">Pago 2 recibido hoy</BotonAccion>}
      <BotonAccion accion={hito("siguiente")} className="btn-ghost lg:ml-auto" title={`Avanzar a ${siguiente}`}>
        <span className="lg:hidden">Avanzar paso</span>
        <span className="hidden lg:inline">Avanzar a «{siguiente}»</span> <ChevronRight size={14} />
      </BotonAccion>
    </>
  );

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

      <div className="card mb-5 p-4">
        {/* Teléfono y tablet vertical: paso actual compacto */}
        <div className="lg:hidden">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold text-ink-900">{o.paso}</span>
            <span className="text-[12.5px] text-ink-500">Paso {idx + 1} de {PASOS_FERRADA.length}</span>
          </div>
          <div className="mt-2 flex gap-1">
            {PASOS_FERRADA.map((x, i) => <div key={x} className={clsx("h-2 flex-1 rounded-full", i < idx || o.paso === "Cerrada" ? "bg-leaf-500" : i === idx ? "bg-leaf-500/50" : "bg-ink-200")} />)}
          </div>
          {o.paso !== "Cerrada" && <div className="mt-1.5 text-[12.5px] text-ink-500">Sigue: {PASOS_FERRADA[idx + 1]}</div>}
        </div>
        {/* Escritorio y tablet horizontal: todos los pasos */}
        <div className="hidden overflow-x-auto lg:block">
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
        </div>
        {edita && o.paso !== "Cerrada" && <div className="mt-4 hidden flex-wrap gap-2 border-t border-ink-100 pt-3 lg:flex">{botonesHito}</div>}
      </div>

      {/* Teléfono y tablet: la próxima acción fija sobre la barra inferior */}
      {edita && o.paso !== "Cerrada" && (
        <div className="fixed inset-x-0 z-20 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden" style={{ bottom: "var(--nav-h)" }}>
          <div className="mx-auto flex max-w-3xl gap-2 [&>span]:flex-1 [&>span>button]:w-full">{botonesHito}</div>
        </div>
      )}

      {bloqueado && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[14px] text-brand-700">
          <Lock size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div><b className="font-semibold">Set oficial bloqueado.</b> Ferrada tiene el draft desde el {fechaLarga(o.draftEnviado!)} y no ha pagado el anticipo ({p1.texto.toLowerCase()}). Con el set oficial se retira el contenedor.</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
                  {prov.telefono && <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-700"><MessageCircle size={13} aria-hidden /> <a href={`https://wa.me/${prov.telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-leaf-700 underline-offset-2 hover:underline">{prov.telefono}</a></div>}
                  {prov.email && <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-700"><Mail size={13} aria-hidden /> <a href={`mailto:${prov.email}`} className="break-all text-leaf-700 underline-offset-2 hover:underline">{prov.email}</a></div>}
                  {o.ocProveedor && <div className="mt-2 text-[12.5px] text-ink-500">Orden CFSCL al proveedor: <span className="font-mono">{o.ocProveedor}</span></div>}
                  <h3 className="mt-4 text-[13px] font-semibold">Certificados del proveedor</h3>
                  <div className="mt-1.5"><CertificadosResumen proveedor={prov} certs={certs} /></div>
                  {planta && (
                    <>
                      <h3 className="mt-4 text-[13px] font-semibold">
                        Planta de embalaje: <Link href={`/proveedores/${planta.id}`} className="font-semibold text-leaf-700 hover:underline">{planta.nombre}</Link>
                      </h3>
                      <div className="mt-1.5"><CertificadosResumen proveedor={planta} certs={certsPlanta} /></div>
                    </>
                  )}
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
                  ["BL", o.bl],
                  ["Barco", o.barco],
                  ["Zarpe (ETD)", o.etd && fechaLarga(o.etd)],
                  ["Llegada (ETA)", o.eta && fechaLarga(o.eta)],
                  ["Tránsito", transito != null && `${transito} días`],
                  ["Contenedor", o.numerosContenedor],
                  ["Destino", `${d.puerto}, ${d.pais}`],
                  ["Consignatario", o.consignatario],
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
                <tr className="border-b border-ink-100"><td className="td">Anticipo de Ferrada (contra documentos)</td><td className="td text-right">{usd2(o.anticipoUsdCaja)}</td><td className="td text-right">{o.anticipoUsdCaja != null ? usd(o.anticipoUsdCaja * o.cajas) : "—"}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Precio mínimo garantizado (FOB)</td><td className="td text-right">{o.precioMinimoUsdCaja != null ? usd2(o.precioMinimoUsdCaja) : "Open"}</td><td className="td text-right">{o.precioMinimoUsdCaja != null ? usd(o.precioMinimoUsdCaja * o.cajas) : "Según venta"}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Venta a Ferrada (final)</td><td className="td text-right">{usd2(o.ventaUsdCaja)}</td><td className="td text-right">{g.venta != null ? usd(g.venta) : "—"}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Comisión</td><td className="td text-right">{usd2(o.comisionUsdCaja)}</td><td className="td text-right">{usd(g.comision)}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Rebate de la naviera</td><td className="td text-right">—</td><td className="td text-right">{usd(g.rebate)}</td></tr>
                <tr className="bg-ink-50"><td className="td font-semibold">Ganancia CFSCL</td><td className="td" /><td className="td text-right font-semibold text-leaf-700">{usd(g.total)}</td></tr>
              </tbody>
            </TableWrap>
          </Section>

          <Section titulo="Pagos de Ferrada" descripcion={`Anticipo contra el full set de documentos · saldo según cuenta de venta, ${p.dias_pago2_desde ?? 15} a ${p.dias_pago2_hasta ?? 20} días después de la llegada`} sinPadding>
            <ul className="divide-y divide-ink-100">
              {([["Pago 1 · anticipo", p1], ["Pago 2 · saldo", p2]] as const).map(([t, pp]) => (
                <li key={t} className={clsx("grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 sm:grid-cols-[1.3fr_1fr_1.4fr_auto]", pp.estado === "Vencido" && "bg-brand-50/60")}>
                  <span className="text-[14px] font-medium">{t}</span>
                  <span className="text-right text-[14px] font-semibold tabular-nums sm:order-none">{pp.monto != null ? usd(pp.monto) : t === "Pago 2 · saldo" ? "Según venta" : "Sin precio"}</span>
                  <span className="text-[13px] text-ink-500 sm:text-[14px] sm:text-ink-700">{pp.texto}</span>
                  <span className="justify-self-end"><Badge tono={TONO_PAGO[pp.estado]}>{pp.estado}</Badge></span>
                </li>
              ))}
            </ul>
          </Section>

          <Documentos entidad="operacion" entidadId={o.id} docs={docs} tipos={TIPOS_DOC_OPERACION} puedeEditar={edita} />
          <div className="card p-4">
            <h3 className="text-[13px] font-semibold">Full set que exige Ferrada para pagar el anticipo</h3>
            <p className="mt-0.5 text-[12.5px] text-ink-500">BL, certificado de origen, fitosanitario, packing list, factura y cold treatment. Antes de enviar originales se mandan copias a revisión.</p>
            <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
              {FULL_SET_FERRADA.map((t) => (
                <li key={t} className="flex items-center gap-2 text-[13.5px]">
                  {tiposCargados.has(t) ? <CheckCircle2 size={15} className="text-leaf-500" /> : <CircleDashed size={15} className="text-ink-300" />}
                  <span className={tiposCargados.has(t) ? "" : "text-ink-500"}>{t}</span>
                  {t === "BL" && !tiposCargados.has("BL") && tiposCargados.has("Draft de BL") && <span className="text-[12px] text-amber-700">· hay draft</span>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-ink-500">{FULL_SET_FERRADA.filter((t) => tiposCargados.has(t)).length} de {FULL_SET_FERRADA.length} listos</p>
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
      {edita && o.paso !== "Cerrada" && <div className="h-20 lg:hidden" aria-hidden />}
    </>
  );
}
