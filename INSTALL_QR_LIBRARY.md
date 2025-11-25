# Instalación de Librería QR (OPCIONAL)

## Para habilitar la funcionalidad de QR de transferencia

Si quieres usar la funcionalidad de QR de Mercado Pago para transferencias, ejecuta:

```bash
cd frontend
npm install qrcode
npm install --save-dev @types/qrcode
```

## ¿Es obligatorio?

**NO**. La funcionalidad de QR es completamente opcional:
- Si NO instalas la librería, el componente simplemente no se mostrará
- El resto de la aplicación funcionará perfectamente
- El pago por transferencia tradicional seguirá funcionando

## ¿Cuándo instalarla?

Instala la librería cuando:
- Quieras ofrecer QR de Mercado Pago para transferencias
- Quieras confirmación automática de pagos
- Quieras mejorar la UX del pago por transferencia

## Cómo habilitar/deshabilitar

En `frontend/app/checkout/success/page.tsx`:

```tsx
// HABILITADO (con QR)
<TransferQROptional 
  pedidoId={pedidoId} 
  metodoPago={pedidoData?.metodo_pago}
  enabled={true}  // ← Cambiar a true para habilitar
/>

// DESHABILITADO (sin QR)
<TransferQROptional 
  pedidoId={pedidoId} 
  metodoPago={pedidoData?.metodo_pago}
  enabled={false}  // ← Cambiar a false para deshabilitar
/>
```

## Resultado

- **Con QR habilitado**: Usuario ve botón "Generar QR de Pago"
- **Con QR deshabilitado**: No se muestra nada, pago tradicional
