import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Check, CheckCircle2, CircleDashed, FileText, Lock, Mail, MessageCircle, Send, Upload } from "lucide-react";
import { Badge, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { Bitacora } from "@/components/bitacora";
import { certificadosDe, destinoDe, exportadorDe, gananciaFerrada, pagosFerrada, setOficialBloqueadoF } from "@/lib/calc";
import { bitacora, operacionesFerrada } from "@/lib/data";
import { fecha, fechaLarga, n, usd } from "@/lib/format";
import { PASOS_FERRADA } from "@/lib/types";

export function generateStaticParams() {
  return operacionesFerrada.map((o) => ({ id: o.id }));
}

const TONO_PAGO: Record<string, Tono> = { Pagado: "verde", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };
const usd2 = (v: number) => "US$ " + v.toFixed(2).replace(".", ",");

export default async function OperacionFerradaDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = operacionesFerrada.find((x) => x.id === id);
  if (!o) notFound();
  const d = destinoDe(o.destinoId);
  const g = gananciaFerrada(o);
  const [p1, p2] = pagosFerrada(o);
  const idx = PASOS_FERRADA.indexOf(o.paso);
  const prov = o.proveedorId ? exportadorDe(o.proveedorId) : undefined;
  const certs = certificadosDe(o.proveedorId);
  const bloqueado = setOficialBloqueadoF(o);
  const ops = (pid?: string) => operacionesFerrada.filter((x) => x.proveedorId && x.proveedorId === pid).length;

  return (
    <>
      <Link href="/ferrada" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Ferrada
      </Link>
      <PageHeader
        etapa={`${o.id} · Ferrada ${o.origenPais} · orden del ${fechaLarga(o.fecha)}`}
        titulo={`${o.producto} ${o.variedad} → ${d.puerto}`}
        subtitulo={`${o.contenedores} contenedor${o.contenedores > 1 ? "es" : ""} · ${o.palletsPorContenedor} pallets c/u · calibres ${o.calibres} · ${d.pais}, ${d.region}`}
      />

      <div className="card mb-5 overflow-x-auto p-4">
        <ol className="flex min-w-max items-center gap-2">
          {PASOS_FERRADA.map((e, i) => (
            <li key={e} className="flex items-center gap-2">
              <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold", i < idx ? "bg-leaf-500 text-white" : i === idx ? "bg-leaf-50 text-leaf-700 ring-2 ring-leaf-500" : "bg-ink-100 text-ink-400")}>
                {i < idx ? <Check size={13} /> : i + 1}
              </span>
              <span className={clsx("text-[13px]", i === idx ? "font-semibold text-ink-900" : "text-ink-500")}>{e}</span>
              {i < PASOS_FERRADA.length - 1 && <span className={clsx("mx-1 h-px w-5", i < idx ? "bg-leaf-500" : "bg-ink-200")} />}
            </li>
          ))}
        </ol>
      </div>

      {bloqueado && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[14px] text-brand-700">
          <Lock size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div><b className="font-semibold">Set oficial bloqueado.</b> Ferrada tiene el draft desde el {fechaLarga(o.draftEnviado)} y no ha pagado el primer 50% ({p1.texto.toLowerCase()}). Con el set oficial se retira el contenedor.</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ganancia CFSCL" valor={usd(g.total)} tono="ok" detalle="Comisión + margen + rebate" />
        <Stat label="Comisión" valor={usd(g.comision)} detalle={`${n(o.cajas)} cajas × ${usd2(o.comisionUsdCaja)}`} />
        <Stat label="Margen compraventa" valor={o.ventaUsdCaja ? usd(g.margen) : "Por cotizar"} detalle={o.ventaUsdCaja ? `Compra ${usd2(o.compraUsdCaja)} · venta ${usd2(o.ventaUsdCaja)}` : "Aún sin precio"} />
        <Stat label="Rebate naviera" valor={usd(g.rebate)} detalle={`${o.contenedores} × ${usd(o.rebateUsdContenedor)} · variable`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Section titulo="Proveedor" descripcion="A quién le compra CFSCL">
              {prov ? (
                <>
                  <div className="text-[14.5px] font-semibold">{prov.nombre}</div>
                  <div className="text-[12.5px] text-ink-500">{prov.ciudad}, {prov.pais} · {prov.rut}</div>
                  <div className="mt-2 text-[13.5px] font-medium">{prov.contacto} <span className="font-normal text-ink-500">· {prov.cargo}</span></div>
                  <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-700"><MessageCircle size={13} aria-hidden /> <span className="select-all">{prov.telefono}</span></div>
                  <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-700"><Mail size={13} aria-hidden /> <span className="select-all break-all">{prov.email}</span></div>
                  <p className="mt-2 text-[12.5px] text-ink-500">{ops(o.proveedorId)} operaciones con Ferrada esta temporada.</p>
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
                  ["Tiempo de tránsito", o.transitoDias && `${o.transitoDias} días`],
                  ["Destino", `${d.puerto}, ${d.pais}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className={clsx("text-right", !v && "text-ink-400")}>{v || "Por reservar"}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          </div>

          <Section titulo="Compra y venta" sinPadding>
            <TableWrap>
              <thead className="border-b border-ink-100">
                <tr>
                  <th className="th">Concepto</th>
                  <th className="th text-right">Por caja</th>
                  <th className="th text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-ink-100"><td className="td">Compra al proveedor</td><td className="td text-right">{o.compraUsdCaja ? usd2(o.compraUsdCaja) : "—"}</td><td className="td text-right">{o.compraUsdCaja ? usd(g.compra) : "Por cotizar"}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Venta a Ferrada</td><td className="td text-right">{o.ventaUsdCaja ? usd2(o.ventaUsdCaja) : "—"}</td><td className="td text-right">{o.ventaUsdCaja ? usd(g.venta) : "Por cotizar"}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Comisión</td><td className="td text-right">{usd2(o.comisionUsdCaja)}</td><td className="td text-right">{usd(g.comision)}</td></tr>
                <tr className="border-b border-ink-100"><td className="td">Rebate de la naviera</td><td className="td text-right">—</td><td className="td text-right">{usd(g.rebate)}</td></tr>
                <tr className="bg-ink-50"><td className="td font-semibold">Ganancia CFSCL</td><td className="td" /><td className="td text-right font-semibold text-leaf-700">{usd(g.total)}</td></tr>
              </tbody>
            </TableWrap>
          </Section>

          <Section titulo="Pagos de Ferrada" descripcion="Siempre 50/50: contra el draft de documentos y entre 5 y 10 días después de la llegada" sinPadding>
            <TableWrap>
              <thead className="border-b border-ink-100">
                <tr>
                  <th className="th">Hito</th>
                  <th className="th text-right">%</th>
                  <th className="th text-right">Monto</th>
                  <th className="th">Fecha</th>
                  <th className="th">Estado</th>
                </tr>
              </thead>
              <tbody>
                {[["Pago 1 · contra draft", p1], ["Pago 2 · tras la llegada", p2]].map(([t, p]) => {
                  const pp = p as typeof p1;
                  return (
                    <tr key={t as string} className={clsx("border-b border-ink-100 last:border-0", pp.estado === "Vencido" && "bg-brand-50/60")}>
                      <td className="td font-medium">{t as string}</td>
                      <td className="td text-right">50%</td>
                      <td className="td text-right">{pp.monto ? usd(pp.monto) : "—"}</td>
                      <td className="td">{pp.texto}</td>
                      <td className="td"><Badge tono={TONO_PAGO[pp.estado]}>{pp.estado}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </Section>

          <Section titulo="Documentos" descripcion="Todo en un solo lugar, en vez de carpetas de Drive" acciones={<button className="btn-ghost" type="button"><Upload size={15} /> Subir</button>} sinPadding>
            <div className="grid divide-y divide-ink-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-4">
                <h3 className="text-[14px] font-semibold">Certificados del proveedor 2027</h3>
                <p className="mt-0.5 text-[12.5px] text-ink-500">Se piden una vez, antes del primer contenedor. Valen de enero a diciembre y se reutilizan en todas las operaciones.</p>
                <ul className="mt-2.5 space-y-1.5">
                  {certs.map((c) => (
                    <li key={c.tipo} className="flex items-center gap-2 text-[13px]">
                      {c.recibido ? <CheckCircle2 size={15} className="text-leaf-500" /> : <CircleDashed size={15} className="text-brand-500" />}
                      <span className="flex-1">{c.tipo}</span>
                      <span className={clsx("text-[12px]", c.recibido ? "text-ink-500" : "font-medium text-brand-600")}>{c.recibido ? `Recibido ${fecha(c.recibido)}` : "Falta"}</span>
                    </li>
                  ))}
                  {certs.length === 0 && <li className="text-[13px] text-ink-500">Sin proveedor asignado.</li>}
                </ul>
              </div>
              <div className="p-4">
                <h3 className="text-[14px] font-semibold">Draft y set oficial</h3>
                <div className="mt-2 space-y-2 text-[13px]">
                  <div className="flex items-center justify-between gap-2"><span>1 · Draft a Ferrada</span>{o.draftEnviado ? <Badge tono="verde">Enviado {fecha(o.draftEnviado)}</Badge> : <Badge>Pendiente</Badge>}</div>
                  <div className="flex items-center justify-between gap-2"><span>2 · Set oficial</span>{o.setOficialEnviado ? <Badge tono="verde">Enviado {fecha(o.setOficialEnviado)}</Badge> : bloqueado ? <Badge tono="rojo"><Lock size={11} /> Bloqueado</Badge> : <Badge>Pendiente</Badge>}</div>
                </div>
                <button type="button" className={bloqueado ? "btn-ghost mt-3 cursor-not-allowed opacity-50" : "btn-primary mt-3"} disabled={bloqueado || !!o.setOficialEnviado}>
                  {bloqueado ? <Lock size={14} /> : <Send size={14} />} Enviar set oficial
                </button>
              </div>
            </div>
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {o.documentos.map((doc) => (
                <li key={doc.tipo} className="flex items-center gap-3 px-4 py-2.5">
                  {doc.recibido ? <CheckCircle2 size={17} className="text-leaf-500" /> : <CircleDashed size={17} className="text-ink-300" />}
                  <span className="flex-1 text-[13.5px]">
                    {doc.tipo}
                    {doc.tipo === "Orden de compra de Ferrada" && <span className="ml-1.5 text-[12px] text-ink-500">· formato fijo de Ferrada</span>}
                    {doc.tipo === "Orden de compra CFSCL al proveedor" && <span className="ml-1.5 text-[12px] text-ink-500">· la emite CFSCL</span>}
                  </span>
                  {doc.recibido ? <span className="inline-flex items-center gap-1 text-[12.5px] text-leaf-600"><FileText size={13} /> {fecha(doc.recibido)}</span> : <span className="text-[12.5px] text-ink-400">Pendiente</span>}
                </li>
              ))}
            </ul>
          </Section>
        </div>
        <Bitacora inicial={bitacora[`fe:${o.id}`] ?? []} idBase={`bit-${o.id}`} />
      </div>
    </>
  );
}
