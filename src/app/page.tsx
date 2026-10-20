import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, Factory, Package, Scale, Ship, Sprout, Truck } from "lucide-react";
import { Badge, LinkMas, PageHeader, Progress, Section, SeveridadBadge, Stat, TableWrap } from "@/components/ui";
import { alertas, cajasOC, clienteDe, columnaDe, kgPorSemana, pagosProductorPorEstado, resumenTemporada, seguimientos, semaforoOC } from "@/lib/calc";
import { ordenes, productores, productoresPendientes } from "@/lib/data";
import { clp, clpM, fecha, fechaLarga, n, pct } from "@/lib/format";
import { HOY, TEMPORADA_ACTUAL } from "@/lib/params";
import { COLUMNAS_OC } from "@/lib/types";
import { Dot } from "@/components/ui";

export default function Inicio() {
  const t = resumenTemporada();
  const al = alertas();
  const { hoy } = pagosProductorPorEstado();
  const totalHoy = hoy.reduce((a, p) => a + p.montoClp, 0);
  const semanas = kgPorSemana();
  const maxKg = Math.max(...semanas.map(([, v]) => v));
  const urgentes = al.filter((a) => a.severidad === "Crítica" || a.severidad === "Alta");
  const ocActivas = ordenes.filter((o) => o.paso !== "Cerrada");

  return (
    <>
      <PageHeader
        titulo={`Temporada ${TEMPORADA_ACTUAL}`}
        subtitulo={`Situación al ${fechaLarga(HOY)}. Plena cosecha: ${productores.length} productores con contrato entregando fruta al packing.`}
        acciones={
          <Link href="/alertas" className="btn-danger">
            <AlertTriangle size={15} /> {urgentes.length} alertas por atender
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Bins recibidos" icon={Truck} valor={n(t.binsRecibidos)} detalle={`de ${n(t.binsContratados)} contratados · ${pct(t.binsRecibidos / t.binsContratados)}`} />
        <Stat label="Kg recibidos (romana)" icon={Scale} valor={n(t.kgRecibidos)} detalle={`${t.camiones} camiones · ${t.descuadres} con descuadre`} />
        <Stat label="Cajas embaladas" icon={Package} valor={n(t.cajas)} detalle={`${pct(1 - t.kgIndustrial / t.kgEntradaProc)} exportable`} tono="ok" />
        <Stat label="Pagos a productores hoy" icon={Banknote} valor={clpM(totalHoy)} detalle={`Viernes · ${hoy.length} pagos de cosecha y embalado`} />
      </div>

      {/* Las tres etapas */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          {
            href: "/productores",
            etapa: "Módulo 1",
            titulo: "Productores",
            icon: Sprout,
            lineas: [
              [`Contratos firmados`, String(productores.length)],
              [`Por firmar o visitar`, String(productoresPendientes.length)],
              [`Avance de cosecha`, pct(t.binsRecibidos / t.binsContratados)],
              [`Bins faltantes (guía vs romana)`, n(t.binsGuia - t.binsRecibidos)],
            ],
          },
          {
            href: "/proceso",
            etapa: "Módulo 2",
            titulo: "Proceso",
            icon: Factory,
            lineas: [
              [`Bins procesados`, n(t.binsProcesados)],
              [`Premium + Extra Fancy`, pct((t.porCalidad.Premium + t.porCalidad["Extra Fancy"]) / t.cajas)],
              [`Kg industrial`, n(t.kgIndustrial)],
            ],
          },
          {
            href: "/clientes",
            etapa: "Módulo 3",
            titulo: "Clientes",
            icon: Ship,
            lineas: [
              [`Órdenes de compra activas`, String(ocActivas.length)],
              [`Contenedores comprometidos`, String(ocActivas.reduce((a, o) => a + o.contenedores, 0))],
              [`Clientes con pago atrasado`, String(ordenes.filter((o) => semaforoOC(o) === "rojo").length)],
              [`Seguimientos pendientes`, String(seguimientos().length)],
            ],
          },
        ].map((e, i) => (
          <Link key={e.href} href={e.href} className="card group relative p-4 transition hover:border-leaf-500">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-50 text-leaf-600">
                <e.icon size={17} aria-hidden />
              </span>
              <div>
                <div className="label">{e.etapa}</div>
                <div className="font-display text-[16px] font-bold">{e.titulo}</div>
              </div>
              <ArrowRight size={16} className="ml-auto text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-leaf-600" />
            </div>
            <dl className="mt-3 space-y-1.5">
              {e.lineas.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-[13.5px]">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            {i < 2 && <div className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400 md:flex"><ArrowRight size={12} /></div>}
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Section titulo="Avance por productor" descripcion="Bins recibidos en romana contra lo contratado" acciones={<LinkMas href="/productores">Ver productores</LinkMas>} sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Productor</th>
                <th className="th text-right">Contratados</th>
                <th className="th text-right">Recibidos</th>
                <th className="th w-40">Avance</th>
                <th className="th text-right">Exportable</th>
                <th className="th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {t.porProductor.map((r) => {
                const p = productores.find((x) => x.id === r.temporada.productorId)!;
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                    <td className="td">
                      <Link href={`/productores/${p.id}`} className="font-medium hover:text-leaf-600">{p.nombre}</Link>
                      <div className="text-[12px] text-ink-500">{p.comuna}</div>
                    </td>
                    <td className="td text-right">{n(r.temporada.binsContratados)}</td>
                    <td className="td text-right">{n(r.binsRecibidos)}</td>
                    <td className="td"><div className="flex items-center gap-2"><Progress valor={r.avance} className="w-20" /><span className="w-9 text-right text-[12px] text-ink-500">{pct(r.avance)}</span></div></td>
                    <td className="td text-right">{r.kgEntradaProc ? pct(r.pctExportable) : "—"}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {r.descuadres.length > 0 && <Badge tono="ambar">{r.binsFaltantes} bins faltantes</Badge>}
                        {r.docsFaltantes.length > 0 && <Badge tono="rojo">{r.docsFaltantes.length} doc. pendiente{r.docsFaltantes.length > 1 ? "s" : ""}</Badge>}
                        {!r.descuadres.length && !r.docsFaltantes.length && <Badge tono="verde">Al día</Badge>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo="Alertas prioritarias" acciones={<LinkMas href="/alertas">Ver todas ({al.length})</LinkMas>} sinPadding>
          <ul className="divide-y divide-ink-100">
            {urgentes.slice(0, 6).map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="block px-4 py-3 hover:bg-ink-50">
                  <div className="flex items-start gap-2">
                    <SeveridadBadge s={a.severidad} />
                    <span className="text-[13.5px] font-medium leading-snug">{a.titulo}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-500">{a.detalle}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Section titulo="Kilos recibidos por semana" descripcion="Pesaje de romana, todos los productores">
          <div className="flex h-44 items-end gap-1.5">
            {semanas.map(([sem, v]) => (
              <div key={sem} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10.5px] tabular-nums text-ink-500">{Math.round(v / 1000)}t</span>
                <div className="w-full rounded-t bg-leaf-500/80" style={{ height: `${(v / maxKg) * 78}%` }} title={`${n(v)} kg`} />
                <span className="text-[10.5px] text-ink-400">{fecha(sem)}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section titulo="Pagos de hoy" descripcion="Cosecha (por bin llegado) y embalado (por kg)" acciones={<LinkMas href="/productores/pagos">Calendario</LinkMas>} sinPadding>
          <ul className="divide-y divide-ink-100">
            {hoy.map((p) => {
              const pr = productores.find((x) => x.id === p.productorId)!;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium">{pr.nombre}</div>
                    <div className="truncate text-[12px] text-ink-500">{p.tipo} · {p.base}</div>
                  </div>
                  <span className="text-[13.5px] font-semibold tabular-nums">{clp(p.montoClp)}</span>
                </li>
              );
            })}
            <li className="flex justify-between bg-ink-50 px-4 py-2.5 text-[13.5px]">
              <span className="font-medium">Total viernes {fecha(HOY)}</span>
              <span className="font-bold tabular-nums">{clp(totalHoy)}</span>
            </li>
          </ul>
        </Section>

        <Section titulo="Órdenes de compra en curso" acciones={<LinkMas href="/clientes">Ver tablero</LinkMas>} sinPadding>
          <ul className="divide-y divide-ink-100">
            {ocActivas.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link href={`/clientes/oc/${o.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50">
                  <Dot tono={semaforoOC(o)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{clienteDe(o).nombre}</div>
                    <div className="text-[12px] text-ink-500">{o.id} · {o.contenedores} cont. · {n(cajasOC(o))} cajas</div>
                  </div>
                  <Badge tono="gris">{o.paso}</Badge>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex gap-1 border-t border-ink-100 px-4 py-3">
            {COLUMNAS_OC.map((col) => {
              const c = ordenes.filter((o) => columnaDe(o.paso) === col.id).length;
              return (
                <div key={col.id} className="min-w-0 flex-1">
                  <div className="text-[11.5px] text-ink-500">{col.titulo}</div>
                  <div className="font-display text-[18px] font-bold tabular-nums">{c}</div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </>
  );
}
