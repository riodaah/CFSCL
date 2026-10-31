import { timingSafeEqual } from "node:crypto";
import { listaDestinos, listaOperaciones, listaProveedores } from "@/lib/datos";
import { ganancia, pagos, setOficialBloqueado } from "@/lib/ferrada";

export const dynamic = "force-dynamic";

// API para el agente de correos (fase 2) y el servidor MCP.
// Autenticación: Authorization: Bearer <API_KEY>
function autorizado(req: Request) {
  const key = process.env.API_KEY;
  const h = req.headers.get("authorization") ?? "";
  if (!key || !h.startsWith("Bearer ")) return false;
  const a = Buffer.from(h.slice(7));
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!autorizado(req)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const [ops, provs, dests] = await Promise.all([listaOperaciones(), listaProveedores(), listaDestinos()]);
  const prov = new Map(provs.map((p) => [p.id, p.nombre]));
  const dest = new Map(dests.map((d) => [d.id, d]));
  return Response.json({
    operaciones: ops.map((o) => {
      const [p1, p2] = pagos(o);
      return {
        ...o,
        proveedor: o.proveedorId ? prov.get(o.proveedorId) : null,
        destino: dest.get(o.destinoId) ?? null,
        ganancia: ganancia(o),
        pago1: p1,
        pago2: p2,
        setOficialBloqueado: setOficialBloqueado(o),
      };
    }),
  });
}
