# 📱 Integración con Redes Sociales - Florería Cristina

## 📋 Resumen

Sistema para publicar automáticamente productos en Facebook e Instagram usando n8n como orquestador.

---

## 🆕 Cambios Implementados

### 1. Modelo Producto

**Nuevos campos agregados:**

```python
publicar_en_redes = models.BooleanField(
    default=False,
    verbose_name='Publicar en Redes Sociales',
    help_text='Marcar para incluir este producto en las publicaciones automáticas'
)

fecha_ultima_publicacion = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name='Última publicación en redes'
)
```

### 2. Admin de Django

- ✅ Campo `publicar_en_redes` visible en list_display
- ✅ Filtro por `publicar_en_redes` en list_filter
- ✅ Nueva sección "Redes Sociales" en el formulario de edición

### 3. API REST

**Nuevo endpoint:** `/api/catalogo/productos/sync_to_social/`

**Métodos:**
- `GET`: Obtiene productos marcados para publicar
- `POST`: Envía productos a n8n para publicación

**Query params:**
- `limit`: Número máximo de productos (default: 10)
- `force`: Incluir productos publicados recientemente (default: false)

**Ejemplo GET:**
```bash
curl https://tu-api.com/api/catalogo/productos/sync_to_social/?limit=5
```

**Ejemplo POST:**
```bash
curl -X POST https://tu-api.com/api/catalogo/productos/sync_to_social/?limit=5
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "5 productos sincronizados con redes sociales",
  "productos_count": 5,
  "productos": [
    {
      "id": 1,
      "sku": "PROD001",
      "nombre": "Ramo de Rosas Rojas",
      "descripcion": "Hermoso ramo de 12 rosas rojas",
      "precio": "5000",
      "imagenes": [
        {
          "url": "https://res.cloudinary.com/.../rosas.jpg",
          "is_primary": true
        }
      ],
      "url": "https://www.floreriacristina.com.ar/productos/ramo-rosas-rojas"
    }
  ]
}
```

---

## 🔧 Configuración

### Variables de Entorno

Agregar a Railway o `.env`:

```bash
# n8n
N8N_BASE_URL=https://tu-n8n.com
N8N_API_KEY=tu_api_key_secreta
```

### Migración de Base de Datos

**Crear migración:**
```bash
python manage.py makemigrations catalogo
python manage.py migrate
```

---

## 📝 Workflow n8n

### Workflow 1: Sincronización Manual

```javascript
// Nodo 1: Webhook Trigger
// POST /webhook/sync-catalog
// Recibe: { "productos": [...] }

// Nodo 2: Loop Over Items
// Itera sobre cada producto

// Nodo 3: Code - Preparar Post para Instagram
const producto = $input.item.json;

const caption = `🌸 ${producto.nombre}

${producto.descripcion_corta || producto.descripcion.substring(0, 150)}

💰 Precio: $${producto.precio_descuento || producto.precio}
${producto.envio_gratis ? '🚚 Envío GRATIS' : ''}

🛒 Compralo ahora: ${producto.url}

#FloreríaCristina #Flores #Tucumán #${producto.categoria || 'Regalos'}`;

const imagen_principal = producto.imagenes.find(img => img.is_primary) || producto.imagenes[0];

return {
  image_url: imagen_principal.url,
  caption: caption,
  product_url: producto.url
};

// Nodo 4: Instagram Graph API - Crear Media
// POST https://graph.facebook.com/v18.0/{instagram_account_id}/media
// Body: {
//   "image_url": "{{ $json.image_url }}",
//   "caption": "{{ $json.caption }}"
// }

// Nodo 5: Instagram Graph API - Publicar
// POST https://graph.facebook.com/v18.0/{instagram_account_id}/media_publish
// Body: {
//   "creation_id": "{{ $json.id }}"
// }

// Nodo 6: Delay (2 horas entre posts)
// Wait: 7200000 ms
```

### Workflow 2: Publicación Automática Diaria

```javascript
// Nodo 1: Schedule Trigger
// Cron: 0 10 * * * (Todos los días a las 10 AM)

// Nodo 2: HTTP Request - Obtener Productos
// GET https://tu-api.com/api/catalogo/productos/sync_to_social/?limit=1
// Headers: { "Content-Type": "application/json" }

// Nodo 3: IF - Verificar si hay productos
// Condition: {{ $json.productos_count > 0 }}

// Nodo 4: Code - Preparar Post
// (Mismo código que Workflow 1, Nodo 3)

// Nodo 5-6: Instagram API
// (Mismo que Workflow 1)

// Nodo 7: HTTP Request - Marcar como publicado
// POST https://tu-api.com/api/catalogo/productos/sync_to_social/?limit=1
```

---

## 🎯 Uso

### 1. Marcar Productos para Redes Sociales

1. Ir al admin de Django: `/admin/catalogo/producto/`
2. Editar un producto
3. En la sección "Redes Sociales", marcar ✅ **Publicar en Redes Sociales**
4. Guardar

### 2. Sincronización Manual

**Opción A: Desde n8n**
- Ejecutar manualmente el workflow "Sync Catalog"

**Opción B: Desde API**
```bash
curl -X POST https://tu-api.com/api/catalogo/productos/sync_to_social/?limit=5
```

### 3. Publicación Automática

- El workflow con Schedule Trigger publicará automáticamente 1 producto por día
- Los productos se rotan automáticamente (los más antiguos primero)
- No se repite un producto hasta 24 horas después

---

## 📊 Lógica de Rotación

El endpoint `sync_to_social` implementa rotación inteligente:

1. **Filtros aplicados:**
   - `is_active=True`
   - `publicar_en_redes=True`
   - `stock > 0`

2. **Ordenamiento:**
   - Primero: Productos nunca publicados
   - Segundo: Productos publicados hace más de 24 horas (más antiguos primero)

3. **Actualización automática:**
   - Al publicar, se actualiza `fecha_ultima_publicacion`
   - Esto asegura rotación equitativa

---

## 🔐 Credenciales de Facebook/Instagram

### Obtener Access Token

1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Crear App → Tipo: Business
3. Agregar productos:
   - Instagram Graph API
   - Facebook Login
4. Generar Access Token con permisos:
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`

### Configurar en n8n

1. Crear credencial "Instagram Account"
2. Pegar Access Token
3. Agregar Instagram Business Account ID

---

## 📈 Monitoreo

### Logs de Django

```bash
# Ver productos sincronizados
grep "productos sincronizados" logs/django.log

# Ver errores
grep "Error en sync_to_social" logs/django.log
```

### Admin de Django

- Ver `fecha_ultima_publicacion` de cada producto
- Filtrar por `publicar_en_redes=True`

---

## 🚀 Próximos Pasos

1. **Crear workflows en n8n** siguiendo los ejemplos
2. **Configurar credenciales** de Facebook/Instagram
3. **Marcar productos** para publicar en el admin
4. **Probar manualmente** con `limit=1`
5. **Activar schedule** para publicación automática

---

## ⚠️ Notas Importantes

- **Límites de Instagram:** Máximo 25 posts por día
- **Delay entre posts:** Recomendado 2 horas mínimo
- **Calidad de imágenes:** Usar imágenes de alta resolución
- **Hashtags:** Máximo 30 por post
- **Links en caption:** Instagram no permite links clickeables en caption (solo en bio)

---

## 🆘 Troubleshooting

### "No hay productos disponibles"
- Verificar que productos tengan `publicar_en_redes=True`
- Verificar que tengan `stock > 0`
- Verificar que no se hayan publicado en las últimas 24 horas

### "n8n no configurado"
- Verificar variables `N8N_BASE_URL` y `N8N_API_KEY` en Railway

### "Error al sincronizar con n8n"
- Verificar que el webhook `/webhook/sync-catalog` exista en n8n
- Verificar que el workflow esté activo
- Revisar logs de n8n

---

## 📞 Soporte

Para más información, revisar:
- Documentación de Instagram Graph API
- Documentación de n8n
- Logs de Django en Railway
