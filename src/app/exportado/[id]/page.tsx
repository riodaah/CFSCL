import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Check, CheckCircle2, CircleDashed, FileText, Upload } from "lucide-react";
import { Badge, Dot, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { cajasOC, clienteDe, semaforoOC, totalOC } from "@/lib/calc";
import { ordenes } from "@/lib/data";
import { diffDays } from "@/lib/dates";
import { clp, fecha, fechaLarga, n, usd } from "@/lib/format";
import { HOY } from "@/lib/params";
import { ETAPAS_OC } from "@/lib/types";

export function generateStaticParams() {
  return ordenes.map((o) => ({ id: o.id }));
}

export default async function OCDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = ordenes.find((x) => x.id === id);
  if (!o) notFound();
  const c = clienteDe(o);
  const idx = ETAPAS_OC.indexOf(o.etapa);
  const total = totalOC(o);
  const docsOk = o.documentos.filter((d) => d.recibido).length;
  const tonoPago: Record<string, Tono> = { Pagado: "verde", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };

  return (
    <>
      <Link href="/exportado" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Exportado
      </Link>
      <PageHeader
        etapa={`${o.id} · ${fechaLarga(o.fecha)}`}
        titulo={c.nombre}
        subtitulo={`${c.contacto} · ${c.pais} · Puerto ${c.puertoDestino}`}
        acciones={
          <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px]">
            <Dot tono={semaforoOC(o)} /> {semaforoOC(o) === "rojo" ? "Pago vencido" : semaforoOC(o) === "amarillo" ? "Pago próximo" : "Pagos al día"}
          </div>
        }
      />

      {/* Etapas */}
      <div className="card mb-5 overflow-x-auto p-4">
        <ol className="flex min-w-max items-center gap-2">
          {ETAPAS_OC.map((e, i) => (
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
              {i < ETAPAS_OC.length - 1 && <span className={clsx("mx-1 h-px w-6", i < idx ? "bg-leaf-500" : "bg-ink-200")} />}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total OC" valor={usd(total)} />
        <Stat label="Contenedores" valor={o.contenedores} detalle={`${n(cajasOC(o))} cajas`} />
        <Stat label="Transporte packing → puerto" valor={o.costoTransporteClp ? clp(o.costoTransporteClp) : "—"} />
        <Stat label="Documentos" valor={`${docsOk}/${o.documentos.length}`} detalle={o.fechaEnvioSetDocs ? `Set enviado ${fecha(o.fechaEnvioSetDocs)}` : "Set no enviado"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Section titulo="Detalle de la orden" sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Variedad</th>
                <th className="th">Calidad</th>
                <th className="th text-right">Calibre</th>
                <th className="th text-right">Cajas</th>
                <th className="th text-right">US$/caja</th>
                <th className="th text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {o.lineas.map((l, i) => (
                <tr key={i} className="border-b border-ink-100">
                  <td className="td">{l.variedad}</td>
                  <td className="td">{l.calidad}</td>
                  <td className="td text-right">{l.calibre}</td>
                  <td className="td text-right">{n(l.cajas)}</td>
                  <td className="td text-right">{l.precioUsdCaja.toFixed(2).replace(".", ",")}</td>
                  <td className="td text-right">{usd(l.cajas * l.precioUsdCaja)}</td>
                </tr>
              ))}
              <tr className="bg-ink-50">
                <td className="td font-semibold" colSpan={3}>Total</td>
                <td className="td text-right font-semibold">{n(cajasOC(o))}</td>
                <td className="td" />
                <td className="td text-right font-semibold">{usd(total)}</td>
              </tr>
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo="Logística">
          <dl className="space-y-2 text-[13.5px]">
            {[
              ["Naviera", o.naviera],
              ["Booking", o.booking],
              ["Nave", o.nave],
              ["Zarpe (ETD)", o.etd && fechaLarga(o.etd)],
              ["Llegada (ETA)", o.eta && fechaLarga(o.eta)],
              ["Puerto destino", c.puertoDestino],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-ink-500">{k}</dt>
                <dd className={clsx(!v && "text-ink-400")}>{v || "Por reservar"}</dd>
              </div>
            ))}
          </dl>
          {o.recepcionCliente && (
            <div className="mt-4 rounded-lg bg-leaf-50 px-3 py-2 text-[12.5px] text-leaf-900">
              <span className="font-semibold">Recepción del cliente: </span>{o.recepcionCliente}
            </div>
          )}
        </Section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section titulo="Pagos del cliente" descripcion={c.condicionesPago} sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Hito</th>
                <th className="th text-right">%</th>
                <th className="th text-right">Monto</th>
                <th className="th">Vence</th>
                <th className="th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {o.pagos.map((p) => {
                const atraso = p.estado === "Vencido" && p.vencimiento ? diffDays(HOY, p.vencimiento) : 0;
                return (
                  <tr key={p.hito} className={clsx("border-b border-ink-100 last:border-0", p.estado === "Vencido" && "bg-brand-50/60")}>
                    <td className="td font-medium">{p.hito}</td>
                    <td className="td text-right">{p.pct}%</td>
                    <td className="td text-right">{usd(p.montoUsd)}</td>
                    <td className="td">{fecha(p.vencimiento)}</td>
                    <td className="td">
                      <Badge tono={tonoPago[p.estado]}>{p.estado}{atraso ? ` · ${atraso} ${atraso === 1 ? "día" : "días"}` : ""}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo="Set de documentos" descripcion="Se envía al cliente; desde ese día corre el plazo de pago" acciones={<button className="btn-ghost" type="button"><Upload size={15} /> Subir</button>} sinPadding>
          <ul className="divide-y divide-ink-100">
            {o.documentos.map((d) => (
              <li key={d.tipo} className="flex items-center gap-3 px-4 py-2.5">
                {d.recibido ? <CheckCircle2 size={17} className="text-leaf-500" /> : <CircleDashed size={17} className="text-ink-300" />}
                <span className="flex-1 text-[13.5px]">{d.tipo}</span>
                {d.recibido ? (
                  <span className="inline-flex items-center gap-1 text-[12.5px] text-leaf-600"><FileText size={13} /> {fecha(d.recibido)}</span>
                ) : (
                  <span className="text-[12.5px] text-ink-400">Pendiente</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
