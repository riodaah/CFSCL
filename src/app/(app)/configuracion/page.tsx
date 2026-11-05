import { cambiarDestino, cambiarUsuario, crearDestino, crearUsuario, guardarParametros } from "@/app/acciones";
import { BotonAccion, Campo, FormAccion } from "@/components/form-accion";
import { Badge, PageHeader, Section } from "@/components/ui";
import { REGIONES, ROLES } from "@/db/schema";
import { DOMINIOS, usuarioActual } from "@/lib/auth";
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
        <Section titulo="Usuarios" descripcion={`Entran con su cuenta de Google. Cualquier cuenta ${DOMINIOS.map((d) => "@" + d).join(", ")} entra sola con rol operaciones; aquí se cambia el rol o se desactiva. Otros correos se autorizan abajo.`} sinPadding>
          <ul className="divide-y divide-ink-100">
            {usuarios.map((x) => (
              <li key={x.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-medium">{x.nombre ?? x.email}</div>
                    <div className="truncate text-[12.5px] text-ink-500">{x.email}</div>
                  </div>
                  <Badge tono={x.activo ? "verde" : "gris"}>{x.activo ? ROL[x.rol] : "Sin acceso"}</Badge>
                </div>
                {esAdmin && x.id !== u.id && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ROLES.filter((r) => r !== x.rol).map((r) => (
                      <BotonAccion key={r} accion={cambiarUsuario.bind(null, x.id, { rol: r })} className="btn-ghost min-h-[36px] px-2.5 py-1 text-[13px] lg:min-h-0 lg:text-[12.5px]">
                        Hacer {ROL[r].toLowerCase()}
                      </BotonAccion>
                    ))}
                    <BotonAccion accion={cambiarUsuario.bind(null, x.id, { activo: !x.activo })} className="btn-ghost min-h-[36px] px-2.5 py-1 text-[13px] lg:min-h-0 lg:text-[12.5px]">
                      {x.activo ? "Quitar acceso" : "Dar acceso"}
                    </BotonAccion>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {esAdmin && (
            <FormAccion action={crearUsuario} resetear className="border-t border-ink-100 p-4" submit="Autorizar usuario">
              <div className="grid gap-3 sm:grid-cols-3">
                <Campo label="Correo de Google"><input name="email" type="email" inputMode="email" autoCapitalize="none" required className="input" /></Campo>
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
          <ul className="divide-y divide-ink-100">
            {destinos.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-medium">{d.puerto}</div>
                  <div className="text-[12.5px] text-ink-500">{d.pais} · {d.region}</div>
                </div>
                {esAdmin ? (
                  <BotonAccion accion={cambiarDestino.bind(null, d.id, !d.activo)} className="btn-ghost min-h-[36px] px-2.5 py-1 text-[13px] lg:min-h-0 lg:text-[12.5px]">
                    {d.activo ? "Desactivar" : "Activar"}
                  </BotonAccion>
                ) : null}
                <Badge tono={d.activo ? "verde" : "gris"}>{d.activo ? "Activo" : "Inactivo"}</Badge>
              </li>
            ))}
          </ul>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
