import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { actualizarProveedor } from "@/app/acciones";
import { PageHeader } from "@/components/ui";
import { editor } from "@/lib/auth";
import { getProveedor } from "@/lib/datos";
import { FormProveedor } from "../../form-proveedor";

export default async function EditarProveedor({ params }: { params: Promise<{ id: string }> }) {
  await editor();
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await getProveedor(id) : undefined;
  if (!p) notFound();
  return (
    <>
      <Link href={`/proveedores/${p.id}`} className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> {p.nombre}
      </Link>
      <PageHeader etapa="Proveedor" titulo="Editar proveedor" />
      <FormProveedor action={actualizarProveedor.bind(null, p.id)} p={p} />
    </>
  );
}
