const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, PageOrientation,
  Header, Footer, PageNumber, NumberFormat, convertInchesToTwip
} = require("docx");
const fs = require("fs");

const NAVY = "1B2A4A";
const GREEN = "3F7D5C";
const LIGHT = "EFF3F1";
const GRAY = "5A5A5A";

const PAGE_W = 12240, PAGE_H = 15840; // US Letter

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { color: GREEN, space: 4, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 26 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, bold: true, color: GREEN, size: 22 })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    children: [new TextRun({ text, size: 21, color: "222222", ...opts })],
  });
}

function bullet(text, bold) {
  return new Paragraph({
    numbering: { reference: "main-bullets", level: 0 },
    spacing: { after: 80, line: 280 },
    children: bold
      ? [new TextRun({ text: bold, bold: true, size: 21 }), new TextRun({ text: text, size: 21 })]
      : [new TextRun({ text, size: 21 })],
  });
}

function cell(text, opts = {}) {
  const { width, bold = false, shade = null, color = "222222", align = AlignmentType.LEFT, size = 20 } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    verticalAlign: "center",
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, size, color })],
    })],
  });
}

// ---- Pricing table ----
const priceWidths = [4200, 2400, 3060];
const priceTable = new Table({
  width: { size: priceWidths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
  columnWidths: priceWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Concepto", { width: priceWidths[0], bold: true, shade: NAVY, color: "FFFFFF" }),
        cell("Tipo", { width: priceWidths[1], bold: true, shade: NAVY, color: "FFFFFF", align: AlignmentType.CENTER }),
        cell("Valor", { width: priceWidths[2], bold: true, shade: NAVY, color: "FFFFFF", align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        cell("Implementación Fase 1 (Módulo CRM + Módulo Inventario)", { width: priceWidths[0], shade: LIGHT }),
        cell("Pago único", { width: priceWidths[1], shade: LIGHT, align: AlignmentType.CENTER }),
        cell("USD 3.000", { width: priceWidths[2], shade: LIGHT, align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
    new TableRow({
      children: [
        cell("Hosting GCP (Cloud SQL + Cloud Run)", { width: priceWidths[0] }),
        cell("Mensual — a costo real", { width: priceWidths[1], align: AlignmentType.CENTER }),
        cell("≈ USD 20 – 35", { width: priceWidths[2], align: AlignmentType.RIGHT }),
      ],
    }),
    new TableRow({
      children: [
        cell("Soporte, mantenimiento y mejoras continuas", { width: priceWidths[0], shade: LIGHT }),
        cell("Mensual", { width: priceWidths[1], shade: LIGHT, align: AlignmentType.CENTER }),
        cell("[a definir]", { width: priceWidths[2], shade: LIGHT, align: AlignmentType.RIGHT, bold: true }),
      ],
    }),
  ],
});

// ---- Timeline table ----
const tlWidths = [1800, 2600, 5260];
function tlRow(week, title, desc, shade) {
  return new TableRow({
    children: [
      cell(week, { width: tlWidths[0], bold: true, shade: shade, align: AlignmentType.CENTER, color: shade ? NAVY : "222222" }),
      cell(title, { width: tlWidths[1], bold: true, shade: shade }),
      cell(desc, { width: tlWidths[2], shade: shade }),
    ],
  });
}
const timelineTable = new Table({
  width: { size: tlWidths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
  columnWidths: tlWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Semana", { width: tlWidths[0], bold: true, shade: NAVY, color: "FFFFFF", align: AlignmentType.CENTER }),
        cell("Etapa", { width: tlWidths[1], bold: true, shade: NAVY, color: "FFFFFF" }),
        cell("Actividades", { width: tlWidths[2], bold: true, shade: NAVY, color: "FFFFFF" }),
      ],
    }),
    tlRow("1", "Descubrimiento y modelo de datos", "Reunión de definición de campos y flujo de PO con el equipo comercial, mapeo de estados del embudo y de las categorías de inventario, diseño de la base de datos.", LIGHT),
    tlRow("2", "Construcción — Módulo CRM", "Fichas de cliente, programas de venta (frecuencia, período, disponibilidad), etapas y tarjetas del embudo, estados de negociación."),
    tlRow("3", "Construcción — Módulo Inventario", "Registro de operación con ID único, stock por variedad/calibre, disponible vs. comprometido, integración en vivo con el módulo de clientes.", LIGHT),
    tlRow("4", "Integración, pruebas y despliegue en GCP", "Pruebas conjuntas, ajustes finales, despliegue en Cloud SQL + Cloud Run, capacitación al equipo de CFSCL."),
  ],
});

// ---- Modules comparison mini-table (scope in / scope out) ----
const scopeWidths = [5330, 5330];
const scopeTable = new Table({
  width: { size: 10660, type: WidthType.DXA },
  columnWidths: scopeWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Incluido en Fase 1 (MVP)", { width: scopeWidths[0], bold: true, shade: GREEN, color: "FFFFFF" }),
        cell("Queda para fases futuras", { width: scopeWidths[1], bold: true, shade: GRAY, color: "FFFFFF" }),
      ],
    }),
    new TableRow({
      children: [
        cell("Módulo CRM: fichas de cliente, embudo con etapas y tarjetas, programas de venta con frecuencia/período, estados interés → reservado → confirmado", { width: scopeWidths[0], shade: LIGHT }),
        cell("Costeo y margen automático por operación/contenedor", { width: scopeWidths[1] }),
      ],
    }),
    new TableRow({
      children: [
        cell("Módulo Inventario: ID de operación único, stock por variedad/calibre, disponible vs. comprometido, integración en vivo con clientes", { width: scopeWidths[0], shade: LIGHT }),
        cell("Finanzas y flujo de caja (cuentas por cobrar/pagar)", { width: scopeWidths[1] }),
      ],
    }),
    new TableRow({
      children: [
        cell("Base de datos PostgreSQL en GCP, con arquitectura preparada para escalar a los módulos futuros", { width: scopeWidths[0], shade: LIGHT }),
        cell("Carpeta documental digital automática por contenedor", { width: scopeWidths[1] }),
      ],
    }),
    new TableRow({
      children: [
        cell("Capacitación al equipo y documentación de uso", { width: scopeWidths[0], shade: LIGHT }),
        cell("Dashboard gerencial y analítica de rentabilidad por productor / variedad / mercado", { width: scopeWidths[1] }),
      ],
    }),
  ],
});

const doc = new Document({
  numbering: {
    config: [{
      reference: "main-bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 420, hanging: 260 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { color: "CCCCCC", space: 4, style: BorderStyle.SINGLE, size: 4 } },
          children: [new TextRun({ text: "Digitalizándonos  ·  Propuesta CFSCL", size: 16, color: GRAY })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Digitalizandonos.cl  —  Página ", size: 16, color: GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY }),
          ],
        })],
      }),
    },
    children: [
      // Portada
      new Paragraph({ spacing: { before: 800, after: 100 }, children: [new TextRun({ text: "PROPUESTA COMERCIAL", size: 20, color: GREEN, bold: true })] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "Sistema de Gestión Comercial e Inventario para CFSCL", bold: true, size: 44, color: NAVY })],
      }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Fase 1 — MVP: Módulo CRM + Módulo de Inventario", size: 24, color: GREEN, italics: true })] }),
      new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "Preparado para CFSCL (Central Frutícola Sur SPA)  ·  Preparado por Digitalizándonos  ·  Septiembre 2026", size: 18, color: GRAY })] }),

      h1("1. Contexto"),
      body("Hoy CFSCL administra clientes, programas de venta y stock en planillas Excel. A medida que crece el volumen de operaciones — incluyendo programas de exportación de gran escala, como el actual programa de manzanas con foco en contenedores — ese método deja de ser sostenible: la información vive dispersa, no hay trazabilidad entre lo que se vende y lo que efectivamente hay disponible, y cada consulta (\"¿qué le queda comprometido a este cliente?\", \"¿cuánto stock libre tengo de esta variedad?\") depende de buscar manualmente entre archivos."),
      body("Esta propuesta plantea una Fase 1 enfocada y realista: un sistema con dos módulos que resuelven el cuello de botella más urgente — el control comercial y de stock — dejando la base técnica lista para escalar hacia un sistema de gestión más completo (costos, finanzas, documentación, dashboard gerencial) en fases posteriores, a medida que el negocio lo requiera."),

      h1("2. Alcance de la Fase 1 (MVP)"),
      body("El sistema se compone de dos módulos integrados entre sí, de modo que toda operación de venta impacta automáticamente el inventario disponible."),

      h2("Módulo 1 — CRM / Embudo comercial"),
      bullet("Ficha de cliente: país, contacto, condiciones comerciales, historial.", ""),
      bullet("Embudo de ventas con etapas y tarjetas (estilo kanban): interés / negociación → programa reservado → venta confirmada.", ""),
      bullet("Programas de venta con frecuencia y período (ej. \"3 contenedores por semana, febrero a julio\"), no solo cantidades fijas.", ""),
      bullet("Registro de variedad, calibre, mercado y condiciones solicitadas por cada cliente.", ""),

      h2("Módulo 2 — Inventario y disponibilidad de stock"),
      bullet("ID de operación único que conecta cada lote con su origen, cliente y estado.", ""),
      bullet("Stock por variedad y calibre, con estado disponible vs. comprometido en tiempo real.", ""),
      bullet("Integración directa con el módulo de clientes: al confirmar una venta, se descuenta automáticamente el disponible — evitando comprometer fruta que ya está vendida.", ""),
      bullet("Vista consolidada de disponibilidad para apoyar decisiones comerciales del día a día.", ""),

      new Paragraph({ spacing: { before: 200, after: 160 }, children: [new TextRun({ text: "Qué incluye esta fase y qué queda para más adelante:", bold: true, size: 21 })] }),
      scopeTable,

      h1("3. Arquitectura técnica"),
      body("El sistema se construye sobre una base de datos relacional PostgreSQL, alojada en Cloud SQL (Google Cloud Platform), y una aplicación web desplegada en Cloud Run. Esta combinación es la adecuada para este caso por tres razones concretas:"),
      bullet("PostgreSQL maneja con solidez las relaciones entre clientes, programas de venta y operaciones de inventario que este sistema necesita desde el día uno.", "Datos relacionales: "),
      bullet("Cloud Run cobra solo por uso real; con el volumen de operación esperado en esta fase, el costo de la aplicación se mantiene dentro o muy cerca del nivel gratuito de Google Cloud.", "Costo eficiente: "),
      bullet("Ambos servicios escalan sin necesidad de migrar de plataforma cuando se sumen los módulos de costos, finanzas o documentación en fases futuras.", "Escalable: "),

      h1("4. Cronograma estimado"),
      body("4 semanas de desarrollo desde el kickoff, sujeto a la disponibilidad del equipo de CFSCL para la reunión de descubrimiento inicial (incluyendo la definición pendiente de la estructura de la Orden de Compra)."),
      timelineTable,

      h1("5. Inversión"),
      priceTable,
      new Paragraph({ spacing: { before: 160, after: 100 }, children: [new TextRun({ text: "Notas:", bold: true, size: 20, color: GRAY })] }),
      bullet("El presupuesto de implementación (USD 3.000) fue el monto indicado por CFSCL para este proyecto.", ""),
      bullet("El hosting en GCP se factura por separado, a costo real de Google Cloud (estimado USD 20–35/mes según uso; puede partir dentro del nivel gratuito los primeros meses).", ""),
      bullet("El soporte mensual cubre mantenimiento, corrección de errores y mejoras menores, y es la base para evolucionar hacia las fases futuras del sistema.", ""),

      h1("6. Próximos pasos"),
      bullet("Confirmar alcance y presupuesto de esta propuesta con CFSCL.", "1. "),
      bullet("Agendar reunión de kickoff para cerrar el modelo de datos y la estructura de la Orden de Compra.", "2. "),
      bullet("Iniciar desarrollo según el cronograma de 4 semanas.", "3. "),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/tmp/cfscl_proposal/Propuesta_CFSCL_CRM_Inventario.docx", buf);
  console.log("done");
});
