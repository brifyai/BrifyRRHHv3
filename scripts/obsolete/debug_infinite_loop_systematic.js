// 🔥 SISTEMA DE DEBUGGING SISTEMÁTICO PARA BUCLE INFINITO
// Este archivo implementa un sistema completo de logging para identificar TODAS las fuentes del bucle

// 1. CONTADOR GLOBAL DE RENDERIZACIONES
let globalRenderCount = 0
let lastRenderTime = Date.now()
const renderHistory = []

// 2. TRACKER DE EFECTOS
const effectTracker = {
  AuthContext: { count: 0, lastExecute: 0 },
  Dashboard: { count: 0, lastExecute: 0 },
  Polling: { count: 0, lastExecute: 0 },
  ProfileLoad: { count: 0, lastExecute: 0 }
}

// 3. FUNCIÓN DE LOGGING DETALLADO
function logRender(source, details = {}) {
  globalRenderCount++
  const now = Date.now()
  const timeSinceLast = now - lastRenderTime
  
  renderHistory.push({
    count: globalRenderCount,
    source,
    timestamp: now,
    timeSinceLast,
    details
  })
  
  // Mantener solo los últimos 100 registros
  if (renderHistory.length > 100) {
    renderHistory.shift()
  }
  
  // Log cada 10 renderizaciones para detectar patrones
  if (globalRenderCount % 10 === 0) {
    console.log(`🔄 [${source}] Render #${globalRenderCount} - Tiempo desde último: ${timeSinceLast}ms`, details)
    
    // Detectar bucle si los renders son muy frecuentes
    if (timeSinceLast < 100) {
      console.error(`🚨 BUCLE DETECTADO en ${source}! Renders muy frecuentes: ${timeSinceLast}ms`)
    }
  }
  
  lastRenderTime = now
}

// 4. FUNCIÓN PARA DETECTAR PATRONES DE BUCLE
function analyzeLoopPattern() {
  if (renderHistory.length < 10) return
  
  const recent = renderHistory.slice(-20) // Últimos 20 renders
  const sources = recent.map(r => r.source)
  const sourceCounts = sources.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})
  
  // Detectar si un solo source está dominando
  const dominantSource = Object.keys(sourceCounts).reduce((a, b) => 
    sourceCounts[a] > sourceCounts[b] ? a : b
  )
  
  if (sourceCounts[dominantSource] > 15) {
    console.error(`🚨 BUCLE DOMINANTE DETECTADO: ${dominantSource} está causando ${sourceCounts[dominantSource]} de los últimos 20 renders`)
  }
  
  // Detectar renders muy frecuentes
  const avgTimeBetween = recent.reduce((sum, r, i) => {
    if (i === 0) return 0
    return sum + (r.timeSinceLast || 0)
  }, 0) / (recent.length - 1)
  
  if (avgTimeBetween < 200) {
    console.error(`🚨 RENDERS MUY FRECUENTES: Promedio ${avgTimeBetween}ms entre renders`)
  }
}

// 5. EXPORTAR FUNCIONES PARA USO EN COMPONENTES
window.infiniteLoopDebugger = {
  logRender,
  effectTracker,
  analyzeLoopPattern,
  getRenderHistory: () => renderHistory,
  getGlobalCount: () => globalRenderCount
}

// 6. ANÁLISIS AUTOMÁTICO CADA 5 SEGUNDOS
setInterval(() => {
  if (globalRenderCount > 0) {
    analyzeLoopPattern()
  }
}, 5000)

console.log('🔥 Sistema de debugging de bucle infinito inicializado')
console.log('📊 Usa window.infiniteLoopDebugger para análisis manual')