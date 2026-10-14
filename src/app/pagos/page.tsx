import Link from "next/link";
import { Badge, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { clienteDe } from "@/lib/calc";
import { ordenes, pagosProductor, productores } from "@/lib/data";
import { addDays } from "@/lib/dates";
import { clp, clpM, fecha, usd } from "@/lib/format";
import { HOY } from "@/lib/params";
import type { TipoPagoProductor } from "@/lib/types";

const TIPOS: TipoPagoProductor[] = ["Anticipo", "Cosecha", "Embalado", "Liquidación"];

export default function Pagos() {
  const pendientes = pagosProductor
    .filter((p) => p.estado !== "Pagado" && p.vencimiento <= addDays(HOY, 45))
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
  const hoy = pendientes.filter((p) => p.vencimiento === HOY);
  const totalPorTipo = TIPOS.map((t) => ({
    t,
    pagado: pagosProductor.filter((p) => p.tipo === t && p.estado === "Pagado").reduce((a, p) => a + p.montoClp, 0),
    pendiente: pagosProductor.filter((p) => p.tipo === t && p.estado !== "Pagado").reduce((a, p) => a + p.montoClp, 0),
  }));
  const cobros = ordenes
    .flatMap((o) => o.pagos.map((p) => ({ o, p })))
    .filter(({ p }) => p.estado !== "Pagado")
    .sort((a, b) => (a.p.vencimiento ?? "9999").localeCompare(b.p.vencimiento ?? "9999"));
  const tono: Record<string, Tono> = { "Por pagar": "ambar", Programado: "gris", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };

  return (
    <>
      <PageHeader titulo="Pagos" subtitulo="Lo que hay que pagar a productores y lo que hay que cobrar a clientes, en un solo calendario." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {totalPorTipo.map((x, i) => (
          <Stat key={x.t} label={`Pago ${i + 1} · ${x.t}`} valor={clpM(x.pagado)} detalle={x.pendiente ? `${clpM(x.pendiente)} pendiente` : "Sin pendientes"} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Section titulo="Pagos a productores · próximos 45 días" descripcion={`Hoy viernes ${fecha(HOY)}: ${hoy.length} pagos por ${clp(hoy.reduce((a, p) => a + p.montoClp, 0))}`} sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Fecha</th>
                <th className="th">Productor</th>
                <th className="th">Pago</th>
                <th className="th">Cálculo</th>
                <th className="th text-right">Monto</th>
                <th className="th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((p) => {
                const pr = productores.find((x) => x.id === p.productorId)!;
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0">
                    <td className="td font-medium">{fecha(p.vencimiento)}</td>
                    <td className="td"><Link href={`/productores/${pr.id}?tab=pagos`} className="hover:text-leaf-600">{pr.nombre}</Link></td>
                    <td className="td">{p.tipo}</td>
                    <td className="td text-[13px] text-ink-500">{p.base}</td>
                    <td className="td text-right">{clp(p.montoClp)}</td>
                    <td className="td"><Badge tono={tono[p.estado]}>{p.estado}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo="Cobros a clientes" descripcion="Hitos pendientes por orden de compra" sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Vence</th>
                <th className="th">Cliente</th>
                <th className="th">Hito</th>
                <th className="th text-right">Monto</th>
                <th className="th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cobros.map(({ o, p }) => (
                <tr key={o.id + p.hito} className="border-b border-ink-100 last:border-0">
                  <td className="td font-medium">{fecha(p.vencimiento)}</td>
                  <td className="td">
                    <Link href={`/exportado/${o.id}`} className="hover:text-leaf-600">{clienteDe(o).nombre}</Link>
                    <div className="font-mono text-[11.5px] text-ink-400">{o.id}</div>
                  </td>
                  <td className="td text-[13px]">{p.hito}</td>
                  <td className="td text-right">{usd(p.montoUsd)}</td>
                  <td className="td"><Badge tono={tono[p.estado]}>{p.estado}</Badge></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>
      </div>
    </>
  );
}
