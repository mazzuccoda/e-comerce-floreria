#!/usr/bin/env python3
"""
Script para crear imagen placeholder
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder():
    # Crear directorio si no existe
    os.makedirs('frontend/public/images', exist_ok=True)
    
    # Crear imagen
    width, height = 400, 400
    img = Image.new('RGB', (width, height), color='#f3f4f6')
    
    # Dibujar
    draw = ImageDraw.Draw(img)
    
    # Dibujar borde
    draw.rectangle([(10, 10), (width-10, height-10)], outline='#d1d5db', width=3)
    
    # Texto
    text = "🌸\nSin Imagen"
    
    # Calcular posición del texto (centrado)
    bbox = draw.textbbox((0, 0), text, font=None)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((width - text_width) // 2, (height - text_height) // 2)
    
    # Dibujar texto
    draw.text(position, text, fill='#9ca3af', font=None, align='center')
    
    # Guardar
    img.save('frontend/public/images/no-image.jpg', 'JPEG', quality=85)
    print('✅ Imagen placeholder creada en frontend/public/images/no-image.jpg')

if __name__ == '__main__':
    create_placeholder()
