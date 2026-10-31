// Lectura tolerante de FormData para las acciones del servidor.

export type Resultado = { ok?: boolean; error?: string; mensaje?: string } | undefined;

export class ErrorForm extends Error {}

export function txt(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function req(fd: FormData, k: string, etiqueta: string): string {
  const v = txt(fd, k);
  if (!v) throw new ErrorForm(`Falta ${etiqueta}.`);
  return v;
}

/** Acepta "1.029", "1029", "12,50", "12.50" */
export function num(fd: FormData, k: string): number | null {
  const v = txt(fd, k);
  if (v == null) return null;
  let s = v.replace(/\s|US\$|\$/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) throw new ErrorForm(`"${v}" no es un número válido.`);
  return n;
}

export function int(fd: FormData, k: string, etiqueta: string, min = 0): number {
  const n = num(fd, k);
  if (n == null || !Number.isInteger(n) || n < min) throw new ErrorForm(`${etiqueta} debe ser un número entero${min > 0 ? ` mayor o igual a ${min}` : ""}.`);
  return n;
}

export function fechaISO(fd: FormData, k: string): string | null {
  const v = txt(fd, k);
  if (v == null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ErrorForm(`Fecha inválida: ${v}`);
  return v;
}

export function uno<T extends readonly string[]>(fd: FormData, k: string, lista: T, etiqueta: string): T[number] {
  const v = txt(fd, k);
  if (!v || !lista.includes(v)) throw new ErrorForm(`Elige ${etiqueta}.`);
  return v as T[number];
}

export function mensajeDe(e: unknown): string {
  if (e instanceof ErrorForm) return e.message;
  if (e instanceof Error && /solo lectura|administrador/.test(e.message)) return e.message;
  console.error(e);
  return "No se pudo guardar. Revisa los datos e intenta de nuevo.";
}
