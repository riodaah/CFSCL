import { cambiarDestino, cambiarUsuario, crearDestino, crearUsuario, guardarParametros } from "@/app/acciones";
import { BotonAccion, Campo, FormAccion } from "@/components/form-accion";
import { Badge, PageHeader, Section, TableWrap } from "@/components/ui";
import { REGIONES, ROLES } from "@/db/schema";
import { usuarioActual } from "@/lib/auth";
import { listaDestinos, listaParametros, listaUsuarios } from "@/lib/datos";

const ROL = { admin: "Administrador", operaciones: "Operaciones", lectura: "Solo lectura" } as const;
const fmt = (v: number) => String(v).replace(".", ",");

export default async function Configuracion() {
  const [u, usuarios, destinos, params] = await Promise.all([usuarioActual(), listaUsuarios(), listaDestinos(), listaParametros()]);
  const esAdmin = u.rol === "admin";
  return (
    <>
      <PageHeader etapa="Control" titulo="Configuración" subtitulo={esAdmin ? "Usuarios, destinos y parámetros de negocio." : "Solo un administrador puede cambiar esta sección."} />

      <div className="grid gap-5 xl:grid-cols-2">
        <Section titulo="Usuarios" descripcion="Entran con su cuenta de Google. Solo los correos de esta lista tienen acceso." sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr><th className="th">Usuario</th><th className="th">Rol</th><th className="th">Estado</th>{esAdmin && <th className="th" />}</tr>
            </thead>
            <tbody>
              {usuarios.map((x) => (
                <tr key={x.id} className="border-b border-ink-100 last:border-0">
                  <td className="td">
                    <div className="font-medium">{x.nombre ?? "—"}</div>
                    <div className="text-[12px] text-ink-500">{x.email}</div>
                  </td>
                  <td className="td">
                    {esAdmin && x.id !== u.id ? (
                      <span className="flex flex-wrap gap-1">
                        {ROLES.map((r) =>
                          r === x.rol ? <Badge key={r} tono="verde">{ROL[r]}</Badge> : (
                            <BotonAccion key={r} accion={cambiarUsuario.bind(null, x.id, { rol: r })} className="rounded-full px-2 py-0.5 text-[12px] text-ink-500 hover:bg-ink-100">{ROL[r]}</BotonAccion>
                          ),
                        )}
                      </span>
                    ) : (
                      ROL[x.rol]
                    )}
                  </td>
                  <td className="td"><Badge tono={x.activo ? "verde" : "gris"}>{x.activo ? "Activo" : "Sin acceso"}</Badge></td>
                  {esAdmin && (
                    <td className="td text-right">
                      {x.id !== u.id && (
                        <BotonAccion accion={cambiarUsuario.bind(null, x.id, { activo: !x.activo })} className="btn-ghost py-1 text-[12.5px]">
                          {x.activo ? "Quitar acceso" : "Dar acceso"}
                        </BotonAccion>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {esAdmin && (
            <FormAccion action={crearUsuario} resetear className="border-t border-ink-100 p-4" submit="Autorizar usuario">
              <div className="grid gap-3 sm:grid-cols-3">
                <Campo label="Correo de Google"><input name="email" type="email" required className="input" /></Campo>
                <Campo label="Nombre"><input name="nombre" className="input" /></Campo>
                <Campo label="Rol">
                  <select name="rol" defaultValue="operaciones" className="input">
                    {ROLES.map((r) => <option key={r} value={r}>{ROL[r]}</option>)}
                  </select>
                </Campo>
              </div>
            </FormAccion>
          )}
        </Section>

        <Section titulo="Destinos de Ferrada" descripcion="La meta semanal se mide por destino activo" sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr><th className="th">Puerto</th><th className="th">País</th><th className="th">Región</th><th className="th">Estado</th></tr>
            </thead>
            <tbody>
              {destinos.map((d) => (
                <tr key={d.id} className="border-b border-ink-100 last:border-0">
                  <td className="td font-medium">{d.puerto}</td>
                  <td className="td">{d.pais}</td>
                  <td className="td">{d.region}</td>
                  <td className="td">
                    {esAdmin ? (
                      <BotonAccion accion={cambiarDestino.bind(null, d.id, !d.activo)} className="btn-ghost py-0.5 text-[12.5px]">{d.activo ? "Activo · desactivar" : "Inactivo · activar"}</BotonAccion>
                    ) : (
                      <Badge tono={d.activo ? "verde" : "gris"}>{d.activo ? "Activo" : "Inactivo"}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {esAdmin && (
            <FormAccion action={crearDestino} resetear className="border-t border-ink-100 p-4" submit="Agregar destino">
              <div className="grid gap-3 sm:grid-cols-3">
                <Campo label="Puerto"><input name="puerto" required className="input" /></Campo>
                <Campo label="País"><input name="pais" required className="input" /></Campo>
                <Campo label="Región">
                  <select name="region" className="input">{REGIONES.map((r) => <option key={r}>{r}</option>)}</select>
                </Campo>
              </div>
            </FormAccion>
          )}
        </Section>
      </div>

      <Section titulo="Parámetros de negocio" descripcion="Valores sugeridos al crear operaciones y reglas de alertas" className="mt-5">
        <FormAccion action={guardarParametros} submit="Guardar parámetros">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {params.map((p) => (
              <Campo key={p.clave} label={`${p.etiqueta} (${p.unidad})`} ayuda={p.nota ?? undefined}>
                <input name={p.clave} defaultValue={fmt(p.valor)} inputMode="decimal" disabled={!esAdmin} className="input" />
              </Campo>
            ))}
          </div>
        </FormAccion>
      </Section>
    </>
  );
}
