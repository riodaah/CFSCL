import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Dot, PageHeader, Section, TableWrap } from "@/components/ui";
import { Estrellas } from "@/components/estrellas";
import { semaforoOC, seguimientos, totalOC } from "@/lib/calc";
import { clientes, operacionesFerrada, ordenes } from "@/lib/data";
import { fecha, usd } from "@/lib/format";

export default function Clientes() {
  const seg = new Set(seguimientos().map((s) => s.cliente.id));
  return (
    <>
      <PageHeader
        etapa="Módulo 3 · Clientes"
        titulo="Clientes"
        subtitulo="Solo clientes con al menos una orden de compra. Cada uno tiene su forma de pago, sus destinos y su calificación."
        acciones={<button className="btn-primary" type="button"><Plus size={15} /> Nuevo cliente</button>}
      />
      <Section titulo={`${clientes.length} clientes`} sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Cliente</th>
              <th className="th">Calificación</th>
              <th className="th">Destinos</th>
              <th className="th">Forma de pago</th>
              <th className="th text-right">Órdenes</th>
              <th className="th text-right">Vendido</th>
              <th className="th text-right">Por cobrar</th>
              <th className="th">Último contacto</th>
              <th className="th">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => {
              const os = ordenes.filter((o) => o.clienteId === c.id);
              const esFerrada = c.tipo === "Intermediación";
              const vendido = esFerrada ? operacionesFerrada.reduce((a, f) => a + f.cajas * f.ventaUsdCaja, 0) : os.reduce((a, o) => a + totalOC(o), 0);
              const porCobrar = os.flatMap((o) => o.pagos).filter((p) => p.estado !== "Pagado").reduce((a, p) => a + p.montoUsd, 0);
              const peor = os.some((o) => semaforoOC(o) === "rojo") ? "rojo" : os.some((o) => semaforoOC(o) === "amarillo") ? "amarillo" : "verde";
              return (
                <tr key={c.id} className="border-b border-ink-100 align-top last:border-0 hover:bg-ink-50">
                  <td className="td">
                    <Link href={esFerrada ? "/ferrada" : `/clientes/${c.id}`} className="font-medium hover:text-leaf-600">{c.nombre}</Link>
                    <div className="text-[12px] text-ink-500">{c.contacto} · {c.pais}</div>
                    {esFerrada && <Badge tono="azul" className="mt-1">Intermediación</Badge>}
                  </td>
                  <td className="td"><Estrellas valor={c.calificacion} /></td>
                  <td className="td max-w-[220px] whitespace-normal text-[13px] text-ink-600">{c.destinos.join(" · ")}</td>
                  <td className="td max-w-[220px] whitespace-normal text-[13px] text-ink-600">{c.condicionesPago}</td>
                  <td className="td text-right">{esFerrada ? operacionesFerrada.length : os.length}</td>
                  <td className="td text-right">{usd(vendido)}</td>
                  <td className="td text-right">{usd(porCobrar)}</td>
                  <td className="td">{fecha(c.ultimoContacto)} {seg.has(c.id) && <Badge tono="ambar" className="ml-1">Seguimiento</Badge>}</td>
                  <td className="td"><Dot tono={peor} /></td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Section>
      <p className="mt-3 text-[12.5px] text-ink-500">Los prospectos y cotizaciones sin orden de compra no se cargan, como pidió Francisco. El sistema queda listo para registrar clientes nuevos cuando llegue su primera orden.</p>
    </>
  );
}
