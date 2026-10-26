import Link from "next/link";
import { BellRing, Lock, Plus } from "lucide-react";
import { Dot, PageHeader, Section, Stat, TableWrap } from "@/components/ui";
import { Tablero, type CardOC } from "@/components/tablero";
import { cajasOC, clienteDe, disponibilidad, semaforoOC, seguimientos, setOficialBloqueado, stockDisponible, totalOC } from "@/lib/calc";
import { ordenes } from "@/lib/data";
import { fecha, n, usd } from "@/lib/format";
import { CALIBRES, CALIDADES } from "@/lib/types";

export default function TableroClientes() {
  const activas = ordenes.filter((o) => o.paso !== "Cerrada");
  const cerradas = ordenes.filter((o) => o.paso === "Cerrada");
  const porCobrar = ordenes.flatMap((o) => o.pagos).filter((p) => p.estado !== "Pagado").reduce((a, p) => a + p.montoUsd, 0);
  const vencido = ordenes.flatMap((o) => o.pagos).filter((p) => p.estado === "Vencido").reduce((a, p) => a + p.montoUsd, 0);
  const disp = disponibilidad();
  const seg = seguimientos();
  const bloqueadas = activas.filter((o) => o.paso === "Draft enviado" && setOficialBloqueado(o));
  const stock = stockDisponible();

  const cards: CardOC[] = activas.map((o) => {
    const c = clienteDe(o);
    const d = disp[o.id];
    const falta = d ? d.reduce((a, l) => a + (l.pedido - l.asignado), 0) : 0;
    return {
      id: o.id,
      paso: o.paso,
      cliente: c.nombre,
      destino: `${o.destinoPuerto}, ${o.destinoPais}`,
      contenedores: o.contenedores,
      cajas: n(cajasOC(o)),
      total: usd(totalOC(o)),
      semaforo: semaforoOC(o),
      detalle: o.barco ? `${o.barco} · ETD ${fecha(o.etd)} · ETA ${fecha(o.eta)}` : `OC recibida el ${fecha(o.fecha)}`,
      bloqueoPago: setOficialBloqueado(o),
      faltaFruta: falta > 0 ? `Faltan ${n(falta)} cajas en packing: evaluar caja terminada` : d ? "Fruta disponible en packing" : undefined,
    };
  });

  return (
    <>
      <PageHeader
        etapa="Módulo 3 · Clientes"
        titulo="Órdenes de compra"
        subtitulo="El cliente entra al sistema cuando manda su orden de compra. Cada tarjeta guarda la orden, la negociación, la naviera, los documentos y los pagos."
        acciones={<button className="btn-primary" type="button"><Plus size={15} /> Cargar orden de compra</button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Órdenes activas" valor={activas.length} detalle={`${activas.reduce((a, o) => a + o.contenedores, 0)} contenedores en curso`} />
        <Stat label="Por cobrar" valor={usd(porCobrar)} detalle="Hitos pendientes y vencidos" />
        <Stat label="Vencido" valor={usd(vencido)} detalle="Requiere gestión hoy" tono={vencido ? "alerta" : "ok"} />
        <Stat label="Seguimientos" valor={seg.length} detalle={`Clientes sin contacto hace 7+ días`} />
      </div>

      {(bloqueadas.length > 0 || seg.length > 0) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {bloqueadas.map((o) => (
            <Link key={o.id} href={`/clientes/oc/${o.id}`} className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[13.5px] text-brand-700 hover:border-brand-500">
              <Lock size={17} className="mt-0.5 shrink-0" aria-hidden />
              <span><b className="font-semibold">No enviar el set oficial de {o.id}.</b> {clienteDe(o).nombre} tiene el draft pero no ha pagado el hito contra documentos.</span>
            </Link>
          ))}
          {seg.map((s) => (
            <Link key={s.cliente.id} href={`/clientes/${s.cliente.id}`} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900 hover:border-amber-400">
              <BellRing size={17} className="mt-0.5 shrink-0" aria-hidden />
              <span><b className="font-semibold">{s.dias} días sin contacto con {s.cliente.contacto}</b> ({s.cliente.nombre}). Tiene {s.activas.length} {s.activas.length > 1 ? "órdenes activas" : "orden activa"}.</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-3 mt-6 flex flex-wrap items-center gap-4 text-[12.5px] text-ink-500">
        <span className="flex items-center gap-1.5"><Dot tono="verde" /> Pagos al día</span>
        <span className="flex items-center gap-1.5"><Dot tono="amarillo" /> Pago vence en 3 días o menos</span>
        <span className="flex items-center gap-1.5"><Dot tono="rojo" /> Pago vencido</span>
        <span className="ml-auto">Los botones mueven la tarjeta solo en esta demostración.</span>
      </div>
      <Tablero inicial={cards} />

      <div className="mt-6 grid gap-5 2xl:grid-cols-[1.3fr_1fr]">
        <Section titulo="Fruta disponible para vender" descripcion="Cajas embaladas en los últimos 14 días, menos lo comprometido en órdenes con naviera reservada. Calibre = frutas por caja: número más bajo, fruta más grande." sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Calidad \ calibre</th>
                {CALIBRES.map((c) => <th key={c} className="th text-right">Cal. {c}</th>)}
              </tr>
            </thead>
            <tbody>
              {CALIDADES.map((c) => (
                <tr key={c} className="border-b border-ink-100 last:border-0">
                  <td className="td font-medium">{c}</td>
                  {CALIBRES.map((cal) => <td key={cal} className="td text-right">{n(stock[c][cal])}</td>)}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo={`Cerradas esta temporada (${cerradas.length})`} sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Orden</th>
                <th className="th">Cliente</th>
                <th className="th text-right">Cont.</th>
                <th className="th text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {cerradas.map((o) => (
                <tr key={o.id} className="border-b border-ink-100 last:border-0">
                  <td className="td"><Link href={`/clientes/oc/${o.id}`} className="font-mono text-[12.5px] text-leaf-600 hover:underline">{o.id}</Link></td>
                  <td className="td">{clienteDe(o).nombre}</td>
                  <td className="td text-right">{o.contenedores}</td>
                  <td className="td text-right">{usd(totalOC(o))}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>
      </div>
    </>
  );
}
