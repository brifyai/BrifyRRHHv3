const fs = require('fs');
const path = require('path');

// Leer el archivo
const filePath = 'src/components/communication/EmployeeFolders.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Corregir el bloque default malformado
content = content.replace(
  /default:\s*Swal\.fire\(\{[\s\S]*?const handleBulkSync = useCallback[\s\S]*?\}, \[loadFolders\]\);/,
  `default:
        Swal.fire({
          title: 'Acción no válida',
          text: 'La acción solicitada no es válida.',
          icon: 'error',
          confirmButtonText: 'OK'
        });`
);

// 2. Agregar la función handleBulkSync después de handleBulkAction
const insertPosition = content.indexOf('}, [selectedFolders, foldersToShow]);');
if (insertPosition !== -1) {
  const before = content.substring(0, insertPosition);
  const after = content.substring(insertPosition);
  
  const handleBulkSyncFunction = `

  // Función para manejar sincronización en lote
  const handleBulkSync = useCallback(async (selectedFolderData, direction, createMissing) => {
    setIsBulkSyncing(true);
    setBulkSyncProgress({});

    try {
      const result = await bulkSyncService.bulkSyncFolders({
        folders: selectedFolderData,
        direction: direction,
        createMissingFolders: createMissing,
        onProgress: (progress) => {
          setBulkSyncProgress(progress);
        }
      });

      console.log('🔄 [BULK SYNC] Resultado:', result);

      // Mostrar resultado final
      const successCount = result.successful.length;
      const errorCount = result.failed.length;

      if (errorCount === 0) {
        Swal.fire({
          title: '¡Sincronización Completada!',
          text: \`Se sincronizaron exitosamente \${successCount} carpeta(s).\`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          title: 'Sincronización Parcial',
          html: \`
            <div class="space-y-2">
              <p><strong>Exitosas:</strong> \${successCount}</p>
              <p><strong>Con errores:</strong> \${errorCount}</p>
              \${result.failed.length > 0 ? \`
                <div class="mt-3 p-2 bg-red-50 rounded text-left text-sm">
                  <strong>Errores:</strong>
                  <ul class="mt-1 list-disc list-inside">
                    \${result.failed.map(item => \`<li>\${item.folder?.employeeName || 'Carpeta'}: \${item.error}</li>\`).join('')}
                  </ul>
                </div>
              \` : ''}
            </div>
          \`,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      }

      // Recargar carpetas para mostrar cambios
      await loadFolders();

    } catch (error) {
      console.error('❌ [BULK SYNC] Error:', error);
      Swal.fire({
        title: 'Error en Sincronización',
        text: 'No se pudo completar la sincronización: ' + error.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsBulkSyncing(false);
      setBulkSyncProgress({});
    }
  }, [loadFolders]);`;
  
  content = before + handleBulkSyncFunction + after;
}

// 3. Reemplazar el case 'sync' con la implementación completa
content = content.replace(
  /case 'sync':[\s\S]*?break;/,
  `case 'sync':
        // Sincronización en lote con BulkSyncService
        Swal.fire({
          title: 'Sincronización en lote',
          html: \`
            <div class="space-y-4">
              <p>Se sincronizarán <strong>\${selectedFolders.size}</strong> carpetas.</p>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Dirección de sincronización:</label>
                <select id="syncDirection" class="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="bidirectional">Bidireccional (Drive ↔ Supabase)</option>
                  <option value="drive-to-supabase">Google Drive → Supabase</option>
                  <option value="supabase-to-drive">Supabase → Google Drive</option>
                </select>
              </div>
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="createMissingFolders" class="rounded">
                <label for="createMissingFolders" class="text-sm text-gray-600">Crear carpetas faltantes en Google Drive</label>
              </div>
            </div>
          \`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Iniciar Sincronización',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const direction = document.getElementById('syncDirection').value;
            const createMissing = document.getElementById('createMissingFolders').checked;
            return { direction, createMissing };
          }
        }).then((result) => {
          if (result.isConfirmed) {
            handleBulkSync(selectedFolderData, result.value.direction, result.value.createMissing);
          }
        });
        break;`
);

// Escribir el archivo corregido
fs.writeFileSync(filePath, content);
console.log('✅ Archivo EmployeeFolders.js corregido exitosamente');