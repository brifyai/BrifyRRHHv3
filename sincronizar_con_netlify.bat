@echo off
echo === SINCRONIZACION COMPLETA CON NETLIFY ===
echo.

echo 1. Verificando commit actual...
git log --oneline -1

echo.
echo 2. Limpiando cache de npm...
npm cache clean --force

echo.
echo 3. Eliminando node_modules y dependencias...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 4. Eliminando archivos de build...
if exist .next rmdir /s /q .next
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
if exist .cache rmdir /s /q .cache

echo.
echo 5. Terminando todos los procesos Node.js...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 6. Verificando estado de git...
git status

echo.
echo 7. Reinstalando dependencias frescas...
npm install

echo.
echo 8. Iniciando servidor limpio...
echo.
echo === SERVIDOR INICIANDO EN http://localhost:3000 ===
echo IMPORTANTE: Limpia el cache del navegador (Ctrl+F5 o Ctrl+Shift+R)
echo.

npm run dev:win