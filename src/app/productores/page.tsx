import Link from "next/link";
import clsx from "clsx";
import { CalendarClock, Container, Mail, MessageCircle, Phone, Plus, Upload } from "lucide-react";
import { Badge, PageHeader, Progress, Section, Stat, TableWrap } from "@/components/ui";
import { resumenTemporada, type ResumenProductor } from "@/lib/calc";
import { comprasCajaTerminada, exportadores, operacionesFerrada, ordenes, productores, productoresInactivos, productoresPendientes, TEMPORADA_SIGUIENTE } from "@/lib/data";
import { clpM, fecha, n, pct, usd } from "@/lib/format";
import { TEMPORADA_ACTUAL } from "@/lib/params";

export const dynamic = "force-dynamic";

const VISTAS = [
  { id: "tarjetas", label: "Productores · tarjetas" },
  { id: "tabla", label: "Productores · tabla" },
  { id: "exportadoras", label: "Exportadoras (caja terminada)" },
];

export default async function Productores({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista = "tarjetas" } = await searchParams;
  const t = resumenTemporada();
  const saldoBins = t.porProductor.reduce((a, r) => a + r.saldoBins, 0);
  const docsPend = t.porProductor.reduce((a, r) => a + r.docsFaltantes.length, 0);
  const porFirmar = productoresPendientes.filter((p) => p.estado === "Por firmar").length;

  return (
    <>
      <PageHeader
        etapa="Módulo 1"
        titulo="Productores y exportadoras"
        subtitulo="De dónde viene la fruta: productores que entregan bins al packing, y exportadoras que venden caja terminada cuando la producción propia no alcanza."
        acciones={
          <>
            <button className="btn-ghost" type="button"><Upload size={15} /> Cargar archivo de romana</button>
            <button className="btn-primary" type="button"><Plus size={15} /> Nuevo productor</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Contratos firmados" valor={productores.length} detalle={`${n(t.binsContratados)} bins · temporada ${TEMPORADA_ACTUAL}`} />
        <Stat label="Por firmar o visitar" valor={productoresPendientes.length} detalle={`${porFirmar} por firmar · temporada ${TEMPORADA_SIGUIENTE}`} />
        <Stat label="Bins prestados en campo" valor={n(saldoBins)} detalle="Enviados por el packing y aún no devueltos" />
        <Stat label="Documentos pendientes" valor={docsPend} detalle="Entre todos los productores" tono={docsPend ? "alerta" : "ok"} />
      </div>

      <div className="mt-5 overflow-x-auto border-b border-ink-200">
        <nav className="flex min-w-max gap-1">
          {VISTAS.map((v) => (
            <Link
              key={v.id}
              href={`/productores?vista=${v.id}`}
              scroll={false}
              className={clsx("border-b-2 px-3 py-2 text-[14px]", vista === v.id ? "border-leaf-500 font-semibold text-ink-900" : "border-transparent text-ink-500 hover:text-ink-900")}
            >
              {v.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-5">
        {vista === "tarjetas" && <Tarjetas porProductor={t.porProductor} />}
        {vista === "tabla" && <Tabla porProductor={t.porProductor} />}
        {vista === "exportadoras" && <Exportadoras />}
      </div>
    </>
  );
}

function TarjetaProductor({ r }: { r: ResumenProductor }) {
  const p = productores.find((x) => x.id === r.temporada.productorId)!;
  return (
    <Link href={`/productores/${p.id}`} className="card block p-3.5 transition hover:border-leaf-500">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11.5px] text-ink-500">SAG {p.codigoSag}</span>
        <span className="ml-auto text-[12px] text-ink-400">{p.comuna}</span>
      </div>
      <div className="mt-1 text-[14.5px] font-semibold leading-snug">{p.nombre}</div>
      <div className="text-[12px] text-ink-500">{p.variedades.join(", ")}</div>
      <div className="mt-2.5 flex items-center gap-2">
        <Progress valor={r.avance} tono={r.temporada.cierre && r.avance < 0.9 ? "ambar" : "verde"} />
        <span className="shrink-0 text-[12px] tabular-nums text-ink-600">{n(r.binsRecibidos)}/{n(r.temporada.binsContratados)}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 text-[12px]">
        <span className="text-ink-500">Exportable</span>
        <span className="text-right font-medium tabular-nums">{r.kgEntradaProc ? pct(r.pctExportable) : "—"}</span>
        <span className="text-ink-500">Pagado</span>
        <span className="text-right font-medium tabular-nums">{clpM(r.pagado)}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {r.temporada.cierre && r.avance < 0.9 && <Badge tono="ambar">Cerrada: granizo</Badge>}
        {r.descuadres.length > 0 && <Badge tono="ambar">{r.binsFaltantes} bins faltantes</Badge>}
        {r.docsFaltantes.length > 0 && <Badge tono="rojo">Faltan docs</Badge>}
        {r.temporada.cierre && r.saldoBins > 0 && <Badge tono="azul">{n(r.saldoBins)} bins por devolver</Badge>}
        {!r.descuadres.length && !r.docsFaltantes.length && !r.temporada.cierre && <Badge tono="verde">Al día</Badge>}
      </div>
    </Link>
  );
}

function Tarjetas({ porProductor }: { porProductor: ResumenProductor[] }) {
  const enCosecha = porProductor.filter((r) => !r.temporada.cierre);
  const terminados = porProductor.filter((r) => r.temporada.cierre);
  const cols = [
    { titulo: "Por visitar", sub: `Temporada ${TEMPORADA_SIGUIENTE}`, pend: productoresPendientes.filter((p) => p.estado === "Por visitar") },
    { titulo: "Por firmar", sub: `Temporada ${TEMPORADA_SIGUIENTE}`, pend: productoresPendientes.filter((p) => p.estado === "Por firmar") },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cols.map((c) => (
        <Columna key={c.titulo} titulo={c.titulo} sub={c.sub} total={c.pend.length}>
          {c.pend.map((p) => (
            <article key={p.id} className="card p-3.5">
              <div className="flex items-center gap-2 text-[12px] text-ink-500">
                <CalendarClock size={13} aria-hidden /> {p.estado === "Por visitar" ? "Visita" : "Visitado"} {fecha(p.fecha)}
                <span className="ml-auto">{p.comuna}</span>
              </div>
              <div className="mt-1 text-[14.5px] font-semibold leading-snug">{p.nombre}</div>
              <div className="text-[12px] text-ink-500">{p.variedades.join(", ")} · ~{n(p.binsEstimados)} bins</div>
              <p className="mt-2 text-[12.5px] leading-snug text-ink-700">{p.nota}</p>
              <div className="mt-2 flex items-center gap-1.5 border-t border-ink-100 pt-2 text-[12px] text-ink-600">
                <Phone size={12} aria-hidden /> {p.contacto} · <span className="select-all">{p.telefono}</span>
              </div>
            </article>
          ))}
        </Columna>
      ))}
      <Columna titulo="Contrato firmado" sub={`En cosecha ${TEMPORADA_ACTUAL}`} total={enCosecha.length} destacada>
        {enCosecha.map((r) => <TarjetaProductor key={r.temporada.id} r={r} />)}
      </Columna>
      <Columna titulo="Cosecha terminada" sub="Completa o cerrada antes" total={terminados.length}>
        {terminados.map((r) => <TarjetaProductor key={r.temporada.id} r={r} />)}
      </Columna>
    </div>
  );
}

function Columna({ titulo, sub, total, destacada, children }: { titulo: string; sub: string; total: number; destacada?: boolean; children: React.ReactNode }) {
  return (
    <div className={clsx("flex min-w-0 flex-col rounded-xl p-2.5", destacada ? "bg-leaf-50" : "bg-ink-100/70")}>
      <div className="flex items-start justify-between px-1.5 pb-2.5 pt-1">
        <div>
          <div className="text-[14px] font-semibold text-ink-800">{titulo}</div>
          <div className="text-[12px] text-ink-500">{sub}</div>
        </div>
        <span className="rounded-full bg-white px-2 text-[12px] tabular-nums text-ink-500">{total}</span>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Tabla({ porProductor }: { porProductor: ResumenProductor[] }) {
  return (
    <>
      <Section titulo={`Contratos temporada ${TEMPORADA_ACTUAL}`} sinPadding>
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
              <th className="th">Estado</th>
            </tr>
          </thead>
          <tbody>
            {porProductor.map((r) => {
              const p = productores.find((x) => x.id === r.temporada.productorId)!;
              return (
                <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="td">
                    <Link href={`/productores/${p.id}`} className="font-medium text-ink-900 hover:text-leaf-600">{p.nombre}</Link>
                    <div className="text-[12px] text-ink-500">{p.comuna}, {p.region} · SAG {p.codigoSag}</div>
                  </td>
                  <td className="td text-ink-600">{p.variedades.join(", ")}</td>
                  <td className="td text-ink-600">{fecha(r.temporada.fechaContrato)}</td>
                  <td className="td text-right">{n(r.temporada.binsContratados)}</td>
                  <td className="td text-right">{n(r.binsRecibidos)}</td>
                  <td className="td"><div className="flex items-center gap-2"><Progress valor={r.avance} className="w-20" /><span className="w-9 text-right text-[12px] text-ink-500">{pct(r.avance)}</span></div></td>
                  <td className="td text-right">{n(r.kgPorBin)}</td>
                  <td className="td text-right">{r.kgEntradaProc ? pct(r.pctExportable) : "—"}</td>
                  <td className="td text-right">{clpM(r.pagado)}</td>
                  <td className="td"><Badge tono={r.temporada.cierre ? "gris" : "azul"}>{r.temporada.estado}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Section>

      <Section titulo="Productores de temporadas anteriores" descripcion="No recontratados. El historial queda para decidir futuras contrataciones." className="mt-5" sinPadding>
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

function Exportadoras() {
  return (
    <>
      <p className="mb-4 max-w-3xl text-[14px] text-ink-600">
        Cuando las órdenes de compra superan lo que produce el packing, se compra un contenedor completo de caja terminada (21 pallets, 1.029 cajas) a otra exportadora. No quedan sobrantes. Lo que importa: cuánto costó, qué calidades trae, a cuánto se vendió y con quién se habla.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {exportadores.map((e) => {
          const compras = comprasCajaTerminada.filter((c) => c.exportadorId === e.id);
          return (
            <section key={e.id} className="card min-w-0">
              <div className="flex flex-wrap items-start gap-3 border-b border-ink-100 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[16px] font-bold">{e.nombre}</h2>
                  <div className="text-[12.5px] text-ink-500">{e.ciudad}, {e.pais} · {e.rut} · {e.productos.join(", ")}</div>
                </div>
                <Badge tono="verde">Caja terminada</Badge>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1.2fr]">
                <div className="text-[13.5px]">
                  <div className="label mb-1.5">Contacto directo</div>
                  <div className="font-semibold">{e.contacto}</div>
                  <div className="text-[12.5px] text-ink-500">{e.cargo}</div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-ink-700"><MessageCircle size={13} aria-hidden /> <span className="select-all">{e.telefono}</span></div>
                  <div className="mt-1 flex items-center gap-1.5 text-ink-700"><Mail size={13} aria-hidden /> <span className="select-all break-all">{e.email}</span></div>
                  {e.nota && <p className="mt-2 rounded-lg bg-ink-50 px-2.5 py-1.5 text-[12.5px] text-ink-700">{e.nota}</p>}
                </div>
                <div className="min-w-0">
                  <div className="label mb-1.5">Compras esta temporada</div>
                  {compras.length === 0 && <p className="text-[13px] text-ink-500">Sin compras para clientes directos.</p>}
                  {operacionesFerrada.some((o) => o.proveedorId === e.id) && (
                    <Link href="/ferrada" className="mb-2 block rounded-lg bg-sky-50 px-3 py-2 text-[12.5px] text-sky-800 hover:underline">
                      {operacionesFerrada.filter((o) => o.proveedorId === e.id).length} operaciones para Ferrada
                    </Link>
                  )}
                  <ul className="space-y-2">
                    {compras.map((c) => {
                      const oc = ordenes.find((o) => o.id === c.ocId);
                      const venta = oc ? oc.lineas.filter((l) => typeof l.origen !== "string" && l.origen.compraId === c.id).reduce((a, l) => a + l.cajas * l.precioUsdCaja, 0) : 0;
                      const costo = c.cajas * c.costoUsdCaja;
                      return (
                        <li key={c.id} className="rounded-lg border border-ink-200 px-3 py-2 text-[12.5px]">
                          <div className="flex items-center gap-1.5 font-medium text-ink-800"><Container size={13} aria-hidden /> {c.contenedores} cont. · {n(c.cajas)} cajas · {fecha(c.fecha)}</div>
                          <div className="text-ink-500">{c.detalle}</div>
                          <div className="mt-1 grid grid-cols-3 gap-2 tabular-nums">
                            <span>Costo <b className="font-medium text-ink-900">{usd(costo)}</b></span>
                            <span>Venta <b className="font-medium text-ink-900">{venta ? usd(venta) : "—"}</b></span>
                            <span>Margen <b className="font-medium text-leaf-700">{venta ? usd(venta - costo) : "—"}</b></span>
                          </div>
                          {oc && <Link href={`/clientes/oc/${oc.id}`} className="mt-1 inline-block font-mono text-[11.5px] text-leaf-600 hover:underline">{oc.id}</Link>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
