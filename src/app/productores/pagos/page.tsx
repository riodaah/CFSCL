import Link from "next/link";
import { Badge, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { resumenProductor } from "@/lib/calc";
import { pagosProductor, productores } from "@/lib/data";
import { addDays } from "@/lib/dates";
import { clp, clpM, fecha } from "@/lib/format";
import { HOY, P } from "@/lib/params";
import type { TipoPagoProductor } from "@/lib/types";

const TIPOS: TipoPagoProductor[] = ["Anticipo", "Cosecha", "Embalado", "Liquidación"];
const COMO: Record<TipoPagoProductor, string> = {
  Anticipo: `${clp(P.anticipoPorBin)} por bin contratado, a la firma`,
  Cosecha: `${clp(P.cosechaPorBin)} por bin llegado a planta, semanal`,
  Embalado: `${clp(P.embaladoPorKg)} por kg exportable embalado, semanal`,
  Liquidación: `${clp(P.liquidacionPorKg)} por kg, ${P.diasLiquidacion} días después`,
};

export default function PagosProductores() {
  const pendientes = pagosProductor
    .filter((p) => p.estado !== "Pagado" && p.vencimiento <= addDays(HOY, 45))
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
  const hoy = pendientes.filter((p) => p.vencimiento === HOY);
  const tono: Record<string, Tono> = { "Por pagar": "ambar", Programado: "gris", Pagado: "verde" };

  return (
    <>
      <PageHeader
        etapa="Módulo 1 · Productores"
        titulo="Pagos a productores"
        subtitulo="Siempre son cuatro pagos. Cada uno se calcula desde el contrato, la romana y lo embalado; aquí se ve qué toca pagar y cuándo."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TIPOS.map((t, i) => {
          const pagado = pagosProductor.filter((p) => p.tipo === t && p.estado === "Pagado").reduce((a, p) => a + p.montoClp, 0);
          const pend = pagosProductor.filter((p) => p.tipo === t && p.estado !== "Pagado").reduce((a, p) => a + p.montoClp, 0);
          return <Stat key={t} label={`Pago ${i + 1} · ${t}`} valor={clpM(pagado)} detalle={<>{COMO[t]}<br />{pend ? `${clpM(pend)} pendiente` : "Sin pendientes"}</>} />;
        })}
      </div>

      <p className="mt-4 rounded-lg bg-ink-100/70 px-3 py-2 text-[13px] text-ink-700">
        Día de pago semanal: viernes. Si el packing procesa el sábado (8 a 12 h), ese día también se paga. Si la fruta de un productor se termina a mitad de semana, se le paga el mismo día.
      </p>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[1.4fr_1fr]">
        <Section titulo="Próximos 45 días" descripcion={`Hoy viernes ${fecha(HOY)}: ${hoy.length} pagos por ${clp(hoy.reduce((a, p) => a + p.montoClp, 0))}`} sinPadding>
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

        <Section titulo="Por productor" descripcion="Pagado y pendiente en la temporada" sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Productor</th>
                <th className="th text-right">Pagado</th>
                <th className="th text-right">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {productores.map((pr) => {
                const r = resumenProductor(pr.id);
                return (
                  <tr key={pr.id} className="border-b border-ink-100 last:border-0">
                    <td className="td"><Link href={`/productores/${pr.id}?tab=pagos`} className="font-medium hover:text-leaf-600">{pr.nombre}</Link></td>
                    <td className="td text-right">{clpM(r.pagado)}</td>
                    <td className="td text-right">{clpM(r.porPagar)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <p className="border-t border-ink-100 px-4 py-3 text-[12.5px] text-amber-800">Valores de los pagos 2, 3 y 4 por confirmar con Francisco.</p>
        </Section>
      </div>
    </>
  );
}
