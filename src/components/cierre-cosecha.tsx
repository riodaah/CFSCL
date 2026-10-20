"use client";

import { useState } from "react";
import { CloudHail, Lock } from "lucide-react";

const MOTIVOS = ["Cosecha completa", "Granizo o lluvia dañó la fruta", "El productor no enviará más fruta", "Otro"];

/** Cierra la cosecha de un productor: no llegarán más bins y la diferencia queda explicada. */
export function CierreCosecha({ cierre, contratados, recibidos }: { cierre?: { fecha: string; motivo: string }; contratados: number; recibidos: number }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS[1]);
  const [cerrado, setCerrado] = useState(cierre);

  if (cerrado) {
    return (
      <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
        <CloudHail size={18} className="mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <span className="font-semibold">Cosecha cerrada el {cerrado.fecha.slice(8, 10)}/{cerrado.fecha.slice(5, 7)}.</span> {cerrado.motivo}{" "}
          Llegaron {recibidos.toLocaleString("es-CL")} de {contratados.toLocaleString("es-CL")} bins contratados.
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4">
      {!abierto ? (
        <button type="button" className="btn-ghost" onClick={() => setAbierto(true)}>
          <Lock size={15} /> Cerrar cosecha
        </button>
      ) : (
        <form
          className="card flex flex-wrap items-end gap-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setCerrado({ fecha: "2027-03-12", motivo: `${motivo}. No llegarán más bins.` });
          }}
        >
          <div>
            <label htmlFor="motivo-cierre" className="label mb-1 block">Motivo del cierre</label>
            <select id="motivo-cierre" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[13.5px]">
              {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <p className="min-w-0 flex-1 basis-60 text-[12.5px] text-ink-500">Al cerrar, el sistema deja de esperar bins, calcula la liquidación del día y pide coordinar la devolución de los bins vacíos.</p>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={() => setAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Confirmar cierre</button>
          </div>
        </form>
      )}
    </div>
  );
}
