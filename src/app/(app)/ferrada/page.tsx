import Link from "next/link";
import clsx from "clsx";
import { Check, Handshake, Lock, Plus } from "lucide-react";
import { Bitacora } from "@/components/bitacora";
import { Badge, Fab, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { PASOS_FERRADA, REGIONES, type Destino, type OperacionFerrada } from "@/db/schema";
import { usuarioActual } from "@/lib/auth";
import { getParams, listaDestinos, listaOperaciones, listaProveedores, notasDe } from "@/lib/datos";
import { ganancia, pagos, semanaDe, setOficialBloqueado } from "@/lib/ferrada";
import { fecha, n, usd } from "@/lib/format";

const ORIGENES = ["Todos", "Chile", "Perú", "Ecuador"] as const;
const TONO_PAGO: Record<string, Tono> = { Pagado: "verde", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };

export default async function Ferrada({ searchParams }: { searchParams: Promise<{ origen?: string }> }) {
  const { origen = "Todos" } = await searchParams;
  const [u, todas, destinos, proveedores, p, notas] = await Promise.all([usuarioActual(), listaOperaciones(), listaDestinos(), listaProveedores(), getParams(), notasDe("ferrada", null)]);
  const dest = new Map(destinos.map((d) => [d.id, d]));
  const prov = new Map(proveedores.map((x) => [x.id, x.nombre]));
  const dias = { desde: p.dias_pago2_desde ?? 15, hasta: p.dias_pago2_hasta ?? 20 };
  const meta = p.meta_semanal_destino ?? 2;

  const filtradas = todas.filter((o) => origen === "Todos" || o.origenPais === origen);
  const activas = filtradas.filter((o) => o.paso !== "Cerrada");
  const cerradas = filtradas.filter((o) => o.paso === "Cerrada");
  const g = filtradas.map(ganancia);
  const sum = (k: "comision" | "margen" | "rebate" | "total") => g.reduce((a, x) => a + x[k], 0);
  const porCobrar = filtradas.flatMap((o) => pagos(o, dias)).filter((x) => x.estado !== "Pagado").reduce((a, x) => a + (x.monto ?? 0), 0);

  // Contenedores de una misma orden de Ferrada: "1 de 2", "2 de 2"
  const porOrden = new Map<string, OperacionFerrada[]>();
  for (const o of [...todas].sort((a, b) => a.codigo.localeCompare(b.codigo))) {
    if (!o.ocFerrada) continue;
    porOrden.set(o.ocFerrada, [...(porOrden.get(o.ocFerrada) ?? []), o]);
  }
  const posicion = (o: OperacionFerrada) => {
    const g = o.ocFerrada ? porOrden.get(o.ocFerrada) : undefined;
    return g ? { i: g.indexOf(o) + 1, total: g.length } : undefined;
  };

  const { lunes, domingo } = semanaDe();
  const metaSemana = destinos
    .filter((d) => d.activo)
    .map((d) => ({
      destino: d,
      contenedores: todas.filter((o) => o.destinoId === d.id && o.etd && o.etd >= lunes && o.etd <= domingo).reduce((a, o) => a + o.contenedores, 0),
    }));

  return (
    <>
      <PageHeader
        etapa="Ferrada · importador europeo"
        titulo="Operaciones de Ferrada"
        subtitulo="CFSCL busca la fruta en Chile, Perú y Ecuador para Ferrada y sigue cada contenedor hasta el pago. Una operación es un contenedor."
        acciones={u.rol !== "lectura" && <Link href="/ferrada/nueva" className="btn-primary hidden lg:inline-flex"><Plus size={15} /> Nueva operación</Link>}
      />
      {u.rol !== "lectura" && todas.length > 0 && <Fab href="/ferrada/nueva" label="Nueva operación"><Plus size={20} /> Nueva</Fab>}

      {todas.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Handshake size={34} className="text-leaf-500" aria-hidden />
          <h2 className="mt-3 font-display text-[19px] font-bold">Todavía no hay operaciones</h2>
          <p className="mt-1 max-w-md text-[14px] text-ink-500">Carga la primera con la orden de compra de Ferrada. Antes conviene crear el proveedor y revisar los destinos en Configuración.</p>
          {u.rol !== "lectura" && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/ferrada/nueva" className="btn-primary"><Plus size={15} /> Nueva operación</Link>
              <Link href="/proveedores/nuevo" className="btn-ghost">Crear proveedor</Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Operaciones activas" valor={activas.length} detalle={`${activas.reduce((a, o) => a + o.contenedores, 0)} contenedores en curso`} />
            <Stat label="Ganancia CFSCL" valor={usd(sum("total"))} detalle={`Comisión ${usd(sum("comision"))} · margen ${usd(sum("margen"))} · rebate ${usd(sum("rebate"))}`} tono="ok" />
            <Stat label="Por cobrar a Ferrada" valor={usd(porCobrar)} detalle="Pagos 1 y 2 pendientes" />
            <Stat label="Meta de la semana" valor={`${metaSemana.filter((m) => m.contenedores >= meta).length}/${metaSemana.length}`} detalle={`Destinos con ${meta} contenedores`} tono={metaSemana.every((m) => m.contenedores >= meta) ? "ok" : "alerta"} />
          </div>

          <Section titulo={`Meta semanal: ${meta} contenedores por destino`} descripcion={`Zarpes del ${fecha(lunes)} al ${fecha(domingo)}`} className="mt-5">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
              {metaSemana.map((m) => {
                const ok = m.contenedores >= meta;
                return (
                  <div key={m.destino.id} className={clsx("rounded-lg border px-3 py-2.5", ok ? "border-leaf-100 bg-leaf-50" : m.contenedores === 0 ? "border-brand-100 bg-brand-50" : "border-amber-200 bg-amber-50")}>
                    <div className="text-[12px] text-ink-500">{m.destino.region} · {m.destino.pais}</div>
                    <div className="text-[14.5px] font-semibold">{m.destino.puerto}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {Array.from({ length: meta }).map((_, i) => (
                        <span key={i} className={clsx("flex h-6 w-6 items-center justify-center rounded-full", i < m.contenedores ? "bg-leaf-500 text-white" : "border border-dashed border-ink-300 bg-white")}>
                          {i < m.contenedores && <Check size={14} aria-hidden />}
                        </span>
                      ))}
                      <span className="ml-1 text-[12.5px] font-medium">{m.contenedores} de {meta}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <div className="-mx-4 mt-6 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <span className="shrink-0 text-[13px] text-ink-500">Origen:</span>
            {ORIGENES.map((o) => {
              const c = o === "Todos" ? todas.length : todas.filter((x) => x.origenPais === o).length;
              return (
                <Link key={o} href={o === "Todos" ? "/ferrada" : `/ferrada?origen=${encodeURIComponent(o)}`} scroll={false} className={clsx("shrink-0 rounded-full px-3.5 py-2 text-[14px] lg:px-3 lg:py-1 lg:text-[13px]", origen === o ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}>
                  {o === "Todos" ? "Todas" : o} <span className="tabular-nums opacity-70">{c}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {todas.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {REGIONES.map((reg) => {
                const lista = activas.filter((o) => dest.get(o.destinoId)?.region === reg);
                return (
                  <div key={reg} className="flex min-w-0 flex-col rounded-xl bg-ink-100/70 p-2.5">
                    <div className="flex items-start justify-between px-1.5 pb-2.5 pt-1">
                      <div className="text-[14px] font-semibold text-ink-800">{reg}</div>
                      <span className="rounded-full bg-white px-2 text-[12px] tabular-nums text-ink-500">{lista.length}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {lista.map((o) => <Tarjeta key={o.id} o={o} d={dest.get(o.destinoId)!} proveedor={o.proveedorId ? prov.get(o.proveedorId) : undefined} dias={dias} pos={posicion(o)} />)}
                      {lista.length === 0 && <div className="rounded-lg border border-dashed border-ink-300 px-3 py-6 text-center text-[12px] text-ink-400">Sin operaciones activas</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {cerradas.length > 0 && (
            <Section titulo={`Cerradas (${cerradas.length})`} className="mt-5" sinPadding>
              <ul className="divide-y divide-ink-100 md:hidden">
                {cerradas.map((o) => (
                  <li key={o.id}>
                    <Link href={`/ferrada/${o.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-ink-50">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-medium">{o.producto} {o.variedad}</div>
                        <div className="text-[12.5px] text-ink-500"><span className="font-mono">{o.codigo}</span> · {dest.get(o.destinoId)?.puerto} {o.numerosContenedor ? ` · ${o.numerosContenedor}` : ""}</div>
                      </div>
                      <div className="text-right text-[14px] font-semibold text-leaf-700">{usd(ganancia(o).total)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
              <TableWrap>
                <thead className="border-b border-ink-100">
                  <tr><th className="th">Operación</th><th className="th">Fruta</th><th className="th">Destino</th><th className="th text-right">Cont.</th><th className="th text-right">Ganancia CFSCL</th></tr>
                </thead>
                <tbody>
                  {cerradas.map((o) => (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="td"><Link href={`/ferrada/${o.id}`} className="font-mono text-[12.5px] text-leaf-600 hover:underline">{o.codigo}</Link></td>
                      <td className="td">{o.producto} {o.variedad} · {o.origenPais}</td>
                      <td className="td">{dest.get(o.destinoId)?.puerto}</td>
                      <td className="td text-right">{o.contenedores}</td>
                      <td className="td text-right">{usd(ganancia(o).total)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              </div>
            </Section>
          )}
        </div>
        <Bitacora entidad="ferrada" entidadId={null} notas={notas} titulo="Notas generales de Ferrada" />
      </div>
    </>
  );
}

function Tarjeta({ o, d, proveedor, dias, pos }: { o: OperacionFerrada; d: Destino; proveedor?: string; dias: { desde: number; hasta: number }; pos?: { i: number; total: number } }) {
  const [p1, p2] = pagos(o, dias);
  const k = PASOS_FERRADA.indexOf(o.paso);
  const bloqueado = setOficialBloqueado(o);
  return (
    <Link href={`/ferrada/${o.id}`} className="card block p-4 transition hover:border-leaf-500 active:scale-[.99] md:p-3.5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-ink-500">{o.codigo}</span>
        <Badge tono={o.origenPais === "Perú" ? "ambar" : o.origenPais === "Ecuador" ? "azul" : "verde"} className="ml-auto">{o.origenPais}</Badge>
      </div>
      <div className="mt-1.5 text-[14.5px] font-semibold leading-snug">{o.producto} {o.variedad}</div>
      <div className="text-[12.5px] text-ink-500">{proveedor ?? "Proveedor por buscar"}</div>
      <div className="mt-1.5 text-[12.5px] text-ink-600">
        <span className="font-semibold text-ink-900">{d.puerto}</span> · {n(o.cajas)} cajas
      </div>
      {o.ocFerrada && (
        <div className="mt-0.5 text-[12px] text-ink-600">
          Orden <span className="font-mono">{o.ocFerrada}</span>{pos && pos.total > 1 ? ` · contenedor ${pos.i} de ${pos.total}` : ""}
        </div>
      )}
      <div className="mt-0.5 font-mono text-[12px] text-ink-500">
        {o.numerosContenedor ?? "Contenedor por asignar"}{o.bl ? ` · BL ${o.bl}` : ""}
      </div>
      {o.etd && <div className="mt-0.5 text-[12px] text-ink-500">ETD {fecha(o.etd)}{o.eta ? ` · ETA ${fecha(o.eta)}` : ""}</div>}
      <div className="mt-2.5">
        <div className="flex gap-0.5">
          {PASOS_FERRADA.slice(0, -1).map((x, i) => <div key={x} className={clsx("h-1.5 flex-1 rounded-full", i < k ? "bg-leaf-500" : i === k ? "bg-leaf-500/60" : "bg-ink-200")} />)}
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
