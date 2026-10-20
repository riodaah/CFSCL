import { Badge, PageHeader, Section, TableWrap } from "@/components/ui";
import { DOCS_SET_OFICIAL, TIPOS_DOC_PRODUCTOR, productores } from "@/lib/data";
import { n } from "@/lib/format";
import { PARAMS } from "@/lib/params";
import { CALIBRES } from "@/lib/types";

const CALIDADES_CFG = [
  { c: "Premium", color: "80 – 100%" },
  { c: "Extra Fancy", color: "60 – 79%" },
  { c: "Fancy", color: "40 – 59%" },
  { c: "Choice", color: "20 – 39%" },
  { c: "Comercial", color: "Menos de 20%" },
];

const USUARIOS = [
  { nombre: "Francisco Padilla", rol: "Gerencia", permisos: "Todo el sistema, aprueba pagos" },
  { nombre: "Anita", rol: "Operaciones y logística", permisos: "Carga de datos y documentos, aprueba lo que propone el agente de correos" },
];

const DOCS_EXPO = DOCS_SET_OFICIAL;

export default function Configuracion() {
  const variedades = [...new Set(productores.flatMap((p) => p.variedades))].sort();
  return (
    <>
      <PageHeader titulo="Configuración" subtitulo="Parámetros de negocio y catálogos. Cambian el cálculo de pagos, las cuadraturas y las alertas." />

      <Section titulo="Parámetros del negocio" descripcion="Los marcados como por confirmar salen de la reunión de levantamiento y hay que validarlos" sinPadding>
        <TableWrap>
          <thead className="border-b border-ink-100">
            <tr>
              <th className="th">Parámetro</th>
              <th className="th text-right">Valor</th>
              <th className="th">Unidad</th>
              <th className="th">Nota</th>
              <th className="th">Estado</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(PARAMS).map(([k, v]) => (
              <tr key={k} className="border-b border-ink-100 last:border-0">
                <td className="td font-medium">{v.label}</td>
                <td className="td text-right">
                  <label className="sr-only" htmlFor={`p-${k}`}>{v.label}</label>
                  <input id={`p-${k}`} defaultValue={n(v.valor)} className="w-24 rounded-md border border-ink-200 px-2 py-1 text-right text-[13px] tabular-nums" />
                </td>
                <td className="td text-ink-500">{v.unidad}</td>
                <td className="td whitespace-normal text-[13px] text-ink-500">{v.nota}</td>
                <td className="td">{"porConfirmar" in v && v.porConfirmar ? <Badge tono="ambar">Por confirmar</Badge> : <Badge tono="verde">Validado</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section titulo="Calidades de exportación" descripcion="Umbrales de cobertura de color a definir por Francisco" sinPadding>
          <TableWrap>
            <thead className="border-b border-ink-100">
              <tr><th className="th">Calidad</th><th className="th">Cobertura de color</th><th className="th" /></tr>
            </thead>
            <tbody>
              {CALIDADES_CFG.map((c) => (
                <tr key={c.c} className="border-b border-ink-100 last:border-0">
                  <td className="td font-medium">{c.c}</td>
                  <td className="td">{c.color}</td>
                  <td className="td">{c.c === "Premium" || c.c === "Extra Fancy" ? <Badge tono="verde">Mencionado</Badge> : <Badge tono="ambar">A definir</Badge>}</td>
                </tr>
              ))}
              <tr><td className="td font-medium text-brand-700">Industrial</td><td className="td text-ink-500" colSpan={2}>Fallas grandes o pudrición. No se paga al productor.</td></tr>
            </tbody>
          </TableWrap>
        </Section>

        <Section titulo="Catálogos">
          <div className="space-y-4">
            <div>
              <div className="label mb-1.5">Especies</div>
              <div className="mb-3 flex flex-wrap gap-1.5"><Badge tono="verde">Manzana</Badge><Badge tono="verde">Arándano</Badge></div>
              <div className="label mb-1.5">Variedades</div>
              <div className="flex flex-wrap gap-1.5">{variedades.map((v) => <Badge key={v} tono="verde">{v}</Badge>)}</div>
            </div>
            <div>
              <div className="label mb-1.5">Calibres</div>
              <div className="flex flex-wrap gap-1.5">{CALIBRES.map((c) => <Badge key={c}>{c}</Badge>)}</div>
            </div>
            <div>
              <div className="label mb-1.5">Documentos exigidos al productor</div>
              <div className="flex flex-wrap gap-1.5">{TIPOS_DOC_PRODUCTOR.map((d) => <Badge key={d}>{d}</Badge>)}</div>
            </div>
            <div>
              <div className="label mb-1.5">Set de documentos de exportación (draft primero, oficial después del pago)</div>
              <div className="flex flex-wrap gap-1.5">{DOCS_EXPO.map((d) => <Badge key={d}>{d}</Badge>)}</div>
            </div>
          </div>
        </Section>

        <Section titulo="Usuarios y permisos" sinPadding>
          <ul className="divide-y divide-ink-100">
            {USUARIOS.map((u) => (
              <li key={u.nombre} className="px-4 py-3">
                <div className="flex items-center gap-2"><span className="text-[14px] font-medium">{u.nombre}</span><Badge tono="gris">{u.rol}</Badge></div>
                <div className="text-[12.5px] text-ink-500">{u.permisos}</div>
              </li>
            ))}
          </ul>
        </Section>

        <Section titulo="Acceso e integraciones">
          <ul className="space-y-3 text-[13.5px]">
            <li className="flex items-start justify-between gap-3"><div><div className="font-medium">Ingreso con Google Workspace</div><div className="text-[12.5px] text-ink-500">Francisco y Anita entran con sus cuentas de la empresa. Funciona en computador, iPad y celular.</div></div><Badge tono="verde">Fase 1</Badge></li>
            <li className="flex items-start justify-between gap-3"><div><div className="font-medium">Agente de correos</div><div className="text-[12.5px] text-ink-500">Separado del sistema: lee romana, reportes del packing, naviera y facturas, y carga los datos por la API. Deja su nota en el registro de gestión.</div></div><Badge tono="gris">Fase 2</Badge></li>
            <li className="flex items-start justify-between gap-3"><div><div className="font-medium">API para agentes</div><div className="text-[12.5px] text-ink-500">Registrar recepciones, procesos, fletes y documentos</div></div><Badge tono="gris">Fase 2</Badge></li>
            <li className="flex items-start justify-between gap-3"><div><div className="font-medium">Servidor MCP</div><div className="text-[12.5px] text-ink-500">Consultar el sistema desde un asistente de IA</div></div><Badge tono="gris">Fase 2</Badge></li>
            <li className="flex items-start justify-between gap-3"><div><div className="font-medium">Notificaciones</div><div className="text-[12.5px] text-ink-500">Alertas por correo o WhatsApp</div></div><Badge tono="gris">Por definir</Badge></li>
          </ul>
        </Section>
      </div>
    </>
  );
}
