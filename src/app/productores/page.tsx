import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Badge, PageHeader, Progress, Section, Stat, TableWrap } from "@/components/ui";
import { resumenTemporada } from "@/lib/calc";
import { productores, productoresInactivos } from "@/lib/data";
import { clpM, fecha, n, pct } from "@/lib/format";
import { TEMPORADA_ACTUAL } from "@/lib/params";

export default function Productores() {
  const t = resumenTemporada();
  const saldoBins = t.porProductor.reduce((a, r) => a + r.saldoBins, 0);
  const docsPend = t.porProductor.reduce((a, r) => a + r.docsFaltantes.length, 0);

  return (
    <>
      <PageHeader
        etapa="Etapa 1"
        titulo="Productores"
        subtitulo="Cada productor tiene una temporada por año (septiembre a septiembre) con su contrato, recepciones, fletes, documentos y pagos."
        acciones={
          <>
            <button className="btn-ghost" type="button"><Upload size={15} /> Cargar archivo de romana</button>
            <button className="btn-primary" type="button"><Plus size={15} /> Nuevo contrato</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Bins contratados" valor={n(t.binsContratados)} detalle={`${productores.length} contratos ${TEMPORADA_ACTUAL}`} />
        <Stat label="Bins recibidos" valor={n(t.binsRecibidos)} detalle={`${pct(t.binsRecibidos / t.binsContratados)} del programa`} />
        <Stat label="Bins prestados en campo" valor={n(saldoBins)} detalle="Enviados por el packing y aún no devueltos" />
        <Stat label="Documentos pendientes" valor={docsPend} detalle="Entre todos los productores" tono={docsPend ? "alerta" : "ok"} />
      </div>

      <Section titulo={`Contratos temporada ${TEMPORADA_ACTUAL}`} className="mt-5" sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Productor</th>
              <th className="th">Variedades</th>
              <th className="th">Contrato</th>
              <th className="th text-right">Contratados</th>
              <th className="th text-right">Recibidos</th>
              <th className="th w-36">Avance</th>
              <th className="th text-right">Kg/bin</th>
              <th className="th text-right">Exportable</th>
              <th className="th text-right">Pagado</th>
              <th className="th">Alertas</th>
            </tr>
          </thead>
          <tbody>
            {t.porProductor.map((r) => {
              const p = productores.find((x) => x.id === r.temporada.productorId)!;
              return (
                <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="td">
                    <Link href={`/productores/${p.id}`} className="font-medium text-ink-900 hover:text-leaf-600">{p.nombre}</Link>
                    <div className="text-[12px] text-ink-500">{p.comuna}, {p.region} · {p.codigoPacking}</div>
                  </td>
                  <td className="td text-ink-600">{p.variedades.join(", ")}</td>
                  <td className="td text-ink-600">{fecha(r.temporada.fechaContrato)}</td>
                  <td className="td text-right">{n(r.temporada.binsContratados)}</td>
                  <td className="td text-right">{n(r.binsRecibidos)}</td>
                  <td className="td"><div className="flex items-center gap-2"><Progress valor={r.avance} className="w-20" /><span className="w-9 text-right text-[12px] text-ink-500">{pct(r.avance)}</span></div></td>
                  <td className="td text-right">{n(r.kgPorBin)}</td>
                  <td className="td text-right">{r.kgEntradaProc ? pct(r.pctExportable) : "—"}</td>
                  <td className="td text-right">{clpM(r.pagado)}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {r.descuadres.length > 0 && <Badge tono="ambar">{r.descuadres.length} descuadre{r.descuadres.length > 1 ? "s" : ""}</Badge>}
                      {r.docsFaltantes.length > 0 && <Badge tono="rojo">Faltan docs</Badge>}
                      {!r.descuadres.length && !r.docsFaltantes.length && <Badge tono="verde">Al día</Badge>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Section>

      <Section titulo="Productores de temporadas anteriores" descripcion="No recontratados esta temporada. El historial queda para decidir futuras contrataciones." className="mt-5" sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Productor</th>
              <th className="th">Última temporada</th>
              <th className="th text-right">Exportable</th>
              <th className="th">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {productoresInactivos.map((p) => (
              <tr key={p.nombre} className="border-b border-ink-100 last:border-0">
                <td className="td"><span className="font-medium">{p.nombre}</span><div className="text-[12px] text-ink-500">{p.comuna}</div></td>
                <td className="td">{p.ultimaTemporada}</td>
                <td className="td text-right">{p.pctExportable}%</td>
                <td className="td"><Badge tono="gris">{p.motivo}</Badge></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>
    </>
  );
}
