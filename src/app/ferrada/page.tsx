import { Container, Handshake, MessageCircle } from "lucide-react";
import { Badge, PageHeader, Section, Stat, TableWrap, type Tono } from "@/components/ui";
import { Bitacora } from "@/components/bitacora";
import { exportadorDe } from "@/lib/calc";
import { bitacora, clientes, operacionesFerrada } from "@/lib/data";
import { fecha, n, usd } from "@/lib/format";
import type { OperacionFerrada } from "@/lib/types";

const PASOS: OperacionFerrada["estado"][] = ["Buscando fruta", "Fruta comprada", "Embarcada", "Draft enviado", "Pagada", "Cerrada"];
const TONO: Record<OperacionFerrada["estado"], Tono> = {
  "Buscando fruta": "ambar",
  "Fruta comprada": "azul",
  Embarcada: "azul",
  "Draft enviado": "azul",
  Pagada: "verde",
  Cerrada: "gris",
};

export default function Ferrada() {
  const f = clientes.find((c) => c.id === "ferrada")!;
  const ops = operacionesFerrada;
  const cont = ops.reduce((a, o) => a + o.contenedores, 0);
  const cajas = ops.reduce((a, o) => a + o.cajas, 0);
  const comision = ops.reduce((a, o) => a + o.cajas * o.comisionUsdCaja, 0);
  const vendido = ops.reduce((a, o) => a + o.cajas * o.ventaUsdCaja, 0);

  return (
    <>
      <PageHeader
        etapa="Módulo 3 · Clientes · Intermediación"
        titulo="Ferrada"
        subtitulo="Francisco busca fruta en Chile y Perú para Ferrada: la compra a una exportadora, se la vende y cobra una comisión por caja. Ferrada la envía a Italia, Hong Kong y Taiwán."
        acciones={<button className="btn-primary" type="button"><Handshake size={15} /> Nueva operación</button>}
      />

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
        Sección inicial para validar: nombre, comisión de US$ 0,05 por caja y cómo se cobra están por confirmar con Francisco. Datos de ejemplo.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Operaciones" valor={ops.length} detalle={`${cont} contenedores esta temporada`} />
        <Stat label="Cajas intermediadas" valor={n(cajas)} detalle="Arándano y manzana" />
        <Stat label="Vendido a Ferrada" valor={usd(vendido)} />
        <Stat label="Comisión ganada" valor={usd(comision)} detalle="US$ 0,05 por caja" tono="ok" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section titulo="Operaciones" descripcion="A cuánto se compró, a cuánto se vendió y la comisión de cada una" sinPadding>
            <TableWrap>
              <thead className="border-b border-ink-100">
                <tr>
                  <th className="th">Operación</th>
                  <th className="th">Producto</th>
                  <th className="th">Exportadora</th>
                  <th className="th">Destino</th>
                  <th className="th text-right">Cajas</th>
                  <th className="th text-right">Compra</th>
                  <th className="th text-right">Venta</th>
                  <th className="th text-right">Comisión</th>
                  <th className="th">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ops.map((o) => {
                  const e = exportadorDe(o.exportadorId);
                  return (
                    <tr key={o.id} className="border-b border-ink-100 last:border-0">
                      <td className="td"><span className="font-mono text-[12.5px]">{o.id}</span><div className="text-[12px] text-ink-500">{fecha(o.fecha)}</div></td>
                      <td className="td">{o.producto}<div className="text-[12px] text-ink-500">{o.origenPais}</div></td>
                      <td className="td">{e.nombre}<div className="text-[12px] text-ink-500">{e.contacto}</div></td>
                      <td className="td">{o.destino}</td>
                      <td className="td text-right">{n(o.cajas)}<div className="text-[12px] text-ink-500">{o.contenedores} cont.</div></td>
                      <td className="td text-right">{usd(o.cajas * o.compraUsdCaja)}<div className="text-[12px] text-ink-500">{o.compraUsdCaja.toFixed(2).replace(".", ",")}/caja</div></td>
                      <td className="td text-right">{usd(o.cajas * o.ventaUsdCaja)}<div className="text-[12px] text-ink-500">{o.ventaUsdCaja.toFixed(2).replace(".", ",")}/caja</div></td>
                      <td className="td text-right font-medium text-leaf-700">{usd(o.cajas * o.comisionUsdCaja)}</td>
                      <td className="td"><Badge tono={TONO[o.estado]}>{o.estado}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section titulo="Pasos de una operación">
              <ol className="flex flex-wrap gap-2">
                {PASOS.map((p, i) => (
                  <li key={p} className="flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-[12.5px] text-ink-700">
                    <span className="font-mono text-[11px] text-ink-500">{i + 1}</span> {p}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[12.5px] text-ink-500">Igual que con los clientes directos: el set oficial de documentos se entrega solo después del pago.</p>
            </Section>
            <Section titulo="Condiciones con Ferrada">
              <dl className="space-y-2 text-[13.5px]">
                <div className="flex justify-between gap-3"><dt className="text-ink-500">Forma de pago</dt><dd>{f.condicionesPago}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-500">Destinos</dt><dd className="text-right">{f.destinos.join(", ")}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-500">Comisión</dt><dd>US$ 0,05 por caja</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-500">Potencial</dt><dd>Hasta ~500 contenedores</dd></div>
              </dl>
              <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3 text-[12.5px] text-ink-600">
                <MessageCircle size={13} aria-hidden /> Contacto en Ferrada: por confirmar
                <Container size={13} className="ml-auto" aria-hidden /> {cont} cont.
              </div>
            </Section>
          </div>
        </div>
        <Bitacora inicial={bitacora.ferrada ?? []} idBase="bit-ferrada" />
      </div>
    </>
  );
}
