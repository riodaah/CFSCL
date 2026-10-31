import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { crearProveedor } from "@/app/acciones";
import { PageHeader } from "@/components/ui";
import { editor } from "@/lib/auth";
import { FormProveedor } from "../form-proveedor";

export default async function NuevoProveedor() {
  await editor();
  return (
    <>
      <Link href="/proveedores" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Proveedores
      </Link>
      <PageHeader etapa="Ferrada" titulo="Nuevo proveedor" subtitulo="Exportadora o productor a quien CFSCL le compra fruta para Ferrada." />
      <FormProveedor action={crearProveedor} />
    </>
  );
}
