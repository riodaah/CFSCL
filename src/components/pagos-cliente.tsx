"use client";

import { useState } from "react";
import clsx from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { Badge, type Tono } from "@/components/ui";
import type { HitoPago, PagoCliente } from "@/lib/types";

const HITOS: HitoPago[] = ["Anticipo", "Contra documentos", "A la llegada", "Al contado"];
const TONO: Record<PagoCliente["estado"], Tono> = { Pagado: "verde", Pendiente: "gris", Vencido: "rojo", "Sin fecha": "gris" };
const fmt = (v: number) => "US$ " + Math.round(v).toLocaleString("es-CL");
const fecha = (iso?: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "—");

/** Formas de pago por orden: se agregan o quitan hitos. Mínimo 2, salvo al contado. */
export function PagosCliente({ inicial, total, hoy }: { inicial: PagoCliente[]; total: number; hoy: string }) {
  const [pagos, setPagos] = useState(inicial);
  const [error, setError] = useState("");
  const suma = pagos.reduce((a, p) => a + p.pct, 0);
  const alContado = pagos.length === 1 && pagos[0].hito === "Al contado";

  function cambiarPct(i: number, v: string) {
    const pct = Math.max(0, Math.min(100, Number(v) || 0));
    setPagos((ps) => ps.map((p, j) => (j === i ? { ...p, pct, montoUsd: (total * pct) / 100 } : p)));
  }
  function quitar(i: number) {
    if (pagos.length <= 2) {
      setError("Una orden necesita al menos 2 pagos (salvo al contado).");
      return;
    }
    setError("");
    setPagos((ps) => ps.filter((_, j) => j !== i));
  }
  function agregar() {
    const usado = new Set(pagos.map((p) => p.hito));
    const hito = HITOS.find((h) => !usado.has(h) && h !== "Al contado") ?? "Anticipo";
    setError("");
    setPagos((ps) => [...ps, { hito, pct: 0, montoUsd: 0, estado: "Sin fecha" }]);
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Hito</th>
              <th className="th text-right">%</th>
              <th className="th text-right">Monto</th>
              <th className="th">Vence</th>
              <th className="th">Estado</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {pagos.map((p, i) => {
              const atraso = p.estado === "Vencido" && p.vencimiento ? Math.round((Date.parse(hoy) - Date.parse(p.vencimiento)) / 86400000) : 0;
              return (
                <tr key={i} className={clsx("border-b border-ink-100", p.estado === "Vencido" && "bg-brand-50/60")}>
                  <td className="td">
                    <label htmlFor={`hito-${i}`} className="sr-only">Hito</label>
                    <select
                      id={`hito-${i}`}
                      value={p.hito}
                      onChange={(e) => setPagos((ps) => ps.map((x, j) => (j === i ? { ...x, hito: e.target.value as HitoPago } : x)))}
                      className="rounded-md border border-ink-200 bg-white px-1.5 py-1 text-[13px] font-medium"
                    >
                      {HITOS.map((h) => <option key={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="td text-right">
                    <label htmlFor={`pct-${i}`} className="sr-only">Porcentaje</label>
                    <input id={`pct-${i}`} value={p.pct} onChange={(e) => cambiarPct(i, e.target.value)} inputMode="numeric" className="w-14 rounded-md border border-ink-200 px-1.5 py-1 text-right text-[13px]" />
                  </td>
                  <td className="td text-right">{fmt(p.montoUsd)}</td>
                  <td className="td">{fecha(p.vencimiento)}</td>
                  <td className="td"><Badge tono={TONO[p.estado]}>{p.estado}{atraso ? ` · ${atraso} ${atraso === 1 ? "día" : "días"}` : ""}</Badge></td>
                  <td className="td text-right">
                    <button type="button" onClick={() => quitar(i)} className="text-ink-400 hover:text-brand-600" aria-label={`Quitar ${p.hito}`}><Trash2 size={15} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button type="button" className="btn-ghost" onClick={agregar} disabled={pagos.length >= 4}><Plus size={14} /> Agregar hito</button>
        <span className={clsx("text-[12.5px]", suma === 100 ? "text-ink-500" : "font-medium text-brand-600")}>
          Suma {suma}%{suma !== 100 && " · debe sumar 100%"}
        </span>
        {alContado && <span className="text-[12.5px] text-ink-500">Pago al contado</span>}
        {error && <span className="text-[12.5px] text-brand-600">{error}</span>}
      </div>
    </div>
  );
}
