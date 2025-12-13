#!/bin/bash

# Script para desplegar el sistema de zonas de envío
# Ejecutar con: bash deploy_shipping_zones.sh

echo "🚀 Desplegando Sistema de Zonas de Envío..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Crear migraciones
echo -e "${YELLOW}📝 Paso 1: Creando migraciones...${NC}"
docker compose exec web python manage.py makemigrations pedidos

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migraciones creadas${NC}"
else
    echo -e "${RED}❌ Error al crear migraciones${NC}"
    exit 1
fi

echo ""

# 2. Aplicar migraciones
echo -e "${YELLOW}📦 Paso 2: Aplicando migraciones...${NC}"
docker compose exec web python manage.py migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
else
    echo -e "${RED}❌ Error al aplicar migraciones${NC}"
    exit 1
fi

echo ""

# 3. Inicializar datos
echo -e "${YELLOW}🗺️ Paso 3: Inicializando datos de zonas...${NC}"
docker compose exec web python setup_shipping_zones.py

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Datos inicializados${NC}"
else
    echo -e "${RED}❌ Error al inicializar datos${NC}"
    exit 1
fi

echo ""

# 4. Reiniciar servicios
echo -e "${YELLOW}🔄 Paso 4: Reiniciando servicios...${NC}"
docker compose restart web

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Servicios reiniciados${NC}"
else
    echo -e "${RED}❌ Error al reiniciar servicios${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DESPLIEGUE COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📊 Próximos pasos:${NC}"
echo "  1. Verificar endpoints:"
echo "     curl http://localhost:8000/api/pedidos/shipping/config/"
echo ""
echo "  2. Acceder al admin:"
echo "     http://localhost:8000/admin/"
echo ""
echo "  3. Hacer commit y push:"
echo "     git add ."
echo "     git commit -m 'feat: Sistema de zonas de envío con Distance Matrix API'"
echo "     git push origin master"
echo ""
