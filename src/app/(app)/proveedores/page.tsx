import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { Badge, Fab, PageHeader, Section, TableWrap } from "@/components/ui";
import { usuarioActual } from "@/lib/auth";
import { listaOperaciones, listaProveedores, todosLosCertificados } from "@/lib/datos";
import { resumenCertificados } from "@/lib/ferrada";

export default async function Proveedores() {
  const [u, provs, ops, certs] = await Promise.all([usuarioActual(), listaProveedores(), listaOperaciones(), todosLosCertificados()]);
  const cert = (id: number, tipo: Parameters<typeof resumenCertificados>[0]) => resumenCertificados(tipo, certs.filter((c) => c.proveedorId === id));
  return (
    <>
      <PageHeader
        etapa="Ferrada"
        titulo="Proveedores"
        subtitulo="Exportadoras, productores y plantas de embalaje. Sus certificados se cargan una vez y sirven para todas las operaciones mientras estén vigentes."
        acciones={u.rol !== "lectura" && <Link href="/proveedores/nuevo" className="btn-primary hidden lg:inline-flex"><Plus size={15} /> Nuevo proveedor</Link>}
      />
      {u.rol !== "lectura" && provs.length > 0 && <Fab href="/proveedores/nuevo" label="Nuevo proveedor"><Plus size={20} /> Nuevo</Fab>}
      {provs.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Truck size={34} className="text-leaf-500" aria-hidden />
          <h2 className="mt-3 font-display text-[19px] font-bold">Todavía no hay proveedores</h2>
          <p className="mt-1 max-w-md text-[14px] text-ink-500">Crea el primero con sus datos de contacto y luego sube sus certificados del año.</p>
          {u.rol !== "lectura" && <Link href="/proveedores/nuevo" className="btn-primary mt-5"><Plus size={15} /> Nuevo proveedor</Link>}
        </div>
      ) : (
        <Section titulo={`${provs.length} proveedor${provs.length > 1 ? "es" : ""}`} sinPadding>
          <ul className="divide-y divide-ink-100 md:hidden">
            {provs.map((p) => {
              const { ok, total } = cert(p.id, p.tipo);
              return (
                <li key={p.id}>
                  <Link href={`/proveedores/${p.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-ink-50">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium text-ink-900">{p.nombre}{!p.activo && <span className="ml-2 text-[12px] text-ink-400">Inactivo</span>}</div>
                      <div className="truncate text-[13px] text-ink-500">{p.tipo} · {p.pais}{p.contacto ? ` · ${p.contacto}` : ""} · {ops.filter((o) => o.proveedorId === p.id || o.plantaId === p.id).length} oper.</div>
                    </div>
                    <Badge tono={ok >= total ? "verde" : ok === 0 ? "rojo" : "ambar"}>Cert. {ok}/{total}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Proveedor</th>
                <th className="th">Tipo y país</th>
                <th className="th">Contacto</th>
                <th className="th text-right">Operaciones</th>
                <th className="th">Certificados vigentes</th>
              </tr>
            </thead>
            <tbody>
              {provs.map((p) => {
                const { ok, total } = cert(p.id, p.tipo);
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0">
                    <td className="td">
                      <Link href={`/proveedores/${p.id}`} className="font-medium text-leaf-700 hover:underline">{p.nombre}</Link>
                      {!p.activo && <Badge className="ml-2">Inactivo</Badge>}
                    </td>
                    <td className="td">{p.tipo} · {p.pais}{p.ciudad ? ` · ${p.ciudad}` : ""}</td>
                    <td className="td">{p.contacto ?? <span className="text-ink-400">—</span>}</td>
                    <td className="td text-right">{ops.filter((o) => o.proveedorId === p.id || o.plantaId === p.id).length}</td>
                    <td className="td"><Badge tono={ok >= total ? "verde" : ok === 0 ? "rojo" : "ambar"}>{ok} de {total}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          </div>
        </Section>
      )}
    </>
  );
}
