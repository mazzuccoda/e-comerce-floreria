#!/bin/bash

# Script de despliegue para Florería Cristina
# Autor: Daniel Mazzucco
# Fecha: 10/10/2025

set -e

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando despliegue de Florería Cristina ===${NC}"

# Verificar que todos los archivos necesarios existen
echo -e "${YELLOW}Verificando archivos necesarios...${NC}"

required_files=(
  ".env.prod"
  "docker-compose.deploy.yml"
  "nginx/nginx.prod.conf"
  "nginx/prod.conf.d/default.conf"
  "frontend/Dockerfile.prod"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}Error: No se encuentra el archivo $file${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✓ Todos los archivos necesarios encontrados${NC}"

# Crear directorios para logs y certificados SSL si no existen
mkdir -p logs/nginx
mkdir -p ssl

# Verificar si hay certificados SSL o generar auto-firmados para pruebas
if [ ! -f "ssl/floreriacristina_com.pem" ]; then
  echo -e "${YELLOW}No se encontraron certificados SSL. Generando certificados auto-firmados para pruebas...${NC}"
  
  # Generar certificado para el dominio principal
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/floreriacristina_com.key \
    -out ssl/floreriacristina_com.pem \
    -subj "/C=AR/ST=Buenos Aires/L=Buenos Aires/O=Florería Cristina/CN=floreriacristina.com"
  
  # Generar certificado para la API
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/api_floreriacristina_com.key \
    -out ssl/api_floreriacristina_com.pem \
    -subj "/C=AR/ST=Buenos Aires/L=Buenos Aires/O=Florería Cristina/CN=api.floreriacristina.com"
  
  echo -e "${GREEN}✓ Certificados auto-firmados generados${NC}"
else
  echo -e "${GREEN}✓ Certificados SSL encontrados${NC}"
fi

# Construir y iniciar los contenedores
echo -e "${YELLOW}Construyendo y desplegando la aplicación...${NC}"
docker-compose -f docker-compose.deploy.yml build
docker-compose -f docker-compose.deploy.yml up -d

echo -e "${GREEN}=== Despliegue completado ===${NC}"
echo -e "${YELLOW}La aplicación está desplegada en:${NC}"
echo -e "- Frontend: https://floreriacristina.com"
echo -e "- Backend API: https://api.floreriacristina.com"

echo -e "${YELLOW}NOTA: Para un despliegue en producción real, deberás:${NC}"
echo -e "1. Obtener certificados SSL válidos (Let's Encrypt)"
echo -e "2. Configurar un dominio real apuntando a tu servidor"
echo -e "3. Asegurarte de que los puertos 80 y 443 estén abiertos"
