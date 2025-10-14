# Script para reemplazar colores rosa por verde en todo el proyecto

$files = Get-ChildItem -Path ".\app" -Include *.tsx,*.ts,*.jsx,*.js -Recurse
$files += Get-ChildItem -Path ".\components" -Include *.tsx,*.ts,*.jsx,*.js -Recurse -ErrorAction SilentlyContinue

$replacements = @{
    'bg-pink-600' = 'bg-green-700'
    'bg-pink-700' = 'bg-green-800'
    'hover:bg-pink-600' = 'hover:bg-green-700'
    'hover:bg-pink-700' = 'hover:bg-green-800'
    'text-pink-600' = 'text-green-700'
    'text-pink-500' = 'text-green-600'
    'border-pink-500' = 'border-green-600'
    'border-pink-600' = 'border-green-700'
    'ring-pink-500' = 'ring-green-600'
    'ring-pink-600' = 'ring-green-700'
    'focus:ring-pink-500' = 'focus:ring-green-600'
    'focus:ring-pink-600' = 'focus:ring-green-700'
    'focus:border-pink-500' = 'focus:border-green-600'
    'bg-pink-100' = 'bg-green-100'
    'bg-pink-50' = 'bg-green-50'
    'border-pink-100' = 'border-green-100'
    'peer-checked:bg-pink-600' = 'peer-checked:bg-green-700'
    'border-b-2 border-pink-500 text-pink-600' = 'border-b-2 border-green-600 text-green-700'
    'from-purple-500 to-pink-600' = 'from-green-500 to-green-700'
    'shadow-purple-500/25' = 'shadow-green-500/25'
    'from-pink-50 to-purple-50' = 'from-green-50 to-blue-50'
}

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($key in $replacements.Keys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalChanges++
        Write-Host "✅ Actualizado: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Total de archivos actualizados: $totalChanges" -ForegroundColor Cyan
