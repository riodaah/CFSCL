import { toDate } from "./dates";

const nf0 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const n = (v: number) => nf0.format(v);
export const n1 = (v: number) => nf1.format(v);
export const clp = (v: number) => "$" + nf0.format(v);
export const usd = (v: number) => "US$ " + nf0.format(v);
export const pct = (v: number, d = 0) => (d ? nf1.format(v * 100) : nf0.format(v * 100)) + "%";
export const kg = (v: number) => nf0.format(v) + " kg";

/** Montos grandes en CLP de forma compacta: $12,4 M */
export const clpM = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return "$" + nf1.format(v / 1_000_000) + " M";
  return clp(v);
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const fecha = (iso?: string) => {
  if (!iso) return "—";
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
};
export const fechaLarga = (iso?: string) => {
  if (!iso) return "—";
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const fechaHora = (isoDT: string) => `${fecha(isoDT.slice(0, 10))} · ${isoDT.slice(11, 16)}`;
