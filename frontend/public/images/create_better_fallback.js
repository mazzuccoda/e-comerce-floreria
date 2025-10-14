const fs = require('fs');
const path = require('path');

// Crear una imagen más clara para fallback
console.log('Creando imagen fallback mejorada...');

// Script para verificar que la imagen no-image.jpg está en su lugar
const fallbackImagePath = path.join(__dirname, 'no-image.jpg');

if (fs.existsSync(fallbackImagePath)) {
  console.log('✅ Imagen fallback ya existe en:', fallbackImagePath);
  
  // Verificar el tamaño para asegurarnos de que es válida
  const stats = fs.statSync(fallbackImagePath);
  console.log(`Tamaño: ${stats.size} bytes`);
  
  if (stats.size < 100) {
    console.warn('⚠️ Advertencia: La imagen parece ser muy pequeña, podría ser inválida');
  }
} else {
  console.error('❌ Error: Imagen fallback no existe en:', fallbackImagePath);
  console.error('Por favor, crea una imagen para fallback');
}

// Script completo
console.log('Verificación de imágenes fallback completada');
