"""
Vista temporal para debuggear MercadoPago desde el navegador
ELIMINAR DESPUÉS DE USARLA
"""
from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.conf import settings
import mercadopago
import json


@require_GET
def test_mercadopago_view(request):
    """Vista para verificar credenciales de MercadoPago"""
    
    output = []
    output.append("="*60)
    output.append("🔍 VERIFICANDO CREDENCIALES DE MERCADOPAGO")
    output.append("="*60)
    output.append("")
    
    # Obtener credenciales
    access_token = settings.MERCADOPAGO['ACCESS_TOKEN']
    public_key = settings.MERCADOPAGO['PUBLIC_KEY']
    sandbox_mode = settings.MERCADOPAGO['SANDBOX']
    
    # Mostrar información
    output.append(f"📌 Modo SANDBOX: {sandbox_mode}")
    output.append(f"📌 Access Token (primeros 20 chars): {access_token[:20]}...")
    output.append(f"📌 Access Token (últimos 10 chars): ...{access_token[-10:]}")
    output.append(f"📌 Token length: {len(access_token)}")
    output.append(f"📌 Public Key (primeros 20 chars): {public_key[:20]}...")
    output.append("")
    
    # Determinar tipo de token
    if access_token.startswith('TEST-'):
        token_type = "TEST (Prueba)"
        output.append(f"⚠️  Tipo de token: {token_type}")
    elif access_token.startswith('APP_USR-'):
        token_type = "PRODUCTION (Producción)"
        output.append(f"✅ Tipo de token: {token_type}")
    else:
        token_type = "UNKNOWN (Desconocido)"
        output.append(f"❌ Tipo de token: {token_type}")
    
    output.append("")
    output.append("-"*60)
    output.append("🔍 VERIFICANDO CONSISTENCIA")
    output.append("-"*60)
    output.append("")
    
    if sandbox_mode and not access_token.startswith('TEST-'):
        output.append("❌ ERROR: SANDBOX=True pero el token NO es de TEST")
    elif not sandbox_mode and access_token.startswith('TEST-'):
        output.append("❌ ERROR: SANDBOX=False pero el token ES de TEST")
    else:
        output.append("✅ Modo y token son consistentes")
    
    output.append("")
    output.append("-"*60)
    output.append("🔌 PROBANDO CONEXIÓN CON MERCADOPAGO")
    output.append("-"*60)
    output.append("")
    
    try:
        sdk = mercadopago.SDK(access_token)
        
        # Intentar crear una preferencia mínima de prueba
        test_preference = {
            "items": [
                {
                    "id": "test",
                    "title": "Test Product",
                    "quantity": 1,
                    "currency_id": "ARS",
                    "unit_price": 100.0
                }
            ],
            "external_reference": "test-debug-001"
        }
        
        output.append("📤 Enviando preferencia de prueba...")
        response = sdk.preference().create(test_preference)
        
        output.append(f"📥 Response status: {response.get('status')}")
        output.append("")
        
        if response.get('status') == 201:
            output.append("✅ ¡CREDENCIALES VÁLIDAS! La conexión funciona correctamente.")
            preference_id = response['response']['id']
            init_point = response['response'].get('init_point', 'N/A')
            output.append(f"📌 Preference ID creado: {preference_id}")
            output.append(f"📌 Init Point: {init_point}")
        else:
            output.append("❌ ERROR AL CREAR PREFERENCIA")
            output.append("")
            output.append("Response completo:")
            output.append(json.dumps(response, indent=2))
            
            # Intentar extraer el mensaje de error
            error_msg = response.get('response', {}).get('message', 'Sin mensaje de error')
            output.append(f"💬 Mensaje de error: {error_msg}")
            
    except Exception as e:
        output.append(f"❌ EXCEPCIÓN: {str(e)}")
        import traceback
        output.append("")
        output.append("Traceback:")
        output.append(traceback.format_exc())
    
    output.append("")
    output.append("="*60)
    output.append("FIN DE LA VERIFICACIÓN")
    output.append("="*60)
    
    # Retornar como texto plano
    return HttpResponse("\n".join(output), content_type="text/plain")
