# Configuración de WhatsApp para Cotizaciones

## Descripción
Los productos con precio = 0 en la base de datos mostrarán automáticamente:
- Texto: "Solicitar cotización"
- Botón de WhatsApp con mensaje pre-cargado

## Configuración

### 1. Crear archivo `.env.local`
En la raíz del proyecto `frontend/`, crear el archivo `.env.local` con:

```env
NEXT_PUBLIC_WHATSAPP_NUMBER=5491112345678
```

**Formato del número:**
- Sin el símbolo `+`
- Código de país (ej: 54 para Argentina)
- Código de área (ej: 9 11 para Buenos Aires)
- Número de teléfono

**Ejemplos:**
- Argentina (Buenos Aires): `5491112345678`
- Argentina (Córdoba): `5493512345678`
- España: `34612345678`
- México: `5215512345678`

### 2. Reiniciar el servidor de desarrollo
Después de crear/modificar el archivo `.env.local`:

```bash
npm run dev
```

## Funcionamiento

### Mensaje pre-cargado
Cuando un cliente hace clic en "Consultar por WhatsApp", se abre WhatsApp con este mensaje:

```
Hola! Me interesa obtener una cotización para:

- Producto: [Nombre del producto]
- Categoría: [Categoría del producto]

¿Podrían brindarme más información?
```

### Ejemplo visual
Para un producto con precio = 0, la tarjeta mostrará:

```
┌─────────────────────────────┐
│                             │
│   [Imagen del producto]     │
│                             │
│   Altar de Paz              │
│                             │
│   [Solicitar cotización]    │
│                             │
│   [📱 Consultar WhatsApp]   │
│                             │
└─────────────────────────────┘
```

## Archivos modificados
- `frontend/app/components/ProductCard.tsx` - Componente principal
- `frontend/.env.example` - Ejemplo de configuración
- `frontend/.env.local` - Configuración real (no se sube a git)
