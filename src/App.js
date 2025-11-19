import React, { lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext.js'
import CacheCleanup from './components/CacheCleanup.js'
import { ensureCorrectSupabaseConfig } from './utils/clearSupabaseCache.js'
// Importar el interceptor forzado para asegurar el uso del proyecto correcto
import './lib/forcedSupabaseClient.js'

// Componentes pequeños (cargar directamente)
import LoadingSpinner from './components/common/LoadingSpinner.js'
import Navbar from './components/layout/Navbar.js'
import GoogleAuthCallback from './components/auth/GoogleAuthCallback.js'
import ReactErrorBoundary from './components/error/ReactErrorBoundary.js'
import SuspenseWrapper from './components/common/SuspenseWrapper.js'

// Componentes grandes - Lazy Loading para reducir bundle size
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword.js'))
const ResetPassword = lazy(() => import('./components/auth/ResetPassword.js'))
const Plans = lazy(() => import('./components/plans/Plans.js'))
const Folders = lazy(() => import('./components/folders/Folders.js'))
const Files = lazy(() => import('./components/files/Files.js'))
const Profile = lazy(() => import('./components/profile/Profile.js'))
const SemanticSearch = lazy(() => import('./components/embeddings/SemanticSearch.js'))
const Abogado = lazy(() => import('./components/legal/Abogado.js'))
const HomeStaffHubSEO = lazy(() => import('./components/home/HomeStaffHubSEO.js'))
const LoginUltraModern = lazy(() => import('./components/auth/LoginRedesigned.js'))
const RegisterInnovador = lazy(() => import('./components/auth/RegisterInnovador.js'))
const ModernDashboard = lazy(() => import('./components/dashboard/ModernDashboardRedesigned.js'))
const CompanyEmployeeTest = lazy(() => import('./components/dashboard/CompanyEmployeeTest.js'))
const CompanySyncTest = lazy(() => import('./components/test/CompanySyncTest.js'))
const WhatsAppAPITest = lazy(() => import('./components/test/WhatsAppAPITest.js'))
const WebrifyCommunicationDashboard = lazy(() => import('./components/communication/WebrifyCommunicationDashboard.js'))
const Settings = lazy(() => import('./components/settings/Settings.js'))
const BrevoStatisticsDashboard = lazy(() => import('./components/communication/BrevoStatisticsDashboard.js'))
const BrevoTemplatesManager = lazy(() => import('./components/communication/BrevoTemplatesManager.js'))
const WhatsAppOnboarding = lazy(() => import('./components/whatsapp/WhatsAppOnboarding.js'))
const MultiWhatsAppManager = lazy(() => import('./components/whatsapp/MultiWhatsAppManager.js'))
const GoogleDriveIntegrationSelector = lazy(() => import('./components/integrations/GoogleDriveIntegrationSelector.js'))
const GoogleDriveAutoSetup = lazy(() => import('./components/integrations/GoogleDriveAutoSetup.js'))
const GoogleDriveSetupWizard = lazy(() => import('./components/integrations/GoogleDriveSetupWizard.js'))
const GoogleDriveSimplePage = lazy(() => import('./components/integrations/GoogleDriveSimplePage.js'))
const GoogleDriveTestPage = lazy(() => import('./components/integrations/GoogleDriveTestPage.js'))
const GoogleDriveLocalTest = lazy(() => import('./components/test/GoogleDriveLocalTest.js'))
const GoogleDriveProductionDiagnosis = lazy(() => import('./components/test/GoogleDriveProductionDiagnosis.js'))
const UserGoogleDriveConnector = lazy(() => import('./components/integrations/UserGoogleDriveConnector.js'))
const GoogleDriveURIChecker = lazy(() => import('./components/test/GoogleDriveURIChecker.js'))
const GoogleDriveURIDebugger = lazy(() => import('./components/test/GoogleDriveURIDebugger.js'))
const GoogleDriveConnectionVerifier = lazy(() => import('./components/test/GoogleDriveConnectionVerifier.js'))


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
        <Router>
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
          
          <Routes>
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
            
            {/* Callback de Google Auth */}
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            
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
                      <SemanticSearch />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lawyer"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Abogado />
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
                    <WebrifyCommunicationDashboard activeTab="dashboard" />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/base-de-datos"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WebrifyCommunicationDashboard activeTab="dashboard" />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/base-de-datos/database"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WebrifyCommunicationDashboard activeTab="database" />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/communication/send" 
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WebrifyCommunicationDashboard activeTab="send" />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communication/folders" 
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WebrifyCommunicationDashboard activeTab="folders" />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communication/templates" 
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WebrifyCommunicationDashboard activeTab="templates" />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communication/bulk-upload" 
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WebrifyCommunicationDashboard activeTab="bulk-upload" />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communication/reports" 
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WebrifyCommunicationDashboard activeTab="reports" />
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
                    <BrevoStatisticsDashboard />
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
                    <BrevoTemplatesManager />
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
                    <CompanyEmployeeTest />
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
                    <CompanySyncTest />
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
                    <WhatsAppAPITest />
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
      </AuthProvider>
    </ReactErrorBoundary>
  )
}

export default App