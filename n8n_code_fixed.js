// Obtener datos del webhook
const pedido = $input.item.json.body || $input.item.json;

// Log para debug
console.log('Datos recibidos:', JSON.stringify(pedido, null, 2));

// Validar datos recibidos
if (!pedido.numero_pedido || !pedido.telefono_destinatario) {
  console.error('Datos faltantes:', {
    numero_pedido: pedido.numero_pedido,
    telefono_destinatario: pedido.telefono_destinatario
  });
  throw new Error('❌ Datos incompletos: falta numero_pedido o telefono_destinatario');
}

// Formatear teléfono argentino
let telefono = pedido.telefono_destinatario.toString().replace(/\D/g, '');

// Agregar código de país si falta
if (!telefono.startsWith('54')) {
  telefono = '54' + telefono;
}

// Formatear mensaje de WhatsApp
const mensaje = `
🌸 *Florería Cristina* 🌸

✅ *¡Pedido Confirmado!*

📋 *Detalles del Pedido:*
• Número: #${pedido.numero_pedido}
• Destinatario: ${pedido.nombre_destinatario}
• Dirección: ${pedido.direccion}
• Fecha de entrega: ${pedido.fecha_entrega}
• Horario: ${pedido.franja_horaria}

💰 *Total: $${Number(pedido.total).toLocaleString('es-AR')}*

📦 *Productos:*
${pedido.items.map(item => 
  `• ${item.cantidad}x ${item.producto_nombre} - $${Number(item.precio).toLocaleString('es-AR')}`
).join('\n')}

${pedido.dedicatoria ? `\n💌 *Dedicatoria:*\n"${pedido.dedicatoria}"\n` : ''}

📱 Te notificaremos cuando tu pedido esté en camino.

¡Gracias por elegirnos! 💐
`.trim();

return {
  json: {
    telefono: telefono,
    mensaje: mensaje,
    pedido_id: pedido.pedido_id,
    numero_pedido: pedido.numero_pedido
  }
};
