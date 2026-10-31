"use client";

import { useState } from "react";
import { Campo } from "./form-accion";

/** Contenedores, pallets y cajas: las cajas se sugieren solas hasta que el usuario las cambia. */
export function CamposCarga({
  contenedores,
  pallets,
  cajas,
  cajasPorPallet,
}: {
  contenedores: number;
  pallets: number;
  cajas: number | null;
  cajasPorPallet: number;
}) {
  const [c, setC] = useState(String(contenedores));
  const [p, setP] = useState(String(pallets));
  const [manual, setManual] = useState(cajas != null);
  const [k, setK] = useState(cajas != null ? String(cajas) : String(contenedores * pallets * cajasPorPallet));
  const sugerido = (Number(c) || 0) * (Number(p) || 0) * cajasPorPallet;
  const valor = manual ? k : String(sugerido);
  return (
    <>
      <Campo label="Contenedores">
        <input name="contenedores" type="number" min={1} required value={c} onChange={(e) => setC(e.target.value)} className="input" />
      </Campo>
      <Campo label="Pallets por contenedor" ayuda="20 o 21 según la fruta">
        <input name="palletsPorContenedor" type="number" min={1} required value={p} onChange={(e) => setP(e.target.value)} className="input" />
      </Campo>
      <Campo
        label="Cajas"
        ayuda={
          manual && Number(k) !== sugerido ? (
            <button type="button" className="text-leaf-700 underline" onClick={() => setManual(false)}>
              Usar sugerido: {sugerido.toLocaleString("es-CL")}
            </button>
          ) : (
            `${cajasPorPallet} cajas por pallet`
          )
        }
      >
        <input
          name="cajas"
          type="number"
          min={0}
          required
          value={valor}
          onChange={(e) => {
            setManual(true);
            setK(e.target.value);
          }}
          className="input"
        />
      </Campo>
    </>
  );
}
