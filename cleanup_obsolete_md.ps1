# Script para eliminar archivos MD obsoletos
# Mantiene solo los archivos importantes y actuales

# Archivos a MANTENER
$keepFiles = @(
    "README.md",
    "ESTADO_ACTUAL_PROYECTO.md",
    "RESUMEN_COMPLETO_SESION.md",
    "ANALISIS_TABLAS_FALTANTES.md",
    "GUIA_COMPLETA_CREACION_TABLAS.md",
    "RESUMEN_CREACION_TABLAS_COMPLETO.md",
    "LIMPIAR_BASE_DATOS.md",
    "DATABASE_READY.md",
    "DATABASE_SETUP_INSTRUCTIONS.md",
    "CREATE_USER_CAMILO_INSTRUCTIONS.md",
    "INSTRUCCIONES_CREAR_USUARIO_CAMILO.md",
    "CONFIGURACION_FINAL_STAFFHUB.md",
    "EJECUTAR_AHORA_STAFFHUB.md",
    "PASOS_EXACTOS_EASYPANEL_REBUILD.md",
    "CORRECCION_URLS_COMPLETA.md",
    "CORREGIR_URL_SUPABASE_URGENTE.md",
    "LIMPIEZA_IMETRICS_COMPLETA.md",
    "SOLUCION_ERROR_USER_CREDENTIALS.md",
    "VERIFICAR_URL_FRONTEND.md",
    "DOCKER_DEPLOYMENT.md",
    "DEPLOYMENT_READY.md",
    "n8n-workflows-configuration.md",
    "README_EMPLOYEE_FOLDERS.md",
    "LIMPIAR_ARCHIVOS_MD.md"
)

# Obtener todos los archivos MD
$allMdFiles = Get-ChildItem -Path . -Filter "*.md" -File

$deletedCount = 0
$keptCount = 0

Write-Host "🧹 Iniciando limpieza de archivos MD obsoletos..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $allMdFiles) {
    if ($keepFiles -contains $file.Name) {
        Write-Host "✅ Manteniendo: $($file.Name)" -ForegroundColor Green
        $keptCount++
    } else {
        Write-Host "❌ Eliminando: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
        $deletedCount++
    }
}

Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   Archivos mantenidos: $keptCount" -ForegroundColor Green
Write-Host "   Archivos eliminados: $deletedCount" -ForegroundColor Red
Write-Host ""
Write-Host "✅ Limpieza completada!" -ForegroundColor Green
