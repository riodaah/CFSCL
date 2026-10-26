import Link from "next/link";
import clsx from "clsx";
import { Check, Handshake, Lock } from "lucide-react";
import { Badge, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { Bitacora } from "@/components/bitacora";
import { destinoDe, exportadorDe, gananciaFerrada, metaSemanalFerrada, pagosFerrada, semanaActual, setOficialBloqueadoF } from "@/lib/calc";
import { bitacora, clientes, operacionesFerrada } from "@/lib/data";
import { fecha, n, usd } from "@/lib/format";
import { P } from "@/lib/params";
import { PASOS_FERRADA, REGIONES_FERRADA, type OperacionFerrada } from "@/lib/types";

export const dynamic = "force-dynamic";

const ORIGENES = ["Todos", "Chile", "Perú", "Ecuador"] as const;
const TONO_PAGO: Record<string, Tono> = { Pagado: "verde", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };

export default async function Ferrada({ searchParams }: { searchParams: Promise<{ origen?: string }> }) {
  const { origen = "Todos" } = await searchParams;
  const f = clientes.find((c) => c.id === "ferrada")!;
  const todas = operacionesFerrada;
  const filtradas = todas.filter((o) => origen === "Todos" || o.origenPais === origen);
  const activas = filtradas.filter((o) => o.paso !== "Cerrada");
  const cerradas = filtradas.filter((o) => o.paso === "Cerrada");
  const g = filtradas.map(gananciaFerrada);
  const sum = (k: "comision" | "margen" | "rebate" | "total") => g.reduce((a, x) => a + x[k], 0);
  const porCobrar = filtradas.flatMap(pagosFerrada).filter((p) => p.estado !== "Pagado").reduce((a, p) => a + p.monto, 0);
  const meta = metaSemanalFerrada();
  const { lunes, domingo } = semanaActual();

  return (
    <>
      <PageHeader
        etapa="Módulo 3 · Clientes · Importador europeo"
        titulo="Ferrada"
        subtitulo="Gustavo Ferrada, empresa con 70 años. CFSCL le busca fruta en Chile y Perú (y a futuro Ecuador), compra contenedores completos y se los despacha a Europa, Medio Oriente y Asia. No pasa por el packing propio."
        acciones={<button className="btn-primary" type="button"><Handshake size={15} /> Nueva operación</button>}
      />

      {/* Cómo gana CFSCL */}
      <div className="card mb-5 grid gap-4 p-4 md:grid-cols-4">
        {[
          ["Comisión", `US$ ${P.comisionFerrada.toFixed(2).replace(".", ",")} por caja`, "Siempre se cobra"],
          ["Margen de compraventa", "Venta menos compra", "A veces: compra a 4, vende a 5"],
          ["Rebate de naviera", `~US$ ${n(P.rebateNaviera)} por contenedor`, "Variable, lo paga la naviera"],
          ["Forma de pago", "50% · 50%", "Contra draft · 5 a 10 días tras llegar"],
        ].map(([t, v, d]) => (
          <div key={t}>
            <div className="label">{t}</div>
            <div className="mt-1 font-display text-[17px] font-bold">{v}</div>
            <div className="text-[12.5px] text-ink-500">{d}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Operaciones activas" valor={activas.length} detalle={`${activas.reduce((a, o) => a + o.contenedores, 0)} contenedores en curso`} />
        <Stat label="Ganancia CFSCL" valor={usd(sum("total"))} detalle={`Comisión ${usd(sum("comision"))} · margen ${usd(sum("margen"))} · rebate ${usd(sum("rebate"))}`} tono="ok" />
        <Stat label="Por cobrar a Ferrada" valor={usd(porCobrar)} detalle="Pagos 1 y 2 pendientes" />
        <Stat label="Meta de la semana" valor={`${meta.filter((m) => m.contenedores >= P.metaSemanalDestino).length}/${meta.length}`} detalle={`Destinos con ${P.metaSemanalDestino} contenedores`} tono={meta.every((m) => m.contenedores >= P.metaSemanalDestino) ? "ok" : "alerta"} />
      </div>

      {/* Meta semanal */}
      <Section titulo={`Meta semanal: ${P.metaSemanalDestino} contenedores por destino`} descripcion={`Zarpes del ${fecha(lunes)} al ${fecha(domingo)}`} className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {meta.map((m) => {
            const ok = m.contenedores >= P.metaSemanalDestino;
            return (
              <div key={m.destino.id} className={clsx("rounded-lg border px-3 py-2.5", ok ? "border-leaf-100 bg-leaf-50" : m.contenedores === 0 ? "border-brand-100 bg-brand-50" : "border-amber-200 bg-amber-50")}>
                <div className="text-[12px] text-ink-500">{m.destino.region}</div>
                <div className="text-[14.5px] font-semibold">{m.destino.puerto}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {Array.from({ length: P.metaSemanalDestino }).map((_, i) => (
                    <span key={i} className={clsx("flex h-6 w-6 items-center justify-center rounded-full", i < m.contenedores ? "bg-leaf-500 text-white" : "border border-dashed border-ink-300 bg-white")}>
                      {i < m.contenedores && <Check size={14} aria-hidden />}
                    </span>
                  ))}
                  <span className="ml-1 text-[12.5px] font-medium">{m.contenedores} de {P.metaSemanalDestino}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Origen */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-ink-500">Origen de la fruta:</span>
        {ORIGENES.map((o) => {
          const c = o === "Todos" ? todas.length : todas.filter((x) => x.origenPais === o).length;
          return (
            <Link key={o} href={o === "Todos" ? "/ferrada" : `/ferrada?origen=${o}`} scroll={false} className={clsx("rounded-full px-3 py-1 text-[13px]", origen === o ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}>
              {o === "Todos" ? "Todas" : `Ferrada ${o}`} <span className="tabular-nums opacity-70">{c}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {/* Tablero por destino */}
          <div className="grid gap-4 lg:grid-cols-3">
            {REGIONES_FERRADA.map((reg) => {
              const lista = activas.filter((o) => destinoDe(o.destinoId).region === reg);
              return (
                <div key={reg} className="flex min-w-0 flex-col rounded-xl bg-ink-100/70 p-2.5">
                  <div className="flex items-start justify-between px-1.5 pb-2.5 pt-1">
                    <div>
                      <div className="text-[14px] font-semibold text-ink-800">{reg}</div>
                      <div className="text-[12px] text-ink-500">{[...new Set(lista.map((o) => destinoDe(o.destinoId).puerto))].join(" · ") || "Sin operaciones"}</div>
                    </div>
                    <span className="rounded-full bg-white px-2 text-[12px] tabular-nums text-ink-500">{lista.length}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {lista.map((o) => <Tarjeta key={o.id} o={o} />)}
                    {lista.length === 0 && <div className="rounded-lg border border-dashed border-ink-300 px-3 py-6 text-center text-[12px] text-ink-400">Sin operaciones activas</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {cerradas.length > 0 && (
            <Section titulo={`Cerradas (${cerradas.length})`} className="mt-5" sinPadding>
              <TableWrap>
                <thead className="border-b border-ink-100">
                  <tr>
                    <th className="th">Operación</th>
                    <th className="th">Fruta</th>
                    <th className="th">Destino</th>
                    <th className="th text-right">Cont.</th>
                    <th className="th text-right">Ganancia CFSCL</th>
                  </tr>
                </thead>
                <tbody>
                  {cerradas.map((o) => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="td"><Link href={`/ferrada/${o.id}`} className="font-mono text-[12.5px] text-leaf-600 hover:underline">{o.id}</Link></td>
                      <td className="td">{o.producto} {o.variedad} · {o.origenPais}</td>
                      <td className="td">{destinoDe(o.destinoId).puerto}</td>
                      <td className="td text-right">{o.contenedores}</td>
                      <td className="td text-right">{usd(gananciaFerrada(o).total)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Section titulo="Ferrada">
            <dl className="space-y-2 text-[13.5px]">
              <div className="flex justify-between gap-3"><dt className="text-ink-500">Contacto</dt><dd>{f.contacto}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-500">Teléfono y correo</dt><dd className="text-amber-700">Por agregar</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-500">Pago</dt><dd className="text-right">50% contra draft · 50% a 5–10 días de la llegada</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-500">Productos</dt><dd className="text-right">Uva, manzana, pera, cereza, ciruela, durazno, arándano, fruta congelada, vino</dd></div>
            </dl>
            <p className="mt-3 text-[12.5px] text-ink-500">Los clientes finales de Ferrada no se registran: CFSCL solo trata con Ferrada.</p>
          </Section>
          <Bitacora inicial={bitacora.ferrada ?? []} idBase="bit-ferrada" />
        </div>
      </div>
    </>
  );
}

function Tarjeta({ o }: { o: OperacionFerrada }) {
  const d = destinoDe(o.destinoId);
  const [p1, p2] = pagosFerrada(o);
  const k = PASOS_FERRADA.indexOf(o.paso);
  const bloqueado = setOficialBloqueadoF(o);
  return (
    <Link href={`/ferrada/${o.id}`} className="card block p-3.5 transition hover:border-leaf-500">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-ink-500">{o.id}</span>
        <Badge tono={o.origenPais === "Perú" ? "ambar" : o.origenPais === "Ecuador" ? "azul" : "verde"} className="ml-auto">{o.origenPais}</Badge>
      </div>
      <div className="mt-1.5 text-[14.5px] font-semibold leading-snug">{o.producto} {o.variedad}</div>
      <div className="text-[12.5px] text-ink-500">{o.proveedorId ? exportadorDe(o.proveedorId).nombre : "Proveedor por buscar"}</div>
      <div className="mt-1.5 text-[12.5px] text-ink-600">
        Destino <span className="font-semibold text-ink-900">{d.puerto}</span> · {o.contenedores} cont. · {n(o.cajas)} cajas
      </div>
      {o.etd && (
        <div className="mt-0.5 text-[12px] text-ink-500">
          ETD {fecha(o.etd)}{o.eta ? ` · ETA ${fecha(o.eta)}` : ""}{o.transitoDias ? ` · ${o.transitoDias} días` : ""}
        </div>
      )}
      <div className="mt-2.5">
        <div className="flex gap-0.5">
          {PASOS_FERRADA.slice(0, -1).map((p, i) => <div key={p} className={clsx("h-1.5 flex-1 rounded-full", i < k ? "bg-leaf-500" : i === k ? "bg-leaf-500/60" : "bg-ink-200")} />)}
        </div>
        <div className="mt-1 text-[12px] font-medium text-ink-700">{o.paso}</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge tono={TONO_PAGO[p1.estado]}>Pago 1: {p1.estado.toLowerCase()}</Badge>
        <Badge tono={TONO_PAGO[p2.estado]}>Pago 2: {p2.estado.toLowerCase()}</Badge>
        {bloqueado && <Badge tono="rojo"><Lock size={11} /> Set oficial bloqueado</Badge>}
      </div>
    </Link>
  );
}
