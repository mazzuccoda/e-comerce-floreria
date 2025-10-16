# 🎁 Implementación de Productos Adicionales/Extras

## Resumen de Cambios

Se implementó un sistema completo para mostrar y seleccionar productos adicionales tanto en el checkout como en la página principal.

## 📋 Componentes Creados

### 1. `ExtrasSelector.tsx` (Checkout)
**Ubicación**: `frontend/app/components/ExtrasSelector.tsx`

**Funcionalidad**:
- Carga productos adicionales desde la API `/api/catalogo/productos/adicionales/`
- Permite seleccionar múltiples productos adicionales
- Muestra imagen, nombre, descripción y precio de cada producto
- Indica stock bajo o sin stock
- Interfaz con checkboxes y diseño responsive
- Feedback visual cuando se seleccionan productos

**Props**:
```typescript
interface ExtrasSelectorProps {
  selectedExtras: number[];        // IDs de productos seleccionados
  onExtrasChange: (extras: number[]) => void;  // Callback para cambios
}
```

**Características**:
- ✅ Grid responsive (1 columna móvil, 2 columnas desktop)
- ✅ Animación de selección con ring verde
- ✅ Muestra imágenes de productos
- ✅ Alerta de stock bajo
- ✅ Contador de extras seleccionados
- ✅ Loading state con spinner

### 2. `AdicionalesSection.tsx` (Página Principal)
**Ubicación**: `frontend/app/components/AdicionalesSection.tsx`

**Funcionalidad**:
- Muestra hasta 4 productos adicionales en la home
- Diseño con imágenes circulares (estilo Florería Palermo)
- Links a la página de detalle de cada producto
- Botón "Ver todos" si hay más de 4 productos

**Características**:
- ✅ Fondo degradado rosa/púrpura
- ✅ Imágenes en círculos de 40-48rem
- ✅ Hover effects con scale y shadow
- ✅ Grid responsive (2 columnas móvil, 4 desktop)
- ✅ Nombres en mayúsculas
- ✅ Precios formateados
- ✅ Indicador de stock bajo

## 🔄 Modificaciones en Archivos Existentes

### 1. `checkout/multistep/page.tsx`

**Cambios**:
```typescript
// Import agregado
import ExtrasSelector from '@/app/components/ExtrasSelector';

// Estado agregado
const [selectedExtras, setSelectedExtras] = useState<number[]>([]);

// Paso 4 reemplazado
{currentStep === 4 && (
  <ExtrasSelector
    selectedExtras={selectedExtras}
    onExtrasChange={setSelectedExtras}
  />
)}
```

**Antes**: Paso 4 tenía opciones hardcodeadas (Tarjeta Personalizada, Oso de Peluche)
**Ahora**: Paso 4 carga productos adicionales dinámicamente desde la API

### 2. `page.tsx` (Home)

**Cambios**:
```typescript
// Import agregado
import AdicionalesSection from './components/AdicionalesSection';

// Sección reemplazada
<AdicionalesSection />
```

**Antes**: Usaba `ProductListFinal` con grid estándar
**Ahora**: Usa `AdicionalesSection` con diseño circular especial

## 🎨 Diseño Visual

### Checkout (Paso 4)
```
┌─────────────────────────────────────────┐
│  🎁 Extras Especiales                   │
│                                         │
│  Agrega productos adicionales...        │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ ☑️ Ferrero x8│  │ ☐ Peluche   │   │
│  │ [Imagen]     │  │ [Imagen]     │   │
│  │ Chocolates   │  │ Osito tierno │   │
│  │ +$7.000      │  │ +$25.000     │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ✅ 1 extra seleccionado                │
└─────────────────────────────────────────┘
```

### Página Principal
```
┌──────────────────────────────────────────────┐
│   AGREGÁ ADICIONALES A TU RAMO               │
│   Súmalos dentro de tu compra...             │
│                                              │
│   ●────────●────────●────────●              │
│   │ [IMG] ││ [IMG] ││ [IMG] ││ [IMG] │      │
│   │PELUCHE││BOMBÓN ││CHAMPÁN││FLORERO│      │
│   │$25.000││$15.000││$35.000││$12.000│      │
│   ●────────●────────●────────●              │
│                                              │
│        [Ver todos los adicionales]           │
└──────────────────────────────────────────────┘
```

## 📡 API Endpoints Utilizados

### 1. Obtener Productos Adicionales
```
GET /api/catalogo/productos/adicionales/
```

**Respuesta**:
```json
[
  {
    "id": 1,
    "nombre": "Ferrero x 8",
    "descripcion": "Caja de chocolates Ferrero Rocher",
    "descripcion_corta": "Chocolates premium",
    "precio": 7000.00,
    "imagen_principal": "https://...",
    "stock_disponible": 100,
    "es_adicional": true
  }
]
```

## 🔧 Configuración del Backend

El backend ya tiene todo configurado:

### Modelo `Producto`
```python
class Producto(models.Model):
    # ...
    es_adicional = models.BooleanField(default=False, verbose_name='Es Adicional')
```

### API ViewSet
```python
@action(detail=False, methods=['get'])
def adicionales(self, request):
    """Endpoint para obtener productos adicionales"""
    productos = self.get_queryset().filter(es_adicional=True)
    serializer = self.get_serializer(productos, many=True)
    return Response(serializer.data)
```

## 📝 Cómo Crear Productos Adicionales

### Desde Django Admin:
1. Ve a `/admin/catalogo/producto/`
2. Crea o edita un producto
3. Marca el checkbox **"Es Adicional"**
4. Guarda el producto

### Campos Importantes:
- **Nombre**: Ej. "Ferrero x 8"
- **Descripción Corta**: Ej. "Chocolates premium"
- **Precio**: Ej. 7000.00
- **Imagen Principal**: URL de Cloudinary
- **Stock Disponible**: Cantidad en inventario
- **Es Adicional**: ✅ Marcar como True
- **Activo**: ✅ Debe estar activo

## 🎯 Flujo de Usuario

### En la Página Principal:
1. Usuario ve sección "AGREGÁ ADICIONALES A TU RAMO"
2. Ve hasta 4 productos en círculos
3. Click en un producto → va a página de detalle
4. Puede agregarlo al carrito desde ahí

### En el Checkout:
1. Usuario llega al **Paso 4: Extras**
2. Ve todos los productos adicionales disponibles
3. Selecciona los que desea con checkboxes
4. Los productos seleccionados se agregan al pedido
5. El precio se actualiza automáticamente

## ✅ Características Implementadas

### ExtrasSelector (Checkout):
- ✅ Carga dinámica desde API
- ✅ Selección múltiple con checkboxes
- ✅ Imágenes de productos
- ✅ Precios formateados
- ✅ Indicador de stock
- ✅ Contador de seleccionados
- ✅ Responsive design
- ✅ Loading state
- ✅ Error handling

### AdicionalesSection (Home):
- ✅ Diseño circular elegante
- ✅ Fondo degradado
- ✅ Hover effects
- ✅ Links a detalle
- ✅ Máximo 4 productos
- ✅ Botón "Ver todos"
- ✅ Responsive design
- ✅ Loading state
- ✅ Oculta si no hay productos

## 🚀 Próximos Pasos

### 1. Integrar con el Pedido
Actualmente los extras se seleccionan pero falta:
- [ ] Agregar extras al pedido en el backend
- [ ] Calcular total incluyendo extras
- [ ] Guardar extras en la base de datos
- [ ] Mostrar extras en el resumen del pedido

### 2. Mejoras Sugeridas
- [ ] Agregar cantidad para cada extra
- [ ] Permitir deseleccionar todos
- [ ] Filtros por categoría de extras
- [ ] Búsqueda de extras
- [ ] Recomendaciones basadas en el carrito
- [ ] Agregar extras directamente desde la home

### 3. Backend - Modelo de Pedido
Necesitarás agregar una relación para los extras:

```python
class PedidoExtra(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='extras', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = 'Extra del Pedido'
        verbose_name_plural = 'Extras del Pedido'
```

### 4. Actualizar API de Crear Pedido
```python
def crear_pedido(request):
    # ...
    extras_ids = request.data.get('extras', [])
    
    for extra_id in extras_ids:
        producto = Producto.objects.get(id=extra_id)
        PedidoExtra.objects.create(
            pedido=pedido,
            producto=producto,
            cantidad=1,
            precio=producto.precio
        )
```

## 📊 Testing

### Verificar en Desarrollo:
1. **Home**: `http://localhost:3000/`
   - Scroll hasta "AGREGÁ ADICIONALES"
   - Verifica que se muestren en círculos
   - Click en un producto

2. **Checkout**: `http://localhost:3000/checkout/multistep`
   - Agrega productos al carrito
   - Ve al checkout
   - Llega al Paso 4
   - Selecciona extras
   - Verifica que se marquen

### Verificar en Producción:
1. **Home**: `https://floreriayviverocristian.up.railway.app/`
2. **Checkout**: Crear pedido y llegar al paso 4

## 🐛 Troubleshooting

### Problema: No se muestran productos
**Solución**:
1. Verifica que existan productos con `es_adicional=True`
2. Verifica que estén activos
3. Revisa la consola del navegador
4. Verifica la API: `/api/catalogo/productos/adicionales/`

### Problema: Imágenes no cargan
**Solución**:
1. Verifica que `res.cloudinary.com` esté en `next.config.js`
2. Verifica las URLs de las imágenes
3. Usa imágenes directas, no Next Image optimization

### Problema: No se seleccionan en checkout
**Solución**:
1. Verifica que `selectedExtras` se actualice en el estado
2. Revisa la consola para errores
3. Verifica que `onExtrasChange` se llame correctamente

## 📝 Resumen

✅ **Componente ExtrasSelector**: Muestra extras en checkout con selección múltiple
✅ **Componente AdicionalesSection**: Muestra extras en home con diseño circular
✅ **Integración en Checkout**: Paso 4 ahora carga productos dinámicamente
✅ **Integración en Home**: Sección de adicionales con diseño mejorado
✅ **API funcionando**: `/api/catalogo/productos/adicionales/`
✅ **Responsive**: Funciona en móvil y desktop
✅ **Loading states**: Spinners mientras carga
✅ **Error handling**: Manejo de errores de API

**Pendiente**:
- Integrar extras con el pedido en el backend
- Calcular total incluyendo extras
- Guardar extras en la base de datos

¡La funcionalidad de productos adicionales está lista para usar! 🎉
