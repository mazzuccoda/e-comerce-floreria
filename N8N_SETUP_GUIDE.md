# 🔄 Guía de Setup n8n + Twilio para WhatsApp

## 📋 Paso 1: Levantar n8n

### 1.1 Iniciar servicio n8n

```bash
# Levantar solo n8n (primera vez)
docker-compose up -d n8n

# Ver logs
docker-compose logs -f n8n

# Verificar que está corriendo
docker-compose ps
```

### 1.2 Acceder a n8n

1. Abrir navegador en: **http://localhost:5678**
2. Login con credenciales:
   - **Usuario:** `admin`
   - **Password:** `Floreria2025!Secure` (configurado en `.env.docker`)

---

## 📋 Paso 2: Configurar Twilio en n8n

### 2.1 Obtener credenciales de Twilio

1. Ir a [Twilio Console](https://console.twilio.com/)
2. Copiar:
   - **Account SID:** `ACxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token:** `xxxxxxxxxxxxxxxxxxxxxxxx`
   - **WhatsApp Number:** `whatsapp:+14155238886`

### 2.2 Configurar credenciales en n8n

1. En n8n, ir a **Settings** (⚙️) → **Credentials**
2. Click en **+ Add Credential**
3. Buscar y seleccionar **Twilio API**
4. Llenar:
   - **Credential Name:** `Twilio Floreria Cristina`
   - **Account SID:** (pegar tu Account SID)
   - **Auth Token:** (pegar tu Auth Token)
5. Click **Save**

---

## 📋 Paso 3: Crear Workflow - Pedido Confirmado

### 3.1 Crear nuevo workflow

1. En n8n, click en **+ New Workflow**
2. Nombre: `WhatsApp - Pedido Confirmado`

### 3.2 Agregar nodos

#### Nodo 1: Webhook (Trigger)

1. Buscar y agregar nodo **Webhook**
2. Configurar:
   - **HTTP Method:** POST
   - **Path:** `pedido-confirmado`
   - **Authentication:** Header Auth
   - **Header Name:** `X-API-Key`
   - **Header Value:** `floreria_n8n_api_key_2025_super_secret_change_this`
   - **Response Mode:** When Last Node Finishes
3. Click **Execute Node** para obtener la URL del webhook
4. **Copiar URL:** `http://n8n:5678/webhook/pedido-confirmado`

#### Nodo 2: Function - Validar y Formatear

1. Agregar nodo **Function**
2. Conectar desde Webhook
3. Código:

```javascript
// Validar datos recibidos
const pedido = $input.item.json;

if (!pedido.numero_pedido || !pedido.telefono_destinatario) {
  throw new Error('❌ Datos incompletos: falta numero_pedido o telefono_destinatario');
}

// Formatear teléfono argentino
let telefono = pedido.telefono_destinatario.toString().replace(/\D/g, '');

// Agregar código de país si falta
if (!telefono.startsWith('54')) {
  telefono = '54' + telefono;
}

// Formatear mensaje de WhatsApp
const mensaje = `
🌸 *Florería Cristina* 🌸

✅ *¡Pedido Confirmado!*

📋 *Detalles del Pedido:*
• Número: #${pedido.numero_pedido}
• Destinatario: ${pedido.nombre_destinatario}
• Dirección: ${pedido.direccion}
• Fecha de entrega: ${pedido.fecha_entrega}
• Horario: ${pedido.franja_horaria}

💰 *Total: $${Number(pedido.total).toLocaleString('es-AR')}*

📦 *Productos:*
${pedido.items.map(item => 
  `• ${item.cantidad}x ${item.producto_nombre} - $${Number(item.precio).toLocaleString('es-AR')}`
).join('\n')}

${pedido.dedicatoria ? `\n💌 *Dedicatoria:*\n"${pedido.dedicatoria}"\n` : ''}

📱 Te notificaremos cuando tu pedido esté en camino.

¡Gracias por elegirnos! 💐
`.trim();

return {
  json: {
    telefono: telefono,
    mensaje: mensaje,
    pedido_id: pedido.pedido_id,
    numero_pedido: pedido.numero_pedido
  }
};
```

#### Nodo 3: Twilio - Enviar WhatsApp

1. Agregar nodo **Twilio**
2. Conectar desde Function
3. Configurar:
   - **Credential:** Seleccionar `Twilio Floreria Cristina`
   - **Resource:** Message
   - **Operation:** Send
   - **From:** `whatsapp:+14155238886` (tu número Twilio)
   - **To:** `whatsapp:+{{ $json.telefono }}`
   - **Message:** `{{ $json.mensaje }}`
4. Click **Execute Node** para probar

#### Nodo 4: Set - Respuesta

1. Agregar nodo **Set**
2. Conectar desde Twilio
3. Configurar:
   - **Keep Only Set:** ✅ Activado
   - Agregar valores:
     - **Name:** `status` | **Value:** `success`
     - **Name:** `message` | **Value:** `Notificación enviada`
     - **Name:** `pedido_id` | **Value:** `{{ $('Function').item.json.pedido_id }}`
     - **Name:** `sid` | **Value:** `{{ $json.sid }}`

### 3.3 Guardar workflow

1. Click en **Save** (💾)
2. Activar workflow: Toggle **Active** en ON

---

## 📋 Paso 4: Crear Workflow - Cambio de Estado

### 4.1 Crear segundo workflow

1. Click en **+ New Workflow**
2. Nombre: `WhatsApp - Cambio Estado Pedido`

### 4.2 Agregar nodos

#### Nodo 1: Webhook

- **Path:** `pedido-estado`
- **Authentication:** Header Auth (mismo API Key)

#### Nodo 2: Function - Mensaje según Estado

```javascript
const pedido = $input.item.json;

// Validar
if (!pedido.estado || !pedido.telefono_destinatario) {
  throw new Error('❌ Datos incompletos');
}

// Formatear teléfono
let telefono = pedido.telefono_destinatario.toString().replace(/\D/g, '');
if (!telefono.startsWith('54')) {
  telefono = '54' + telefono;
}

// Mensajes según estado
const mensajes = {
  preparando: `
🌺 *Tu pedido está siendo preparado*

Pedido #${pedido.numero_pedido}

Estamos seleccionando las mejores flores para ti.
Te avisaremos cuando salga para entrega.

💐 Florería Cristina
  `,
  
  en_camino: `
🚚 *¡Tu pedido está en camino!*

Pedido #${pedido.numero_pedido}

Nuestro repartidor ya salió con tu pedido.
Llegará aproximadamente entre las ${pedido.franja_horaria}.

📍 Dirección: ${pedido.direccion}

💐 Florería Cristina
  `,
  
  entregado: `
✅ *¡Pedido entregado con éxito!*

Pedido #${pedido.numero_pedido}

Esperamos que disfrutes de tus flores 🌸

¿Nos ayudas con una reseña? Tu opinión es muy importante para nosotros.

💐 Florería Cristina
  `,
  
  cancelado: `
❌ *Pedido cancelado*

Pedido #${pedido.numero_pedido}

Tu pedido ha sido cancelado.

Si tienes dudas, no dudes en contactarnos.

💐 Florería Cristina
  `
};

const mensaje = mensajes[pedido.estado] || `Estado actualizado: ${pedido.estado}`;

return {
  json: {
    telefono: telefono,
    mensaje: mensaje.trim(),
    pedido_id: pedido.pedido_id,
    estado: pedido.estado
  }
};
```

#### Nodo 3: Twilio (igual que antes)

#### Nodo 4: Set (igual que antes)

### 4.3 Guardar y activar

---

## 📋 Paso 5: Integrar con Django

### 5.1 Crear servicio n8n

**Archivo:** `backend/notificaciones/n8n_service.py`

```python
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class N8NService:
    """Servicio para enviar notificaciones vía n8n + Twilio"""
    
    def __init__(self):
        self.base_url = settings.N8N_WEBHOOK_URL
        self.api_key = settings.N8N_API_KEY
        self.enabled = settings.N8N_ENABLED
    
    def enviar_notificacion_pedido(self, pedido, tipo='confirmado'):
        """
        Envía notificación de pedido vía n8n
        
        Args:
            pedido: Instancia de Pedido
            tipo: 'confirmado' o 'estado'
        
        Returns:
            bool: True si se envió exitosamente
        """
        if not self.enabled:
            logger.info("n8n deshabilitado, notificación no enviada")
            return False
        
        try:
            # Preparar datos
            data = {
                'pedido_id': pedido.id,
                'numero_pedido': pedido.numero_pedido,
                'nombre_destinatario': pedido.nombre_destinatario,
                'telefono_destinatario': pedido.telefono_destinatario,
                'direccion': pedido.direccion,
                'fecha_entrega': pedido.fecha_entrega.strftime('%d/%m/%Y'),
                'franja_horaria': pedido.get_franja_horaria_display(),
                'estado': pedido.estado,
                'total': str(pedido.total),
                'dedicatoria': pedido.dedicatoria or '',
                'items': [
                    {
                        'producto_nombre': item.producto.nombre,
                        'cantidad': item.cantidad,
                        'precio': str(item.precio)
                    }
                    for item in pedido.items.all()
                ]
            }
            
            # Determinar webhook
            webhook_path = '/webhook/pedido-confirmado' if tipo == 'confirmado' else '/webhook/pedido-estado'
            
            # Enviar a n8n
            logger.info(f"📤 Enviando notificación n8n para pedido #{pedido.numero_pedido}")
            
            response = requests.post(
                f"{self.base_url}{webhook_path}",
                json=data,
                headers={
                    'X-API-Key': self.api_key,
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Notificación WhatsApp enviada para pedido #{pedido.numero_pedido}")
                return True
            else:
                logger.error(f"❌ Error n8n: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error(f"⏱️ Timeout al enviar notificación para pedido #{pedido.numero_pedido}")
            return False
        except Exception as e:
            logger.error(f"❌ Error enviando notificación n8n: {str(e)}")
            return False

# Instancia global
n8n_service = N8NService()
```

### 5.2 Actualizar settings.py

**Archivo:** `backend/floreria_cristina/settings.py`

Agregar al final:

```python
# ==============================================================================
# N8N CONFIGURATION
# ==============================================================================
N8N_WEBHOOK_URL = env('N8N_WEBHOOK_URL', default='http://n8n:5678')
N8N_API_KEY = env('N8N_API_KEY', default='')
N8N_ENABLED = env.bool('N8N_ENABLED', default=True)
```

### 5.3 Modificar modelo Pedido

**Archivo:** `backend/pedidos/models.py`

Modificar método `confirmar_pedido()`:

```python
def confirmar_pedido(self):
    """Confirma el pedido y envía notificaciones"""
    if self.confirmado:
        return False, "El pedido ya está confirmado"
    
    # ... código existente de validación y reducción de stock ...
    
    self.confirmado = True
    self.save()
    
    # Enviar notificación vía n8n + Twilio
    try:
        from notificaciones.n8n_service import n8n_service
        n8n_service.enviar_notificacion_pedido(self, tipo='confirmado')
    except Exception as e:
        logger.error(f"Error enviando notificación n8n: {str(e)}")
    
    return True, "Pedido confirmado exitosamente"
```

Agregar en método `save()`:

```python
def save(self, *args, **kwargs):
    """Override save para detectar cambios de estado"""
    estado_anterior = None
    if self.pk:
        try:
            estado_anterior = Pedido.objects.get(pk=self.pk).estado
        except Pedido.DoesNotExist:
            pass
    
    super().save(*args, **kwargs)
    
    # Si cambió el estado, enviar notificación
    if estado_anterior and estado_anterior != self.estado and self.confirmado:
        try:
            from notificaciones.n8n_service import n8n_service
            n8n_service.enviar_notificacion_pedido(self, tipo='estado')
        except Exception as e:
            logger.error(f"Error enviando notificación de cambio de estado: {str(e)}")
```

---

## 📋 Paso 6: Testing

### 6.1 Script de prueba

**Archivo:** `backend/test_n8n_whatsapp.py`

```python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from pedidos.models import Pedido
from notificaciones.n8n_service import n8n_service

def test_notificacion_whatsapp():
    """Test de notificación WhatsApp vía n8n"""
    
    # Obtener último pedido
    pedido = Pedido.objects.filter(confirmado=True).last()
    
    if not pedido:
        print("❌ No hay pedidos confirmados en la BD")
        return
    
    print(f"\n📤 Enviando notificación de prueba")
    print(f"📋 Pedido: #{pedido.numero_pedido}")
    print(f"📱 Teléfono: {pedido.telefono_destinatario}")
    print(f"💰 Total: ${pedido.total}")
    
    # Enviar notificación
    resultado = n8n_service.enviar_notificacion_pedido(pedido, tipo='confirmado')
    
    if resultado:
        print("\n✅ Notificación WhatsApp enviada exitosamente")
        print("📱 Revisa tu WhatsApp para ver el mensaje")
    else:
        print("\n❌ Error al enviar notificación")
        print("🔍 Revisa los logs de n8n en http://localhost:5678/executions")

if __name__ == '__main__':
    test_notificacion_whatsapp()
```

### 6.2 Ejecutar test

```bash
# Dentro del contenedor Django
docker-compose exec web python test_n8n_whatsapp.py
```

---

## 📊 Monitoreo

### Ver ejecuciones en n8n

1. Ir a http://localhost:5678
2. Click en **Executions** (📊)
3. Ver historial de ejecuciones:
   - ✅ Exitosas (verde)
   - ❌ Fallidas (rojo)
   - ⏱️ Tiempo de ejecución

### Ver logs de Docker

```bash
# Logs de n8n
docker-compose logs -f n8n

# Logs de Django
docker-compose logs -f web
```

---

## 🔧 Troubleshooting

### Problema: n8n no inicia

```bash
# Ver logs
docker-compose logs n8n

# Reiniciar servicio
docker-compose restart n8n
```

### Problema: Webhook no responde

1. Verificar que el workflow esté **Active** (toggle en ON)
2. Verificar URL del webhook en n8n
3. Verificar API Key en `.env.docker`

### Problema: WhatsApp no llega

1. Verificar credenciales de Twilio en n8n
2. Verificar formato de teléfono (debe incluir código país 54)
3. Ver ejecución en n8n → Executions

---

## 📈 Próximos Pasos

1. ✅ Configurar n8n en Railway para producción
2. ✅ Agregar más workflows (recordatorios, promociones)
3. ✅ Implementar dashboard de métricas
4. ✅ Configurar alertas automáticas

---

**¿Necesitas ayuda?** Revisa los logs o contacta al equipo de desarrollo.
