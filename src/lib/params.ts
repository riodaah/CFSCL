// Parámetros de negocio editables desde Configuración.
// Los marcados como "porConfirmar" salen de la reunión pero requieren validación de Francisco.

export const HOY = "2027-03-12"; // Fecha simulada de la maqueta (plena cosecha)
export const TEMPORADA_ACTUAL = "2026-2027";

export const PARAMS = {
  kgPorBinEstandar: { valor: 380, unidad: "kg/bin", label: "Peso estándar por bin", nota: "Más o menos, según tamaño de fruta" },
  binsPorCamion: { valor: 72, unidad: "bins", label: "Bins por camión ideal", nota: "Menos bins encarece el kilo" },
  kgNetoCaja: { valor: 19.2, unidad: "kg", label: "Fruta neta por caja", nota: "20,5 a 21 kg con caja, bandeja y huincha" },
  anticipoPorBin: { valor: 5000, unidad: "CLP/bin", label: "Pago 1 · Anticipo a la firma", nota: "Por bin contratado" },
  cosechaPorBin: { valor: 31500, unidad: "CLP/bin", label: "Pago 2 · Cosecha", nota: "Por bin llegado a planta, semanal", porConfirmar: true },
  embaladoPorKg: { valor: 60, unidad: "CLP/kg", label: "Pago 3 · Kg embalado", nota: "Solo exportable, viernes", porConfirmar: true },
  liquidacionPorKg: { valor: 60, unidad: "CLP/kg", label: "Pago 4 · Liquidación", nota: "60 días después del embalado", porConfirmar: true },
  diasLiquidacion: { valor: 60, unidad: "días", label: "Plazo liquidación", nota: "Desde embalado o cosecha: por confirmar", porConfirmar: true },
  diasGratisFrio: { valor: 15, unidad: "días", label: "Días gratis en frío", nota: "Antes de proceso" },
  diasRetiroContenedor: { valor: 15, unidad: "días", label: "Plazo retiro producto terminado", nota: "Después cobra almacenaje" },
  diasPagoSetDocs: { valor: 3, unidad: "días", label: "Plazo pago contra set de documentos", nota: "Depende del cliente" },
  plazoRetornoBins: { valor: 120, unidad: "días", label: "Plazo retorno de bins", nota: "3 a 4 meses" },
  precioIndustrialKg: { valor: 90, unidad: "CLP/kg", label: "Precio venta industrial", nota: "Referencial, jugo y pulpa" },
  cajasPorContenedor: { valor: 1029, unidad: "cajas", label: "Cajas por contenedor", nota: "21 pallets" },
  diasSeguimiento: { valor: 7, unidad: "días", label: "Aviso de seguimiento a clientes", nota: "Sin contacto con un cliente activo" },
  comisionFerrada: { valor: 0.05, unidad: "USD/caja", label: "Comisión Ferrada", nota: "Por caja intermediada", porConfirmar: true },
} as const;

export const P = Object.fromEntries(Object.entries(PARAMS).map(([k, v]) => [k, v.valor])) as {
  [K in keyof typeof PARAMS]: number;
};
