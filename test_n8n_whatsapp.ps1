# Test n8n WhatsApp Integration
$url = "https://n8n-production-e029.up.railway.app/webhook/pedido-confirmado"

$body = @{
    pedido_id = 1
    numero_pedido = "TEST001"
    nombre_destinatario = "Daniel Mazzucco"
    telefono_destinatario = "3813671352"
    direccion = "Av. Corrientes 1234, CABA"
    fecha_entrega = "25/10/2025"
    franja_horaria = "Mañana 9-12hs"
    estado = "confirmado"
    total = "15000"
    dedicatoria = "Prueba de integracion n8n + Twilio WhatsApp"
    items = @(
        @{
            producto_nombre = "Ramo de Rosas Rojas"
            cantidad = 2
            precio = "7500"
        },
        @{
            producto_nombre = "Tarjeta de Regalo"
            cantidad = 1
            precio = "500"
        }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "X-API-Key" = "floreria_n8n_api_key_2025_super_secret_change_this"
    "Content-Type" = "application/json"
}

Write-Host "Enviando webhook a n8n..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Cyan
Write-Host "Telefono: 3813671352" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers
    Write-Host "`nRespuesta exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "`nError:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.Exception.Response.StatusCode
}
