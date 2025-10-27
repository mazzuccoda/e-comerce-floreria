# 📱 Guía de Prueba: n8n + Twilio WhatsApp

## 🎯 Objetivo
Probar el envío de mensajes de WhatsApp usando n8n como orquestador y Twilio como proveedor.

---

## 📋 Pre-requisitos

### 1. Cuenta de Twilio
- Crear cuenta en: https://www.twilio.com/
- Activar WhatsApp Sandbox o comprar número
- Obtener credenciales:
  - Account SID
  - Auth Token
  - WhatsApp Number

### 2. n8n en Railway
- URL: `https://n8n-production-e029.up.railway.app`
- Workflow activo con webhook
- API Key configurada

### 3. Variables de Entorno
Configurar en Railway o `.env.local`:

```bash
# n8n
N8N_WEBHOOK_URL=https://n8n-production-e029.up.railway.app
N8N_API_KEY=tu_api_key_secreta
N8N_ENABLED=True

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## 🧪 Ejecutar Pruebas

### Opción 1: Script Completo
```bash
cd /ruta/al/proyecto
python test_n8n_whatsapp.py
```

### Opción 2: Prueba Manual con curl
```bash
curl -X POST https://n8n-production-e029.up.railway.app/webhook/pedido-confirmado \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu_api_key" \
  -d '{
    "pedido_id": 99999,
    "numero_pedido": "TEST-001",
    "nombre_destinatario": "Juan Pérez",
    "telefono_destinatario": "+5491123456789",
    "direccion": "Av. Corrientes 1234, CABA",
    "fecha_entrega": "28/10/2025",
    "franja_horaria": "Mañana (9:00 - 13:00)",
    "estado": "confirmado",
    "total": "15000.00",
    "dedicatoria": "Feliz cumpleaños! 🎂",
    "items": [
      {
        "producto_nombre": "Ramo de 12 Rosas Rojas",
        "cantidad": 1,
        "precio": "15000.00"
      }
    ]
  }'
```

### Opción 3: Desde Django Shell
```bash
python manage.py shell
```

```python
from notificaciones.n8n_service import n8n_service
from datetime import datetime, timedelta

# Crear pedido mock
class MockPedido:
    id = 99999
    numero_pedido = 'TEST-001'
    nombre_destinatario = 'Juan Pérez'
    telefono_destinatario = '+5491123456789'  # TU NÚMERO AQUÍ
    direccion = 'Av. Corrientes 1234'
    fecha_entrega = datetime.now() + timedelta(days=1)
    estado = 'confirmado'
    total = 15000.00
    dedicatoria = 'Feliz cumpleaños! 🎂'
    
    def get_franja_horaria_display(self):
        return 'Mañana (9:00 - 13:00)'
    
    class Items:
        @staticmethod
        def all():
            class Item:
                class Producto:
                    nombre = 'Ramo de 12 Rosas Rojas'
                producto = Producto()
                cantidad = 1
                precio = '15000.00'
            return [Item()]
    items = Items()

# Enviar notificación
pedido = MockPedido()
resultado = n8n_service.enviar_notificacion_pedido(pedido, tipo='confirmado')
print(f"Resultado: {resultado}")
```

---

## 🔧 Configuración del Workflow en n8n

### Nodo 1: Webhook (Trigger)
```
Method: POST
Path: /webhook/pedido-confirmado
Authentication: Header Auth
  - Name: X-API-Key
  - Value: {{$env.N8N_API_KEY}}
```

### Nodo 2: Code (Procesar datos)
```javascript
// Extraer datos del pedido
const pedido = $input.item.json;

// Formatear número de teléfono
let telefono = pedido.telefono_destinatario;
if (!telefono.startsWith('+')) {
  telefono = '+' + telefono;
}

// Crear mensaje
const mensaje = `¡Hola! 👋

Gracias por tu compra en Florería Cristina.

*Pedido #${pedido.numero_pedido}* confirmado ✅

📦 *Detalles de entrega:*
• Destinatario: ${pedido.nombre_destinatario}
• Dirección: ${pedido.direccion}
• Fecha: ${pedido.fecha_entrega}
• Horario: ${pedido.franja_horaria}

💰 Total: $${pedido.total}

${pedido.dedicatoria ? `💌 Dedicatoria: "${pedido.dedicatoria}"` : ''}

¡Pronto te confirmaremos la entrega! 🌸`;

return {
  to: telefono,
  message: mensaje
};
```

### Nodo 3: Twilio (Enviar WhatsApp)
```
Credential: Twilio API
Resource: SMS
Operation: Send

From: whatsapp:{{$env.TWILIO_WHATSAPP_NUMBER}}
To: whatsapp:{{$json.to}}
Message: {{$json.message}}
```

---

## ✅ Checklist de Verificación

### Antes de Probar:
- [ ] Twilio configurado y activo
- [ ] WhatsApp Sandbox activado (o número comprado)
- [ ] Tu número agregado al Sandbox de Twilio
- [ ] n8n workflow creado y ACTIVO
- [ ] Variables de entorno configuradas
- [ ] N8N_ENABLED=True

### Durante la Prueba:
- [ ] Script ejecutado sin errores
- [ ] Webhook responde con status 200
- [ ] Logs de n8n muestran ejecución exitosa
- [ ] Twilio muestra mensaje enviado

### Después de la Prueba:
- [ ] Mensaje recibido en WhatsApp
- [ ] Formato del mensaje correcto
- [ ] Datos del pedido correctos
- [ ] Sin errores en logs

---

## 🐛 Troubleshooting

### Error: "Connection refused"
**Causa**: n8n no está accesible
**Solución**: Verifica que n8n esté corriendo en Railway

### Error: "Unauthorized" (401)
**Causa**: API Key incorrecta
**Solución**: Verifica N8N_API_KEY en variables de entorno

### Error: "Twilio authentication failed"
**Causa**: Credenciales de Twilio incorrectas
**Solución**: Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN

### Error: "Invalid phone number"
**Causa**: Formato de número incorrecto
**Solución**: Usar formato E.164: +5491123456789

### Mensaje no llega
**Causa**: Número no registrado en Sandbox
**Solución**: 
1. Ir a Twilio Console → WhatsApp Sandbox
2. Enviar mensaje de activación desde tu WhatsApp
3. Esperar confirmación

---

## 📊 Logs y Monitoreo

### Ver logs en Railway:
```bash
railway logs
```

### Ver logs en Django:
```bash
tail -f logs/django.log
```

### Ver ejecuciones en n8n:
1. Ir a n8n dashboard
2. Click en "Executions"
3. Ver detalles de cada ejecución

---

## 🚀 Integración Final

Una vez que las pruebas funcionen, integrar en `pedidos/models.py`:

```python
def confirmar_pedido(self):
    # ... código existente de email ...
    
    # Agregar notificación WhatsApp vía n8n
    try:
        from notificaciones.n8n_service import n8n_service
        
        if n8n_service.enabled:
            logger.info(f"📱 Enviando WhatsApp vía n8n...")
            whatsapp_enviado = n8n_service.enviar_notificacion_pedido(
                pedido=self,
                tipo='confirmado'
            )
            if whatsapp_enviado:
                logger.info(f"✅ WhatsApp enviado")
    except Exception as e:
        logger.error(f"❌ Error WhatsApp: {str(e)}")
```

---

## 📞 Soporte

- Twilio Docs: https://www.twilio.com/docs/whatsapp
- n8n Docs: https://docs.n8n.io/
- Railway Docs: https://docs.railway.app/

---

## 🎉 ¡Listo!

Si todas las pruebas pasan, el sistema está listo para enviar WhatsApp automáticamente cuando se confirme un pedido.
