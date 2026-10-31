import { CamposCarga } from "@/components/campos-carga";
import { Campo, FormAccion } from "@/components/form-accion";
import { ORIGENES, PASOS_FERRADA, type Destino, type OperacionFerrada, type Proveedor } from "@/db/schema";
import type { Resultado } from "@/lib/form";
import type { Params } from "@/lib/datos";
import { hoy } from "@/lib/ferrada";

type Accion = (prev: Resultado, fd: FormData) => Promise<Resultado>;

const PRODUCTOS = ["Manzana", "Pera", "Uva", "Cereza", "Ciruela", "Durazno", "Arándano", "Fruta congelada", "Vino", "Plátano"];

function Bloque({ titulo, children, descripcion }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-4 sm:p-5">
      <legend className="sr-only">{titulo}</legend>
      <h2 className="font-display text-[15.5px] font-bold text-ink-900">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-[12.5px] text-ink-500">{descripcion}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

const v = (x: unknown) => (x == null ? "" : String(x));

export function FormOperacion({
  action,
  o,
  proveedores,
  destinos,
  params,
  codigoSugerido,
}: {
  action: Accion;
  o?: OperacionFerrada;
  proveedores: Proveedor[];
  destinos: Destino[];
  params: Params;
  codigoSugerido?: string;
}) {
  const activos = destinos.filter((d) => d.activo || d.id === o?.destinoId);
  return (
    <FormAccion action={action} className="flex flex-col gap-5" submit={o ? "Guardar cambios" : "Crear operación"}>
      <Bloque titulo="Orden" descripcion="Lo que pide Ferrada en su orden de compra">
        <Campo label="Código" ayuda={o ? undefined : "Se asigna solo si lo dejas vacío"}>
          <input name="codigo" defaultValue={o?.codigo} placeholder={codigoSugerido} required={!!o} className="input font-mono" />
        </Campo>
        <Campo label="Fecha de la orden">
          <input name="fechaOrden" type="date" required defaultValue={o?.fechaOrden ?? hoy()} className="input" />
        </Campo>
        <Campo label="N° orden de Ferrada">
          <input name="ocFerrada" defaultValue={v(o?.ocFerrada)} className="input" />
        </Campo>
        <Campo label="Origen de la fruta">
          <select name="origenPais" required defaultValue={o?.origenPais ?? "Perú"} className="input">
            {ORIGENES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo label="Destino">
          <select name="destinoId" required defaultValue={v(o?.destinoId)} className="input">
            <option value="" disabled>Elegir…</option>
            {activos.map((d) => (
              <option key={d.id} value={d.id}>{d.puerto} · {d.pais} ({d.region})</option>
            ))}
          </select>
        </Campo>
        <Campo label="Paso actual">
          <select name="paso" required defaultValue={o?.paso ?? "Orden de Ferrada"} className="input">
            {PASOS_FERRADA.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo label="Producto">
          <input name="producto" required list="productos" defaultValue={v(o?.producto)} className="input" />
          <datalist id="productos">{PRODUCTOS.map((p) => <option key={p} value={p} />)}</datalist>
        </Campo>
        <Campo label="Variedad">
          <input name="variedad" defaultValue={v(o?.variedad)} placeholder="Ej.: Red Globe" className="input" />
        </Campo>
        <Campo label="Calibres">
          <input name="calibres" defaultValue={v(o?.calibres)} placeholder="Ej.: XL, XXL" className="input" />
        </Campo>
        <CamposCarga
          contenedores={o?.contenedores ?? 1}
          pallets={o?.palletsPorContenedor ?? params.pallets_por_contenedor ?? 21}
          cajas={o ? o.cajas : null}
          cajasPorPallet={params.cajas_por_pallet ?? 49}
        />
      </Bloque>

      <Bloque titulo="Proveedor y precios" descripcion="A quién le compra CFSCL y cuánto gana. Montos en dólares por caja.">
        <Campo label="Proveedor" ayuda="Si no está en la lista, créalo en Proveedores">
          <select name="proveedorId" defaultValue={v(o?.proveedorId)} className="input">
            <option value="">Por buscar</option>
            {proveedores.filter((p) => p.activo || p.id === o?.proveedorId).map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} · {p.pais}</option>
            ))}
          </select>
        </Campo>
        <Campo label="N° orden CFSCL al proveedor">
          <input name="ocProveedor" defaultValue={v(o?.ocProveedor)} className="input" />
        </Campo>
        <div className="hidden lg:block" />
        <Campo label="Compra (US$/caja)" ayuda="Lo que paga CFSCL al proveedor">
          <input name="compraUsdCaja" inputMode="decimal" defaultValue={v(o?.compraUsdCaja)} className="input" />
        </Campo>
        <Campo label="Venta (US$/caja)" ayuda="Lo que paga Ferrada. Vacío si solo hay comisión">
          <input name="ventaUsdCaja" inputMode="decimal" defaultValue={v(o?.ventaUsdCaja)} className="input" />
        </Campo>
        <Campo label="Comisión (US$/caja)">
          <input name="comisionUsdCaja" inputMode="decimal" required defaultValue={v(o?.comisionUsdCaja ?? params.comision_ferrada ?? 0.5)} className="input" />
        </Campo>
        <Campo label="Rebate naviera (US$/contenedor)" ayuda="Variable; 0 si no aplica">
          <input name="rebateUsdContenedor" inputMode="decimal" defaultValue={v(o?.rebateUsdContenedor ?? params.rebate_naviera ?? 0)} className="input" />
        </Campo>
      </Bloque>

      <Bloque titulo="Logística">
        <Campo label="Naviera"><input name="naviera" defaultValue={v(o?.naviera)} className="input" /></Campo>
        <Campo label="Booking"><input name="booking" defaultValue={v(o?.booking)} className="input font-mono" /></Campo>
        <Campo label="Barco"><input name="barco" defaultValue={v(o?.barco)} className="input" /></Campo>
        <Campo label="Zarpe (ETD)"><input name="etd" type="date" defaultValue={v(o?.etd)} className="input" /></Campo>
        <Campo label="Llegada (ETA)"><input name="eta" type="date" defaultValue={v(o?.eta)} className="input" /></Campo>
        <Campo label="N° de contenedores" ayuda="Separados por coma"><input name="numerosContenedor" defaultValue={v(o?.numerosContenedor)} className="input font-mono" /></Campo>
      </Bloque>

      <Bloque titulo="Documentos y pagos" descripcion="50% contra el draft · 50% entre 5 y 10 días después de la llegada. El set oficial solo sale con el pago 1.">
        <Campo label="Draft enviado"><input name="draftEnviado" type="date" defaultValue={v(o?.draftEnviado)} className="input" /></Campo>
        <Campo label="Pago 1 vence"><input name="pago1Vence" type="date" defaultValue={v(o?.pago1Vence)} className="input" /></Campo>
        <Campo label="Pago 1 recibido"><input name="pago1Pagado" type="date" defaultValue={v(o?.pago1Pagado)} className="input" /></Campo>
        <Campo label="Set oficial enviado"><input name="setOficialEnviado" type="date" defaultValue={v(o?.setOficialEnviado)} className="input" /></Campo>
        <Campo label="Pago 2 recibido"><input name="pago2Pagado" type="date" defaultValue={v(o?.pago2Pagado)} className="input" /></Campo>
        <Campo label="Notas" className="sm:col-span-2 lg:col-span-3">
          <textarea name="notas" rows={3} defaultValue={v(o?.notas)} className="input" />
        </Campo>
      </Bloque>
    </FormAccion>
  );
}
