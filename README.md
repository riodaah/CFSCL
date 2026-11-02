# CFSCL · Sistema de gestión

Sistema de Central Frutícola Sur. Piloto: **operaciones de Ferrada** (proveedores, operaciones, documentos, pagos 50/50, certificados anuales, bitácora). Productores, proceso y clientes directos vienen después sobre la misma base.

- Rama `main`: maqueta navegable con datos de ejemplo (cfscl.vercel.app).
- Rama `app`: **esta aplicación real**, con base de datos y login.

## Arquitectura

| Pieza | Servicio | Costo inicial |
|---|---|---|
| App (pantallas + API) | Next.js 15 en **Cloud Run**, `us-east4` (Virginia), 0 instancias mínimas, dominio `sistema.cfscl.cl` | Capa gratuita |
| Base de datos | **Neon Postgres 17**, proyecto `cfscl` (`quiet-salad-63906823`), aws-us-east-1 (Virginia) | Capa gratuita |
| Documentos | **Cloud Storage**, bucket privado con versionado | Centavos |
| Secretos | Secret Manager | Capa gratuita |
| Login | Google (next-auth). Solo entran los correos autorizados en Configuración | Gratis |

```
src/
  db/schema.ts        tablas (Drizzle). Cambios → npm run db:generate → npm run db:migrate
  lib/ferrada.ts      reglas de negocio puras (ganancia, pagos, set oficial bloqueado)
  lib/datos.ts        consultas
  app/acciones.ts     todas las escrituras (server actions, con permisos y bitácora)
  app/(app)/...       pantallas
  app/api/v1/...      API para el agente de correos y el MCP (Bearer API_KEY)
drizzle/              migraciones SQL + seed.sql (datos base)
deploy/gcp.sh         despliegue en Google Cloud
```

Roles: **admin** (todo, incluye usuarios y parámetros), **operaciones** (carga y edita), **solo lectura**.

## Desarrollo local

```bash
cp .env.example .env.local     # completar DATABASE_URL; AUTH_DEV_BYPASS=1 entra sin Google
npm install
npm run db:migrate && npm run db:seed   # solo en una base nueva
npm run dev
```

Para no tocar producción, crea una rama `dev` en Neon y usa su cadena de conexión.

## Despliegue en Google Cloud (desde Cloud Shell)

La base en Neon **ya está creada, migrada y con los datos base** (usuarios admin, parámetros y 4 destinos).

### 1. Cadena de conexión de Neon

Neon → proyecto **cfscl** → **Connect** → rama `main`, base `cfscl`, rol `cfscl_owner`, **Connection pooling activado** → copiar.

### 2. Cliente OAuth de Google (login)

En la consola de GCP, proyecto **cfscl-513102** → Google Auth Platform → Clientes → cliente web:

- Orígenes autorizados: `https://sistema.cfscl.cl` y la dirección técnica `https://cfscl-230628636540.us-east4.run.app`
- URI de redirección autorizados: las mismas dos terminadas en `/api/auth/callback/google`
- Para local: `http://localhost:3000` y `http://localhost:3000/api/auth/callback/google`

La app toma la dirección desde la que se entra (AUTH_TRUST_HOST), así que el login funciona en ambas.

### 3. Correr el script

```bash
git clone -b app https://github.com/riodaah/cfscl.git && cd cfscl
bash deploy/gcp.sh setup    # APIs, bucket, cuenta de servicio y secretos (pide Neon y Google)
bash deploy/gcp.sh deploy   # construye la imagen y publica en Cloud Run (5 a 8 minutos)
bash deploy/gcp.sh dominio  # una vez: conecta sistema.cfscl.cl e imprime el registro DNS
```

### Dominio propio

Cloud Run solo admite dominio propio en algunas regiones (no en São Paulo); por eso la app vive en `us-east4`.

1. Verificar `cfscl.cl` una vez: `gcloud domains verify cfscl.cl` abre Search Console; agregar el registro TXT que indica en el DNS del dominio y presionar Verificar. Debe hacerse con la misma cuenta que despliega.
2. `bash deploy/gcp.sh dominio` y crear en el DNS el registro que imprime (CNAME `sistema` → `ghs.googlehosted.com.`).
3. El certificado HTTPS se emite solo en 15 minutos a unas horas.

- Para actualizar después de cambios: `git pull && bash deploy/gcp.sh deploy` (aplica antes las migraciones de base de datos).
- Primer trato de Ferrada: `bash deploy/gcp.sh cargar "<carpeta con los 20 PDF>"` (una vez `gcloud auth application-default login`). Ver `scripts/cargar-trato-ferrada.ts`.
- Para cargar o cambiar las credenciales de Google: `bash deploy/gcp.sh google`.

### 4. Alerta de presupuesto (recomendado)

En **Facturación → Presupuestos y alertas**, crea un presupuesto de US$ 15/mes para el proyecto, con avisos al 50%, 90% y 100%.

## API v1

```
GET /api/v1/operaciones
Authorization: Bearer <API_KEY>
```

La llave se ve en Secret Manager → `API_KEY`. Es la base para el agente de correos (fase 2) y el servidor MCP.
