#!/bin/bash
# ============================================
# Caixa de Perguntas — Azure Provisioning
# ============================================
# Creates all Azure resources needed for the application.
# Prerequisites: Azure CLI logged in (az login)
#
# Usage:
#   bash scripts/azure/provision.sh
#
# Customize the variables below before running.
# ============================================

set -euo pipefail

# ---------- Configuration ----------
RESOURCE_GROUP="rgCaixaDePerguntas"
LOCATION="brazilsouth"
APP_SERVICE_PLAN="planCaixaDePerguntas"
APP_NAME="app-caixa-de-perguntas"
SKU="B1"
NODE_VERSION="20-lts"

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

# ---------- Web App ----------
echo "Creating Web App: $APP_NAME..."
az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --runtime "NODE|$NODE_VERSION" \
  --output none

echo "Web App created."

# ---------- Environment Variables ----------
echo "Configuring environment variables..."

# IMPORTANT: Replace these values before running in production!
# Generate a strong JWT_SECRET: openssl rand -base64 64
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    DATABASE_PATH="/home/data/caixa.db" \
    JWT_SECRET="CHANGE-ME-USE-openssl-rand-base64-64" \
    JWT_EXPIRATION_HOURS="8" \
    SEED_ADMIN_USERNAME="admin" \
    SEED_ADMIN_PASSWORD="CHANGE-ME-STRONG-PASSWORD" \
    RATE_LIMIT_WINDOW_MS="60000" \
    RATE_LIMIT_MAX_REQUESTS="5" \
    QUESTION_MIN_LENGTH="5" \
    QUESTION_MAX_LENGTH="500" \
    NODE_ENV="production" \
  --output none

echo "Environment variables configured."

# ---------- Startup Command ----------
echo "Setting startup command..."
az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file "npm run seed && npm run start" \
  --output none

echo "Startup command set."

# ---------- Persistent Storage ----------
echo "Ensuring /home/data/ is used for SQLite persistence..."
echo "  Azure App Service Linux persists /home/ across restarts."
echo "  DATABASE_PATH is set to /home/data/caixa.db."

# ---------- Summary ----------
echo ""
echo "============================================"
echo "Provisioning complete!"
echo "============================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Service Plan: $APP_SERVICE_PLAN ($SKU)"
echo "Web App: $APP_NAME"
echo "URL: https://$APP_NAME.azurewebsites.net"
echo ""
echo "IMPORTANT: Update JWT_SECRET and SEED_ADMIN_PASSWORD"
echo "before deploying to production!"
echo ""
echo "Next step: bash scripts/azure/deploy.sh"
echo "============================================"
