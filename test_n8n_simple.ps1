# Test n8n WhatsApp - Numero ya formateado
$url = "https://n8n-production-e029.up.railway.app/webhook/pedido-confirmado"

$body = @{
    pedido_id = 1
    numero_pedido = "TEST002"
    nombre_destinatario = "Daniel Mazzucco"
    telefono_destinatario = "5493813671352"
    direccion = "Av. Corrientes 1234, CABA"
    fecha_entrega = "25/10/2025"
    franja_horaria = "Mañana 9-12hs"
    estado = "confirmado"
    total = "15000"
    dedicatoria = "Prueba con numero formateado"
    items = @(
        @{
            producto_nombre = "Ramo de Rosas"
            cantidad = 1
            precio = "15000"
        }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "X-API-Key" = "floreria_n8n_api_key_2025_super_secret_change_this"
    "Content-Type" = "application/json"
}

Write-Host "Enviando con telefono YA formateado: 5493813671352" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers
    Write-Host "`nRespuesta exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "`nError:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
