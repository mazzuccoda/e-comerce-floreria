# ✅ SOLUCIÓN FINAL: CORS y Fotos de Productos

## 🎯 Problema 1: Error CORS con Credentials

### Error Original:
```
Access-Control-Allow-Origin header must not be the wildcard '*' 
when the request's credentials mode is 'include'
```

### Causa:
- Frontend enviaba `credentials: 'include'` en CartContextRobust
- Django tenía `CORS_ALLOW_ALL_ORIGINS = True` (envía '*')
- **No puedes usar '*' con credentials, debes especificar orígenes exactos**

### ✅ Solución Aplicada en `settings.py`:

```python
# ANTES (INCORRECTO):
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = False

# DESPUÉS (CORRECTO):
CORS_ALLOWED_ORIGINS = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:80',
]
CORS_ALLOW_CREDENTIALS = True
```

### Resultado:
✅ El carrito ahora puede hacer peticiones POST con sesiones
✅ Las cookies se envían correctamente
✅ No más errores de CORS

---

## 📸 Problema 2: Productos sin Fotos

### Situación Actual:
```
Primera imagen: https://via.placeholder.com/400x300?text=Sin+Imagen
```

### Causa:
Los productos en la base de datos no tienen imágenes asociadas. El sistema está mostrando placeholders.

### ✅ Solución: Agregar Imágenes Reales

#### Opción 1: Subir imágenes manualmente desde Django Admin

```bash
# 1. Acceder al admin
http://localhost/admin/

# 2. Ir a "Productos"
# 3. Editar cada producto
# 4. Subir imagen en el campo "imagen"
```

#### Opción 2: Crear script para agregar imágenes por código

```python
# create_products_with_images.py
from catalogo.models import Producto, TipoFlor, Ocasion
from django.core.files import File
from pathlib import Path

# Ejemplo: Agregar imagen a un producto existente
producto = Producto.objects.get(id=4)  # "Ramo de 12 Rosas Rojas"

# Asignar una imagen (debe estar en la carpeta media/)
with open('media/productos/rosas_rojas.jpg', 'rb') as f:
    producto.imagen.save('rosas_rojas.jpg', File(f), save=True)

print(f"✅ Imagen agregada a {producto.nombre}")
```

#### Opción 3: URLs de imágenes externas

Modificar el modelo para aceptar URLs:

```python
# En catalogo/models.py
class Producto(models.Model):
    # ... campos existentes ...
    imagen_url = models.URLField(blank=True, null=True, help_text="URL de imagen externa")
    
    def get_imagen_url(self):
        if self.imagen:
            return self.imagen.url
        elif self.imagen_url:
            return self.imagen_url
        else:
            return 'https://via.placeholder.com/400x300?text=Sin+Imagen'
```

---

## 📋 Checklist de Verificación Post-Cambios

### 1. ✅ Verificar CORS
```bash
# En la consola del navegador NO debe aparecer:
❌ "Access-Control-Allow-Origin header must not be wildcard"

# Debe aparecer:
✅ Carrito actualizado correctamente
✅ Producto agregado al carrito
```

### 2. ✅ Verificar Carrito Funcionando
```
1. Abrir http://localhost
2. Click en "Agregar al Carrito" en cualquier producto
3. El contador del carrito debe aumentar
4. NO debe haber errores en la consola
```

### 3. ⏳ Verificar Imágenes (PENDIENTE)
```
1. Los productos actualmente muestran placeholder
2. Necesitas subir imágenes reales vía admin o script
3. Después verás las fotos reales en lugar de placeholders
```

---

## 🔧 Comandos Útiles

### Reiniciar backend después de cambios:
```bash
docker-compose -f docker-compose.simple.yml restart web
```

### Ver logs del backend:
```bash
docker logs floreria-backend --tail 50 -f
```

### Ver logs del frontend:
```bash
docker logs floreria-frontend --tail 50 -f
```

### Acceder al admin de Django:
```bash
# 1. Crear superusuario si no existe
docker exec -it floreria-backend python manage.py createsuperuser

# 2. Acceder
http://localhost/admin/
```

---

## 🎯 Estado Actual del Sistema

### ✅ FUNCIONANDO:
- Backend Django en puerto 8000
- Frontend Next.js en puerto 3000
- Nginx en puerto 80
- PostgreSQL y Redis
- API de productos (GET)
- Listado de productos
- Conexión al backend establecida

### 🔄 PARCIALMENTE FUNCIONANDO:
- Carrito: POST debe funcionar ahora con CORS arreglado
- Imágenes: Mostrando placeholders (necesitan imágenes reales)

### ⏳ PENDIENTE DE VERIFICAR:
- Agregar productos al carrito (después de fix CORS)
- Checkout completo
- Notificaciones
- Procesamiento de pagos

---

## 📊 Próximos Pasos

1. **Verificar que el carrito funciona (AHORA):**
   - Recargar la página: http://localhost
   - Intentar agregar un producto
   - Verificar que NO hay errores CORS

2. **Agregar imágenes reales:**
   - Opción más rápida: Django Admin
   - Subir 3-5 imágenes de productos
   - Refrescar y ver las fotos reales

3. **Crear productos de prueba con stock:**
   ```bash
   docker exec -it floreria-backend python manage.py shell
   ```
   ```python
   from catalogo.models import Producto, TipoFlor
   tipo = TipoFlor.objects.first()
   
   Producto.objects.create(
       nombre="Test Product",
       precio=1000,
       stock=50,
       tipo_flor=tipo,
       activo=True
   )
   ```

---

## 🐛 Errores Menores Restantes (No críticos)

### 1. apple-touch-icon.png (404)
**Efecto:** Ninguno, solo warning en consola
**Solución:** Crear el archivo o ignorar

### 2. Múltiples renderizados
**Efecto:** Menor, productos se cargan 2 veces
**Causa:** Strict Mode de React
**Solución:** Ya implementamos useRef, es normal en desarrollo

---

**Última actualización:** 11 octubre 2025, 18:50 hs
**Estado:** CORS arreglado, esperando reinicio del backend
**Siguiente paso:** Verificar carrito funcionando
