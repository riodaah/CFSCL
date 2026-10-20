import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Badge, Dot, PageHeader, Section, Stat, TableWrap } from "@/components/ui";
import { Bitacora } from "@/components/bitacora";
import { Estrellas } from "@/components/estrellas";
import { cajasOC, semaforoOC, seguimientos, totalOC } from "@/lib/calc";
import { bitacora, clientes, ordenes } from "@/lib/data";
import { fecha, fechaLarga, usd } from "@/lib/format";

export function generateStaticParams() {
  return clientes.filter((c) => c.tipo === "Directo").map((c) => ({ id: c.id }));
}

export default async function ClienteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = clientes.find((x) => x.id === id);
  if (!c) notFound();
  if (c.tipo === "Intermediación") redirect("/ferrada");
  const os = ordenes.filter((o) => o.clienteId === c.id);
  const vendido = os.reduce((a, o) => a + totalOC(o), 0);
  const cobrado = os.flatMap((o) => o.pagos).filter((p) => p.estado === "Pagado").reduce((a, p) => a + p.montoUsd, 0);
  const pendiente = vendido - cobrado;
  const seg = seguimientos().find((s) => s.cliente.id === c.id);

  return (
    <>
      <Link href="/clientes/lista" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Clientes
      </Link>
      <PageHeader
        etapa={`Cliente desde ${c.clienteDesde} · ${c.pais}`}
        titulo={c.nombre}
        subtitulo={c.condicionesPago}
        acciones={<span className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px]">Calificación <Estrellas valor={c.calificacion} /></span>}
      />

      {seg && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
          <b className="font-semibold">Seguimiento:</b> {seg.dias} días sin contacto con {c.contacto}. Último contacto el {fechaLarga(c.ultimoContacto)}.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Órdenes" valor={os.length} detalle={`${os.reduce((a, o) => a + o.contenedores, 0)} contenedores`} />
        <Stat label="Vendido" valor={usd(vendido)} />
        <Stat label="Cobrado" valor={usd(cobrado)} tono="ok" />
        <Stat label="Por cobrar" valor={usd(pendiente)} tono={os.some((o) => semaforoOC(o) === "rojo") ? "alerta" : "neutro"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section titulo="Órdenes de compra" sinPadding>
            <TableWrap>
              <thead className="border-b border-ink-100">
                <tr>
                  <th className="th">Orden</th>
                  <th className="th">Fecha</th>
                  <th className="th">Destino</th>
                  <th className="th text-right">Cont.</th>
                  <th className="th text-right">Cajas</th>
                  <th className="th text-right">Total</th>
                  <th className="th">Paso</th>
                  <th className="th">Pagos</th>
                </tr>
              </thead>
              <tbody>
                {os.map((o) => (
                  <tr key={o.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                    <td className="td"><Link href={`/clientes/oc/${o.id}`} className="font-mono text-[12.5px] text-leaf-600 hover:underline">{o.id}</Link></td>
                    <td className="td">{fecha(o.fecha)}</td>
                    <td className="td">{o.destinoPuerto}, {o.destinoPais}</td>
                    <td className="td text-right">{o.contenedores}</td>
                    <td className="td text-right">{cajasOC(o).toLocaleString("es-CL")}</td>
                    <td className="td text-right">{usd(totalOC(o))}</td>
                    <td className="td"><Badge tono={o.paso === "Cerrada" ? "verde" : "gris"}>{o.paso}</Badge></td>
                    <td className="td"><Dot tono={semaforoOC(o)} /></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Section>

          <div className="grid gap-5 md:grid-cols-2">
            <Section titulo="Contacto">
              <div className="text-[14px] font-semibold">{c.contacto}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-ink-700"><Phone size={13} aria-hidden /> <span className="select-all">{c.telefono}</span></div>
              <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-700"><Mail size={13} aria-hidden /> <span className="select-all break-all">{c.email}</span></div>
            </Section>
            <Section titulo="Destinos" descripcion="El país de destino se define en cada orden">
              <ul className="space-y-1.5">
                {c.destinos.map((d) => <li key={d} className="flex items-center gap-1.5 text-[13.5px]"><MapPin size={13} className="text-leaf-600" aria-hidden /> {d}</li>)}
              </ul>
            </Section>
          </div>
        </div>
        <Bitacora inicial={bitacora[`cli:${c.id}`] ?? []} idBase={`bit-${c.id}`} />
      </div>
    </>
  );
}
