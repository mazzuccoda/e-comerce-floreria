# Workflow n8n: Recuperación de Contraseña por WhatsApp

## 📋 Descripción
Este workflow recibe solicitudes de recuperación de contraseña desde Django y envía un mensaje de WhatsApp con el enlace de reset usando Evolution API.

---

## 🔗 Webhook
**URL:** `https://tu-n8n.railway.app/webhook/password-reset`
**Método:** `POST`
**Autenticación:** Header `X-API-Key`

---

## 📥 Payload de Entrada (desde Django)

```json
{
  "event": "password_reset",
  "customer": {
    "name": "Juan Pérez",
    "phone": "+5491112345678"
  },
  "reset": {
    "url": "https://floreriacristina.com.ar/reset-password/ABC123XYZ...",
    "token": "ABC123XYZ..."
  },
  "meta": {
    "source": "django",
    "type": "password_recovery"
  }
}
```

---

## 🔧 Configuración del Workflow en n8n

### **1. Webhook Node**
- **Tipo:** Webhook
- **Path:** `/webhook/password-reset`
- **Método:** `POST`
- **Authentication:** Header Auth
  - Header Name: `X-API-Key`
  - Header Value: `{{ $env.N8N_API_KEY }}`

### **2. Function Node - Preparar Mensaje**
```javascript
// Extraer datos del payload
const customerName = $input.item.json.customer.name;
const customerPhone = $input.item.json.customer.phone;
const resetUrl = $input.item.json.reset.url;

// Construir mensaje de WhatsApp
const message = `🔐 *Recuperación de Contraseña - Florería Cristina*

Hola ${customerName},

Recibimos tu solicitud para restablecer tu contraseña.

Para crear una nueva contraseña, hacé click en el siguiente enlace:
${resetUrl}

⏰ Este enlace expirará en 2 horas.

Si no solicitaste este cambio, podés ignorar este mensaje.

🌸 Saludos,
Florería Cristina`;

return {
  phone: customerPhone,
  message: message
};
```

### **3. Evolution API Node - Enviar WhatsApp**
- **Tipo:** HTTP Request
- **Método:** `POST`
- **URL:** `{{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}`
- **Authentication:** Bearer Token
  - Token: `{{ $env.EVOLUTION_API_KEY }}`
- **Body (JSON):**
```json
{
  "number": "{{ $json.phone }}",
  "text": "{{ $json.message }}"
}
```

### **4. Response Node**
- **Tipo:** Respond to Webhook
- **Status Code:** `200`
- **Body:**
```json
{
  "success": true,
  "message": "WhatsApp de recuperación enviado",
  "phone": "{{ $json.phone }}"
}
```

---

## 🔐 Variables de Entorno Requeridas en n8n

```bash
# Evolution API
EVOLUTION_API_URL=https://tu-evolution-api.com
EVOLUTION_INSTANCE=tu-instancia
EVOLUTION_API_KEY=tu-api-key

# Autenticación del webhook
N8N_API_KEY=tu-n8n-api-key-secreta
```

---

## 🧪 Testing

### **Desde Django (local o Railway):**
```bash
curl -X POST https://tu-n8n.railway.app/webhook/password-reset \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu-n8n-api-key" \
  -d '{
    "event": "password_reset",
    "customer": {
      "name": "Test Usuario",
      "phone": "+5491112345678"
    },
    "reset": {
      "url": "https://floreriacristina.com.ar/reset-password/test-token-123",
      "token": "test-token-123"
    },
    "meta": {
      "source": "django",
      "type": "password_recovery"
    }
  }'
```

### **Respuesta Esperada:**
```json
{
  "success": true,
  "message": "WhatsApp de recuperación enviado",
  "phone": "+5491112345678"
}
```

---

## 📊 Logs y Monitoreo

### **En n8n:**
- Ver ejecuciones en la pestaña "Executions"
- Verificar errores en cada nodo
- Revisar payload recibido y enviado

### **En Django:**
```python
# Logs en Railway
logger.info(f"📤 Enviando WhatsApp de recuperación a {telefono_normalizado}")
logger.info(f"✅ WhatsApp de recuperación enviado")
logger.error(f"❌ Error n8n: {response.status_code} - {response.text}")
```

---

## 🚨 Troubleshooting

### **Error: "401 Unauthorized"**
- Verificar que el header `X-API-Key` coincida en Django y n8n
- Revisar variable `N8N_API_KEY` en Railway

### **Error: "Evolution API no responde"**
- Verificar que Evolution API esté activo
- Revisar credenciales `EVOLUTION_API_KEY` y `EVOLUTION_INSTANCE`
- Verificar formato del teléfono (debe incluir código de país)

### **Error: "Teléfono inválido"**
- Django normaliza automáticamente con `normalizar_telefono_whatsapp()`
- Formato esperado: `+5491112345678` (sin espacios ni guiones)

---

## 🔄 Integración con Django

El backend ya está configurado para usar este webhook:

**Archivo:** `notificaciones/n8n_service.py`
**Método:** `enviar_recuperacion_password()`
**Webhook:** `/webhook/password-reset`

---

## ✅ Checklist de Implementación

- [ ] Crear workflow en n8n con los 4 nodos
- [ ] Configurar variables de entorno en n8n
- [ ] Configurar `N8N_WEBHOOK_URL` en Railway (Django)
- [ ] Configurar `N8N_API_KEY` en Railway (Django)
- [ ] Configurar `N8N_ENABLED=True` en Railway (Django)
- [ ] Probar con curl desde terminal
- [ ] Probar desde la página `/recuperar-password` (opción WhatsApp)
- [ ] Verificar que llegue el WhatsApp con el link correcto
- [ ] Verificar que el link funcione y permita cambiar contraseña

---

## 📝 Notas Adicionales

- El token expira en 2 horas (configurado en Django)
- El token es de un solo uso
- Los tokens antiguos se invalidan automáticamente al crear uno nuevo
- El mensaje de WhatsApp incluye el nombre del usuario para personalización
- El enlace apunta al dominio configurado en `FRONTEND_URL` (Railway)
