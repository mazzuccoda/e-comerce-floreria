"""
Views para pruebas de notificaciones
"""
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from .n8n_service import n8n_service
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def test_whatsapp(request):
    """
    Endpoint de prueba para enviar WhatsApp vía n8n
    
    GET: Muestra formulario de prueba
    POST: Envía mensaje de prueba
    
    Uso:
    GET  /api/notificaciones/test-whatsapp/
    POST /api/notificaciones/test-whatsapp/
         Body: {"telefono": "+5491123456789"}
    """
    
    if request.method == 'GET':
        # Mostrar página de prueba
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prueba WhatsApp - Florería Cristina</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #2d5f3f;
                    text-align: center;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #333;
                }
                input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                }
                button {
                    width: 100%;
                    padding: 12px;
                    background: #2d5f3f;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                }
                button:hover {
                    background: #1f4429;
                }
                .info {
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .success {
                    background: #c8e6c9;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                    display: none;
                }
                .error {
                    background: #ffcdd2;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌸 Prueba de WhatsApp</h1>
                
                <div class="info">
                    <strong>ℹ️ Instrucciones:</strong><br>
                    1. Ingresa tu número de WhatsApp en formato internacional<br>
                    2. Ejemplo: +5491123456789<br>
                    3. Click en "Enviar Mensaje de Prueba"<br>
                    4. Revisa tu WhatsApp
                </div>
                
                <form id="testForm">
                    <div class="form-group">
                        <label>📱 Número de WhatsApp:</label>
                        <input 
                            type="text" 
                            id="telefono" 
                            name="telefono" 
                            placeholder="+5491123456789"
                            required
                        >
                    </div>
                    
                    <button type="submit">Enviar Mensaje de Prueba</button>
                </form>
                
                <div id="success" class="success"></div>
                <div id="error" class="error"></div>
            </div>
            
            <script>
                document.getElementById('testForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const telefono = document.getElementById('telefono').value;
                    const successDiv = document.getElementById('success');
                    const errorDiv = document.getElementById('error');
                    
                    // Ocultar mensajes previos
                    successDiv.style.display = 'none';
                    errorDiv.style.display = 'none';
                    
                    try {
                        const response = await fetch('/api/notificaciones/test-whatsapp/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ telefono })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            successDiv.innerHTML = '✅ ' + data.message;
                            successDiv.style.display = 'block';
                        } else {
                            errorDiv.innerHTML = '❌ ' + data.error;
                            errorDiv.style.display = 'block';
                        }
                    } catch (error) {
                        errorDiv.innerHTML = '❌ Error: ' + error.message;
                        errorDiv.style.display = 'block';
                    }
                });
            </script>
        </body>
        </html>
        """
        return HttpResponse(html)
    
    # POST - Enviar mensaje
    try:
        import json
        data = json.loads(request.body)
        telefono = data.get('telefono')
        
        if not telefono:
            return JsonResponse({
                'success': False,
                'error': 'Número de teléfono requerido'
            }, status=400)
        
        # Verificar que n8n esté habilitado
        if not n8n_service.enabled:
            return JsonResponse({
                'success': False,
                'error': 'n8n está deshabilitado. Configura N8N_ENABLED=True'
            }, status=400)
        
        # Crear pedido mock para prueba
        class MockPedido:
            id = 99999
            numero_pedido = 'TEST-001'
            nombre_destinatario = 'Cliente de Prueba'
            telefono_destinatario = telefono
            direccion = 'Av. Corrientes 1234, CABA'
            fecha_entrega = datetime.now() + timedelta(days=1)
            estado = 'confirmado'
            total = 15000.00
            dedicatoria = '¡Mensaje de prueba desde Florería Cristina! 🌸'
            
            def get_franja_horaria_display(self):
                return 'Mañana (9:00 - 13:00)'
            
            class Items:
                @staticmethod
                def all():
                    class Item:
                        class Producto:
                            nombre = 'Ramo de 12 Rosas Rojas (PRUEBA)'
                        producto = Producto()
                        cantidad = 1
                        precio = '15000.00'
                    return [Item()]
            items = Items()
        
        pedido_mock = MockPedido()
        
        logger.info(f"📱 Enviando WhatsApp de prueba a {telefono}")
        
        # Enviar notificación
        success = n8n_service.enviar_notificacion_pedido(
            pedido=pedido_mock,
            tipo='confirmado'
        )
        
        if success:
            return JsonResponse({
                'success': True,
                'message': f'Mensaje enviado a {telefono}. Revisa tu WhatsApp! 📱'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'No se pudo enviar el mensaje. Revisa los logs.'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Error en test_whatsapp: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
