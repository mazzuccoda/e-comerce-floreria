# 🔐 Configuración: Recuperación de Contraseña Híbrida

## 📋 Resumen
Sistema de recuperación de contraseña con dos canales:
1. **WhatsApp** (Principal) - Evolution API vía n8n
2. **Email** (Fallback) - Resend vía django-anymail

---

## ✅ Estado de Implementación

### **Backend (Django):**
- ✅ Modelo `PasswordResetToken` con expiración de 2 horas
- ✅ Serializers para WhatsApp y Email
- ✅ Vista `SolicitarResetPasswordView` con lógica dual
- ✅ Método `n8n_service.enviar_recuperacion_password()`
- ✅ Configuración django-anymail + Resend

### **Frontend (Next.js):**
- ✅ Página `/recuperar-password` con selector de canal
- ✅ Página `/reset-password/[token]` para cambio de contraseña
- ✅ UI moderna con feedback visual

### **Infraestructura:**
- ⏳ Workflow n8n para `/webhook/password-reset` (pendiente crear)
- ⏳ Variables de entorno en Railway (pendiente configurar)

---

## 🔧 Configuración Requerida

### **1. Variables de Entorno en Railway (Backend)**

Agregar en el servicio de Django:

```bash
# Frontend URL
FRONTEND_URL=https://floreriacristina.com.ar

# n8n Configuration (WhatsApp)
N8N_WEBHOOK_URL=https://tu-n8n.railway.app
N8N_API_KEY=tu-clave-secreta-n8n
N8N_ENABLED=True

# Resend Configuration (Email)
USE_RESEND=True
RESEND_API_KEY=re_tu_api_key_de_resend
DEFAULT_FROM_EMAIL=no-responder@floreriacristina.com
```

### **2. Obtener API Key de Resend**

1. Ir a [resend.com](https://resend.com)
2. Crear cuenta (gratis - 100 emails/día)
3. Ir a **API Keys** → **Create API Key**
4. Copiar la key (empieza con `re_`)
5. Agregar a Railway como `RESEND_API_KEY`

**Verificar dominio (opcional pero recomendado):**
- Agregar dominio `floreriacristina.com.ar` en Resend
- Configurar registros DNS (SPF, DKIM)
- Esto mejora deliverability

### **3. Crear Workflow en n8n**

Ver documentación completa en: `WORKFLOW_N8N_PASSWORD_RESET.md`

**Resumen rápido:**
1. Crear nuevo workflow en n8n
2. Agregar 4 nodos:
   - Webhook (`/webhook/password-reset`)
   - Function (preparar mensaje)
   - HTTP Request (Evolution API)
   - Respond to Webhook
3. Configurar variables de entorno en n8n:
   - `EVOLUTION_API_URL`
   - `EVOLUTION_INSTANCE`
   - `EVOLUTION_API_KEY`
   - `N8N_API_KEY`
4. Activar workflow

---

## 🧪 Testing

### **1. Probar WhatsApp (Recomendado)**

1. Ir a: `https://floreriacristina.com.ar/recuperar-password`
2. Seleccionar **WhatsApp**
3. Ingresar teléfono registrado: `+54 9 11 1234-5678`
4. Click en "Enviar"
5. Verificar que llegue WhatsApp con link
6. Click en link del WhatsApp
7. Ingresar nueva contraseña
8. Verificar que se cambie correctamente

### **2. Probar Email (Fallback)**

1. Ir a: `https://floreriacristina.com.ar/recuperar-password`
2. Seleccionar **Email**
3. Ingresar email registrado: `usuario@ejemplo.com`
4. Click en "Enviar"
5. Verificar email (revisar spam si no llega)
6. Click en link del email
7. Ingresar nueva contraseña
8. Verificar que se cambie correctamente

---

## 📊 Monitoreo y Logs

### **Railway (Django):**
```bash
# Ver logs en tiempo real
railway logs

# Buscar logs de recuperación
railway logs | grep "recuperación"
railway logs | grep "WhatsApp de recuperación"
railway logs | grep "Email de recuperación"
```

### **n8n:**
- Dashboard → Executions
- Filtrar por workflow "Password Reset"
- Ver payload recibido y respuesta

### **Resend:**
- Dashboard → Logs
- Ver emails enviados
- Ver tasa de apertura y clicks

---

## 🚨 Troubleshooting

### **Error: "No existe una cuenta con este teléfono"**
**Causa:** El teléfono no está registrado en el perfil del usuario
**Solución:** 
- Usuario debe actualizar su perfil con el teléfono
- O usar opción Email

### **Error: "Error al enviar WhatsApp"**
**Causa:** n8n no responde o Evolution API falla
**Solución:**
1. Verificar que n8n esté activo
2. Verificar `N8N_WEBHOOK_URL` en Railway
3. Verificar `N8N_API_KEY` coincida
4. Revisar logs de n8n
5. Probar con Email como alternativa

### **Error: "Error al enviar el email"**
**Causa:** Resend no configurado o API key inválida
**Solución:**
1. Verificar `USE_RESEND=True` en Railway
2. Verificar `RESEND_API_KEY` es válida
3. Verificar límite de 100 emails/día no alcanzado
4. Revisar logs de Resend

### **Error: "Token inválido o expirado"**
**Causa:** Token usado o más de 2 horas desde creación
**Solución:**
- Usuario debe solicitar nuevo token
- Los tokens se invalidan automáticamente al crear uno nuevo

---

## 🔐 Seguridad

### **Tokens:**
- ✅ Únicos (32 bytes URL-safe)
- ✅ Expiran en 2 horas
- ✅ Un solo uso
- ✅ Se invalidan al crear nuevo token
- ✅ Almacenados en base de datos

### **Validación:**
- ✅ Teléfono debe estar registrado
- ✅ Email debe estar registrado
- ✅ Token validado antes de cambiar contraseña
- ✅ Contraseña validada con Django validators

### **Rate Limiting:**
- ⚠️ Considerar agregar rate limiting en el futuro
- ⚠️ Limitar intentos por IP/usuario

---

## 📈 Métricas

### **Resend (Email):**
- Límite: 100 emails/día
- Costo: Gratis
- Tracking: Aperturas, clicks, bounces

### **Evolution API (WhatsApp):**
- Límite: Según tu plan
- Costo: Según tu plan
- Tracking: Entregado, leído

---

## 🔄 Flujo Completo

```
Usuario olvida contraseña
    ↓
/recuperar-password
    ↓
Elige canal (WhatsApp/Email)
    ↓
Ingresa teléfono o email
    ↓
Backend crea token (2h expiry)
    ↓
┌─────────────────┬─────────────────┐
│   WhatsApp      │      Email      │
│                 │                 │
│ n8n webhook     │ django-anymail  │
│      ↓          │      ↓          │
│ Evolution API   │    Resend       │
│      ↓          │      ↓          │
│ WhatsApp msg    │   Email msg     │
└─────────────────┴─────────────────┘
    ↓
Usuario recibe link
    ↓
/reset-password/[token]
    ↓
Valida token
    ↓
Ingresa nueva contraseña
    ↓
Token marcado como usado
    ↓
Contraseña actualizada
    ↓
Redirect a /login
```

---

## 📝 Próximos Pasos

1. **Configurar variables en Railway** (5 min)
2. **Obtener API key de Resend** (5 min)
3. **Crear workflow en n8n** (15 min)
4. **Probar ambos canales** (10 min)
5. **Monitorear primeros usos** (ongoing)

---

## 💡 Mejoras Futuras

- [ ] Rate limiting por IP/usuario
- [ ] Logs de auditoría de cambios de contraseña
- [ ] Notificación al usuario cuando se cambia contraseña
- [ ] Opción de SMS como tercer canal
- [ ] Dashboard de métricas de recuperación
- [ ] A/B testing WhatsApp vs Email

---

## 📞 Soporte

**Documentación adicional:**
- `WORKFLOW_N8N_PASSWORD_RESET.md` - Workflow n8n detallado
- Resend Docs: https://resend.com/docs
- django-anymail Docs: https://anymail.dev/

**Logs importantes:**
- Railway: `railway logs`
- n8n: Dashboard → Executions
- Resend: Dashboard → Logs
