// Utilidades de fecha en UTC sobre strings "YYYY-MM-DD" (sin problemas de zona horaria).

export function toDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / 86400000);
}

/** Viernes de la semana (lunes a domingo) que contiene la fecha. */
export function viernesDeSemana(iso: string): string {
  const d = toDate(iso);
  const dow = d.getUTCDay(); // 0 dom … 5 vie
  const offset = dow === 0 ? -2 : 5 - dow;
  return addDays(iso, offset);
}
