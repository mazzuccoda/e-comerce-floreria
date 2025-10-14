# 📸 GUÍA: Cómo Agregar Imágenes a los Productos

## 🎯 Objetivo
Reemplazar los placeholders con imágenes reales de flores para que se vean en el sitio web.

---

## ✅ PASO 1: Acceder al Panel de Administración

**URL:** http://localhost/admin/

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`

El navegador ya debería estar abierto con esta URL.

---

## ✅ PASO 2: Navegar a Productos

1. Haz login con las credenciales de arriba
2. En el menú lateral, busca la sección **"CATALOGO"**
3. Click en **"Productos"**
4. Verás una lista de 3 productos:
   - Ramo de 12 Rosas Rojas
   - Arreglo Floral Mixto  
   - Ramo de Tulipanes Blancos

---

## ✅ PASO 3: Editar un Producto y Agregar Imagen

### Opción A: Usar URLs de Imágenes (Más rápido)

**Para cada producto:**

1. Click en el nombre del producto
2. Scroll hasta encontrar el campo **"Imagen"** o **"Imagen principal"**
3. En lugar de subir archivo, puedes **copiar y pegar la URL** de una imagen

#### 🌸 URLs de Imágenes Sugeridas:

**Para "Ramo de 12 Rosas Rojas":**
```
https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800
```

**Para "Arreglo Floral Mixto":**
```
https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800
```

**Para "Ramo de Tulipanes Blancos":**
```
https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800
```

4. Pega la URL en el campo de imagen
5. Click en **"Guardar"** en la parte inferior

### Opción B: Subir Archivos desde tu Computadora

1. Click en el nombre del producto
2. Busca el botón **"Choose File"** o **"Elegir archivo"** junto al campo "Imagen"
3. Selecciona una foto de flores de tu computadora
4. Click en **"Guardar"**

**Formatos aceptados:** JPG, PNG, WEBP

---

## ✅ PASO 4: Verificar que las Imágenes se Vean en el Sitio

1. Ve a http://localhost
2. Refresca la página (F5 o Ctrl+R)
3. Las tarjetas de productos ahora deben mostrar las imágenes reales en lugar de placeholders

---

## 🎨 RECOMENDACIONES DE IMÁGENES

### Características ideales:
- **Resolución:** Mínimo 800x600 px
- **Formato:** JPG o PNG
- **Tamaño:** Menos de 2MB por imagen
- **Orientación:** Cuadrada o apaisada
- **Calidad:** Alta definición, bien iluminadas

### Fuentes de imágenes gratuitas:
- **Unsplash:** https://unsplash.com/s/photos/flowers
- **Pexels:** https://www.pexels.com/search/flowers/
- **Pixabay:** https://pixabay.com/images/search/flowers/

---

## 🔧 ALTERNATIVA: Script Automático (Avanzado)

Si quieres agregar muchas imágenes rápidamente, puedo crear un script que:

1. Descargue automáticamente imágenes de Unsplash
2. Las asocie a cada producto
3. Las guarde en la base de datos

**¿Quieres que cree este script?** Solo avísame.

---

## ✅ VERIFICACIÓN FINAL

Después de agregar las imágenes, verifica:

- [ ] Las 3 productos tienen imágenes
- [ ] Las imágenes se cargan en http://localhost
- [ ] No hay error "Failed to load resource" en la consola
- [ ] Las imágenes se ven nítidas y profesionales

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "La imagen no se guarda"
**Solución:** Verifica que el archivo sea JPG/PNG y menor a 2MB.

### Problema: "No veo el campo de imagen"
**Solución:** Scroll hacia abajo en el formulario de edición del producto.

### Problema: "La imagen no aparece en el sitio"
**Solución:** 
1. Refresca la página con Ctrl+Shift+R (hard refresh)
2. Verifica que guardaste el producto después de agregar la imagen
3. Verifica los logs del backend: `docker logs floreria-backend --tail 20`

### Problema: "Error al subir imagen"
**Solución:**
1. Verifica permisos de carpeta media/
2. Ejecuta: `docker exec floreria-backend mkdir -p /app/media/productos`
3. Ejecuta: `docker exec floreria-backend chmod -R 755 /app/media`

---

## 📝 NOTAS ADICIONALES

- Las imágenes se guardan en la carpeta `/media/productos/` dentro del contenedor
- Django genera automáticamente miniaturas si está configurado
- Puedes agregar múltiples imágenes por producto usando el modelo `ProductoImagen`

---

**¡Listo! Tus productos ahora tendrán imágenes profesionales** 🌸✨
