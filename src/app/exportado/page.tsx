import { Plus } from "lucide-react";
import { Dot, PageHeader, Stat } from "@/components/ui";
import { Kanban } from "@/components/kanban";
import { cajasOC, clienteDe, semaforoOC, totalOC } from "@/lib/calc";
import { ordenes } from "@/lib/data";
import { fecha, n, usd } from "@/lib/format";

export default function Exportado() {
  const activas = ordenes.filter((o) => o.etapa !== "Cerrada");
  const porCobrar = ordenes.flatMap((o) => o.pagos).filter((p) => p.estado !== "Pagado").reduce((a, p) => a + p.montoUsd, 0);
  const vencido = ordenes.flatMap((o) => o.pagos).filter((p) => p.estado === "Vencido").reduce((a, p) => a + p.montoUsd, 0);

  const cards = ordenes.map((o) => {
    const c = clienteDe(o);
    return {
      id: o.id,
      etapa: o.etapa,
      cliente: c.nombre,
      pais: c.pais,
      contenedores: o.contenedores,
      cajas: n(cajasOC(o)),
      total: usd(totalOC(o)),
      semaforo: semaforoOC(o),
      linea2: o.naviera ? `${o.naviera} · ETD ${fecha(o.etd)} · ETA ${fecha(o.eta)}` : `OC del ${fecha(o.fecha)}`,
    };
  });

  return (
    <>
      <PageHeader
        etapa="Etapa 3"
        titulo="Exportado"
        subtitulo="Cada tarjeta es una orden de compra. Avanza desde la OC hasta que el cliente recibe y paga."
        acciones={<button className="btn-primary" type="button"><Plus size={15} /> Nueva orden de compra</button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Órdenes activas" valor={activas.length} detalle={`${ordenes.length} en la temporada`} />
        <Stat label="Contenedores en curso" valor={activas.reduce((a, o) => a + o.contenedores, 0)} />
        <Stat label="Por cobrar" valor={usd(porCobrar)} detalle="Hitos pendientes y vencidos" />
        <Stat label="Vencido" valor={usd(vencido)} detalle="Requiere gestión hoy" tono={vencido ? "alerta" : "ok"} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-[12.5px] text-ink-500">
        <span className="flex items-center gap-1.5"><Dot tono="verde" /> Pagos al día</span>
        <span className="flex items-center gap-1.5"><Dot tono="amarillo" /> Pago vence en 3 días o menos</span>
        <span className="flex items-center gap-1.5"><Dot tono="rojo" /> Pago vencido</span>
        <span className="ml-auto">Los botones mueven la tarjeta solo en esta demostración.</span>
      </div>

      <Kanban inicial={cards} />
    </>
  );
}
