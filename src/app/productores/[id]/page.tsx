import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, CircleDashed, FileText, Mail, Phone, Upload } from "lucide-react";
import { Badge, COLOR_CALIDAD, FuenteTag, PageHeader, Progress, Section, StackBar, Stat, TableWrap, type Tono } from "@/components/ui";
import { cajasDeLote, resumenProductor } from "@/lib/calc";
import { bitacora, historial, productores } from "@/lib/data";
import { Bitacora } from "@/components/bitacora";
import { CierreCosecha } from "@/components/cierre-cosecha";
import { clp, clpM, fecha, fechaLarga, n, n1, pct } from "@/lib/format";
import { P, PARAMS } from "@/lib/params";
import { CALIDADES, type TipoPagoProductor } from "@/lib/types";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "recepciones", label: "Recepciones" },
  { id: "fletes", label: "Fletes" },
  { id: "documentos", label: "Documentos" },
  { id: "pagos", label: "Pagos" },
  { id: "rendimiento", label: "Rendimiento" },
  { id: "historial", label: "Historial" },
];

// Las pestañas viajan en ?tab=, así que la página se renderiza por request
export const dynamic = "force-dynamic";

export default async function ProductorDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "resumen" } = await searchParams;
  const p = productores.find((x) => x.id === id);
  if (!p) notFound();
  const r = resumenProductor(p.id);
  const t = r.temporada;

  return (
    <>
      <Link href="/productores" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Productores
      </Link>
      <PageHeader
        etapa={`Código SAG ${p.codigoSag} · Temporada ${t.nombre}`}
        titulo={p.nombre}
        subtitulo={`${p.comuna}, ${p.region} · RUT ${p.rut} · ${p.variedades.join(", ")}`}
        acciones={
          <>
            <button className="btn-ghost" type="button"><Upload size={15} /> Subir documento</button>
            <Badge tono={t.cierre ? (r.avance < 0.9 ? "ambar" : "verde") : "azul"} className="self-center">{t.estado}</Badge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Contratados" valor={n(t.binsContratados)} detalle={`Firma ${fecha(t.fechaContrato)}`} />
        <Stat label="Recibidos" valor={n(r.binsRecibidos)} detalle={<span className="flex items-center gap-2"><Progress valor={r.avance} className="w-16" />{pct(r.avance)}</span>} />
        <Stat label="Kg recibidos" valor={n(r.kgRecibidos)} detalle={`${n(r.kgPorBin)} kg/bin promedio`} />
        <Stat label="Exportable" valor={r.kgEntradaProc ? pct(r.pctExportable) : "—"} detalle={`${n(r.cajas)} cajas embaladas`} tono="ok" />
        <Stat label="Costo real por kilo" valor={r.kgRecibidos ? clp(Math.round(r.costoKgCosecha + r.fletePorKg)) : "—"} detalle={`Cosecha ${n1(r.costoKgCosecha)} + flete ${n1(r.fletePorKg)}`} />
      </div>

      <CierreCosecha cierre={t.cierre} contratados={t.binsContratados} recibidos={r.binsRecibidos} />

      <div className="mt-5 overflow-x-auto border-b border-ink-200">
        <nav className="flex min-w-max gap-1">
          {TABS.map((x) => (
            <Link
              key={x.id}
              href={`/productores/${p.id}?tab=${x.id}`}
              scroll={false}
              className={clsx(
                "border-b-2 px-3 py-2 text-[14px] transition",
                tab === x.id ? "border-leaf-500 font-semibold text-ink-900" : "border-transparent text-ink-500 hover:text-ink-900",
              )}
            >
              {x.label}
              {x.id === "documentos" && r.docsFaltantes.length > 0 && <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 text-[11px] text-white">{r.docsFaltantes.length}</span>}
              {x.id === "recepciones" && r.descuadres.length > 0 && <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 text-[11px] text-amber-950">{r.descuadres.length}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
        {tab === "resumen" && <Resumen r={r} pid={p.id} contacto={p} />}
        {tab === "recepciones" && <Recepciones r={r} />}
        {tab === "fletes" && <Fletes r={r} />}
        {tab === "documentos" && <Documentos r={r} />}
        {tab === "pagos" && <Pagos r={r} />}
        {tab === "rendimiento" && <Rendimiento r={r} />}
        {tab === "historial" && <Historial pid={p.id} r={r} />}
        </div>
        <Bitacora inicial={bitacora[`prod:${p.id}`] ?? []} idBase={`bit-${p.id}`} />
      </div>
    </>
  );
}

type R = ReturnType<typeof resumenProductor>;

function Resumen({ r, contacto }: { r: R; pid: string; contacto: (typeof productores)[number] }) {
  const t = r.temporada;
  const hitos: TipoPagoProductor[] = ["Anticipo", "Cosecha", "Embalado", "Liquidación"];
  const cuadratura = [
    { k: "Bins contratados", v: t.binsContratados },
    { k: "Bins vacíos enviados por el packing", v: t.binsEnviados },
    { k: "Bins según guías de despacho", v: r.binsGuia },
    { k: "Bins recibidos en romana", v: r.binsRecibidos, fuerte: true },
    { k: "Diferencia guía vs romana", v: -r.binsFaltantes, alerta: r.binsFaltantes > 0 },
    { k: "Bins vacíos devueltos", v: t.binsDevueltosVacios },
    { k: "Bins prestados aún en campo", v: r.saldoBins, fuerte: true },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Section titulo="Cuadratura de bins" descripcion="Lo que manda la romana es lo que se paga">
        <dl className="divide-y divide-ink-100">
          {cuadratura.map((c) => (
            <div key={c.k} className="flex justify-between gap-3 py-2 text-[13.5px]">
              <dt className="text-ink-600">{c.k}</dt>
              <dd className={clsx("tabular-nums", c.fuerte && "font-semibold", c.alerta && "text-brand-600")}>{n(c.v)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section titulo="Los cuatro pagos" descripcion="Contrato, cosecha, embalado y liquidación">
        <ol className="space-y-3">
          {hitos.map((h, i) => {
            const ps = r.pagos.filter((x) => x.tipo === h);
            const pag = ps.filter((x) => x.estado === "Pagado").reduce((a, x) => a + x.montoClp, 0);
            const pend = ps.filter((x) => x.estado !== "Pagado").reduce((a, x) => a + x.montoClp, 0);
            return (
              <li key={h} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-50 font-mono text-[12px] text-leaf-700">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-[13.5px]">
                    <span className="font-medium">{h}</span>
                    <span className="tabular-nums">{clpM(pag)}</span>
                  </div>
                  <div className="text-[12px] text-ink-500">
                    {h === "Anticipo" && `${clp(P.anticipoPorBin)} por bin contratado, a la firma`}
                    {h === "Cosecha" && `${clp(P.cosechaPorBin)} por bin llegado, semanal`}
                    {h === "Embalado" && `${clp(P.embaladoPorKg)} por kg exportable, los viernes`}
                    {h === "Liquidación" && `${clp(P.liquidacionPorKg)} por kg, ${P.diasLiquidacion} días después`}
                    {pend > 0 && <span className="text-amber-700"> · {clpM(pend)} por pagar</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-[12.5px] text-ink-500">
          Día de pago: viernes, o sábado si el packing procesa ese día. Si la fruta del productor se termina antes, se le paga ese mismo día.
        </p>
        {r.ajusteAnticipo > 0 && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
            {t.cierre ? "En la liquidación se descontarán" : "Si la temporada cerrara hoy, la liquidación descontaría"} {clp(r.ajusteAnticipo)} de anticipo por {n(r.temporada.binsContratados - r.binsRecibidos)} bins no entregados.
          </p>
        )}
      </Section>

      <Section titulo="Contrato y contacto" className="lg:col-span-2">
        <dl className="space-y-2 text-[13.5px]">
          <div className="flex justify-between gap-3"><dt className="text-ink-500">Temporada</dt><dd>{fechaLarga(t.inicio)} – {fechaLarga(t.fin)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink-500">Firma de contrato</dt><dd>{fechaLarga(t.fechaContrato)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink-500">Tamaño</dt><dd>{contacto.tamano}</dd></div>
          {t.condicionesEspeciales && (
            <div className="rounded-lg bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">{t.condicionesEspeciales}</div>
          )}
        </dl>
        <div className="mt-4 border-t border-ink-100 pt-3 text-[13.5px]">
          <div className="font-medium">{contacto.contacto}</div>
          <div className="mt-1 flex items-center gap-1.5 text-ink-600"><Phone size={13} /> <span className="select-all">{contacto.telefono}</span></div>
          <div className="mt-1 flex items-center gap-1.5 text-ink-600"><Mail size={13} /> <span className="select-all break-all">{contacto.email}</span></div>
        </div>
      </Section>
    </div>
  );
}

function Recepciones({ r }: { r: R }) {
  return (
    <Section titulo={`Recepciones en romana (${r.recepciones.length} camiones)`} descripcion="Una fila por camión. El sistema cuadra la guía de despacho contra lo pesado y alerta si no coinciden." sinPadding>
      <TableWrap>
        <thead className="border-b border-ink-100">
          <tr>
            <th className="th">Fecha</th>
            <th className="th">Guía</th>
            <th className="th">Camión</th>
            <th className="th">Variedad</th>
            <th className="th text-right">Bins guía</th>
            <th className="th text-right">Recibidos</th>
            <th className="th text-right">Dif.</th>
            <th className="th text-right">Kg</th>
            <th className="th text-right">Kg/bin</th>
            <th className="th">Fuente</th>
          </tr>
        </thead>
        <tbody>
          {[...r.recepciones].reverse().map((x) => {
            const dif = x.binsRecibidos - x.binsGuia;
            const kb = x.kgRecibidos / x.binsRecibidos;
            return (
              <tr key={x.id} className={clsx("border-b border-ink-100 last:border-0", dif !== 0 && "bg-amber-50/60")}>
                <td className="td">{fecha(x.fecha)}</td>
                <td className="td font-mono text-[12.5px]">{x.numeroGuia}</td>
                <td className="td"><span className="font-mono text-[12.5px]">{x.patente}</span><div className="text-[12px] text-ink-500">{x.conductor}</div></td>
                <td className="td">{x.variedad}</td>
                <td className="td text-right">{x.binsGuia}</td>
                <td className="td text-right font-medium">{x.binsRecibidos}</td>
                <td className="td text-right">{dif !== 0 ? <Badge tono="ambar">{dif}</Badge> : <span className="text-ink-300">0</span>}</td>
                <td className="td text-right">{n(x.kgRecibidos)}</td>
                <td className={clsx("td text-right", kb < P.kgPorBinEstandar * 0.92 && "font-semibold text-brand-600")}>{n(kb)}</td>
                <td className="td"><FuenteTag f={x.fuente} /></td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>
    </Section>
  );
}

function Fletes({ r }: { r: R }) {
  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_320px]">
      <Section titulo="Fletes campo → packing" descripcion="Los paga CFSCL. La factura del transportista llega por correo y se asocia al camión por patente." sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Fecha</th>
              <th className="th">Transportista</th>
              <th className="th">Camión</th>
              <th className="th">Factura</th>
              <th className="th text-right">Monto</th>
              <th className="th text-right">$/kg</th>
              <th className="th">Estado</th>
            </tr>
          </thead>
          <tbody>
            {[...r.fletes].reverse().map((f) => {
              const rec = r.recepciones.find((x) => x.id === f.recepcionId)!;
              return (
                <tr key={f.id} className="border-b border-ink-100 last:border-0">
                  <td className="td">{fecha(rec.fecha)}</td>
                  <td className="td">{f.transportista}</td>
                  <td className="td font-mono text-[12.5px]">{rec.patente}</td>
                  <td className="td font-mono text-[12.5px]">{f.numeroFactura}</td>
                  <td className="td text-right">{f.montoClp ? clp(f.montoClp) : "—"}</td>
                  <td className="td text-right">{f.montoClp ? n1(f.montoClp / rec.kgRecibidos) : "—"}</td>
                  <td className="td"><Badge tono={f.estado === "Asociada" ? "verde" : "ambar"}>{f.estado}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Section>
      <Section titulo="Costo por kilo">
        <dl className="space-y-2 text-[13.5px]">
          <div className="flex justify-between"><dt className="text-ink-500">Pago cosecha por kg</dt><dd className="tabular-nums">{clp(Math.round(r.costoKgCosecha))}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Flete por kg</dt><dd className="tabular-nums">{n1(r.fletePorKg)}</dd></div>
          <div className="flex justify-between border-t border-ink-100 pt-2 font-semibold"><dt>Costo real por kg</dt><dd className="tabular-nums">{clp(Math.round(r.costoKgCosecha + r.fletePorKg))}</dd></div>
          <div className="flex justify-between pt-2"><dt className="text-ink-500">Total fletes</dt><dd className="tabular-nums">{clp(r.costoFletes)}</dd></div>
        </dl>
        <p className="mt-3 text-[12px] text-ink-500">Flete ÷ kg de romana del mismo camión, sumado al precio pagado por kilo.</p>
      </Section>
    </div>
  );
}

function Documentos({ r }: { r: R }) {
  return (
    <Section titulo="Documentos de la temporada" descripcion="Llegan por correo y el sistema los adjunta; si falta alguno, se genera una alerta para llamar al productor." acciones={<button className="btn-ghost" type="button"><Upload size={15} /> Subir</button>} sinPadding>
      <ul className="divide-y divide-ink-100">
        {r.docs.map((d) => (
          <li key={d.tipo} className="flex flex-wrap items-center gap-3 px-4 py-3">
            {d.recibido ? <CheckCircle2 size={18} className="text-leaf-500" /> : <CircleDashed size={18} className="text-brand-500" />}
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium">{d.tipo}</div>
              <div className="text-[12.5px] text-ink-500">{d.recibido ? `Recibido ${fechaLarga(d.recibido)}` : "Pendiente: el productor no lo ha enviado"}</div>
            </div>
            {d.recibido ? (
              <>
                <FuenteTag f={d.fuente} />
                <span className="inline-flex items-center gap-1 text-[13px] text-leaf-600"><FileText size={14} /> Ver PDF</span>
              </>
            ) : (
              <Badge tono="rojo">Falta</Badge>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Pagos({ r }: { r: R }) {
  const tono: Record<string, Tono> = { Pagado: "verde", "Por pagar": "ambar", Programado: "gris" };
  const orden = [...r.pagos].sort((a, b) => b.vencimiento.localeCompare(a.vencimiento));
  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_300px]">
      <Section titulo="Pagos al productor" sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Fecha</th>
              <th className="th">Pago</th>
              <th className="th">Cálculo</th>
              <th className="th text-right">Monto</th>
              <th className="th">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orden.map((x) => (
              <tr key={x.id} className="border-b border-ink-100 last:border-0">
                <td className="td">{fecha(x.vencimiento)}</td>
                <td className="td font-medium">{x.tipo}</td>
                <td className="td text-ink-600">{x.base}</td>
                <td className="td text-right">{clp(x.montoClp)}</td>
                <td className="td"><Badge tono={tono[x.estado]}>{x.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>
      <Section titulo="Totales">
        <dl className="space-y-2 text-[13.5px]">
          <div className="flex justify-between"><dt className="text-ink-500">Pagado</dt><dd className="tabular-nums font-semibold">{clp(r.pagado)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Por pagar y programado</dt><dd className="tabular-nums">{clp(r.porPagar)}</dd></div>
        </dl>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          Valores de los pagos 2, 3 y 4 por confirmar con Francisco. Se editan en Configuración.
        </p>
      </Section>
    </div>
  );
}

function Rendimiento({ r }: { r: R }) {
  const partes = [
    ...CALIDADES.map((c) => ({ label: c, valor: r.porCalidad[c] * P.kgNetoCaja, color: COLOR_CALIDAD[c] })),
    { label: "Industrial", valor: r.kgIndustrial, color: COLOR_CALIDAD.Industrial },
  ];
  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_1.4fr]">
      <Section titulo="Rendimiento de la fruta" descripcion="Según los reportes de proceso del packing">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="label">Exportable</div><div className="font-display text-3xl font-bold">{r.kgEntradaProc ? pct(r.pctExportable) : "—"}</div></div>
          <div><div className="label">Premium + Extra Fancy</div><div className="font-display text-3xl font-bold">{r.cajas ? pct(r.pctPremiumExtra) : "—"}</div></div>
        </div>
        <div className="mt-5">{r.kgEntradaProc ? <StackBar partes={partes} /> : <p className="text-sm text-ink-500">Aún sin proceso.</p>}</div>
      </Section>
      <Section titulo="Lotes procesados" sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Lote</th>
              <th className="th">Fecha</th>
              <th className="th text-right">Bins</th>
              <th className="th text-right">Kg industrial</th>
              <th className="th text-right">Cajas</th>
              <th className="th text-right">Premium</th>
              <th className="th text-right">Extra F.</th>
            </tr>
          </thead>
          <tbody>
            {r.lotes.map((l) => (
              <tr key={l.id} className="border-b border-ink-100 last:border-0">
                <td className="td font-mono text-[12.5px]">{l.id}</td>
                <td className="td">{fecha(l.fecha)}</td>
                <td className="td text-right">{n(l.binsProcesados)}</td>
                <td className="td text-right">{n(l.kgIndustrial)}</td>
                <td className="td text-right">{n(cajasDeLote(l))}</td>
                <td className="td text-right">{n(l.cajasPorCalidad.Premium)}</td>
                <td className="td text-right">{n(l.cajasPorCalidad["Extra Fancy"])}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>
    </div>
  );
}

function Historial({ pid, r }: { pid: string; r: R }) {
  const h = historial.filter((x) => x.productorId === pid);
  const filas = [
    { temporada: `${r.temporada.nombre} (en curso)`, binsContratados: r.temporada.binsContratados, binsEntregados: r.binsRecibidos, pctExportable: Math.round(r.pctExportable * 100), pctPremiumExtra: Math.round(r.pctPremiumExtra * 100), recontratado: null as boolean | null },
    ...h.map((x) => ({ ...x, recontratado: x.recontratado as boolean | null })),
  ];
  return (
    <Section titulo="Historial y calificación" descripcion="Sirve para decidir si se vuelve a contratar y en qué condiciones." sinPadding>
      <TableWrap>
        <thead className="border-b border-ink-100">
          <tr>
            <th className="th">Temporada</th>
            <th className="th text-right">Contratados</th>
            <th className="th text-right">Entregados</th>
            <th className="th text-right">Cumplimiento</th>
            <th className="th text-right">Exportable</th>
            <th className="th text-right">Premium + Extra F.</th>
            <th className="th">Decisión</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((x) => (
            <tr key={x.temporada} className="border-b border-ink-100 last:border-0">
              <td className="td font-medium">{x.temporada}</td>
              <td className="td text-right">{n(x.binsContratados)}</td>
              <td className="td text-right">{n(x.binsEntregados)}</td>
              <td className="td text-right">{pct(x.binsEntregados / x.binsContratados)}</td>
              <td className="td text-right">{x.pctExportable ? `${x.pctExportable}%` : "—"}</td>
              <td className="td text-right">{x.pctPremiumExtra ? `${x.pctPremiumExtra}%` : "—"}</td>
              <td className="td">{x.recontratado === null ? <Badge tono="azul">En curso</Badge> : x.recontratado ? <Badge tono="verde">Recontratado</Badge> : <Badge tono="gris">No recontratado</Badge>}</td>
            </tr>
          ))}
          {h.length === 0 && (
            <tr><td className="td text-ink-500" colSpan={7}>Primera temporada con este productor.</td></tr>
          )}
        </tbody>
      </TableWrap>
      <p className="border-t border-ink-100 px-4 py-3 text-[12.5px] text-ink-500">Referencia: {PARAMS.kgPorBinEstandar.label.toLowerCase()} {P.kgPorBinEstandar} kg.</p>
    </Section>
  );
}
