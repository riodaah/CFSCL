import { ArrowRight, Bot, Database, Mail, UserCheck } from "lucide-react";
import { PageHeader, Stat } from "@/components/ui";
import { Ingesta } from "@/components/ingesta";
import { correos } from "@/lib/data";

export default function BandejaIngesta() {
  const c = (e: string) => correos.filter((x) => x.estado === e).length;
  const pasos = [
    { icon: Mail, t: "Llega el correo", d: "Romana, reporte de proceso, factura de flete o documentos" },
    { icon: Bot, t: "El agente lo lee", d: "Extrae los datos sin importar el formato del packing" },
    { icon: Database, t: "El sistema valida", d: "Cuadra guía vs romana, productor, temporada y rangos" },
    { icon: UserCheck, t: "Anita aprueba lo dudoso", d: "Lo que cuadra entra solo; lo demás queda aquí" },
  ];
  return (
    <>
      <PageHeader
        etapa="Fase 2 · vista previa"
        titulo="Bandeja de correos"
        subtitulo="Así se verá la lectura automática de correos. En la fase 1 Anita carga estos datos a mano o sube el archivo."
      />

      <div className="card mb-5 p-4">
        <ol className="grid gap-3 md:grid-cols-4">
          {pasos.map((p, i) => (
            <li key={p.t} className="relative flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-leaf-50 text-leaf-600"><p.icon size={18} /></span>
              <div>
                <div className="text-[13.5px] font-semibold">{p.t}</div>
                <div className="text-[12.5px] text-ink-500">{p.d}</div>
              </div>
              {i < pasos.length - 1 && <ArrowRight size={14} className="absolute -right-2 top-3 hidden text-ink-300 md:block" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Confirmados automáticos" valor={c("Confirmado")} tono="ok" />
        <Stat label="Requieren revisión" valor={c("Revisión")} />
        <Stat label="Propuestas del agente" valor={c("Propuesta")} detalle="Nuevo productor o temporada" />
        <Stat label="No se pudo leer" valor={c("Error")} tono="alerta" />
      </div>

      <Ingesta correos={correos} />
    </>
  );
}
