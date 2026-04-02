#!/bin/bash
# ============================================
# Caixa de Perguntas — Azure Provisioning
# Source deploy + Kudu zip build strategy
# ============================================

set -euo pipefail

# ---------- Resolve project root ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# ---------- Configuration ----------
RESOURCE_GROUP="rgCaixaDePerguntas"
LOCATION="brazilsouth"
APP_SERVICE_PLAN="planCaixaDePerguntas"
APP_NAME="app-caixa-de-perguntas"
SKU="B1"
NODE_VERSION="20-lts"

DATABASE_PATH="/home/data/caixa.db"

# IMPORTANT: change before production use
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_PASSWORD="hArdc0d&dP@ssw0rd"
JWT_SECRET="HKbz9iBNOqHz5PqJTkAJ2MUWJhCkepADYakDSpX1jpjoOJnZIXnM94AL9N1v5LBP"
JWT_EXPIRATION_HOURS="8"
QUESTION_MIN_LENGTH="5"
QUESTION_MAX_LENGTH="500"
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="5"

STARTUP_COMMAND="mkdir -p /home/data && npm run start"

# ---------- Pre-checks ----------
echo "Checking Azure CLI login..."
az account show --output none 2>/dev/null || {
  echo "ERROR: Not logged in to Azure CLI. Run 'az login' first."
  exit 1
}

echo "Using project root: $PROJECT_ROOT"

# ---------- Resource Group ----------
echo "Creating resource group: $RESOURCE_GROUP..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

echo "Resource group created."

# ---------- App Service Plan ----------
echo "Creating App Service Plan: $APP_SERVICE_PLAN (Linux, $SKU)..."
az appservice plan create \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --sku "$SKU" \
  --is-linux \
  --output none

echo "App Service Plan created."

# ---------- Force single instance ----------
echo "Setting instance count to 1..."
az appservice plan update \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --number-of-workers 1 \
  --output none

# ---------- Web App ----------
echo "Creating Web App: $APP_NAME..."
az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --runtime "NODE|$NODE_VERSION" \
  --output none

echo "Web App created."

# ---------- Remove conflicting app setting if it exists ----------
echo "Removing WEBSITE_RUN_FROM_PACKAGE if present..."
az webapp config appsettings delete \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --setting-names WEBSITE_RUN_FROM_PACKAGE \
  --output none || true

# ---------- Environment Variables ----------
echo "Configuring environment variables..."
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    ENABLE_ORYX_BUILD="true" \
    NODE_ENV="production" \
    DATABASE_PATH="$DATABASE_PATH" \
    JWT_SECRET="$JWT_SECRET" \
    JWT_EXPIRATION_HOURS="$JWT_EXPIRATION_HOURS" \
    SEED_ADMIN_USERNAME="$SEED_ADMIN_USERNAME" \
    SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
    RATE_LIMIT_WINDOW_MS="$RATE_LIMIT_WINDOW_MS" \
    RATE_LIMIT_MAX_REQUESTS="$RATE_LIMIT_MAX_REQUESTS" \
    QUESTION_MIN_LENGTH="$QUESTION_MIN_LENGTH" \
    QUESTION_MAX_LENGTH="$QUESTION_MAX_LENGTH" \
  --output none

echo "Environment variables configured."

# ---------- Startup Command ----------
echo "Setting startup command..."
az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file "$STARTUP_COMMAND" \
  --output none

echo "Startup command set."

# ---------- Health Check ----------
echo "Configuring health check path..."

az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --generic-configurations "{\"healthCheckPath\":\"/api/health\"}" \
  --output none

echo "Health check configured."

# ---------- Enable Logs ----------
echo "Enabling application logging..."
az webapp log config \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --application-logging filesystem \
  --level information \
  --web-server-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --output none

# ---------- Summary ----------
echo ""
echo "============================================"
echo "Provisioning complete!"
echo "============================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Service Plan: $APP_SERVICE_PLAN ($SKU)"
echo "Web App: $APP_NAME"
echo "URL: https://$APP_NAME.azurewebsites.net"
echo "Database Path: $DATABASE_PATH"
echo ""
echo "IMPORTANT:"
echo "- Change JWT_SECRET before production use"
echo "- Change SEED_ADMIN_PASSWORD before production use"
echo "- Remote build is enabled in Azure"
echo "- WEBSITE_RUN_FROM_PACKAGE was removed"
echo ""
echo "Next step: bash scripts/azure/deploy.sh"
echo "============================================"