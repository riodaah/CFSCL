import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { Badge, PageHeader, Section, TableWrap } from "@/components/ui";
import { usuarioActual } from "@/lib/auth";
import { listaOperaciones, listaProveedores, todosLosCertificados } from "@/lib/datos";
import { hoy, TIPOS_CERTIFICADO } from "@/lib/ferrada";

export default async function Proveedores() {
  const [u, provs, ops, certs] = await Promise.all([usuarioActual(), listaProveedores(), listaOperaciones(), todosLosCertificados()]);
  const anio = Number(hoy().slice(0, 4));
  return (
    <>
      <PageHeader
        etapa="Ferrada"
        titulo="Proveedores"
        subtitulo="Exportadoras y productores a quienes CFSCL les compra fruta. Los certificados se piden una vez al año, antes del primer contenedor."
        acciones={u.rol !== "lectura" && <Link href="/proveedores/nuevo" className="btn-primary"><Plus size={15} /> Nuevo proveedor</Link>}
      />
      {provs.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Truck size={34} className="text-leaf-500" aria-hidden />
          <h2 className="mt-3 font-display text-[19px] font-bold">Todavía no hay proveedores</h2>
          <p className="mt-1 max-w-md text-[14px] text-ink-500">Crea el primero con sus datos de contacto y luego sube sus certificados del año.</p>
          {u.rol !== "lectura" && <Link href="/proveedores/nuevo" className="btn-primary mt-5"><Plus size={15} /> Nuevo proveedor</Link>}
        </div>
      ) : (
        <Section titulo={`${provs.length} proveedor${provs.length > 1 ? "es" : ""}`} sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr>
                <th className="th">Proveedor</th>
                <th className="th">País</th>
                <th className="th">Contacto</th>
                <th className="th text-right">Operaciones</th>
                <th className="th">Certificados {anio}</th>
              </tr>
            </thead>
            <tbody>
              {provs.map((p) => {
                const ok = certs.filter((c) => c.proveedorId === p.id && c.anio === anio && c.recibido).length;
                const total = TIPOS_CERTIFICADO.length;
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0">
                    <td className="td">
                      <Link href={`/proveedores/${p.id}`} className="font-medium text-leaf-700 hover:underline">{p.nombre}</Link>
                      {!p.activo && <Badge className="ml-2">Inactivo</Badge>}
                    </td>
                    <td className="td">{p.pais}{p.ciudad ? ` · ${p.ciudad}` : ""}</td>
                    <td className="td">{p.contacto ?? <span className="text-ink-400">—</span>}</td>
                    <td className="td text-right">{ops.filter((o) => o.proveedorId === p.id).length}</td>
                    <td className="td"><Badge tono={ok >= total ? "verde" : ok === 0 ? "rojo" : "ambar"}>{ok} de {total}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Section>
      )}
    </>
  );
}
