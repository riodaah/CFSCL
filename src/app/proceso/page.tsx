import Link from "next/link";
import clsx from "clsx";
import { Clock } from "lucide-react";
import { Badge, COLOR_CALIDAD, FuenteTag, PageHeader, Progress, Section, StackBar, Stat, TableWrap } from "@/components/ui";
import { cajasDeLote, resumenTemporada } from "@/lib/calc";
import { distribucionCalibre, lotes, productores } from "@/lib/data";
import { clp, fecha, n, n1, pct } from "@/lib/format";
import { P, TEMPORADA_ACTUAL } from "@/lib/params";
import { CALIBRES, CALIDADES } from "@/lib/types";

const TERMINADO = [
  { id: "PT-031", desde: "2027-03-01", contenedores: 2, detalle: "Fuji · Premium 100 y Extra Fancy 113", oc: undefined },
  { id: "PT-032", desde: "2027-03-05", contenedores: 3, detalle: "Fuji / Cripps Pink · Premium y Extra Fancy", oc: "OC-2027-006" },
  { id: "PT-033", desde: "2027-03-09", contenedores: 1, detalle: "Granny Smith · Fancy 113", oc: "OC-2027-007" },
];

const VENTAS_IND = [
  { fecha: "2027-02-12", comprador: "Jugos del Valle Central", kg: 38_400, precio: 90 },
  { fecha: "2027-02-26", comprador: "Agroindustrial Rengo (pulpa)", kg: 52_100, precio: 88 },
  { fecha: "2027-03-08", comprador: "Feria Lo Valledor · Comercial Soto", kg: 21_700, precio: 110 },
];

export default function Proceso() {
  const t = resumenTemporada();
  const totalCajas = t.cajas;
  const matriz = CALIDADES.map((c) => ({
    calidad: c,
    celdas: CALIBRES.map((cal) => Math.round(t.porCalidad[c] * distribucionCalibre[cal])),
  }));
  const maxCelda = Math.max(...matriz.flatMap((m) => m.celdas));
  const ranking = [...t.porProductor].filter((r) => r.cajas).sort((a, b) => b.pctExportable - a.pctExportable);
  const partes = [
    ...CALIDADES.map((c) => ({ label: c, valor: t.porCalidad[c] * P.kgNetoCaja, color: COLOR_CALIDAD[c] })),
    { label: "Industrial", valor: t.kgIndustrial, color: COLOR_CALIDAD.Industrial },
  ];
  const kgVendidos = VENTAS_IND.reduce((a, v) => a + v.kg, 0);
  const HOY_ = "2027-03-12";

  return (
    <>
      <PageHeader
        etapa="Módulo 2"
        titulo="Proceso"
        subtitulo="El packing clasifica en exportable e industrial y embala por calidad y calibre. El reporte de proceso llega por correo y se separa por código de productor."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Bins procesados" valor={n(t.binsProcesados)} detalle={`de ${n(t.binsRecibidos)} recibidos`} />
        <Stat label="Kg a proceso" valor={n(t.kgEntradaProc)} />
        <Stat label="Cajas exportables" valor={n(totalCajas)} detalle={`${n(t.kgEmbalados)} kg netos (${n1(P.kgNetoCaja)} kg/caja)`} tono="ok" />
        <Stat label="Exportable" valor={pct(1 - t.kgIndustrial / t.kgEntradaProc)} detalle={`${pct((t.porCalidad.Premium + t.porCalidad["Extra Fancy"]) / totalCajas)} Premium + Extra Fancy`} />
        <Stat label="Kg industrial" valor={n(t.kgIndustrial)} detalle="No se paga al productor" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Section titulo={`Distribución de la temporada ${TEMPORADA_ACTUAL}`} descripcion="Kilos por destino, todos los productores">
          <StackBar partes={partes} />
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {CALIDADES.map((c) => (
              <div key={c} className="flex justify-between border-b border-ink-100 py-1 text-[13px]">
                <span className="text-ink-600">{c}</span>
                <span className="font-medium tabular-nums">{n(t.porCalidad[c])} cj</span>
              </div>
            ))}
          </div>
        </Section>

        <Section titulo="Cajas por calidad y calibre" descripcion="Lo que hay para vender. Calibre = frutas por caja: número más bajo, fruta más grande." sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Calidad \ calibre</th>
                {CALIBRES.map((c) => <th key={c} className="th text-right">Cal. {c}</th>)}
                <th className="th text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {matriz.map((m) => (
                <tr key={m.calidad} className="border-b border-ink-100 last:border-0">
                  <td className="td font-medium">{m.calidad}</td>
                  {m.celdas.map((v, i) => (
                    <td key={i} className="td text-right" style={{ backgroundColor: `rgba(12,116,56,${(v / maxCelda) * 0.28})` }}>{n(v)}</td>
                  ))}
                  <td className="td text-right font-semibold">{n(t.porCalidad[m.calidad])}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section titulo="Rendimiento por productor" descripcion="Calificación para decidir la próxima temporada" sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Productor</th>
                <th className="th w-40">Exportable</th>
                <th className="th text-right">Premium + Extra F.</th>
                <th className="th text-right">Cajas</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => {
                const p = productores.find((x) => x.id === r.temporada.productorId)!;
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0">
                    <td className="td"><Link href={`/productores/${p.id}?tab=rendimiento`} className="font-medium hover:text-leaf-600">{p.nombre}</Link></td>
                    <td className="td"><div className="flex items-center gap-2"><Progress valor={r.pctExportable} tono={r.pctExportable < 0.82 ? "ambar" : "verde"} className="w-24" /><span className="w-9 text-right text-[12px]">{pct(r.pctExportable)}</span></div></td>
                    <td className="td text-right">{pct(r.pctPremiumExtra)}</td>
                    <td className="td text-right">{n(r.cajas)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo="Producto terminado en packing" descripcion={`${P.diasRetiroContenedor} días para retirar antes de que cobren almacenaje`} sinPadding>
          <ul className="divide-y divide-ink-100">
            {TERMINADO.map((x) => {
              const dias = Math.round((Date.parse(HOY_) - Date.parse(x.desde)) / 86400000);
              const tono = dias >= 10 ? "rojo" : dias >= 7 ? "ambar" : "verde";
              return (
                <li key={x.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12.5px] text-ink-500">{x.id}</span>
                    <span className="text-[13.5px] font-medium">{x.contenedores} contenedor{x.contenedores > 1 ? "es" : ""}</span>
                    <span className="text-[13px] text-ink-500">{x.detalle}</span>
                    <span className="ml-auto">{x.oc ? <Badge tono="verde">Asignado a {x.oc}</Badge> : <Badge tono="rojo">Sin orden de compra</Badge>}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-500">
                    <Clock size={13} />
                    <span className={clsx(tono === "rojo" && "font-medium text-brand-600")}>{dias} de {P.diasRetiroContenedor} días</span>
                    <Progress valor={dias / P.diasRetiroContenedor} tono={tono} className="max-w-48" />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Section titulo="Últimos reportes de proceso" descripcion="Un lote por productor y fecha de proceso" sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Fecha</th>
                <th className="th">Productor</th>
                <th className="th">Variedad</th>
                <th className="th text-right">Bins</th>
                <th className="th text-right">Industrial</th>
                <th className="th text-right">Cajas</th>
                <th className="th">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {lotes.slice(0, 12).map((l) => {
                const p = productores.find((x) => x.id === l.productorId)!;
                return (
                  <tr key={l.id} className="border-b border-ink-100 last:border-0">
                    <td className="td">{fecha(l.fecha)}</td>
                    <td className="td">{p.nombre}<span className="ml-1.5 font-mono text-[11.5px] text-ink-400">SAG {p.codigoSag}</span></td>
                    <td className="td">{l.variedad}</td>
                    <td className="td text-right">{n(l.binsProcesados)}</td>
                    <td className="td text-right">{pct(l.kgIndustrial / l.kgEntrada)}</td>
                    <td className="td text-right">{n(cajasDeLote(l))}</td>
                    <td className="td"><FuenteTag f={l.fuente} /></td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo="Venta de fruta industrial" descripcion="Jugo, pulpa y feria. Precio referencial por kilo." sinPadding>
          <ul className="divide-y divide-ink-100">
            {VENTAS_IND.map((v) => (
              <li key={v.fecha} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
                <div className="min-w-0">
                  <div className="truncate font-medium">{v.comprador}</div>
                  <div className="text-[12px] text-ink-500">{fecha(v.fecha)} · {n(v.kg)} kg × {clp(v.precio)}</div>
                </div>
                <span className="font-semibold tabular-nums">{clp(v.kg * v.precio)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-100 px-4 py-3 text-[13px] text-ink-600">
            Vendido {n(kgVendidos)} kg de {n(t.kgIndustrial)} kg industriales. Quedan {n(Math.max(0, t.kgIndustrial - kgVendidos))} kg por vender.
          </div>
        </Section>
      </div>
    </>
  );
}
