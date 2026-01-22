# Script para organizar y limpiar archivos .mjs y .js obsoletos
# Fecha: 2026-01-22

Write-Host "🧹 Limpieza de Scripts - StaffHub" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Crear estructura de carpetas
$folders = @(
    "scripts/diagnostics",
    "scripts/testing",
    "scripts/setup",
    "scripts/fixes",
    "scripts/debug",
    "scripts/obsolete"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "✅ Creada carpeta: $folder" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📦 Moviendo archivos a carpetas organizadas..." -ForegroundColor Yellow
Write-Host ""

# MANTENER EN RAÍZ (archivos importantes)
$keepInRoot = @(
    "server-simple.mjs",
    "server-simple.js",
    "server.js",
    "postcss.config.js",
    "tailwind.config.js",
    "load-env.mjs"
)

# SCRIPTS DE DIAGNÓSTICO (mover a scripts/diagnostics)
$diagnostics = @(
    "diagnose_*.mjs",
    "debug_*.mjs",
    "diagnostico*.mjs",
    "diagnostico*.js",
    "check_*.mjs",
    "inspect_*.mjs",
    "investigate_*.mjs",
    "ANALISIS_*.mjs"
)

# SCRIPTS DE TESTING (mover a scripts/testing)
$testing = @(
    "test_*.mjs",
    "test*.js",
    "verify_*.mjs",
    "verify_*.js",
    "verificar_*.mjs",
    "verificar_*.js"
)

# SCRIPTS DE SETUP (mover a scripts/setup)
$setup = @(
    "setup_*.mjs",
    "setup_*.js",
    "create_*.mjs",
    "seed_*.mjs",
    "add_*.mjs",
    "migrate_*.mjs",
    "migrate_*.js",
    "generate_*.mjs"
)

# SCRIPTS DE FIXES (mover a scripts/fixes)
$fixes = @(
    "fix_*.mjs",
    "fix_*.js",
    "apply_*.mjs",
    "clean_*.mjs",
    "emergency_*.mjs",
    "force_*.mjs",
    "manual_*.mjs",
    "rebuild_*.mjs",
    "remove_*.mjs",
    "update_*.mjs",
    "update_*.js",
    "audit_*.js",
    "execute_*.mjs"
)

# ARCHIVOS OBSOLETOS (mover a scripts/obsolete)
$obsolete = @(
    "EmployeeFolders_*.js",
    "simulate*.js",
    "search-all-tables.js",
    "add_phone_column_and_update.js",
    "check_employees_structure.js",
    "dashboard_fix.js",
    "debug_infinite_loop*.js",
    "checkTableStructure.mjs",
    "debugEmployeeFoldersFilters.mjs",
    "diagnoseEmployeeFolders.mjs",
    "supabase_pi_connector.mjs",
    "simple_*.mjs",
    "delete_test_employee.mjs",
    "get_oauth_url*.mjs",
    "list_companies.mjs"
)

# Función para mover archivos
function Move-FilesPattern {
    param (
        [string[]]$patterns,
        [string]$destination,
        [string]$category
    )
    
    $count = 0
    foreach ($pattern in $patterns) {
        $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($keepInRoot -notcontains $file.Name) {
                Move-Item -Path $file.FullName -Destination $destination -Force
                $count++
            }
        }
    }
    
    if ($count -gt 0) {
        Write-Host "  ✅ $category : $count archivos" -ForegroundColor Green
    }
}

# Mover archivos
Move-FilesPattern -patterns $diagnostics -destination "scripts/diagnostics" -category "Diagnósticos"
Move-FilesPattern -patterns $testing -destination "scripts/testing" -category "Testing"
Move-FilesPattern -patterns $setup -destination "scripts/setup" -category "Setup"
Move-FilesPattern -patterns $fixes -destination "scripts/fixes" -category "Fixes"
Move-FilesPattern -patterns $obsolete -destination "scripts/obsolete" -category "Obsoletos"

Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$diagnosticsCount = (Get-ChildItem -Path "scripts/diagnostics" -File).Count
$testingCount = (Get-ChildItem -Path "scripts/testing" -File).Count
$setupCount = (Get-ChildItem -Path "scripts/setup" -File).Count
$fixesCount = (Get-ChildItem -Path "scripts/fixes" -File).Count
$obsoleteCount = (Get-ChildItem -Path "scripts/obsolete" -File).Count
$rootMjs = (Get-ChildItem -Path . -Filter "*.mjs" -File).Count
$rootJs = (Get-ChildItem -Path . -Filter "*.js" -File).Count

Write-Host "  📁 scripts/diagnostics: $diagnosticsCount archivos" -ForegroundColor White
Write-Host "  📁 scripts/testing: $testingCount archivos" -ForegroundColor White
Write-Host "  📁 scripts/setup: $setupCount archivos" -ForegroundColor White
Write-Host "  📁 scripts/fixes: $fixesCount archivos" -ForegroundColor White
Write-Host "  📁 scripts/obsolete: $obsoleteCount archivos" -ForegroundColor Yellow
Write-Host "  📁 Raíz: $rootMjs .mjs + $rootJs .js" -ForegroundColor White

Write-Host ""
Write-Host "✅ Limpieza completada!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Nota: Los archivos en scripts/obsolete pueden eliminarse si no los necesitas." -ForegroundColor Yellow
