#!/usr/bin/env bash
# Despliegue de CFSCL en Google Cloud (Cloud Run + Cloud Storage + Secret Manager).
# Correr desde Cloud Shell, dentro del repo clonado en la rama "app":
#
#   git clone -b app https://github.com/riodaah/cfscl.git && cd cfscl
#   bash deploy/gcp.sh setup      # una vez: APIs, bucket, cuenta de servicio, secretos
#   bash deploy/gcp.sh deploy     # cada vez que haya cambios
#   bash deploy/gcp.sh google     # cargar o cambiar el Client ID/Secret de Google
#
# Requisitos: tener a mano la cadena de conexión de Neon (con pooling) y,
# para el login, el Client ID y Secret de Google (ver README, sección "Login con Google").

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cfscl-513102}"
REGION="${REGION:-southamerica-east1}"     # São Paulo: misma zona que la base en Neon
SERVICE="${SERVICE:-cfscl}"
REPO="${REPO:-cfscl}"
BUCKET="${BUCKET:-${PROJECT_ID}-documentos}"
SA_NAME="cfscl-app"
SA="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
# Separados por coma: se pasan a Cloud Run con delimitador "|" para no romper la lista
ADMIN_EMAILS="${ADMIN_EMAILS:-da.morande@gmail.com,francisco@cfs.cl}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/app"

gcloud config set project "$PROJECT_ID" >/dev/null

# Crea el secreto si no existe y le agrega una versión con el valor dado
secreto() {
  local nombre="$1" valor="$2"
  if ! gcloud secrets describe "$nombre" >/dev/null 2>&1; then
    gcloud secrets create "$nombre" --replication-policy=automatic >/dev/null
  fi
  printf '%s' "$valor" | gcloud secrets versions add "$nombre" --data-file=- >/dev/null
  gcloud secrets add-iam-policy-binding "$nombre" --member="serviceAccount:${SA}" --role=roles/secretmanager.secretAccessor >/dev/null
  echo "  ✓ secreto $nombre"
}

pedir() {
  local nombre="$1" texto="$2" valor
  if gcloud secrets describe "$nombre" >/dev/null 2>&1; then
    read -r -p "  $nombre ya existe. ¿Reemplazar? (s/N) " r
    [[ "$r" =~ ^[sS]$ ]] || return 0
  fi
  read -r -s -p "  $texto: " valor; echo
  if [[ -n "$valor" ]]; then secreto "$nombre" "$valor"
  elif ! gcloud secrets describe "$nombre" >/dev/null 2>&1; then secreto "$nombre" "pendiente"; fi
}

# En proyectos nuevos Cloud Build usa la cuenta de servicio por defecto de Compute,
# que (por política de la organización) nace sin permisos. Se le dan los mínimos para construir.
permisos_build() {
  echo "▸ Permisos de Cloud Build"
  local num cb
  num="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
  cb="${num}-compute@developer.gserviceaccount.com"
  for rol in roles/cloudbuild.builds.builder roles/artifactregistry.writer roles/storage.objectViewer roles/logging.logWriter; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${cb}" --role="$rol" --condition=None >/dev/null
    echo "  ✓ $rol → $cb"
  done
  # Para que Cloud Run pueda usar la cuenta de servicio de la app al desplegar
  gcloud iam service-accounts add-iam-policy-binding "$SA" --member="serviceAccount:${cb}" --role=roles/iam.serviceAccountUser >/dev/null
}

setup() {
  echo "▸ Activando APIs (tarda 1 a 2 minutos la primera vez)"
  gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com \
    secretmanager.googleapis.com storage.googleapis.com iam.googleapis.com

  echo "▸ Repositorio de imágenes"
  gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 ||
    gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" --description="Imágenes CFSCL"
  # Borra imágenes viejas automáticamente (deja las 5 últimas) para no pagar almacenamiento de más
  cat > /tmp/cfscl-cleanup.json <<'JSON'
[{"name":"dejar-5","action":{"type":"Keep"},"mostRecentVersions":{"keepCount":5}},
 {"name":"borrar-viejas","action":{"type":"Delete"},"condition":{"olderThan":"30d"}}]
JSON
  gcloud artifacts repositories set-cleanup-policies "$REPO" --location="$REGION" --policy=/tmp/cfscl-cleanup.json --no-dry-run >/dev/null || true

  echo "▸ Cuenta de servicio de la app"
  gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 ||
    gcloud iam service-accounts create "$SA_NAME" --display-name="CFSCL app (Cloud Run)"

  permisos_build

  echo "▸ Bucket privado de documentos: gs://${BUCKET}"
  gcloud storage buckets describe "gs://${BUCKET}" >/dev/null 2>&1 ||
    gcloud storage buckets create "gs://${BUCKET}" --location="$REGION" --uniform-bucket-level-access --public-access-prevention
  gcloud storage buckets update "gs://${BUCKET}" --versioning >/dev/null   # protege contra borrados por error
  gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" --member="serviceAccount:${SA}" --role=roles/storage.objectAdmin >/dev/null

  echo "▸ Secretos"
  pedir DATABASE_URL "Cadena de conexión de Neon (con pooling)"
  if ! gcloud secrets describe NEXTAUTH_SECRET >/dev/null 2>&1; then secreto NEXTAUTH_SECRET "$(openssl rand -base64 32)"; fi
  if ! gcloud secrets describe API_KEY >/dev/null 2>&1; then secreto API_KEY "$(openssl rand -hex 24)"; fi
  pedir GOOGLE_CLIENT_ID "Google OAuth Client ID (Enter para dejarlo para después)"
  pedir GOOGLE_CLIENT_SECRET "Google OAuth Client Secret (Enter para dejarlo para después)"

  echo
  echo "Listo. Siguiente paso: bash deploy/gcp.sh deploy"
}

deploy() {
  for s in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET DATABASE_URL; do
    gcloud secrets describe "$s" >/dev/null 2>&1 || { echo "Falta el secreto $s. Corre: bash deploy/gcp.sh setup"; exit 1; }
  done
  local tag
  tag="$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)"
  echo "▸ Construyendo imagen ${IMAGE}:${tag} con Cloud Build"
  gcloud builds submit --tag "${IMAGE}:${tag}" .

  echo "▸ Desplegando en Cloud Run"
  local url
  url="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)' 2>/dev/null || true)"
  gcloud run deploy "$SERVICE" \
    --image="${IMAGE}:${tag}" \
    --region="$REGION" \
    --service-account="$SA" \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=1 --memory=512Mi \
    --min-instances=0 --max-instances=3 \
    --concurrency=40 --timeout=120 \
    --cpu-boost \
    --set-env-vars="^|^GCS_BUCKET=${BUCKET}|ADMIN_EMAILS=${ADMIN_EMAILS}${url:+|NEXTAUTH_URL=${url}}" \
    --set-secrets="DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,API_KEY=API_KEY:latest"

  if [[ -z "$url" ]]; then
    url="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')"
    gcloud run services update "$SERVICE" --region="$REGION" --update-env-vars="NEXTAUTH_URL=${url}" >/dev/null
  fi
  echo
  echo "✓ App en: ${url}"
  echo "  Salud:  ${url}/api/health"
  echo "  En el cliente OAuth de Google, la URI de redirección autorizada debe ser:"
  echo "  ${url}/api/auth/callback/google"
}

# Carga (o cambia) las credenciales de Google y crea una revisión nueva que las use
google() {
  local id secret
  read -r -p "  Google OAuth Client ID: " id
  read -r -s -p "  Google OAuth Client Secret: " secret; echo
  secreto GOOGLE_CLIENT_ID "$id"
  secreto GOOGLE_CLIENT_SECRET "$secret"
  gcloud run services update "$SERVICE" --region="$REGION" \
    --update-secrets="GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest" >/dev/null
  echo "✓ Login con Google actualizado"
}

case "${1:-}" in
  setup) setup ;;
  permisos) permisos_build ;;
  deploy) deploy ;;
  google) google ;;
  *) echo "Uso: bash deploy/gcp.sh setup | permisos | deploy | google"; exit 1 ;;
esac
