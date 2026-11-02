import { Campo, FormAccion } from "@/components/form-accion";
import { ORIGENES, TIPOS_PROVEEDOR, type Proveedor } from "@/db/schema";
import type { Resultado } from "@/lib/form";

const v = (x: unknown) => (x == null ? "" : String(x));

export function FormProveedor({ action, p }: { action: (prev: Resultado, fd: FormData) => Promise<Resultado>; p?: Proveedor }) {
  return (
    <FormAccion action={action} fijo submit={p ? "Guardar cambios" : "Crear proveedor"}>
      <div className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        <Campo label="Nombre o razón social" className="sm:col-span-2">
          <input name="nombre" required defaultValue={v(p?.nombre)} className="input" />
        </Campo>
        <Campo label="Tipo" ayuda="Exportadora: vende y despacha. Planta: donde se embala.">
          <select name="tipo" required defaultValue={p?.tipo ?? "Exportadora"} className="input">
            {TIPOS_PROVEEDOR.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo label="País">
          <select name="pais" required defaultValue={p?.pais ?? "Perú"} className="input">
            {ORIGENES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo label="Ciudad"><input name="ciudad" defaultValue={v(p?.ciudad)} className="input" /></Campo>
        <Campo label="RUT / RUC"><input name="idTributario" defaultValue={v(p?.idTributario)} className="input font-mono" /></Campo>
        <Campo label="Estado">
          <select name="activo" defaultValue={p?.activo === false ? "0" : "1"} className="input">
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </Campo>
        <Campo label="Contacto"><input name="contacto" defaultValue={v(p?.contacto)} className="input" /></Campo>
        <Campo label="Cargo"><input name="cargo" defaultValue={v(p?.cargo)} className="input" /></Campo>
        <Campo label="Teléfono / WhatsApp"><input name="telefono" type="tel" defaultValue={v(p?.telefono)} className="input" /></Campo>
        <Campo label="Correo"><input name="email" type="email" defaultValue={v(p?.email)} className="input" /></Campo>
        <Campo label="Notas" className="sm:col-span-2">
          <textarea name="notas" rows={2} defaultValue={v(p?.notas)} className="input" />
        </Campo>
      </div>
    </FormAccion>
  );
}
