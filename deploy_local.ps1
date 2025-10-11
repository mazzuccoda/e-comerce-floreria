# Script de despliegue para Florería Cristina (Windows PowerShell)
# Autor: Daniel Mazzucco
# Fecha: 10/10/2025

# Función para mostrar mensajes con colores
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput "Green" "=== Iniciando despliegue local de Florería Cristina ==="

# Verificar requisitos previos
Write-ColorOutput "Yellow" "Verificando Docker..."
try {
    docker --version
    Write-ColorOutput "Green" "✓ Docker está instalado"
} catch {
    Write-ColorOutput "Red" "❌ Docker no está instalado o no está en el PATH"
    exit 1
}

# Usar el archivo docker-compose existente para un despliegue local simplificado
Write-ColorOutput "Yellow" "Deteniendo contenedores existentes..."
docker-compose down

Write-ColorOutput "Yellow" "Construyendo las imágenes..."
docker-compose build

Write-ColorOutput "Yellow" "Iniciando servicios..."
docker-compose up -d

# Verificar que los servicios estén en funcionamiento
Write-ColorOutput "Yellow" "Verificando servicios..."
docker-compose ps

Write-ColorOutput "Green" "=== Despliegue local completado ==="
Write-ColorOutput "Yellow" "La aplicación está disponible en:"
Write-Output "- Frontend: http://localhost:3000"
Write-Output "- Backend API: http://localhost:8000"
Write-Output ""
Write-Output "Para ver los logs de los servicios:"
Write-Output "docker-compose logs -f"
