import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, CircleDashed, FileText, Lock, Send, Upload } from "lucide-react";
import { Badge, Dot, PageHeader, Section, Stat, TableWrap } from "@/components/ui";
import { Bitacora } from "@/components/bitacora";
import { PagosCliente } from "@/components/pagos-cliente";
import { cajasOC, clienteDe, disponibilidad, exportadorDe, pagoContraDocumentos, semaforoOC, setOficialBloqueado, totalOC } from "@/lib/calc";
import { bitacora, ordenes } from "@/lib/data";
import { fecha, fechaLarga, n, usd } from "@/lib/format";
import { HOY } from "@/lib/params";
import { PASOS_OC } from "@/lib/types";

export function generateStaticParams() {
  return ordenes.map((o) => ({ id: o.id }));
}

export default async function OrdenDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = ordenes.find((x) => x.id === id);
  if (!o) notFound();
  const c = clienteDe(o);
  const idx = PASOS_OC.indexOf(o.paso);
  const total = totalOC(o);
  const facturado = o.pagos.filter((p) => p.estado === "Pagado").reduce((a, p) => a + p.montoUsd, 0);
  const docsOk = o.documentos.filter((d) => d.recibido).length;
  const disp = disponibilidad()[o.id];
  const bloqueado = setOficialBloqueado(o);
  const pcd = pagoContraDocumentos(o);

  return (
    <>
      <Link href="/clientes" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Órdenes de compra
      </Link>
      <PageHeader
        etapa={`${o.id} · recibida el ${fechaLarga(o.fecha)}`}
        titulo={c.nombre}
        subtitulo={`${c.contacto} · destino ${o.destinoPuerto}, ${o.destinoPais}`}
        acciones={
          <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px]">
            <Dot tono={semaforoOC(o)} /> {semaforoOC(o) === "rojo" ? "Pago vencido" : semaforoOC(o) === "amarillo" ? "Pago próximo" : "Pagos al día"}
          </div>
        }
      />

      {/* Pasos */}
      <div className="card mb-5 overflow-x-auto p-4">
        <ol className="flex min-w-max items-center gap-2">
          {PASOS_OC.map((e, i) => (
            <li key={e} className="flex items-center gap-2">
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  i < idx ? "bg-leaf-500 text-white" : i === idx ? "bg-leaf-50 text-leaf-700 ring-2 ring-leaf-500" : "bg-ink-100 text-ink-400",
                )}
              >
                {i < idx ? <Check size={13} /> : i + 1}
              </span>
              <span className={clsx("text-[13px]", i === idx ? "font-semibold text-ink-900" : "text-ink-500")}>{e}</span>
              {i < PASOS_OC.length - 1 && <span className={clsx("mx-1 h-px w-5", i < idx ? "bg-leaf-500" : "bg-ink-200")} />}
            </li>
          ))}
        </ol>
      </div>

      {bloqueado && o.draftEnviado && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[14px] text-brand-700">
          <Lock size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <b className="font-semibold">Set oficial bloqueado.</b> El cliente ya tiene el draft (enviado el {fechaLarga(o.draftEnviado)}), pero no ha pagado el hito contra documentos
            {pcd?.vencimiento ? ` (vence ${fecha(pcd.vencimiento)})` : ""}. Con el set oficial puede retirar el contenedor del puerto: no se envía hasta confirmar el pago.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total orden de compra" valor={usd(total)} />
        <Stat label="Total cobrado" valor={usd(facturado)} detalle={`${Math.round((facturado / total) * 100)}% del total`} />
        <Stat label="Contenedores" valor={o.contenedores} detalle={`${n(cajasOC(o))} cajas`} />
        <Stat label="Documentos del set" valor={`${docsOk}/${o.documentos.length}`} detalle={o.setOficialEnviado ? `Set oficial enviado ${fecha(o.setOficialEnviado)}` : o.draftEnviado ? `Draft enviado ${fecha(o.draftEnviado)}` : "Aún sin documentos"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section titulo="Detalle de la orden" descripcion="Cada línea indica de dónde sale la fruta: packing propio o caja terminada comprada a una exportadora" sinPadding>
            <TableWrap>
              <thead className="border-b border-ink-100">
                <tr>
                  <th className="th">Variedad</th>
                  <th className="th">Calidad</th>
                  <th className="th text-right">Calibre</th>
                  <th className="th text-right">Cajas</th>
                  <th className="th text-right">US$/caja</th>
                  <th className="th text-right">Subtotal</th>
                  <th className="th">{disp ? "Disponibilidad" : "Origen"}</th>
                </tr>
              </thead>
              <tbody>
                {o.lineas.map((l, i) => {
                  const d = disp?.[i];
                  return (
                    <tr key={i} className="border-b border-ink-100">
                      <td className="td">{l.variedad}</td>
                      <td className="td">{l.calidad}</td>
                      <td className="td text-right">{l.calibre}</td>
                      <td className="td text-right">{n(l.cajas)}</td>
                      <td className="td text-right">{l.precioUsdCaja.toFixed(2).replace(".", ",")}</td>
                      <td className="td text-right">{usd(l.cajas * l.precioUsdCaja)}</td>
                      <td className="td">
                        {d ? (
                          <Badge tono={d.estado === "Cubierto" ? "verde" : d.estado === "Parcial" ? "ambar" : "rojo"}>
                            {d.estado === "Cubierto" ? "Hay fruta" : d.estado === "Parcial" ? `Faltan ${n(d.pedido - d.asignado)}` : "Sin fruta"}
                          </Badge>
                        ) : l.origen === "Packing" ? (
                          <Badge tono="gris">Packing propio</Badge>
                        ) : (
                          <Badge tono="azul">Caja terminada · {exportadorDe(l.origen.exportadorId).nombre.split(" ").slice(0, 2).join(" ")}</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-ink-50">
                  <td className="td font-semibold" colSpan={3}>Total</td>
                  <td className="td text-right font-semibold">{n(cajasOC(o))}</td>
                  <td className="td" />
                  <td className="td text-right font-semibold">{usd(total)}</td>
                  <td className="td" />
                </tr>
              </tbody>
            </TableWrap>
            {disp && disp.some((d) => d.estado !== "Cubierto") && (
              <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 px-4 py-3 text-[13px] text-amber-900">
                <AlertTriangle size={15} aria-hidden /> Lo embalado en los últimos 14 días no alcanza para esta orden.
                <Link href="/productores?vista=exportadoras" className="btn-ghost ml-auto">Ver exportadoras de caja terminada</Link>
              </div>
            )}
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section titulo="Logística">
              <dl className="space-y-2 text-[13.5px]">
                {[
                  ["Naviera", o.naviera],
                  ["Booking", o.booking],
                  ["Barco", o.barco],
                  ["Zarpe (ETD)", o.etd && fechaLarga(o.etd)],
                  ["Llegada (ETA)", o.eta && fechaLarga(o.eta)],
                  ["Tiempo de tránsito", o.transitoDias && `${o.transitoDias} días`],
                  ["Puerto de destino", `${o.destinoPuerto}, ${o.destinoPais}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className={clsx("text-right", !v && "text-ink-400")}>{v || "Por reservar"}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[12px] text-ink-500">ETD, ETA y tiempo de tránsito llegan en el correo de la naviera al reservar.</p>
              {o.recepcionCliente && (
                <div className="mt-3 rounded-lg bg-leaf-50 px-3 py-2 text-[12.5px] text-leaf-900">
                  <span className="font-semibold">Recepción del cliente: </span>{o.recepcionCliente}
                </div>
              )}
            </Section>

            <Section titulo="Negociación" descripcion="Cotización, ajustes de precio o forma de pago, y la orden">
              <ol className="relative space-y-3 border-l border-ink-200 pl-4">
                {o.negociacion.map((x, i) => (
                  <li key={i} className="text-[13.5px]">
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-leaf-500" />
                    <div className="font-mono text-[11.5px] text-ink-500">{fecha(x.fecha)}</div>
                    <div className="leading-snug">{x.detalle}</div>
                  </li>
                ))}
              </ol>
              <button type="button" className="btn-ghost mt-3"><Upload size={14} /> Adjuntar versión</button>
            </Section>
          </div>

          <Section titulo="Pagos del cliente" descripcion={`Condición habitual: ${c.condicionesPago}. Se puede ajustar por orden; mínimo 2 pagos.`} sinPadding>
            <PagosCliente inicial={o.pagos} total={total} hoy={HOY} />
          </Section>

          <Section titulo="Documentos" descripcion="El draft se envía para que el cliente revise. El set oficial permite retirar el contenedor: solo después del pago." sinPadding>
            <div className="grid divide-y divide-ink-100 md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold">1 · Draft de documentos</h3>
                  {o.draftEnviado ? <Badge tono="verde">Enviado {fecha(o.draftEnviado)}</Badge> : <Badge tono="gris">Pendiente</Badge>}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-500">El cliente ve que el contenedor va cargado a su nombre, pero no puede sacarlo del puerto.</p>
                <button type="button" className="btn-ghost mt-3" disabled={!!o.draftEnviado || idx < PASOS_OC.indexOf("Embarcado")}><Send size={14} /> Enviar draft</button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold">2 · Set oficial</h3>
                  {o.setOficialEnviado ? <Badge tono="verde">Enviado {fecha(o.setOficialEnviado)}</Badge> : bloqueado ? <Badge tono="rojo"><Lock size={11} /> Bloqueado</Badge> : <Badge tono="gris">Pendiente</Badge>}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  {bloqueado ? `Se habilita cuando se registre el pago "${pcd?.hito}" (${pcd?.pct}%).` : "Con este set el cliente retira el contenedor."}
                </p>
                <button type="button" className={bloqueado ? "btn-ghost mt-3 cursor-not-allowed opacity-50" : "btn-primary mt-3"} disabled={bloqueado || !!o.setOficialEnviado}>
                  {bloqueado ? <Lock size={14} /> : <Send size={14} />} Enviar set oficial
                </button>
              </div>
            </div>
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {o.documentos.map((d) => (
                <li key={d.tipo} className="flex items-center gap-3 px-4 py-2.5">
                  {d.recibido ? <CheckCircle2 size={17} className="text-leaf-500" /> : <CircleDashed size={17} className="text-ink-300" />}
                  <span className="flex-1 text-[13.5px]">{d.tipo}</span>
                  {d.recibido ? <span className="inline-flex items-center gap-1 text-[12.5px] text-leaf-600"><FileText size={13} /> {fecha(d.recibido)}</span> : <span className="text-[12.5px] text-ink-400">Pendiente</span>}
                </li>
              ))}
            </ul>
            <p className="border-t border-ink-100 px-4 py-2.5 text-[12px] text-ink-500">Lista de documentos por cliente y destino por confirmar con Anita.</p>
          </Section>
        </div>
        <Bitacora inicial={bitacora[`oc:${o.id}`] ?? []} idBase={`bit-${o.id}`} />
      </div>
    </>
  );
}
