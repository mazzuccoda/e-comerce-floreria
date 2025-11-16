# 🌸 Admin Simple - Florería Cristina

## 📋 Guía de Uso Completa

---

## 🎯 ¿Qué es Admin Simple?

Un panel de administración simplificado y moderno para gestionar productos de manera rápida y eficiente. Diseñado específicamente para facilitar la actualización de precios, stock y disponibilidad sin la complejidad del admin de Django.

---

## 🔐 Acceso

### **URL de Acceso:**
```
https://e-comerce-floreria-production.up.railway.app/admin-simple/
```

### **Requisitos:**
- ✅ Debes ser **superusuario** de Django
- ✅ Debes estar **autenticado**

### **Credenciales:**
Usa las mismas credenciales del admin de Django.

---

## 🏠 Dashboard

Al ingresar verás:

### **Estadísticas en Tiempo Real:**
- 📦 **Total de Productos**: Cantidad total en el catálogo
- ✅ **Productos Activos**: Visibles en la tienda
- ⚠️ **Stock Bajo**: Productos con menos de 5 unidades
- ❌ **Sin Stock**: Productos agotados

### **Acciones Rápidas:**
- Ver todos los productos
- Filtrar por stock bajo
- Ver productos inactivos

---

## 📦 Lista de Productos

### **Funcionalidades:**

#### **1. Búsqueda**
- Busca por nombre o descripción
- Búsqueda en tiempo real

#### **2. Filtros**
- **Por estado:**
  - Todos
  - Activos (visibles en tienda)
  - Inactivos (ocultos)
  - Stock bajo (< 5 unidades)
  - Sin stock (0 unidades)

- **Por categoría:**
  - Rosas
  - Tulipanes
  - Girasoles
  - Orquídeas
  - etc.

- **Ordenamiento:**
  - Nombre (A-Z / Z-A)
  - Precio (menor a mayor / mayor a menor)
  - Stock (menor a mayor / mayor a menor)

#### **3. Edición Inline (Sin recargar página)**

##### **Cambiar Precio:**
1. Haz click en el precio actual
2. Aparecerá un campo de entrada
3. Escribe el nuevo precio
4. Presiona **Enter** para guardar
5. ✅ Se guarda automáticamente

##### **Cambiar Stock:**
1. Haz click en el stock actual
2. Aparecerá un campo de entrada
3. Escribe la nueva cantidad
4. Presiona **Enter** para guardar
5. ✅ Se guarda automáticamente

**Indicadores de Stock:**
- 🟢 Verde: Stock suficiente (≥ 5 unidades)
- 🟡 Amarillo: Stock bajo (1-4 unidades)
- 🔴 Rojo: Sin stock (0 unidades)

##### **Toggle Disponibilidad:**
- Click en el switch para activar/desactivar
- ✅ Se guarda automáticamente
- Verde = Activo (visible en tienda)
- Gris = Inactivo (oculto)

#### **4. Edición Completa**
- Click en el botón **"Editar"** para abrir el formulario completo

---

## ✏️ Editar Producto

### **Campos Editables:**

#### **Información Básica:**
- **Nombre**: Nombre del producto (obligatorio)
- **Descripción Corta**: Máximo 200 caracteres
- **Descripción Completa**: Máximo 500 caracteres

#### **Precio y Stock:**
- **Precio**: En pesos argentinos (debe ser > 0)
- **Stock**: Unidades disponibles (debe ser ≥ 0)

#### **Disponibilidad:**
- ☑️ **Producto visible en la tienda**
  - Marcado: El producto aparece en la tienda
  - Desmarcado: El producto está oculto

### **Panel Lateral:**

#### **Imagen Actual:**
- Muestra la imagen principal del producto
- Para cambiar la imagen, usa el admin de Django

#### **Información:**
- Categoría
- ID del producto
- Fecha de creación
- Última actualización

#### **Estado del Stock:**
- 🔴 **Sin Stock**: Alerta roja
- 🟡 **Stock Bajo**: Alerta amarilla
- 🟢 **Stock Suficiente**: Indicador verde

### **Botones:**
- **Cancelar**: Volver sin guardar
- **Guardar Cambios**: Guardar y volver a la lista

### **Atajo de Teclado:**
- `Ctrl + S` (o `Cmd + S` en Mac): Guardar cambios

---

## 🎨 Características de la Interfaz

### **Diseño Moderno:**
- 🎨 Colores de marca (verde y dorado)
- 🌸 Iconos florales
- 📱 Responsive (funciona en móvil)
- ⚡ Animaciones suaves
- 🔄 Feedback visual inmediato

### **Navegación:**
- **Dashboard**: Vista general
- **Productos**: Lista completa
- **Admin Django**: Link al admin completo

### **Notificaciones:**
- ✅ Mensajes de éxito (verde)
- ❌ Mensajes de error (rojo)
- ℹ️ Mensajes informativos (azul)

---

## 📊 Casos de Uso Comunes

### **1. Actualizar Precio de un Producto**
```
1. Ir a "Productos"
2. Buscar el producto
3. Click en el precio
4. Escribir nuevo precio
5. Enter
✅ Listo!
```

### **2. Actualizar Stock Después de Recibir Mercadería**
```
1. Ir a "Productos"
2. Filtrar por "Stock Bajo"
3. Click en cada stock
4. Actualizar cantidad
5. Enter
✅ Stock actualizado!
```

### **3. Ocultar Producto Temporalmente**
```
1. Ir a "Productos"
2. Buscar el producto
3. Click en el toggle (switch)
✅ Producto oculto!
```

### **4. Ver Productos que Necesitan Atención**
```
1. Ir a Dashboard
2. Click en "Stock Bajo"
3. Ver lista de productos
4. Actualizar según necesidad
```

### **5. Editar Descripción de Producto**
```
1. Ir a "Productos"
2. Buscar el producto
3. Click en "Editar"
4. Modificar descripción
5. "Guardar Cambios"
✅ Descripción actualizada!
```

---

## ⚠️ Validaciones

### **Precio:**
- ❌ No puede ser 0 o negativo
- ✅ Debe ser mayor a 0
- 💡 Se recomienda usar múltiplos de 100

### **Stock:**
- ❌ No puede ser negativo
- ✅ Debe ser 0 o mayor
- 💡 Stock 0 = producto agotado

### **Nombre:**
- ❌ No puede estar vacío
- ✅ Es obligatorio

---

## 🔒 Seguridad

### **Protección:**
- ✅ Solo superusuarios pueden acceder
- ✅ Requiere autenticación
- ✅ Protección CSRF en formularios
- ✅ Validaciones en backend y frontend

### **Logs:**
Todas las acciones quedan registradas:
- Quién modificó el producto
- Qué campo se modificó
- Cuándo se modificó

---

## 🆚 Diferencias con Django Admin

| Característica | Admin Simple | Django Admin |
|----------------|--------------|--------------|
| **Edición Inline** | ✅ Sí | ❌ No |
| **Interfaz** | Moderna | Tradicional |
| **Velocidad** | ⚡ Rápida | 🐌 Más lenta |
| **Campos** | Solo esenciales | Todos |
| **Imágenes** | ❌ No | ✅ Sí |
| **Categorías** | ❌ No | ✅ Sí |
| **Uso** | Día a día | Configuración |

---

## 💡 Tips y Trucos

### **1. Búsqueda Rápida:**
- Usa la búsqueda para encontrar productos rápidamente
- Busca por nombre o parte del nombre

### **2. Filtros Combinados:**
- Puedes combinar búsqueda + categoría + filtro
- Ejemplo: Buscar "rosas" + Categoría "Rosas" + "Stock bajo"

### **3. Edición Inline:**
- Más rápido que abrir el formulario completo
- Ideal para actualizaciones rápidas de precio/stock

### **4. Ordenamiento:**
- Ordena por stock para ver primero los que necesitan reposición
- Ordena por precio para revisar la estructura de precios

### **5. Dashboard:**
- Revisa el dashboard diariamente
- Presta atención a "Stock Bajo" y "Sin Stock"

---

## 🐛 Solución de Problemas

### **No puedo acceder:**
- ✅ Verifica que seas superusuario
- ✅ Verifica que estés autenticado
- ✅ Usa las credenciales del admin de Django

### **Los cambios no se guardan:**
- ✅ Presiona Enter después de editar inline
- ✅ Click en "Guardar Cambios" en el formulario
- ✅ Verifica tu conexión a internet

### **No veo un producto:**
- ✅ Verifica los filtros activos
- ✅ Busca por nombre
- ✅ Revisa si está en otra categoría

### **Error al guardar:**
- ✅ Verifica que el precio sea mayor a 0
- ✅ Verifica que el stock no sea negativo
- ✅ Verifica que el nombre no esté vacío

---

## 📱 Uso en Móvil

El admin simple es **completamente responsive**:

- ✅ Funciona en teléfonos
- ✅ Funciona en tablets
- ✅ Touch-friendly
- ✅ Diseño adaptativo

**Recomendación:** Para edición masiva, usa una computadora.

---

## ➕ Crear Nuevo Producto

### **Acceso:**
- Desde el Dashboard: Click en "Nuevo Producto" en Acciones Rápidas
- Desde Lista de Productos: Click en botón "Nuevo Producto"
- URL directa: `/admin-simple/productos/nuevo/`

### **Campos del Formulario:**

#### **📝 Información Básica (Obligatorio):**
- **Nombre**: Nombre descriptivo del producto
- **Categoría**: Seleccionar de las categorías existentes

#### **💰 Precio y Stock (Obligatorio):**
- **Precio**: En pesos argentinos (sin centavos)
- **Stock Inicial**: Cantidad de unidades disponibles (default: 10)

#### **📸 Imágenes (Opcional):**
- Formatos: JPG, PNG, WEBP
- Tamaño máximo: **10MB por imagen**
- **Múltiples imágenes**: Puedes subir varias a la vez
- Preview instantáneo antes de guardar
- Captura directa desde cámara en móvil
- La primera imagen será la principal

#### **📄 Descripción (Opcional):**
- **Descripción Corta**: Máximo 200 caracteres (aparece en tarjetas)

#### **⚙️ Configuración:**
- **Producto visible**: Checkbox para activar/desactivar (default: activo)

### **Características Especiales:**

#### **Auto-generación:**
- **SKU**: Se genera automáticamente (formato: PROD-XXXXXXXX)
- **Slug**: Se crea desde el nombre del producto

#### **Validaciones en Tiempo Real:**
- ✅ Precio debe ser mayor a 0
- ✅ Stock no puede ser negativo
- ✅ Nombre es obligatorio
- ✅ Categoría es obligatoria

#### **Preview de Imágenes:**
- Ver todas las imágenes antes de subir
- Grid responsive (2-3 columnas)
- Botón individual para remover cada imagen
- Botón para eliminar todas las imágenes
- Contador de imágenes seleccionadas
- Validación de tamaño (máx 10MB por imagen)
- Muestra nombre de archivo en cada preview

#### **Auto-save:**
- Los datos se guardan en localStorage
- Se recuperan si cierras accidentalmente
- Se limpian al crear exitosamente

#### **Atajo de Teclado:**
- `Ctrl + S` (o `Cmd + S` en Mac): Crear producto

### **Flujo de Creación:**
```
1. Click en "Nuevo Producto"
2. Completar campos obligatorios (nombre, categoría, precio)
3. Ajustar stock inicial (opcional, default: 10)
4. Subir imágenes (opcional, múltiples desde galería o cámara)
   - Selecciona varias imágenes a la vez
   - Preview instantáneo de todas
   - Remover individualmente si es necesario
5. Agregar descripción (opcional)
6. Configurar visibilidad (default: visible)
7. Click en "✨ CREAR PRODUCTO"
8. ✅ Producto creado con todas las imágenes y redirigido a lista
```

### **Optimizado para Móvil:**
- ✅ Diseño vertical adaptativo
- ✅ Botones grandes táctiles (min 48px)
- ✅ Teclado numérico para precio/stock
- ✅ Captura directa desde cámara
- ✅ Preview de imagen responsive
- ✅ Formulario sticky en bottom

---

## 🔄 Actualizaciones Futuras (Posibles)

- 🗑️ Eliminar productos
- 📊 Estadísticas de ventas
- 📈 Gráficos de stock
- 🏷️ Gestión de categorías
- 🎨 Personalización de colores
- 📝 Edición de descripción completa desde crear

---

## 📞 Soporte

Si tienes problemas o sugerencias:
1. Contacta al administrador del sistema
2. Usa el admin de Django como alternativa
3. Revisa los logs en Railway

---

## ✅ Checklist Diario

Tareas recomendadas para mantener el inventario actualizado:

- [ ] Revisar dashboard
- [ ] Verificar productos con stock bajo
- [ ] Actualizar precios si es necesario
- [ ] Verificar productos sin stock
- [ ] Ocultar productos no disponibles
- [ ] Activar productos nuevos

---

**¡Listo! Ahora puedes gestionar tus productos de manera simple y eficiente.** 🌸✨
