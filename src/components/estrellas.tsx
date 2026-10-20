import { Star } from "lucide-react";

export function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Calificación ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} aria-hidden className={i <= valor ? "fill-amber-400 text-amber-400" : "text-ink-300"} />
      ))}
    </span>
  );
}
