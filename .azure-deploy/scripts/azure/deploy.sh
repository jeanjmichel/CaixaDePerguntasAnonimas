#!/bin/bash
# ============================================
# Caixa de Perguntas — Azure Deployment
# Push deploy + wait for completion
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

RESOURCE_GROUP="rgCaixaDePerguntas"
APP_NAME="app-caixa-de-perguntas"
DEPLOY_ZIP="deploy.zip"
STAGING_DIR=".azure-deploy"
MAX_WAIT_SECONDS=1200
POLL_INTERVAL=10

require_command() {
  local cmd="$1"
  local message="$2"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: $message"
    exit 1
  fi
}

create_zip_with_python() {
  local source_dir="$1"
  local output_zip="$2"

  echo "Using Python zipfile with normalized POSIX paths..."

  python - "$source_dir" "$output_zip" <<'PY'
import sys
import zipfile
from pathlib import Path

source_dir = Path(sys.argv[1]).resolve()
output_zip = Path(sys.argv[2]).resolve()

if output_zip.exists():
    output_zip.unlink()

with zipfile.ZipFile(output_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    for path in sorted(source_dir.rglob("*")):
        if path.is_file():
            arcname = path.relative_to(source_dir).as_posix()
            zf.write(path, arcname)

print(f"ZIP created: {output_zip}")
PY
}

echo "Checking Azure CLI login..."
az account show --output none 2>/dev/null || {
  echo "ERROR: Not logged in to Azure CLI. Run 'az login' first."
  exit 1
}

require_command "python" "Python is required for ZIP generation."

echo "Using project root: $PROJECT_ROOT"

echo "Cleaning previous artifacts..."
rm -rf "$STAGING_DIR"
rm -f "$DEPLOY_ZIP"

echo "Validating required project files..."
REQUIRED_FILES=(
  "package.json"
  "package-lock.json"
  "next.config.ts"
  "tsconfig.json"
  "app/layout.tsx"
  "app/page.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -e "$file" ]; then
    echo "ERROR: Required file '$file' not found."
    exit 1
  fi
done

echo "Preparing deployment staging directory..."
mkdir -p "$STAGING_DIR"

cp package.json "$STAGING_DIR/"
cp package-lock.json "$STAGING_DIR/"
cp next.config.ts "$STAGING_DIR/"
cp tsconfig.json "$STAGING_DIR/"

cat > "$STAGING_DIR/.deployment" <<'EOF'
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
EOF

[ -d "app" ] && cp -R app "$STAGING_DIR/"
[ -d "src" ] && cp -R src "$STAGING_DIR/"
[ -d "public" ] && cp -R public "$STAGING_DIR/"
[ -d "scripts" ] && cp -R scripts "$STAGING_DIR/"
[ -f "middleware.ts" ] && cp middleware.ts "$STAGING_DIR/" || true
[ -f "next-env.d.ts" ] && cp next-env.d.ts "$STAGING_DIR/" || true
[ -f "postcss.config.js" ] && cp postcss.config.js "$STAGING_DIR/" || true
[ -f "postcss.config.mjs" ] && cp postcss.config.mjs "$STAGING_DIR/" || true
[ -f ".npmrc" ] && cp .npmrc "$STAGING_DIR/" || true

echo "Creating deployment package..."
create_zip_with_python "$STAGING_DIR" "$DEPLOY_ZIP"

[ -f "$DEPLOY_ZIP" ] || {
  echo "ERROR: Deployment package '$DEPLOY_ZIP' was not created."
  exit 1
}

echo "Deploying source package to Azure App Service..."
az webapp deployment source config-zip \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src "$DEPLOY_ZIP" \
  --output none

echo "Deployment submitted. Waiting for completion..."

elapsed=0
active_status=""
active_complete=""
active_id=""

while [ "$elapsed" -lt "$MAX_WAIT_SECONDS" ]; do
  deployment_json="$(az rest \
    --method get \
    --url "https://management.azure.com/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME/deployments?api-version=2022-03-01" \
    --output json)"

  active_id="$(printf '%s' "$deployment_json" | python - <<'PY'
import json, sys
data = json.load(sys.stdin)
items = data.get("value", [])
items.sort(key=lambda x: x.get("properties", {}).get("received_time", ""), reverse=True)
if items:
    print(items[0].get("name", ""))
PY
)"

  active_status="$(printf '%s' "$deployment_json" | python - <<'PY'
import json, sys
data = json.load(sys.stdin)
items = data.get("value", [])
items.sort(key=lambda x: x.get("properties", {}).get("received_time", ""), reverse=True)
if items:
    print(items[0].get("properties", {}).get("status", ""))
PY
)"

  active_complete="$(printf '%s' "$deployment_json" | python - <<'PY'
import json, sys
data = json.load(sys.stdin)
items = data.get("value", [])
items.sort(key=lambda x: x.get("properties", {}).get("received_time", ""), reverse=True)
if items:
    print(str(items[0].get("properties", {}).get("complete", "")))
PY
)"

  echo "Latest deployment: id=$active_id status=$active_status complete=$active_complete elapsed=${elapsed}s"

  if [ "$active_complete" = "True" ] || [ "$active_complete" = "true" ]; then
    if [ "$active_status" = "4" ]; then
      echo "Deployment completed successfully."
      break
    else
      echo "ERROR: Deployment completed with non-success status: $active_status"
      rm -f "$DEPLOY_ZIP"
      rm -rf "$STAGING_DIR"
      exit 1
    fi
  fi

  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
done

if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
  echo "ERROR: Timed out waiting for deployment to complete."
  rm -f "$DEPLOY_ZIP"
  rm -rf "$STAGING_DIR"
  exit 1
fi

echo "Restarting site after successful deployment..."
az webapp restart \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none

echo "Cleaning temporary files..."
rm -f "$DEPLOY_ZIP"
rm -rf "$STAGING_DIR"

APP_URL="https://$APP_NAME.azurewebsites.net"

echo ""
echo "============================================"
echo "Deployment complete!"
echo "============================================"
echo "URL: $APP_URL"
echo ""
echo "Now run:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "============================================"