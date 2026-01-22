import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.js'

// 🚨 SISTEMA DE RECUPERACIÓN DE RECURSOS - INICIALIZACIÓN AUTOMÁTICA
// Detecta y resuelve errores ERR_INSUFFICIENT_RESOURCES
import resourceRecoveryService from './lib/resourceRecoveryService.js'

// Build version: 2.0.0 - Custom Auth Implementation
console.log('🔐 StaffHub v2.0.0 - Custom Authentication Active')

// Inicializar el sistema de recuperación de recursos al arrancar la app
resourceRecoveryService.init()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)