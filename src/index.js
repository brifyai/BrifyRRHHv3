import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.js'

// 🚨 SISTEMA DE RECUPERACIÓN DE RECURSOS - INICIALIZACIÓN AUTOMÁTICA
// Detecta y resuelve errores ERR_INSUFFICIENT_RESOURCES
import resourceRecoveryService from './lib/resourceRecoveryService.js'

// Inicializar el sistema de recuperación de recursos al arrancar la app
resourceRecoveryService.init()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)