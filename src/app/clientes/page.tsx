import Link from "next/link";
import { Plus } from "lucide-react";
import { Dot, PageHeader, Section, TableWrap } from "@/components/ui";
import { semaforoOC, totalOC } from "@/lib/calc";
import { clientes, ordenes } from "@/lib/data";
import { usd } from "@/lib/format";

export default function Clientes() {
  return (
    <>
      <PageHeader
        titulo="Clientes"
        subtitulo="Importadores en destino. Las condiciones de pago varían por cliente, destino y volumen."
        acciones={<button className="btn-primary" type="button"><Plus size={15} /> Nuevo cliente</button>}
      />
      <Section titulo={`${clientes.length} clientes`} sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Cliente</th>
              <th className="th">Destino</th>
              <th className="th">Condiciones de pago</th>
              <th className="th text-right">Órdenes</th>
              <th className="th text-right">Contenedores</th>
              <th className="th text-right">Vendido</th>
              <th className="th text-right">Por cobrar</th>
              <th className="th">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => {
              const os = ordenes.filter((o) => o.clienteId === c.id);
              const porCobrar = os.flatMap((o) => o.pagos).filter((p) => p.estado !== "Pagado").reduce((a, p) => a + p.montoUsd, 0);
              const peor = os.some((o) => semaforoOC(o) === "rojo") ? "rojo" : os.some((o) => semaforoOC(o) === "amarillo") ? "amarillo" : "verde";
              return (
                <tr key={c.id} className="border-b border-ink-100 align-top last:border-0">
                  <td className="td">
                    <div className="font-medium">{c.nombre}</div>
                    <div className="text-[12px] text-ink-500">{c.contacto} · <span className="select-all">{c.email}</span></div>
                  </td>
                  <td className="td">{c.pais}<div className="text-[12px] text-ink-500">{c.puertoDestino}</div></td>
                  <td className="td max-w-xs whitespace-normal text-[13px] text-ink-600">{c.condicionesPago}</td>
                  <td className="td text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      {os.map((o) => <Link key={o.id} href={`/exportado/${o.id}`} className="font-mono text-[12px] text-leaf-600 hover:underline">{o.id}</Link>)}
                    </div>
                  </td>
                  <td className="td text-right">{os.reduce((a, o) => a + o.contenedores, 0)}</td>
                  <td className="td text-right">{usd(os.reduce((a, o) => a + totalOC(o), 0))}</td>
                  <td className="td text-right">{usd(porCobrar)}</td>
                  <td className="td"><Dot tono={peor} /></td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Section>
    </>
  );
}
