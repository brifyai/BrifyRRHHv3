import React, { useEffect, useState } from 'react'
import { clearSupabaseCache } from '../utils/clearSupabaseCache.js'

const CacheCleanup = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [cleanupDone, setCleanupDone] = useState(false)

  useEffect(() => {
    // Verificar si ya se limpió en esta sesión
    const alreadyCleaned = sessionStorage.getItem('supabase_cache_cleaned')
    if (alreadyCleaned) {
      return
    }

    console.log('🧹 Verificando caché de Supabase...')
    
    // Limpiar caché
    const cleanupResult = clearSupabaseCache()
    
    if (cleanupResult.success && cleanupResult.keysRemoved > 0) {
      console.log('✅ Caché limpiado exitosamente')
      console.log(`📊 Se eliminaron ${cleanupResult.keysRemoved} claves`)
      
      // Mostrar mensaje temporalmente
      setMessage(`Se eliminaron ${cleanupResult.keysRemoved} configuraciones incorrectas`)
      setIsVisible(true)
      
      // Marcar que ya se limpió en esta sesión
      sessionStorage.setItem('supabase_cache_cleaned', 'true')
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setIsVisible(false)
        setCleanupDone(true)
      }, 3000)
    } else if (cleanupResult.keysRemoved === 0) {
      console.log('✅ No se encontró configuración incorrecta')
      setCleanupDone(true)
    } else {
      console.error('❌ Error en la limpieza:', cleanupResult.error)
      setCleanupDone(true)
    }
  }, [])

  // No renderizar nada si ya se limpió o no hay mensaje que mostrar
  if (!isVisible || cleanupDone) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '10px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      zIndex: 9999,
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '20px' }}>🧹</div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Configuración Corregida
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {message}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default CacheCleanup