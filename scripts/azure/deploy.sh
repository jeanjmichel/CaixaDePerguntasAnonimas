#!/bin/bash
# ============================================
# Caixa de Perguntas — Azure Deployment
# ============================================
# Builds the application and deploys to Azure App Service.
# Prerequisites:
#   - Azure CLI logged in (az login)
#   - Resources provisioned (run provision.sh first)
#
# Usage:
#   bash scripts/azure/deploy.sh
#
# Customize the variables below to match provision.sh.
# ============================================

set -euo pipefail

# ---------- Configuration ----------
RESOURCE_GROUP="rgCaixaDePerguntas"
APP_NAME="app-caixa-de-perguntas"
BUILD_DIR=".next"
DEPLOY_ZIP="deploy.zip"

# ---------- Pre-checks ----------
echo "Checking Azure CLI login..."
az account show --output none 2>/dev/null || {
  echo "ERROR: Not logged in to Azure CLI. Run 'az login' first."
  exit 1
}

# ---------- Install Dependencies ----------
echo "Installing dependencies..."
npm ci --omit=dev

# ---------- Build ----------
echo "Building application..."
npm run build

if [ ! -d "$BUILD_DIR" ]; then
  echo "ERROR: Build directory '$BUILD_DIR' not found. Build failed."
  exit 1
fi

echo "Build successful."

# ---------- Create Deployment Package ----------
echo "Creating deployment package..."

# Clean up previous deploy zip
rm -f "$DEPLOY_ZIP"

# Package only what's needed for production
zip -r "$DEPLOY_ZIP" \
  .next/ \
  node_modules/ \
  package.json \
  package-lock.json \
  scripts/seed.ts \
  src/infrastructure/database/ \
  src/domain/ \
  src/application/ \
  public/ \
  next.config.ts \
  tsconfig.json \
  -x "node_modules/.cache/*" \
  -x ".next/cache/*" \
  > /dev/null

echo "Deployment package created: $DEPLOY_ZIP"

# ---------- Deploy ----------
echo "Deploying to Azure App Service: $APP_NAME..."
az webapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path "$DEPLOY_ZIP" \
  --type zip \
  --output none

echo "Deployment initiated."

# ---------- Clean Up ----------
rm -f "$DEPLOY_ZIP"

# ---------- Verify ----------
echo "Checking deployment status..."
APP_URL="https://$APP_NAME.azurewebsites.net"

echo ""
echo "============================================"
echo "Deployment complete!"
echo "============================================"
echo "URL: $APP_URL"
echo ""
echo "The app will run 'npm run seed && npm run start'"
echo "on startup (configured in provision.sh)."
echo ""
echo "To check logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "To stream live logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP --provider http"
echo "============================================"
