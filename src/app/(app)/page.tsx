import Link from "next/link";
import clsx from "clsx";
import { AlertTriangle, ArrowRight, CircleAlert, Info } from "lucide-react";
import { PageHeader, Section, Stat } from "@/components/ui";
import { getParams, listaDestinos, listaOperaciones, listaProveedores, todosLosCertificados } from "@/lib/datos";
import { ganancia, hoy, pagos, resumenCertificados, semanaDe, setOficialBloqueado } from "@/lib/ferrada";
import { fechaLarga, usd } from "@/lib/format";
import { usuarioActual, nombreDe } from "@/lib/auth";

type Alerta = { nivel: "alta" | "media" | "info"; titulo: string; detalle: string; href: string };

export default async function Inicio() {
  const [u, ops, provs, dests, certs, p] = await Promise.all([usuarioActual(), listaOperaciones(), listaProveedores(), listaDestinos(), todosLosCertificados(), getParams()]);
  const dias = { desde: p.dias_pago2_desde ?? 15, hasta: p.dias_pago2_hasta ?? 20 };
  const activas = ops.filter((o) => o.paso !== "Cerrada");
  const alertas: Alerta[] = [];

  for (const o of activas) {
    const [p1, p2] = pagos(o, dias);
    const t = `${o.codigo} · ${o.producto}`;
    if (p1.estado === "Vencido") alertas.push({ nivel: "alta", titulo: `Ferrada no ha pagado el primer 50% · ${t}`, detalle: p1.texto, href: `/ferrada/${o.id}` });
    if (setOficialBloqueado(o)) alertas.push({ nivel: "media", titulo: `Set oficial bloqueado · ${t}`, detalle: "Draft enviado, falta el pago 1.", href: `/ferrada/${o.id}` });
    if (o.draftEnviado && !o.pago1Pagado && !o.pago1Vence) alertas.push({ nivel: "media", titulo: `Falta fecha de vencimiento del pago 1 · ${t}`, detalle: "Regístrala para que el sistema avise si se atrasa.", href: `/ferrada/${o.id}/editar` });
    if (p2.estado === "Vencido") alertas.push({ nivel: "alta", titulo: `Pago 2 atrasado · ${t}`, detalle: p2.texto, href: `/ferrada/${o.id}` });
    if (!o.proveedorId) alertas.push({ nivel: "info", titulo: `Sin proveedor asignado · ${t}`, detalle: `Fruta por buscar en ${o.origenPais}.`, href: `/ferrada/${o.id}/editar` });
    if (o.ventaUsdCaja == null && o.compraUsdCaja != null) alertas.push({ nivel: "info", titulo: `Sin precio de venta · ${t}`, detalle: "La ganancia solo considera comisión y rebate.", href: `/ferrada/${o.id}/editar` });
  }

  // Certificados del proveedor y de la planta de cada operación activa
  const conOps = new Set(activas.flatMap((o) => [o.proveedorId, o.plantaId]).filter(Boolean));
  for (const pr of provs.filter((x) => conOps.has(x.id))) {
    const { lista } = resumenCertificados(pr.tipo, certs.filter((c) => c.proveedorId === pr.id));
    for (const x of lista) {
      if (x.estado === "Falta") alertas.push({ nivel: "media", titulo: `Falta certificado ${x.tipo} · ${pr.nombre}`, detalle: "Ferrada lo exige para la operación.", href: `/proveedores/${pr.id}` });
      if (x.estado === "Vencido") alertas.push({ nivel: "alta", titulo: `Certificado ${x.tipo} vencido · ${pr.nombre}`, detalle: `Venció el ${fechaLarga(x.cert!.vigenteHasta!)}. Pedir el nuevo.`, href: `/proveedores/${pr.id}` });
      if (x.estado === "Por vencer") alertas.push({ nivel: "media", titulo: `Certificado ${x.tipo} vence en ${x.dias} días · ${pr.nombre}`, detalle: `Vence el ${fechaLarga(x.cert!.vigenteHasta!)}. Pedir la renovación.`, href: `/proveedores/${pr.id}` });
    }
  }

  if (ops.length) {
    const { lunes, domingo } = semanaDe();
    const meta = p.meta_semanal_destino ?? 2;
    for (const d of dests.filter((x) => x.activo)) {
      const c = ops.filter((o) => o.destinoId === d.id && o.etd && o.etd >= lunes && o.etd <= domingo).reduce((a, o) => a + o.contenedores, 0);
      if (c < meta) alertas.push({ nivel: "info", titulo: `Meta semanal · ${d.puerto}: ${c} de ${meta} contenedores`, detalle: `Zarpes de esta semana hacia ${d.pais}.`, href: "/ferrada" });
    }
  }

  const orden = { alta: 0, media: 1, info: 2 };
  alertas.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
  const total = ops.reduce((a, o) => a + ganancia(o).total, 0);
  const porCobrar = ops.flatMap((o) => pagos(o, dias)).filter((x) => x.estado !== "Pagado").reduce((a, x) => a + (x.monto ?? 0), 0);

  return (
    <>
      <PageHeader etapa={fechaLarga(hoy())} titulo={`Hola, ${nombreDe(u).split(" ")[0]}`} subtitulo="Lo que necesita atención hoy." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Operaciones activas" valor={activas.length} detalle={`${activas.reduce((a, o) => a + o.contenedores, 0)} contenedores`} />
        <Stat label="Ganancia CFSCL" valor={usd(total)} detalle="Todas las operaciones" tono="ok" />
        <Stat label="Por cobrar a Ferrada" valor={usd(porCobrar)} detalle="Pagos pendientes" />
        <Stat label="Proveedores" valor={provs.filter((x) => x.activo).length} detalle="Activos" />
      </div>
      <Section titulo={`Alertas (${alertas.length})`} className="mt-5" sinPadding>
        <ul className="divide-y divide-ink-100">
          {alertas.map((a, i) => {
            const Icon = a.nivel === "alta" ? CircleAlert : a.nivel === "media" ? AlertTriangle : Info;
            return (
              <li key={i}>
                <Link href={a.href} className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50">
                  <Icon size={17} aria-hidden className={clsx("mt-0.5 shrink-0", a.nivel === "alta" ? "text-brand-500" : a.nivel === "media" ? "text-amber-600" : "text-sky-600")} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium">{a.titulo}</div>
                    <div className="text-[12.5px] text-ink-500">{a.detalle}</div>
                  </div>
                  <ArrowRight size={15} className="mt-1 text-ink-300" aria-hidden />
                </Link>
              </li>
            );
          })}
          {alertas.length === 0 && (
            <li className="px-4 py-8 text-center text-[13.5px] text-ink-500">
              {ops.length === 0 ? (
                <>Sin datos todavía. Empieza por <Link href="/proveedores/nuevo" className="text-leaf-700 underline">crear un proveedor</Link> y <Link href="/ferrada/nueva" className="text-leaf-700 underline">cargar la primera operación</Link>.</>
              ) : (
                "Todo al día."
              )}
            </li>
          )}
        </ul>
      </Section>
    </>
  );
}
