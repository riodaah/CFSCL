import { PageHeader, Stat } from "@/components/ui";
import { AlertasLista } from "@/components/alertas-lista";
import { alertas } from "@/lib/calc";

export default function Alertas() {
  const al = alertas();
  const c = (s: string) => al.filter((a) => a.severidad === s).length;
  return (
    <>
      <PageHeader
        titulo="Alertas"
        subtitulo="El sistema revisa cuadraturas, documentos, plazos y pagos. Cada alerta lleva directo al registro que la generó."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Críticas" valor={c("Crítica")} detalle="Pagos vencidos y sets oficiales bloqueados" tono="alerta" />
        <Stat label="Altas" valor={c("Alta")} detalle="Descuadres recientes y documentos" />
        <Stat label="Medias" valor={c("Media")} />
        <Stat label="Informativas" valor={c("Info")} />
      </div>
      <AlertasLista alertas={al} />
      <p className="mt-3 text-[12.5px] text-ink-500">Por definir: quién recibe cada tipo de alerta y por qué canal (correo o WhatsApp).</p>
    </>
  );
}
