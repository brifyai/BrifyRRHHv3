# Script para reemplazar todas las URLs incorrectas de Supabase
# Fecha: 2026-01-22

Write-Host "🔧 Corrigiendo URLs de Supabase en todos los scripts..." -ForegroundColor Cyan
Write-Host ""

$oldUrl = "https://tmqglnycivlcjijoymwe.supabase.co"
$newUrl = "https://supabase.staffhub.cl"
$count = 0

# Buscar en todos los archivos .mjs y .js en scripts/
$files = Get-ChildItem -Path scripts -Recurse -Include "*.mjs","*.js" -File

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($content -and $content -match [regex]::Escape($oldUrl)) {
        $newContent = $content -replace [regex]::Escape($oldUrl), $newUrl
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
        $count++
    }
}

Write-Host ""
Write-Host "📊 Total de archivos corregidos: $count" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Corrección completada!" -ForegroundColor Green
