"""
Comando para verificar las credenciales de MercadoPago
"""
import mercadopago
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Verifica las credenciales de MercadoPago'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("🔍 VERIFICANDO CREDENCIALES DE MERCADOPAGO")
        self.stdout.write("="*60 + "\n")
        
        # Obtener credenciales
        access_token = settings.MERCADOPAGO['ACCESS_TOKEN']
        public_key = settings.MERCADOPAGO['PUBLIC_KEY']
        sandbox_mode = settings.MERCADOPAGO['SANDBOX']
        
        # Mostrar información
        self.stdout.write(f"📌 Modo SANDBOX: {sandbox_mode}")
        self.stdout.write(f"📌 Access Token (primeros 20 chars): {access_token[:20]}...")
        self.stdout.write(f"📌 Access Token (últimos 10 chars): ...{access_token[-10:]}")
        self.stdout.write(f"📌 Token length: {len(access_token)}")
        self.stdout.write(f"📌 Public Key (primeros 20 chars): {public_key[:20]}...")
        
        # Determinar tipo de token
        if access_token.startswith('TEST-'):
            token_type = "TEST (Prueba)"
            self.stdout.write(self.style.WARNING(f"⚠️  Tipo de token: {token_type}"))
        elif access_token.startswith('APP_USR-'):
            token_type = "PRODUCTION (Producción)"
            self.stdout.write(self.style.SUCCESS(f"✅ Tipo de token: {token_type}"))
        else:
            token_type = "UNKNOWN (Desconocido)"
            self.stdout.write(self.style.ERROR(f"❌ Tipo de token: {token_type}"))
        
        # Verificar consistencia
        self.stdout.write("\n" + "-"*60)
        self.stdout.write("🔍 VERIFICANDO CONSISTENCIA")
        self.stdout.write("-"*60 + "\n")
        
        if sandbox_mode and not access_token.startswith('TEST-'):
            self.stdout.write(self.style.ERROR(
                "❌ ERROR: SANDBOX=True pero el token NO es de TEST"
            ))
        elif not sandbox_mode and access_token.startswith('TEST-'):
            self.stdout.write(self.style.ERROR(
                "❌ ERROR: SANDBOX=False pero el token ES de TEST"
            ))
        else:
            self.stdout.write(self.style.SUCCESS("✅ Modo y token son consistentes"))
        
        # Probar conexión
        self.stdout.write("\n" + "-"*60)
        self.stdout.write("🔌 PROBANDO CONEXIÓN CON MERCADOPAGO")
        self.stdout.write("-"*60 + "\n")
        
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
                "external_reference": "test-001"
            }
            
            self.stdout.write("📤 Enviando preferencia de prueba...")
            response = sdk.preference().create(test_preference)
            
            self.stdout.write(f"📥 Response status: {response.get('status')}")
            
            if response.get('status') == 201:
                self.stdout.write(self.style.SUCCESS(
                    "\n✅ ¡CREDENCIALES VÁLIDAS! La conexión funciona correctamente."
                ))
                preference_id = response['response']['id']
                init_point = response['response'].get('init_point', 'N/A')
                self.stdout.write(f"\n📌 Preference ID creado: {preference_id}")
                self.stdout.write(f"📌 Init Point: {init_point[:50]}...")
            else:
                self.stdout.write(self.style.ERROR(
                    f"\n❌ ERROR AL CREAR PREFERENCIA"
                ))
                self.stdout.write(f"Response completo: {response}")
                
                # Intentar extraer el mensaje de error
                error_msg = response.get('response', {}).get('message', 'Sin mensaje de error')
                self.stdout.write(f"\n💬 Mensaje de error: {error_msg}")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ EXCEPCIÓN: {str(e)}"))
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write("FIN DE LA VERIFICACIÓN")
        self.stdout.write("="*60 + "\n")
