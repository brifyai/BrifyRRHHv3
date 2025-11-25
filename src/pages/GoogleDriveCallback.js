/**
 * Google Drive OAuth Callback Page
 * Maneja el callback de OAuth de Google Drive
 * Esta página debe estar accesible en /auth/google/callback
 */

import React, { useEffect, useState } from 'react';
import googleDriveCallbackHandler from '../lib/googleDriveCallbackHandler.js';

const GoogleDriveCallback = () => {
  const [status, setStatus] = useState('Procesando autorización...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        console.log('🔄 Procesando callback de Google Drive...');
        console.log('📍 URL actual:', window.location.href);
        console.log('🔑 Código presente:', !!code);
        console.log('❌ Error presente:', !!error);

        if (error) {
          throw new Error(`Error de autorización: ${error}`);
        }

        if (!code) {
          throw new Error('No se recibió código de autorización');
        }

        // Obtener userId del localStorage o sessionStorage
        const userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
        if (!userId) {
          throw new Error('No se pudo obtener el ID del usuario');
        }

        console.log('👤 User ID:', userId);

        // Procesar el código de autorización
        setStatus('Intercambiando código por tokens...');
        const result = await googleDriveCallbackHandler.handleOAuthCallback({
          code,
          state,
          userId
        });

        if (result.success) {
          setStatus('✅ ¡Conexión exitosa! Google Drive configurado.');
          console.log('✅ Conexión exitosa:', result.data);
          
          // Redirigir después de 3 segundos
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else {
          throw new Error(result.error?.message || 'Error desconocido');
        }

      } catch (error) {
        console.error('❌ Error procesando callback:', error);
        setError(error.message);
        setStatus('❌ Error en la conexión');
        
        // Redirigir a configuración después de 5 segundos
        setTimeout(() => {
          window.location.href = '/settings';
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        {isLoading && (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Conectando Google Drive
        </h1>
        
        <p style={{
          color: '#6b7280',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          {status}
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '20px',
            fontSize: '14px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!error && !isLoading && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '20px',
            fontSize: '14px'
          }}>
            <strong>¡Éxito!</strong> Redirigiendo al dashboard...
          </div>
        )}

        <div style={{
          marginTop: '30px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          Si no eres redirigido automáticamente, 
          <a href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            haz clic aquí
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveCallback;