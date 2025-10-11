# Guía de Despliegue - Florería Cristina

Este documento detalla el proceso de despliegue de la aplicación Florería Cristina en un entorno de producción.

## Prerrequisitos

- Servidor con Docker y Docker Compose instalados
- Dominio configurado (ejemplo: floreriacristina.com)
- Certificados SSL para el dominio
- Puertos 80 y 443 abiertos

## Estructura de Archivos para Despliegue

```
.
├── .env.prod                    # Variables de entorno para producción
├── deploy.sh                    # Script de despliegue para Linux/macOS
├── deploy.ps1                   # Script de despliegue para Windows
├── docker-compose.deploy.yml    # Configuración Docker Compose para producción
├── Dockerfile                   # Dockerfile del backend
├── frontend/
│   └── Dockerfile.prod          # Dockerfile del frontend para producción
├── nginx/
│   ├── nginx.prod.conf          # Configuración principal de Nginx
│   └── prod.conf.d/
│       └── default.conf         # Configuración de los servidores virtuales
└── ssl/                         # Certificados SSL (debe crearse)
```

## Configuración de Variables de Entorno

Todas las variables de entorno necesarias están definidas en el archivo `.env.prod`. Asegúrate de personalizar los siguientes valores:

- `SECRET_KEY`: Genera una clave secreta fuerte
- `ALLOWED_HOSTS`: Actualiza con tu dominio real
- `POSTGRES_PASSWORD`: Usa una contraseña robusta para la base de datos
- `REDIS_PASSWORD`: Usa una contraseña robusta para Redis
- `EMAIL_HOST_USER` y `EMAIL_HOST_PASSWORD`: Configura con tus credenciales de correo
- `MERCADOPAGO_ACCESS_TOKEN`: Actualiza con tu token real de MercadoPago

## Certificados SSL

Para un entorno de producción, debes obtener certificados SSL válidos. Recomendamos Let's Encrypt:

1. Instala Certbot en tu servidor
2. Ejecuta:
   ```
   certbot certonly --standalone -d floreriacristina.com -d www.floreriacristina.com -d api.floreriacristina.com
   ```
3. Copia los certificados generados a la carpeta `ssl/`:
   ```
   cp /etc/letsencrypt/live/floreriacristina.com/fullchain.pem ssl/floreriacristina_com.pem
   cp /etc/letsencrypt/live/floreriacristina.com/privkey.pem ssl/floreriacristina_com.key
   cp /etc/letsencrypt/live/floreriacristina.com/fullchain.pem ssl/api_floreriacristina_com.pem
   cp /etc/letsencrypt/live/floreriacristina.com/privkey.pem ssl/api_floreriacristina_com.key
   ```

## Pasos para el Despliegue

### Linux/macOS

1. Haz que el script de despliegue sea ejecutable:
   ```
   chmod +x deploy.sh
   ```

2. Ejecuta el script de despliegue:
   ```
   ./deploy.sh
   ```

### Windows

1. Ejecuta el script PowerShell:
   ```
   powershell -ExecutionPolicy Bypass -File deploy.ps1
   ```

## Verificación del Despliegue

1. Verifica que todos los contenedores estén en funcionamiento:
   ```
   docker-compose -f docker-compose.deploy.yml ps
   ```

2. Comprueba los registros por si hay errores:
   ```
   docker-compose -f docker-compose.deploy.yml logs -f
   ```

3. Accede a la aplicación en tu navegador:
   - Frontend: https://floreriacristina.com
   - API: https://api.floreriacristina.com

## Mantenimiento

### Actualizar la aplicación

1. Obtén los cambios más recientes del repositorio:
   ```
   git pull
   ```

2. Reconstruye y reinicia los contenedores:
   ```
   docker-compose -f docker-compose.deploy.yml down
   docker-compose -f docker-compose.deploy.yml build
   docker-compose -f docker-compose.deploy.yml up -d
   ```

### Backups de la base de datos

Para crear una copia de seguridad de la base de datos:

```
docker-compose -f docker-compose.deploy.yml exec db pg_dump -U floreria_user floreria_cristina_prod > backup_$(date +"%Y%m%d").sql
```

## Solución de Problemas

### Problemas comunes y sus soluciones

1. **La aplicación no se inicia**
   - Revisa los registros: `docker-compose -f docker-compose.deploy.yml logs web`
   - Verifica que la base de datos esté accesible: `docker-compose -f docker-compose.deploy.yml exec web python manage.py dbshell`

2. **Errores en el frontend**
   - Revisa los registros: `docker-compose -f docker-compose.deploy.yml logs frontend`
   - Verifica que la API sea accesible desde el frontend

3. **Problemas con certificados SSL**
   - Revisa los registros de Nginx: `docker-compose -f docker-compose.deploy.yml logs nginx`
   - Verifica que los archivos de certificados estén correctamente montados

### Contacto para soporte

Si necesitas ayuda adicional, contacta a:

- Email: mazzucoda@gmail.com
- Desarrollador: Daniel Mazzucco
