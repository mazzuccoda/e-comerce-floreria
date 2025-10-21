# 🚀 SOLUCIÓN: USAR SENDGRID API EN LUGAR DE SMTP

## 🔍 PROBLEMA IDENTIFICADO

Railway está bloqueando **TODOS los puertos SMTP** (587 y 465), por lo que no es posible enviar emails usando el backend SMTP de Django.

**Logs confirman el bloqueo:**
```
📤 Iniciando envío de email...
[SE BLOQUEA AQUÍ - NO HAY RESPUESTA]
```

## ✅ SOLUCIÓN: SENDGRID API

En lugar de usar SMTP, usaremos la **API REST de SendGrid** que funciona sobre HTTP/HTTPS (puerto 443) que Railway NO bloquea.

---

## 📦 PASO 1: INSTALAR SENDGRID PYTHON

Agrega `sendgrid` a tus dependencias:

```bash
# En requirements.txt, agrega:
sendgrid==6.11.0
```

O instala directamente:
```bash
pip install sendgrid
```

---

## 🔧 PASO 2: MODIFICAR CONFIGURACIÓN EN RAILWAY

En Railway → Variables, **REEMPLAZA** las variables de email por:

```bash
# Elimina o comenta estas:
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=465
# EMAIL_USE_TLS=False
# EMAIL_USE_SSL=True
# EMAIL_HOST_USER=apikey
# EMAIL_HOST_PASSWORD=SG.xxx...

# Agrega estas nuevas:
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
USE_SENDGRID_API=True
```

**⚠️ IMPORTANTE:**
- `SENDGRID_API_KEY` debe ser tu API Key de SendGrid (la misma que usabas en `EMAIL_HOST_PASSWORD`)
- `USE_SENDGRID_API=True` le indica al sistema que use la API en lugar de SMTP

---

## 📝 PASO 3: CREAR BACKEND PERSONALIZADO DE SENDGRID

Crea un nuevo archivo para el backend de SendGrid:

**Archivo:** `notificaciones/sendgrid_backend.py`

```python
"""
Backend personalizado de email usando SendGrid API
"""

import logging
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

logger = logging.getLogger(__name__)


class SendGridAPIBackend(BaseEmailBackend):
    """
    Backend de email que usa la API de SendGrid en lugar de SMTP
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        if not self.api_key:
            logger.error("SENDGRID_API_KEY no configurada")
            if not fail_silently:
                raise ValueError("SENDGRID_API_KEY no configurada")
        
        self.client = SendGridAPIClient(self.api_key)
        logger.info("✅ SendGrid API Backend inicializado")
    
    def send_messages(self, email_messages):
        """
        Envía una lista de mensajes de email usando SendGrid API
        """
        if not email_messages:
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += 1
            except Exception as e:
                logger.error(f"❌ Error enviando email: {str(e)}")
                if not self.fail_silently:
                    raise
        
        return num_sent
    
    def _send(self, message):
        """
        Envía un mensaje individual usando SendGrid API
        """
        try:
            # Preparar email
            from_email = Email(message.from_email)
            to_email = To(message.to[0])  # SendGrid API envía a un destinatario a la vez
            subject = message.subject
            content = Content("text/plain", message.body)
            
            mail = Mail(from_email, to_email, subject, content)
            
            logger.info(f"📤 Enviando email vía SendGrid API...")
            logger.info(f"   📮 Desde: {from_email.email}")
            logger.info(f"   📬 Para: {to_email.email}")
            logger.info(f"   📋 Asunto: {subject}")
            
            # Enviar usando API
            response = self.client.send(mail)
            
            logger.info(f"✅ Email enviado exitosamente vía SendGrid API")
            logger.info(f"   📊 Status Code: {response.status_code}")
            logger.info(f"   📝 Message ID: {response.headers.get('X-Message-Id', 'N/A')}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error enviando email vía SendGrid API: {str(e)}")
            logger.error(f"   Tipo: {type(e).__name__}")
            
            if hasattr(e, 'body'):
                logger.error(f"   Body: {e.body}")
            
            raise
```

---

## 🔄 PASO 4: MODIFICAR SETTINGS.PY

Actualiza la configuración de email en `settings.py`:

```python
# Email Configuration
# --------------------------------------------------------------------------

# Determinar si usar SendGrid API o SMTP
USE_SENDGRID_API = env.bool('USE_SENDGRID_API', default=False)

if USE_SENDGRID_API:
    # Usar SendGrid API (recomendado para Railway)
    EMAIL_BACKEND = 'notificaciones.sendgrid_backend.SendGridAPIBackend'
    SENDGRID_API_KEY = env('SENDGRID_API_KEY', default='')
    logger.info("📧 Usando SendGrid API Backend")
else:
    # Usar SMTP tradicional (puede estar bloqueado en Railway)
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
    logger.info("📧 Usando SMTP Backend")

DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='no-responder@floreriacristina.com')
SERVER_EMAIL = DEFAULT_FROM_EMAIL
```

---

## 🧪 PASO 5: PROBAR LOCALMENTE (OPCIONAL)

Antes de desplegar, prueba localmente:

```bash
# En tu .env local:
USE_SENDGRID_API=True
SENDGRID_API_KEY=SG.xxx...
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>

# Ejecuta el script de diagnóstico:
python diagnostico_email_railway.py
```

---

## 🚀 PASO 6: DESPLEGAR EN RAILWAY

1. **Actualiza requirements.txt** con `sendgrid==6.11.0`
2. **Crea el archivo** `notificaciones/sendgrid_backend.py`
3. **Modifica settings.py** con la configuración anterior
4. **Configura variables en Railway**:
   ```bash
   USE_SENDGRID_API=True
   SENDGRID_API_KEY=SG.xxx...
   DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
   ```
5. **Haz commit y push**:
   ```bash
   git add .
   git commit -m "Implementar SendGrid API para emails"
   git push origin master
   ```
6. **Espera 2-3 minutos** al redespliegue
7. **Crea un pedido de prueba**

---

## 📊 LOGS ESPERADOS

Con SendGrid API, verás logs como:

**✅ ÉXITO:**
```
📤 Enviando email vía SendGrid API...
   📮 Desde: mazzucoda@gmail.com
   📬 Para: dmazzucco@sanmiguelglobal.com
   📋 Asunto: ✅ Pedido #94 Confirmado
✅ Email enviado exitosamente vía SendGrid API
   📊 Status Code: 202
   📝 Message ID: abc123...
```

**❌ ERROR:**
```
❌ Error enviando email vía SendGrid API: Unauthorized
   Tipo: UnauthorizedError
   Body: {"errors":[{"message":"The provided authorization grant is invalid"}]}
```

---

## 🎯 VENTAJAS DE USAR SENDGRID API

1. ✅ **No requiere puertos SMTP** - Funciona sobre HTTPS (puerto 443)
2. ✅ **Más rápido** - Conexión directa sin handshake SMTP
3. ✅ **Más confiable** - No hay timeouts de conexión
4. ✅ **Mejor tracking** - Message ID para seguimiento
5. ✅ **Más features** - Acceso a templates, analytics, etc.

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Module 'sendgrid' not found"
**Solución:** Asegúrate de que `sendgrid==6.11.0` esté en `requirements.txt` y redespliega.

### Error: "SENDGRID_API_KEY no configurada"
**Solución:** Verifica que la variable `SENDGRID_API_KEY` esté en Railway con tu API Key.

### Error: "Unauthorized"
**Solución:** Tu API Key es inválida. Crea una nueva en SendGrid con permisos de "Mail Send".

### Los emails no llegan
**Solución:** 
1. Revisa logs para confirmar status code 202
2. Ve a SendGrid → Activity → Email Activity
3. Busca el Message ID en los logs
4. Revisa spam/correo no deseado

---

**Última actualización**: 20/10/2025 21:07 UTC-3
**Autor**: Cascade AI Assistant
