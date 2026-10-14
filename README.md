# Sistema de gestión CFSCL

Sistema para Central Frutícola Sur: control de productores, proceso en packing y exportación.
Esta versión es una **maqueta navegable con datos de ejemplo** para validar con el cliente. No tiene backend todavía.

## Módulos

| Ruta | Módulo | Etapa |
|---|---|---|
| `/` | Inicio: situación de la temporada | — |
| `/productores` y `/productores/[id]` | Contratos, recepciones, fletes, documentos, pagos, rendimiento e historial | 1 |
| `/proceso` | Clasificación exportable/industrial, calidad × calibre, producto terminado | 2 |
| `/exportado` y `/exportado/[id]` | Tablero de órdenes de compra, logística, documentos y cobros | 3 |
| `/pagos` | Pagos a productores (4 hitos) y cobros a clientes | — |
| `/alertas` | Cuadraturas, documentos faltantes, plazos y pagos vencidos | — |
| `/clientes` | Importadores y condiciones de pago | — |
| `/ingesta` | Bandeja de correos leídos por el agente (vista previa fase 2) | — |
| `/configuracion` | Parámetros de negocio y catálogos | — |

## Estructura

```
src/
  lib/
    types.ts    Modelo de dominio (espejo de las tablas en PostgreSQL)
    params.ts   Parámetros de negocio editables (precios por bin/kg, plazos, pesos)
    data.ts     DATOS DE EJEMPLO, se reemplaza por la API
    calc.ts     Lógica de negocio: cuadraturas, pagos, rendimiento, alertas
  components/   Shell, UI base, kanban, bandeja de correos, alertas
  app/          Pantallas (Next.js App Router)
```

`calc.ts` es la capa que en producción compartirán la interfaz, la API REST y el servidor MCP.
Para pasar a datos reales solo cambia `data.ts` por llamadas a la API.

## Arquitectura objetivo (GCP)

- Next.js en Cloud Run · PostgreSQL en Cloud SQL · archivos en Cloud Storage
- Fase 2: buzón de correos → agente (n8n) → API/MCP → staging → aprobación de Anita

## Desarrollo

```bash
npm install
npm run dev
```

Fecha simulada de los datos: 12 de marzo de 2027 (plena cosecha).
