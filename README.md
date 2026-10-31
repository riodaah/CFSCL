# CFSCL · Sistema de gestión

Sistema de Central Frutícola Sur. Piloto: **operaciones de Ferrada** (proveedores, operaciones, documentos, pagos 50/50, certificados anuales, bitácora). Productores, proceso y clientes directos vienen después sobre la misma base.

- Rama `main`: maqueta navegable con datos de ejemplo (cfscl.vercel.app).
- Rama `app`: **esta aplicación real**, con base de datos y login.

## Arquitectura

| Pieza | Servicio | Costo inicial |
|---|---|---|
| App (pantallas + API) | Next.js 15 en **Cloud Run**, `southamerica-east1`, 0 instancias mínimas | Capa gratuita |
| Base de datos | **Neon Postgres 17**, proyecto `cfscl` (`late-field-47244055`), São Paulo | Capa gratuita |
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

En la consola de GCP, proyecto **cfscl-513102**:

1. **APIs y servicios → Pantalla de consentimiento de OAuth** (Google Auth Platform):
   - Tipo **Externo**; nombre "CFS · Sistema de gestión"; correo de soporte.
   - En **Público**, publicar la app (estado "En producción"). Solo pide nombre, correo y perfil, así que no requiere verificación de Google.
2. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**:
   - Orígenes autorizados: `https://cfscl-230628636540.southamerica-east1.run.app`
   - URI de redirección autorizados: `https://cfscl-230628636540.southamerica-east1.run.app/api/auth/callback/google`
   - Para probar en local, agregar también `http://localhost:3000` y `http://localhost:3000/api/auth/callback/google`.
3. Copiar el **Client ID** y el **Client Secret**.

(La URL de Cloud Run sigue el formato `https://SERVICIO-NUMERO_PROYECTO.REGION.run.app`. Si al desplegar sale otra, usa la que imprime el script.)

### 3. Correr el script

```bash
git clone -b app https://github.com/riodaah/cfscl.git && cd cfscl
bash deploy/gcp.sh setup    # APIs, bucket, cuenta de servicio y secretos (pide Neon y Google)
bash deploy/gcp.sh deploy   # construye la imagen y publica en Cloud Run (5 a 8 minutos)
```

- Para actualizar después de cambios: `git pull && bash deploy/gcp.sh deploy`.
- Para cargar o cambiar las credenciales de Google: `bash deploy/gcp.sh google`.

### 4. Alerta de presupuesto (recomendado)

En **Facturación → Presupuestos y alertas**, crea un presupuesto de US$ 15/mes para el proyecto, con avisos al 50%, 90% y 100%.

## API v1

```
GET /api/v1/operaciones
Authorization: Bearer <API_KEY>
```

La llave se ve en Secret Manager → `API_KEY`. Es la base para el agente de correos (fase 2) y el servidor MCP.
