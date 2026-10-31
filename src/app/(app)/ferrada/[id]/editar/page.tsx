import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { actualizarOperacion } from "@/app/acciones";
import { PageHeader } from "@/components/ui";
import { editor } from "@/lib/auth";
import { getOperacion, getParams, listaDestinos, listaProveedores } from "@/lib/datos";
import { FormOperacion } from "../../form-operacion";

export default async function EditarOperacion({ params }: { params: Promise<{ id: string }> }) {
  await editor();
  const id = Number((await params).id);
  const o = Number.isInteger(id) ? await getOperacion(id) : undefined;
  if (!o) notFound();
  const [proveedores, destinos, p] = await Promise.all([listaProveedores(), listaDestinos(), getParams()]);
  return (
    <>
      <Link href={`/ferrada/${o.id}`} className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> {o.codigo}
      </Link>
      <PageHeader etapa={`Ferrada · ${o.codigo}`} titulo="Editar operación" />
      <FormOperacion action={actualizarOperacion.bind(null, o.id)} o={o} proveedores={proveedores} destinos={destinos} params={p} />
    </>
  );
}
