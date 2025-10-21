# 📧 CONFIGURAR SENDGRID EN RAILWAY

## ✅ PASO 1: CREAR API KEY EN SENDGRID

1. **Inicia sesión en SendGrid**: https://app.sendgrid.com
2. **Salta la configuración DNS**: Haz clic en "Saltar al panel de control" (arriba a la derecha)
3. **Ve a Settings → API Keys** en el menú lateral izquierdo
4. **Crea una nueva API Key**:
   - Haz clic en "Create API Key"
   - Nombre: `Railway Django Email`
   - Tipo: **Full Access** (o Restricted Access con Mail Send)
   - Haz clic en "Create & View"
5. **COPIA LA API KEY** (solo se muestra una vez)
   - Ejemplo: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## ✅ PASO 2: CONFIGURAR VARIABLES EN RAILWAY

1. **Ve a tu proyecto en Railway**: https://railway.app
2. **Selecciona tu servicio Django**
3. **Ve a la pestaña "Variables"**
4. **Agrega o modifica estas variables**:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=Floreria Cristina <mazzucoda@gmail.com>
```

**⚠️ IMPORTANTE:**
- `EMAIL_HOST_USER` debe ser **literalmente** la palabra `apikey` (no tu email)
- `EMAIL_HOST_PASSWORD` debe ser tu **API Key de SendGrid** (empieza con `SG.`)
- `DEFAULT_FROM_EMAIL` puede ser cualquier email válido

---

## ✅ PASO 3: VERIFICAR CONFIGURACIÓN

### 3.1 Railway redesplegará automáticamente
Espera 2-3 minutos a que termine el despliegue.

### 3.2 Crear un pedido de prueba
1. Ve a tu tienda: https://floreriayviverocristian.up.railway.app
2. Agrega un producto al carrito
3. Completa el checkout
4. Confirma el pedido

### 3.3 Revisar logs en Railway
Ve a la pestaña "Deployments" → "View Logs" y busca:

**✅ SI FUNCIONA:**
```
📧 Enviando email a dmazzucco@sanmiguelglobal.com...
✅ Email enviado exitosamente a dmazzucco@sanmiguelglobal.com
```

**❌ SI FALLA:**
```
⏱️ Timeout conectando al servidor SMTP
❌ Error enviando email: [535] Authentication failed
```

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### Error: "Authentication failed"
- **Causa**: API Key incorrecta o `EMAIL_HOST_USER` no es `apikey`
- **Solución**: Verifica que `EMAIL_HOST_USER=apikey` (literal) y que copiaste bien la API Key

### Error: "Timeout"
- **Causa**: Puerto bloqueado o configuración incorrecta
- **Solución**: Verifica que `EMAIL_PORT=587` y `EMAIL_USE_TLS=True`

### Error: "Invalid sender"
- **Causa**: Email de origen no válido
- **Solución**: Usa un email válido en `DEFAULT_FROM_EMAIL`

### Los emails no llegan
- **Revisa spam/correo no deseado**
- **Verifica en SendGrid**: Activity → Email Activity para ver si se enviaron
- **Límite de plan gratuito**: 100 emails/día

---

## 📊 VERIFICAR EMAILS EN SENDGRID

1. Ve a **Activity → Email Activity** en SendGrid
2. Verás todos los emails enviados con su estado:
   - **Delivered**: Email entregado exitosamente ✅
   - **Bounced**: Email rebotado (dirección inválida) ❌
   - **Deferred**: Email en cola de reintento ⏳
   - **Dropped**: Email descartado por SendGrid 🚫

---

## 🎯 LÍMITES DEL PLAN GRATUITO

- **100 emails/día** durante 30 días
- Después: **100 emails/día permanente**
- Sin tarjeta de crédito requerida
- Suficiente para desarrollo y pruebas

---

## 🚀 PRÓXIMOS PASOS (OPCIONAL)

### Para mejorar la entregabilidad:
1. **Verificar dominio**: Configurar DNS (SPF, DKIM, DMARC)
2. **Verificar sender**: Verificar email de origen en SendGrid
3. **Usar templates**: Crear plantillas HTML en SendGrid
4. **Monitorear métricas**: Revisar tasas de apertura y rebote

### Para producción:
1. **Upgrade a plan pagado** si necesitas más de 100 emails/día
2. **Configurar dominio personalizado** (@tudominio.com)
3. **Implementar webhooks** para tracking de eventos
4. **Agregar unsubscribe links** para cumplir regulaciones

---

## 📝 NOTAS IMPORTANTES

- **NO necesitas configurar DNS** para empezar a enviar emails
- La configuración DNS solo mejora la reputación y evita spam
- Puedes enviar desde cualquier email sin verificar dominio
- SendGrid maneja automáticamente reintentos y bounces
- Los logs de Django mostrarán si el email se envió correctamente

---

## ✅ CHECKLIST FINAL

- [ ] API Key de SendGrid creada y copiada
- [ ] Variables de entorno configuradas en Railway
- [ ] `EMAIL_HOST_USER=apikey` (literal, no tu email)
- [ ] `EMAIL_HOST_PASSWORD=SG.xxx...` (tu API Key)
- [ ] Railway redesplegado
- [ ] Pedido de prueba creado
- [ ] Logs verificados (email enviado exitosamente)
- [ ] Email recibido en bandeja de entrada (o spam)

---

## 🆘 ¿NECESITAS AYUDA?

Si después de seguir estos pasos sigues teniendo problemas:

1. **Comparte los logs de Railway** después de crear un pedido
2. **Verifica las variables de entorno** en Railway (sin mostrar la API Key completa)
3. **Revisa Email Activity en SendGrid** para ver si los emails se están enviando

---

**Última actualización**: 20/10/2025
**Autor**: Cascade AI Assistant
