#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Despliega APP Reparto en el EC2
# Uso: bash scripts/deploy.sh <IP_EC2> [usuario] [clave.pem]
# Ejemplo: bash scripts/deploy.sh 54.123.45.67 ec2-user ~/.ssh/appreparto.pem
# =============================================================================
set -e

EC2_IP="${1:?Uso: $0 <IP_EC2> [usuario=ec2-user] [clave=~/.ssh/appreparto.pem]}"
EC2_USER="${2:-ec2-user}"
PEM="${3:-~/.ssh/appreparto.pem}"
APP_DIR="/home/${EC2_USER}/app-reparto"

SSH_CMD="ssh -i $PEM -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP}"
SCP_CMD="scp -i $PEM -o StrictHostKeyChecking=no"

echo "=== [1/4] Verificando que existe el archivo .env ==="
if [ ! -f .env ]; then
  echo "ERROR: No existe .env en el directorio actual."
  echo "Copia .env.example como .env y completa los valores."
  exit 1
fi

echo ""
echo "=== [2/4] Copiando archivos al EC2 ($EC2_IP) ==="
# Crear directorio en EC2
$SSH_CMD "mkdir -p $APP_DIR"

# Copiar archivos necesarios (excluir node_modules, target, etc.)
rsync -az --progress \
  -e "ssh -i $PEM -o StrictHostKeyChecking=no" \
  --exclude='node_modules' \
  --exclude='backend/target' \
  --exclude='.git' \
  --exclude='mobile' \
  --exclude='web/.env.local' \
  ./ "${EC2_USER}@${EC2_IP}:${APP_DIR}/"

# Copiar .env por separado (no está en el repositorio)
$SCP_CMD .env "${EC2_USER}@${EC2_IP}:${APP_DIR}/.env"
echo "    Archivos copiados."

echo ""
echo "=== [3/4] Construyendo y levantando contenedores ==="
$SSH_CMD << REMOTE
  cd $APP_DIR
  docker compose -f docker-compose.prod.yml --env-file .env pull 2>/dev/null || true
  docker compose -f docker-compose.prod.yml --env-file .env up -d --build
  docker compose -f docker-compose.prod.yml ps
REMOTE

echo ""
echo "=== [4/4] Deploy completado ==="
echo ""
echo "  App disponible en: http://${EC2_IP}"
echo "  Logs del backend : ssh ... 'docker logs appreparto-backend -f'"
echo "  Logs del frontend: ssh ... 'docker logs appreparto-frontend -f'"
echo ""
