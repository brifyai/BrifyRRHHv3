import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext.js'
import CacheCleanup from './components/CacheCleanup.js'
import { ensureCorrectSupabaseConfig } from './utils/clearSupabaseCache.js'
// Importar el interceptor forzado para asegurar el uso del proyecto correcto
import './lib/forcedSupabaseClient.js'
import { safeLazy } from './utils/chunkErrorHandler.js'
// Inicializar el servicio de internacionalización
import i18n from './lib/i18n.js'

// Componentes pequeños (cargar directamente)
import LoadingSpinner from './components/common/LoadingSpinner.js'
import Navbar from './components/layout/Navbar.js'
import GoogleAuthCallback from './components/auth/GoogleAuthCallback.js'
import GoogleDriveCallback from './pages/GoogleDriveCallback.js'
import ReactErrorBoundary from './components/error/ReactErrorBoundary.js'
import SuspenseWrapper from './components/common/SuspenseWrapper.js'
import ResourceRecoveryMonitor from './components/monitoring/ResourceRecoveryMonitor.js'

// Inicializar i18n al cargar la aplicación
i18n.init().catch(console.error);

// Componentes grandes - Lazy Loading con manejo de errores
const ForgotPassword = safeLazy(() => import('./components/auth/ForgotPassword.js'), 'ForgotPassword')
const ResetPassword = safeLazy(() => import('./components/auth/ResetPassword.js'), 'ResetPassword')
const Plans = safeLazy(() => import('./components/plans/Plans.js'), 'Plans')
const Folders = safeLazy(() => import('./components/folders/Folders.js'), 'Folders')
const Files = safeLazy(() => import('./components/files/Files.js'), 'Files')
const Profile = safeLazy(() => import('./components/profile/Profile.js'), 'Profile')
const SemanticSearch = safeLazy(() => import('./components/embeddings/SemanticSearch.js'), 'SemanticSearch')
const Abogado = safeLazy(() => import('./components/legal/Abogado.js'), 'Abogado')
const HomeStaffHubSEO = safeLazy(() => import('./components/home/HomeStaffHubSEO.js'), 'HomeStaffHubSEO')
const LoginUltraModern = safeLazy(() => import('./components/auth/LoginRedesigned.js'), 'LoginUltraModern')
const RegisterInnovador = safeLazy(() => import('./components/auth/RegisterInnovador.js'), 'RegisterInnovador')
const ModernDashboard = safeLazy(() => import('./components/dashboard/ModernDashboardRedesigned.js'), 'ModernDashboard')
const CompanyEmployeeTest = safeLazy(() => import('./components/dashboard/CompanyEmployeeTest.js'), 'CompanyEmployeeTest')
const CompanySyncTest = safeLazy(() => import('./components/test/CompanySyncTest.js'), 'CompanySyncTest')
const WhatsAppAPITest = safeLazy(() => import('./components/test/WhatsAppAPITest.js'), 'WhatsAppAPITest')
const WebrifyCommunicationDashboard = safeLazy(() => import('./components/communication/WebrifyCommunicationDashboard.js'), 'WebrifyCommunicationDashboard')
const Settings = safeLazy(() => import('./components/settings/SettingsDynamic.js'), 'Settings')
const BrevoStatisticsDashboard = safeLazy(() => import('./components/communication/BrevoStatisticsDashboard.js'), 'BrevoStatisticsDashboard')
const BrevoTemplatesManager = safeLazy(() => import('./components/communication/BrevoTemplatesManager.js'), 'BrevoTemplatesManager')
const WhatsAppOnboarding = safeLazy(() => import('./components/whatsapp/WhatsAppOnboarding.js'), 'WhatsAppOnboarding')
const MultiWhatsAppManager = safeLazy(() => import('./components/whatsapp/MultiWhatsAppManager.js'), 'MultiWhatsAppManager')
const GoogleDriveIntegrationSelector = safeLazy(() => import('./components/integrations/GoogleDriveIntegrationSelector.js'), 'GoogleDriveIntegrationSelector')
const GoogleDriveAutoSetup = safeLazy(() => import('./components/integrations/GoogleDriveAutoSetup.js'), 'GoogleDriveAutoSetup')
const GoogleDriveSetupWizard = safeLazy(() => import('./components/integrations/GoogleDriveSetupWizard.js'), 'GoogleDriveSetupWizard')
const GoogleDriveSimplePage = safeLazy(() => import('./components/integrations/GoogleDriveSimplePage.js'), 'GoogleDriveSimplePage')
const GoogleDriveTestPage = safeLazy(() => import('./components/integrations/GoogleDriveTestPage.js'), 'GoogleDriveTestPage')
const GoogleDriveLocalTest = safeLazy(() => import('./components/test/GoogleDriveLocalTest.js'), 'GoogleDriveLocalTest')
const GoogleDriveProductionDiagnosis = safeLazy(() => import('./components/test/GoogleDriveProductionDiagnosis.js'), 'GoogleDriveProductionDiagnosis')
const UserGoogleDriveConnector = safeLazy(() => import('./components/integrations/UserGoogleDriveConnector.js'), 'UserGoogleDriveConnector')
const GoogleDriveURIChecker = safeLazy(() => import('./components/test/GoogleDriveURIChecker.js'), 'GoogleDriveURIChecker')
const GoogleDriveURIDebugger = safeLazy(() => import('./components/test/GoogleDriveURIDebugger.js'), 'GoogleDriveURIDebugger')
const GoogleDriveConnectionVerifier = safeLazy(() => import('./components/test/GoogleDriveConnectionVerifier.js'), 'GoogleDriveConnectionVerifier')


// Limpiar configuración incorrecta de Supabase al iniciar la aplicación
console.log('🔍 Verificando configuración de Supabase al iniciar...')
const configCheck = ensureCorrectSupabaseConfig()
if (configCheck.success) {
  console.log('✅ Configuración de Supabase verificada correctamente')
} else {
  console.warn('⚠️ Hubo problemas al verificar la configuración de Supabase:', configCheck)
}

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Componente para rutas públicas (solo para usuarios no autenticados)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return !isAuthenticated ? children : <Navigate to="/panel-principal" />
}

// Layout principal para rutas autenticadas
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <ReactErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <CacheCleanup />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                },
              },
              error: {
                duration: 4000,
                theme: {
                  primary: '#ff4b4b',
                },
              },
            }}
          />
          
          <Routes future={{ v7_startTransition: true }}>
            {/* Nuevo Home Moderno - página principal */}
            <Route
              path="/"
              element={
                <SuspenseWrapper
                  message="Cargando página principal..."
                  fullScreen={true}
                >
                  <HomeStaffHubSEO />
                </SuspenseWrapper>
              }
            />

            {/* Rutas públicas */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginUltraModern />
                </PublicRoute>
              }
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterInnovador />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <ResetPassword />
              } 
            />
            
            {/* Callback de Google Drive */}
            <Route path="/auth/google/callback" element={<GoogleDriveCallback />} />
            
            {/* Rutas protegidas */}
            <Route
              path="/panel-principal"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando dashboard...">
                      <ModernDashboard />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando planes...">
                      <Plans />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/folders"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando carpetas...">
                      <Folders />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando archivos...">
                      <Files />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando perfil...">
                      <Profile />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando configuración...">
                      <Settings />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/empresas"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando empresas...">
                      <Settings activeTab="companies" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/empresas/:companyId"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando empresa...">
                      <Settings activeTab="companies" companyId={true} />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
/>
            <Route
              path="/configuracion/empresas/:companyId/sincronizacion"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando configuración de sincronización...">
                      <Settings activeTab="company-sync" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/empresas/:companyId/integraciones"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando integraciones de empresa...">
                      <Settings activeTab="integrations" companyId={true} />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/usuarios"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando usuarios...">
                      <Settings activeTab="users" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/general"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando configuración general...">
                      <Settings activeTab="general" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/notificaciones"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando notificaciones...">
                      <Settings activeTab="notifications" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/seguridad"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando seguridad...">
                      <Settings activeTab="security" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/integraciones"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando integraciones...">
                      <Settings activeTab="integrations" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/base-de-datos"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando base de datos...">
                      <Settings activeTab="database" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/sincronizacion"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando configuración de sincronización...">
                      <Settings activeTab="sync" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integraciones"
              element={
                <ProtectedRoute>
                  <Navigate to="/configuracion/integraciones" replace />
                </ProtectedRoute>
              }
            />
              <Route
                path="/busqueda-ia"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SuspenseWrapper message="Cargando búsqueda IA...">
                        <SemanticSearch />
                      </SuspenseWrapper>
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lawyer"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SuspenseWrapper message="Cargando asistente legal...">
                        <Abogado />
                      </SuspenseWrapper>
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              {/* Ruta de prueba de colores */}
              {/* Rutas de comunicación interna - Sistema moderno unificado */}
            <Route
              path="/communication"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando dashboard de comunicaciones...">
                      <WebrifyCommunicationDashboard activeTab="dashboard" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/base-de-datos"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando base de datos...">
                      <WebrifyCommunicationDashboard activeTab="dashboard" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/base-de-datos/database"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando base de datos...">
                      <WebrifyCommunicationDashboard activeTab="database" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication/send"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando envío de mensajes...">
                      <WebrifyCommunicationDashboard activeTab="send" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication/folders"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando carpetas...">
                      <WebrifyCommunicationDashboard activeTab="folders" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication/templates"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando plantillas...">
                      <WebrifyCommunicationDashboard activeTab="templates" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication/bulk-upload"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando carga masiva...">
                      <WebrifyCommunicationDashboard activeTab="bulk-upload" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication/reports"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando reportes...">
                      <WebrifyCommunicationDashboard activeTab="reports" />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />


            
            {/* Dashboard de estadísticas de Brevo */}
            <Route
              path="/estadisticas-brevo"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando estadísticas de Brevo...">
                      <BrevoStatisticsDashboard />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Gestor de plantillas de Brevo */}
            <Route
              path="/plantillas-brevo"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando gestor de plantillas...">
                      <BrevoTemplatesManager />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Rutas de redirección para configuración */}
            <Route
              path="/configuracion/estadisticas-brevo"
              element={
                <ProtectedRoute>
                  <Navigate to="/estadisticas-brevo" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion/plantillas-brevo"
              element={
                <ProtectedRoute>
                  <Navigate to="/plantillas-brevo" replace />
                </ProtectedRoute>
              }
            />
            
            {/* Asistente de configuración fácil de WhatsApp Business */}
            <Route
              path="/whatsapp/setup"
              element={
                <ProtectedRoute>
                  <WhatsAppOnboarding />
                </ProtectedRoute>
              }
            />

            {/* Gestor Multi-WhatsApp para agencias (solo para usuarios avanzados) */}
            <Route
              path="/whatsapp/multi-manager"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <MultiWhatsAppManager />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Redirección de la ruta antigua para compatibilidad */}
            <Route
              path="/whatsapp/setup-wizard"
              element={
                <Navigate to="/whatsapp/setup" replace />
              }
            />

            {/* Ruta de prueba de empresas y empleados */}
            <Route
              path="/test-company-employee"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando prueba de empresa/empleado...">
                      <CompanyEmployeeTest />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Ruta de prueba de sincronización de empresas */}
            <Route
              path="/test-company-sync"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando prueba de sincronización...">
                      <CompanySyncTest />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Ruta de prueba de WhatsApp APIs */}
            <Route
              path="/test-whatsapp-apis"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SuspenseWrapper message="Cargando prueba de WhatsApp...">
                      <WhatsAppAPITest />
                    </SuspenseWrapper>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Rutas de configuración de Google Drive */}
            <Route
              path="/integrations/google-drive"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveIntegrationSelector />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/google-drive/auto-setup"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveAutoSetup />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/google-drive/wizard"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveSetupWizard />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/google-drive-quick-setup"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveSimplePage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/my-google-drive"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <UserGoogleDriveConnector />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta de prueba para diagnóstico */}
            <Route
              path="/test-google-drive"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveTestPage />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta de prueba de Google Drive Local */}
            <Route
              path="/test-google-drive-local"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveLocalTest />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta de diagnóstico de Google Drive para producción */}
            <Route
              path="/diagnostico-google-drive"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveProductionDiagnosis />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta de diagnóstico específico para redirect_uri_mismatch */}
            <Route
              path="/google-drive-uri-checker"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveURIChecker />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta de verificación completa del sistema - PROTEGIDA */}
            <Route
              path="/google-drive-connection-verifier"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveConnectionVerifier />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta de diagnóstico URI específico para redirect_uri_mismatch */}
            <Route
              path="/google-drive-uri-debugger"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GoogleDriveURIDebugger />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* Ruta 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Página no encontrada</p>
                    <a
                      href="/panel-principal"
                      className="btn-primary inline-block"
                    >
                      Volver al Panel Principal
                    </a>
                  </div>
                </div>
              }
            />
            </Routes>
          </div>
        </Router>
        
        {/* 🚨 MONITOR DE RECUPERACIÓN DE RECURSOS - SIEMPRE VISIBLE */}
        <ResourceRecoveryMonitor />
      </AuthProvider>
    </ReactErrorBoundary>
  )
}

export default App