#!/usr/bin/env python
"""
Script para verificar que las imágenes se sirvan correctamente
"""
import requests
import json

def test_api_productos():
    """Verificar que la API devuelve productos con imágenes"""
    print("\n" + "="*60)
    print("VERIFICANDO API DE PRODUCTOS")
    print("="*60 + "\n")
    
    try:
        response = requests.get('http://localhost:8000/api/catalogo/productos/')
        if response.status_code == 200:
            productos = response.json()
            print(f"✅ API funcionando: {len(productos)} productos")
            
            for i, prod in enumerate(productos[:3], 1):
                print(f"\n{i}. {prod['nombre']}")
                print(f"   - Imagen principal: {prod.get('imagen_principal', 'N/A')}")
                print(f"   - Cantidad de imágenes: {len(prod.get('imagenes', []))}")
        else:
            print(f"❌ Error en API: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_imagen_directa():
    """Verificar que las imágenes se sirvan directamente"""
    print("\n" + "="*60)
    print("VERIFICANDO ACCESO DIRECTO A IMÁGENES")
    print("="*60 + "\n")
    
    # Obtener una imagen de ejemplo
    try:
        response = requests.get('http://localhost:8000/api/catalogo/productos/')
        if response.status_code == 200:
            productos = response.json()
            if productos:
                imagen_url = productos[0].get('imagen_principal')
                if imagen_url:
                    print(f"Probando imagen: {imagen_url}")
                    
                    # Probar acceso directo
                    img_response = requests.get(f'http://localhost:8000{imagen_url}')
                    print(f"Status: {img_response.status_code}")
                    print(f"Content-Type: {img_response.headers.get('Content-Type')}")
                    print(f"Content-Length: {img_response.headers.get('Content-Length')} bytes")
                    
                    if img_response.status_code == 200:
                        print("✅ Imagen accesible desde el backend")
                    else:
                        print("❌ Imagen no accesible")
                        
                    # Probar a través de nginx
                    nginx_response = requests.get(f'http://localhost{imagen_url}')
                    print(f"\nA través de Nginx (puerto 80):")
                    print(f"Status: {nginx_response.status_code}")
                    print(f"Content-Type: {nginx_response.headers.get('Content-Type')}")
                    
                    if nginx_response.status_code == 200:
                        print("✅ Imagen accesible desde Nginx")
                    else:
                        print("❌ Imagen no accesible desde Nginx")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_placeholder():
    """Verificar que el placeholder existe"""
    print("\n" + "="*60)
    print("VERIFICANDO IMAGEN PLACEHOLDER")
    print("="*60 + "\n")
    
    try:
        # A través del frontend
        response = requests.get('http://localhost:3000/images/no-image.jpg')
        print(f"Frontend (puerto 3000): {response.status_code}")
        
        # A través de nginx
        response = requests.get('http://localhost/images/no-image.jpg')
        print(f"Nginx (puerto 80): {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Placeholder accesible")
        else:
            print("⚠️ Placeholder no accesible")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_api_productos()
    test_imagen_directa()
    test_placeholder()
    
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print("\nSi todas las pruebas pasaron, las imágenes deberían cargarse")
    print("correctamente en http://localhost:3000")
    print("\nSi hay errores, verifica:")
    print("1. Que nginx esté corriendo: docker ps | grep nginx")
    print("2. Que los volúmenes estén montados correctamente")
    print("3. Que las imágenes existan en ./media/productos/")
    print("="*60 + "\n")
