import clsx from "clsx";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Severidad } from "@/lib/types";

export function PageHeader({
  titulo,
  subtitulo,
  etapa,
  acciones,
}: {
  titulo: string;
  subtitulo?: string;
  etapa?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {etapa && <div className="label mb-1 text-leaf-600">{etapa}</div>}
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-ink-900 [text-wrap:balance]">{titulo}</h1>
        {subtitulo && <p className="mt-1 max-w-3xl text-[14.5px] text-ink-500">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Stat({
  label,
  valor,
  detalle,
  icon: Icon,
  tono = "neutro",
}: {
  label: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  icon?: LucideIcon;
  tono?: "neutro" | "alerta" | "ok";
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {Icon && (
          <Icon
            size={16}
            aria-hidden
            className={clsx(tono === "alerta" ? "text-brand-500" : tono === "ok" ? "text-leaf-500" : "text-ink-400")}
          />
        )}
      </div>
      <div className="mt-2 font-display text-[26px] font-bold leading-none tabular-nums text-ink-900">{valor}</div>
      {detalle && <div className="mt-1.5 text-[13px] text-ink-500">{detalle}</div>}
    </div>
  );
}

const TONOS = {
  verde: "bg-leaf-50 text-leaf-700 ring-leaf-100",
  rojo: "bg-brand-50 text-brand-700 ring-brand-100",
  ambar: "bg-amber-50 text-amber-800 ring-amber-200",
  azul: "bg-sky-50 text-sky-800 ring-sky-200",
  gris: "bg-ink-100 text-ink-600 ring-ink-200",
} as const;
export type Tono = keyof typeof TONOS;

export function Badge({ tono = "gris", children, className }: { tono?: Tono; children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset", TONOS[tono], className)}>
      {children}
    </span>
  );
}

export function SeveridadBadge({ s }: { s: Severidad }) {
  const t: Record<Severidad, Tono> = { Crítica: "rojo", Alta: "ambar", Media: "azul", Info: "gris" };
  return <Badge tono={t[s]}>{s}</Badge>;
}

export function Dot({ tono }: { tono: "verde" | "amarillo" | "rojo" }) {
  return (
    <span
      className={clsx("inline-block h-2.5 w-2.5 rounded-full", tono === "verde" ? "bg-leaf-500" : tono === "amarillo" ? "bg-amber-400" : "bg-brand-500")}
      aria-label={tono}
    />
  );
}

export function Progress({ valor, tono = "verde", className }: { valor: number; tono?: "verde" | "rojo" | "ambar"; className?: string }) {
  const v = Math.max(0, Math.min(1, valor));
  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-ink-100", className)}>
      <div
        className={clsx("h-full rounded-full", tono === "verde" ? "bg-leaf-500" : tono === "rojo" ? "bg-brand-500" : "bg-amber-400")}
        style={{ width: `${v * 100}%` }}
      />
    </div>
  );
}

export function Section({
  titulo,
  descripcion,
  acciones,
  children,
  className,
  sinPadding,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sinPadding?: boolean;
}) {
  return (
    <section className={clsx("card min-w-0", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-display text-[15.5px] font-bold text-ink-900">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-[13px] text-ink-500">{descripcion}</p>}
        </div>
        {acciones}
      </div>
      <div className={clsx(!sinPadding && "p-4")}>{children}</div>
    </section>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function LinkMas({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13px] font-medium text-leaf-600 hover:text-leaf-700 hover:underline">
      {children}
    </Link>
  );
}

export function FuenteTag({ f }: { f?: string }) {
  if (!f) return null;
  const map: Record<string, { t: string; tono: Tono }> = {
    correo: { t: "Correo", tono: "azul" },
    manual: { t: "Manual", tono: "gris" },
    agente: { t: "Agente IA", tono: "verde" },
  };
  const m = map[f];
  return <Badge tono={m.tono}>{m.t}</Badge>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-ink-500">{children}</div>;
}

/** Barra horizontal apilada simple para distribuciones */
export function StackBar({ partes }: { partes: { label: string; valor: number; color: string }[] }) {
  const total = partes.reduce((a, p) => a + p.valor, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
        {partes.map((p) => (
          <div key={p.label} style={{ width: `${(p.valor / total) * 100}%`, backgroundColor: p.color }} title={`${p.label}: ${Math.round((p.valor / total) * 100)}%`} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {partes.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5 text-[12.5px] text-ink-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
            {p.label}
            <span className="tabular-nums text-ink-900">{Math.round((p.valor / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const COLOR_CALIDAD: Record<string, string> = {
  Premium: "#0c7438",
  "Extra Fancy": "#3f9a63",
  Fancy: "#86bf98",
  Choice: "#d9a441",
  Comercial: "#b9837a",
  Industrial: "#c80f0a",
};
