# 🚂 Despliegue de n8n en Railway - Guía Completa

## 📋 Paso 1: Desplegar n8n en Railway

### 1.1 Crear nuevo servicio n8n

**Opción A: Desde Template (MÁS FÁCIL)**

1. Ir a https://railway.app/new
2. Click en **"Deploy a Template"**
3. Buscar **"n8n"** en el buscador
4. Seleccionar **"n8n - Workflow Automation"**
5. Click **"Deploy Now"**
6. Railway creará automáticamente:
   - ✅ Servicio n8n
   - ✅ Base de datos PostgreSQL
   - ✅ Variables de entorno

**Opción B: Desde Docker Image (Manual)**

1. Ir a https://railway.app/new
2. Click en **"Empty Service"**
3. En el servicio creado:
   - Settings → Source → Docker Image
   - Image: `n8nio/n8n:latest`
4. Agregar base de datos PostgreSQL:
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**

### 1.2 Configurar Variables de Entorno

En tu servicio n8n → **Variables**:

```bash
# === AUTENTICACIÓN ===
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=Floreria2025!Secure

# === BASE DE DATOS ===
# Railway conecta automáticamente con ${{Postgres.XXX}}
DB_TYPE=postgresdb
DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}
DB_POSTGRESDB_HOST=${{Postgres.PGHOST}}
DB_POSTGRESDB_PORT=${{Postgres.PGPORT}}
DB_POSTGRESDB_USER=${{Postgres.PGUSER}}
DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}

# === CONFIGURACIÓN ===
N8N_HOST=${{RAILWAY_PUBLIC_DOMAIN}}
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/
GENERIC_TIMEZONE=America/Argentina/Buenos_Aires
NODE_ENV=production

# === SEGURIDAD ===
# Generar con: openssl rand -hex 32
N8N_ENCRYPTION_KEY=GENERAR_KEY_AQUI

# === OPCIONAL ===
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
```

### 1.3 Generar Encryption Key

**Desde tu máquina local (Windows PowerShell):**

```powershell
# Opción 1: Con OpenSSL (si lo tienes instalado)
openssl rand -hex 32

# Opción 2: Con PowerShell nativo
-join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Copiar el resultado y pegarlo en `N8N_ENCRYPTION_KEY`**

### 1.4 Generar Dominio Público

1. En tu servicio n8n → **Settings**
2. Sección **Networking**
3. Click **"Generate Domain"**
4. Railway te dará una URL como: `https://n8n-production-xxxx.up.railway.app`
5. **Copiar esta URL** (la necesitarás después)

### 1.5 Verificar Despliegue

1. Esperar ~2 minutos a que se despliegue
2. Abrir la URL generada
3. Login con:
   - Usuario: `admin`
   - Password: `Floreria2025!Secure`

---

## 📋 Paso 2: Configurar Backend Django en Railway

### 2.1 Agregar Variables de Entorno

En tu servicio **Django** en Railway → **Variables**:

```bash
# n8n Configuration
N8N_WEBHOOK_URL=https://n8n-production-xxxx.up.railway.app
N8N_API_KEY=floreria_n8n_api_key_2025_super_secret_change_this
N8N_ENABLED=True
```

**⚠️ IMPORTANTE:** Reemplazar `n8n-production-xxxx.up.railway.app` con tu URL real de n8n.

### 2.2 Actualizar settings.py

Verificar que `backend/floreria_cristina/settings.py` tenga:

```python
# ==============================================================================
# N8N CONFIGURATION
# ==============================================================================
N8N_WEBHOOK_URL = env('N8N_WEBHOOK_URL', default='http://localhost:5678')
N8N_API_KEY = env('N8N_API_KEY', default='')
N8N_ENABLED = env.bool('N8N_ENABLED', default=False)
```

### 2.3 Redesplegar Backend

Railway redesplegará automáticamente al detectar las nuevas variables.

---

## 📋 Paso 3: Crear Workflows en n8n (Railway)

### 3.1 Acceder a n8n

1. Abrir: `https://tu-n8n.up.railway.app`
2. Login con credenciales

### 3.2 Crear Workflow: Pedido Confirmado

**Paso a paso:**

1. Click **"+ New Workflow"**
2. Nombre: `WhatsApp - Pedido Confirmado`

**Nodo 1: Webhook**
- Buscar y agregar **"Webhook"**
- Configuración:
  - HTTP Method: `POST`
  - Path: `pedido-confirmado`
  - Authentication: `Header Auth`
  - Header Name: `X-API-Key`
  - Header Value: `floreria_n8n_api_key_2025_super_secret_change_this`
  - Response Mode: `When Last Node Finishes`

**Nodo 2: Function - Validar y Formatear**
- Agregar **"Function"**
- Código:

```javascript
// Validar datos
const pedido = $input.item.json;

if (!pedido.numero_pedido || !pedido.telefono_destinatario) {
  throw new Error('❌ Datos incompletos');
}

// Formatear teléfono argentino
let telefono = pedido.telefono_destinatario.toString().replace(/\D/g, '');
if (!telefono.startsWith('54')) {
  telefono = '54' + telefono;
}

// Mensaje WhatsApp
const mensaje = `
🌸 *Florería Cristina* 🌸

✅ *¡Pedido Confirmado!*

📋 *Detalles:*
• Número: #${pedido.numero_pedido}
• Destinatario: ${pedido.nombre_destinatario}
• Dirección: ${pedido.direccion}
• Fecha: ${pedido.fecha_entrega}
• Horario: ${pedido.franja_horaria}

💰 *Total: $${Number(pedido.total).toLocaleString('es-AR')}*

📦 *Productos:*
${pedido.items.map(item => 
  `• ${item.cantidad}x ${item.producto_nombre} - $${Number(item.precio).toLocaleString('es-AR')}`
).join('\n')}

${pedido.dedicatoria ? `\n💌 *Dedicatoria:*\n"${pedido.dedicatoria}"\n` : ''}

📱 Te notificaremos cuando esté en camino.

¡Gracias por elegirnos! 💐
`.trim();

return {
  json: {
    telefono: telefono,
    mensaje: mensaje,
    pedido_id: pedido.pedido_id
  }
};
```

**Nodo 3: Twilio**
- Agregar **"Twilio"**
- Click **"Create New Credential"**
- Configurar credenciales Twilio:
  - Account SID: (de Twilio Console)
  - Auth Token: (de Twilio Console)
- Configuración del nodo:
  - Resource: `Message`
  - Operation: `Send`
  - From: `whatsapp:+14155238886` (tu número Twilio)
  - To: `whatsapp:+{{ $json.telefono }}`
  - Message: `{{ $json.mensaje }}`

**Nodo 4: Set - Respuesta**
- Agregar **"Set"**
- Keep Only Set: ✅
- Values:
  - `status` = `success`
  - `message` = `Notificación enviada`
  - `pedido_id` = `{{ $('Function').item.json.pedido_id }}`

**Guardar y Activar:**
1. Click **Save** (💾)
2. Toggle **Active** → ON

### 3.3 Crear Workflow: Cambio de Estado

Repetir proceso similar pero con:
- Path: `pedido-estado`
- Mensaje dinámico según estado (preparando, en_camino, entregado, cancelado)

---

## 📋 Paso 4: Testing desde Railway

### 4.1 Test Manual con cURL

Desde tu máquina local:

```bash
curl -X POST https://tu-n8n.up.railway.app/webhook/pedido-confirmado \
  -H "X-API-Key: floreria_n8n_api_key_2025_super_secret_change_this" \
  -H "Content-Type: application/json" \
  -d '{
    "pedido_id": 1,
    "numero_pedido": "TEST123",
    "nombre_destinatario": "Juan Pérez",
    "telefono_destinatario": "1234567890",
    "direccion": "Av. Corrientes 1234",
    "fecha_entrega": "25/10/2025",
    "franja_horaria": "Mañana (9-12)",
    "estado": "confirmado",
    "total": "15000",
    "dedicatoria": "Feliz cumpleaños!",
    "items": [
      {
        "producto_nombre": "Ramo de Rosas",
        "cantidad": 1,
        "precio": "15000"
      }
    ]
  }'
```

### 4.2 Ver Ejecuciones en n8n

1. En n8n → **Executions** (📊)
2. Ver historial de ejecuciones
3. Click en una ejecución para ver detalles

---

## 📋 Paso 5: Integración Automática Django → n8n

El código ya está listo en `notificaciones/n8n_service.py`.

Cuando crees un pedido en producción, automáticamente:
1. Django llama a `pedido.confirmar_pedido()`
2. Se ejecuta `n8n_service.enviar_notificacion_pedido()`
3. Se envía webhook a n8n en Railway
4. n8n procesa y envía WhatsApp vía Twilio
5. Cliente recibe notificación

---

## 🔧 Troubleshooting

### Problema: n8n no inicia en Railway

**Solución:**
1. Ver logs: Service → Deployments → Click en deployment → Logs
2. Verificar variables de entorno
3. Verificar que PostgreSQL esté conectado

### Problema: Webhook devuelve 401 Unauthorized

**Solución:**
1. Verificar que `X-API-Key` en Django coincida con n8n
2. Verificar que workflow esté **Active** (toggle ON)

### Problema: WhatsApp no llega

**Solución:**
1. Verificar credenciales de Twilio en n8n
2. Verificar formato de teléfono (debe tener código país 54)
3. Ver ejecución en n8n → Executions para ver error específico

### Problema: Error de conexión desde Django

**Solución:**
1. Verificar `N8N_WEBHOOK_URL` en variables de Railway
2. Debe ser HTTPS: `https://tu-n8n.up.railway.app`
3. No debe tener `/` al final

---

## 💰 Costos Estimados en Railway

| Servicio | Uso Mensual | Costo |
|----------|-------------|-------|
| **n8n** | ~100 horas | $5 |
| **PostgreSQL n8n** | 1GB | $5 |
| **Total n8n** | | **$10/mes** |
| **Django (existente)** | | $5-20 |
| **Twilio WhatsApp** | 3000 msgs | $15 |
| **TOTAL** | | **$30-45/mes** |

**Plan gratuito Railway:** $5 de crédito/mes (suficiente para testing)

---

## 📊 Monitoreo en Producción

### Ver Logs de n8n
1. Railway Dashboard → Servicio n8n → Deployments
2. Click en deployment activo → View Logs

### Ver Ejecuciones
1. Abrir n8n: `https://tu-n8n.up.railway.app`
2. Ir a **Executions**
3. Filtrar por exitosas/fallidas

### Métricas
- Railway muestra automáticamente:
  - CPU usage
  - Memory usage
  - Network traffic

---

## 🚀 Próximos Pasos

1. ✅ Desplegar n8n en Railway
2. ✅ Configurar variables en Django
3. ✅ Crear workflows
4. ✅ Configurar Twilio
5. ✅ Testing completo
6. ⏭️ Monitorear en producción

---

## 📞 Soporte

- **Railway Docs:** https://docs.railway.app/
- **n8n Docs:** https://docs.n8n.io/
- **Twilio Docs:** https://www.twilio.com/docs/whatsapp

---

**¿Listo para desplegar?** Sigue los pasos en orden y estarás enviando WhatsApps en producción en ~30 minutos. 🚀
