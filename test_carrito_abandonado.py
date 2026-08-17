"""
Script de prueba para simular un carrito abandonado
Ejecutar: python test_carrito_abandonado.py
"""
import os
import requests
import json

# Configuración
DJANGO_URL = "https://e-comerce-floreria-production.up.railway.app"
# DJANGO_URL = "http://localhost:8000"  # Descomentar para testing local

def crear_carrito_abandonado():
    """Crea un carrito abandonado de prueba"""
    
    url = f"{DJANGO_URL}/api/pedidos/carrito-abandonado/"
    
    # Datos del carrito abandonado
    data = {
        "telefono": "3813671352",  # ⚠️ CAMBIAR POR TU NÚMERO DE PRUEBA
        "email": "test@example.com",
        "nombre": "Daniel Test",
        "items": [
            {
                "nombre": "Ramo de Rosas Rojas",
                "cantidad": 2,
                "precio": "15000"
            },
            {
                "nombre": "Tarjeta personalizada",
                "cantidad": 1,
                "precio": "500"
            }
        ],
        "total": "30500"
    }
    
    print("🛒 Creando carrito abandonado...")
    print(f"📱 Teléfono: {data['telefono']}")
    print(f"💰 Total: ${data['total']}")
    print(f"📦 Items: {len(data['items'])}")
    
    try:
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Carrito creado exitosamente!")
            print(f"   ID: {result.get('carrito_id')}")
            print(f"   Mensaje: {result.get('mensaje')}")
            print(f"\n⏰ El workflow n8n lo detectará en la próxima ejecución (cada 1 hora)")
            print(f"   O ejecutá manualmente el workflow en n8n para probar ahora")
            return result
        else:
            print(f"\n❌ Error {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None


def listar_carritos_pendientes():
    """Lista los carritos pendientes (requiere API key)"""
    
    url = f"{DJANGO_URL}/api/pedidos/carritos-pendientes?horas=24"
    
    # La API key se toma del entorno (misma que N8N_API_KEY en Railway)
    headers = {
        "X-API-Key": os.getenv("N8N_API_KEY", "")
    }
    
    print("\n📋 Listando carritos pendientes (últimas 24 horas)...")
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            carritos = response.json()
            print(f"\n✅ Encontrados {len(carritos)} carritos pendientes:")
            
            for carrito in carritos:
                print(f"\n   ID: {carrito['id']}")
                print(f"   Teléfono: {carrito['telefono']}")
                print(f"   Nombre: {carrito.get('nombre', 'N/A')}")
                print(f"   Total: ${carrito['total']}")
                print(f"   Creado: {carrito['creado']}")
                
            return carritos
        else:
            print(f"\n❌ Error {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TEST - CARRITO ABANDONADO")
    print("=" * 60)
    
    # Crear carrito abandonado
    resultado = crear_carrito_abandonado()
    
    if resultado:
        print("\n" + "=" * 60)
        print("📊 PRÓXIMOS PASOS:")
        print("=" * 60)
        print("1. Ir a n8n y ejecutar manualmente el workflow 'Carrito Abandonado - Recovery'")
        print("2. Verificar que llegue el WhatsApp al número configurado")
        print("3. Revisar el admin de Django para ver el carrito marcado como 'recordatorio enviado'")
        print("\nO esperar a que el cron ejecute automáticamente (cada 1 hora)")
        
        # Opcional: listar carritos pendientes
        print("\n" + "=" * 60)
        input("\nPresioná ENTER para listar carritos pendientes...")
        listar_carritos_pendientes()
