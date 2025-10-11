# Script de despliegue para Florería Cristina (Windows PowerShell)
# Autor: Daniel Mazzucco
# Fecha: 10/10/2025

# Función para mostrar mensajes con colores
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "=== Iniciando despliegue de Florería Cristina ==="

# Verificar que todos los archivos necesarios existen
Write-ColorOutput Yellow "Verificando archivos necesarios..."

$requiredFiles = @(
    ".env.prod",
    "docker-compose.deploy.yml",
    "nginx/nginx.prod.conf",
    "nginx/prod.conf.d/default.conf",
    "frontend/Dockerfile.prod"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-ColorOutput Red "Error: No se encuentra el archivo $file"
        exit 1
    }
}

Write-ColorOutput Green "✓ Todos los archivos necesarios encontrados"

# Crear directorios para logs y certificados SSL si no existen
if (-not (Test-Path "logs/nginx")) {
    New-Item -Path "logs/nginx" -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path "ssl")) {
    New-Item -Path "ssl" -ItemType Directory -Force | Out-Null
}

# Verificar si hay certificados SSL
if (-not (Test-Path "ssl/floreriacristina_com.pem")) {
    Write-ColorOutput Yellow "No se encontraron certificados SSL. Para un despliegue en producción necesitarás obtenerlos."
    Write-ColorOutput Yellow "Para fines de desarrollo, puedes usar certificados auto-firmados."
    
    # Para generarlos con OpenSSL en Windows, se necesitaría tener OpenSSL instalado
    # Este paso se omite en Windows y se proporciona una guía alternativa
    Write-ColorOutput Yellow "Consulta https://letsencrypt.org/ para obtener certificados SSL válidos para producción."
}
else {
    Write-ColorOutput Green "✓ Certificados SSL encontrados"
}

# Construir y iniciar los contenedores
Write-ColorOutput Yellow "Construyendo y desplegando la aplicación..."
docker-compose -f docker-compose.deploy.yml build
docker-compose -f docker-compose.deploy.yml up -d

Write-ColorOutput Green "=== Despliegue completado ==="
Write-ColorOutput Yellow "La aplicación está desplegada en:"
Write-Output "- Frontend: https://floreriacristina.com"
Write-Output "- Backend API: https://api.floreriacristina.com"

Write-ColorOutput Yellow "NOTA: Para un despliegue en producción real, deberás:"
Write-Output "1. Obtener certificados SSL válidos (Let's Encrypt)"
Write-Output "2. Configurar un dominio real apuntando a tu servidor"
Write-Output "3. Asegurarte de que los puertos 80 y 443 estén abiertos"
