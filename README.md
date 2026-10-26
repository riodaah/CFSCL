# Sistema de gestión CFSCL

Sistema para Central Frutícola Sur en tres módulos: Productores, Proceso y Clientes.
Esta versión es una **maqueta navegable con datos de ejemplo** para validar con el cliente. No tiene backend todavía.

## Módulos

| Ruta | Módulo |
|---|---|
| `/` | Inicio: situación de la temporada |
| `/productores` | **Módulo 1.** Productores (tarjetas por estado de contrato y tabla) y exportadoras de caja terminada |
| `/productores/[id]` | Ficha del productor: recepciones, fletes, documentos, pagos, rendimiento, historial, cierre de cosecha y registro de gestión |
| `/productores/pagos` | Los cuatro pagos a productores |
| `/proceso` | **Módulo 2.** Clasificación exportable/industrial, calidad × calibre, producto terminado |
| `/clientes` | **Módulo 3.** Tablero de órdenes de compra en 3 columnas y fruta disponible |
| `/clientes/oc/[id]` | Orden de compra: disponibilidad, negociación, logística, pagos editables, draft vs set oficial |
| `/clientes/lista`, `/clientes/[id]` | Clientes con calificación, destinos y seguimiento |
| `/ferrada`, `/ferrada/[id]` | Ferrada (importador europeo): tablero por destino, meta semanal, comisión US$ 0,50/caja, margen, rebate, pagos 50/50, certificados del proveedor |
| `/alertas`, `/configuracion` | Alertas y parámetros de negocio |

## Estructura

```
src/
  lib/
    types.ts    Modelo de dominio (espejo de las tablas en PostgreSQL)
    params.ts   Parámetros de negocio editables (precios por bin/kg, plazos, pesos)
    data.ts     DATOS DE EJEMPLO de productores y proceso
    data-comercial.ts  DATOS DE EJEMPLO de clientes, exportadoras y Ferrada
    calc.ts     Lógica de negocio: cuadraturas, pagos, rendimiento, alertas
  components/   Shell, UI base, tablero de órdenes, registro de gestión, pagos, alertas
  app/          Pantallas (Next.js App Router)
```

`calc.ts` es la capa que en producción compartirán la interfaz, la API REST y el servidor MCP.
Para pasar a datos reales solo cambian `data.ts` y `data-comercial.ts` por llamadas a la API.

## Arquitectura objetivo (GCP)

- Next.js en Cloud Run · PostgreSQL en Cloud SQL · archivos en Cloud Storage
- Fase 2: agente de correos separado del sistema (n8n) → API/MCP → staging → aprobación de Anita

## Desarrollo

```bash
npm install
npm run dev
```

Fecha simulada de los datos: 12 de marzo de 2027 (plena cosecha).
