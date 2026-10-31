import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { crearOperacion } from "@/app/acciones";
import { PageHeader } from "@/components/ui";
import { editor } from "@/lib/auth";
import { codigoSugerido, getParams, listaDestinos, listaProveedores } from "@/lib/datos";
import { hoy } from "@/lib/ferrada";
import { FormOperacion } from "../form-operacion";

export default async function NuevaOperacion() {
  await editor();
  const [proveedores, destinos, params, codigo] = await Promise.all([listaProveedores(), listaDestinos(), getParams(), codigoSugerido(hoy())]);
  return (
    <>
      <Link href="/ferrada" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Operaciones
      </Link>
      <PageHeader etapa="Ferrada" titulo="Nueva operación" subtitulo="Con la orden de compra de Ferrada a mano. Lo que no sepas todavía lo completas después." />
      <FormOperacion action={crearOperacion} proveedores={proveedores} destinos={destinos} params={params} codigoSugerido={codigo} />
    </>
  );
}
