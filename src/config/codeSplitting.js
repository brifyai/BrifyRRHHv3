/**
 * CONFIGURACIÓN DE CODE SPLITTING
 * 
 * Implementa lazy loading para componentes pesados y reduce bundle size
 * Meta: Reducir de 1.09 MB a < 250 KB por chunk
 */

import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ========================================
// COMPONENTES PESADOS - Lazy Loading
// ========================================

// Dashboard Components
export const Dashboard = lazy(() => import('../components/dashboard/Dashboard'));
export const ModernAIEnhancedDashboard = lazy(() => import('../components/dashboard/ModernAIEnhancedDashboard'));
export const AnalyticsDashboard = lazy(() => import('../components/analytics/AnalyticsDashboard'));
export const DatabaseCompanySummary = lazy(() => import('../components/dashboard/DatabaseCompanySummary'));

// Communication Components
export const WebrifyCommunicationDashboard = lazy(() => import('../components/communication/WebrifyCommunicationDashboard'));
export const EmployeeFolders = lazy(() => import('../components/communication/EmployeeFolders'));
export const EmployeeSelector = lazy(() => import('../components/communication/EmployeeSelector'));
export const ReportsDashboard = lazy(() => import('../components/communication/ReportsDashboard'));
export const BrevoStatisticsDashboard = lazy(() => import('../components/communication/BrevoStatisticsDashboard'));
export const BrevoTemplatesManager = lazy(() => import('../components/communication/BrevoTemplatesManager'));

// Google Drive Components
export const GoogleDriveIntegrationSelector = lazy(() => import('../components/integrations/GoogleDriveIntegrationSelector'));
export const GoogleDriveSetupWizard = lazy(() => import('../components/integrations/GoogleDriveSetupWizard'));
export const UserGoogleDriveConnector = lazy(() => import('../components/integrations/UserGoogleDriveConnector'));
export const GoogleDriveSimplePage = lazy(() => import('../components/integrations/GoogleDriveSimplePage'));

// AI & Embeddings Components
export const AIChat = lazy(() => import('../components/embeddings/AIChat'));
export const SemanticSearch = lazy(() => import('../components/embeddings/SemanticSearch'));
export const TokenUsage = lazy(() => import('../components/embeddings/TokenUsage'));

// Settings Components - ACTUALIZADO PARA USAR SISTEMA DINÁMICO
export const Settings = lazy(() => import('../components/settings/SettingsDynamic'));
export const CompanyForm = lazy(() => import('../components/settings/CompanyForm'));
export const UserManagement = lazy(() => import('../components/settings/UserManagement'));
export const DatabaseSettings = lazy(() => import('../components/settings/DatabaseSettings'));

// Test Components
export const CompanySyncTest = lazy(() => import('../components/test/CompanySyncTest'));
export const GoogleDriveConnectionVerifier = lazy(() => import('../components/test/GoogleDriveConnectionVerifier'));
export const GoogleDriveLocalTest = lazy(() => import('../components/test/GoogleDriveLocalTest'));
export const GoogleDriveProductionDiagnosis = lazy(() => import('../components/test/GoogleDriveProductionDiagnosis'));

// ========================================
// WRAPPER CON SUSPENSE
// ========================================

/**
 * Envuelve un componente lazy con Suspense y LoadingSpinner
 * @param {React.Component} LazyComponent - Componente lazy importado
 * @returns {React.Component} Componente envuelto con Suspense
 */
export const withSuspense = (LazyComponent) => {
  return (props) => (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// ========================================
// RUTAS CON CODE SPLITTING
// ========================================

/**
 * Configuración de rutas con code splitting
 * Cada ruta carga su componente solo cuando se navega a ella
 */
export const routesWithCodeSplitting = [
  {
    path: '/dashboard',
    component: withSuspense(Dashboard),
    exact: true
  },
  {
    path: '/dashboard/modern',
    component: withSuspense(ModernAIEnhancedDashboard),
    exact: true
  },
  {
    path: '/analytics',
    component: withSuspense(AnalyticsDashboard),
    exact: true
  },
  {
    path: '/communication',
    component: withSuspense(WebrifyCommunicationDashboard),
    exact: true
  },
  {
    path: '/communication/employee-folders',
    component: withSuspense(EmployeeFolders),
    exact: true
  },
  {
    path: '/communication/reports',
    component: withSuspense(ReportsDashboard),
    exact: true
  },
  {
    path: '/communication/brevo',
    component: withSuspense(BrevoStatisticsDashboard),
    exact: true
  },
  {
    path: '/integrations/google-drive',
    component: withSuspense(GoogleDriveIntegrationSelector),
    exact: true
  },
  {
    path: '/integrations/google-drive/setup',
    component: withSuspense(GoogleDriveSetupWizard),
    exact: true
  },
  {
    path: '/integrations/google-drive/connector',
    component: withSuspense(UserGoogleDriveConnector),
    exact: true
  },
  {
    path: '/ai/chat',
    component: withSuspense(AIChat),
    exact: true
  },
  {
    path: '/ai/search',
    component: withSuspense(SemanticSearch),
    exact: true
  },
  {
    path: '/settings',
    component: withSuspense(Settings),
    exact: true
  },
  {
    path: '/settings/companies',
    component: withSuspense(CompanyForm),
    exact: true
  },
  {
    path: '/settings/users',
    component: withSuspense(UserManagement),
    exact: true
  },
  {
    path: '/settings/database',
    component: withSuspense(DatabaseSettings),
    exact: true
  },
  {
    path: '/test/company-sync',
    component: withSuspense(CompanySyncTest),
    exact: true
  },
  {
    path: '/test/google-drive',
    component: withSuspense(GoogleDriveConnectionVerifier),
    exact: true
  }
];

// ========================================
// BUNDLE OPTIMIZATION CONFIG
// ========================================

/**
 * Configuración para Webpack Bundle Analyzer
 * Identifica qué módulos están contribuyendo al bundle size
 */
export const bundleOptimization = {
  // Tamaño máximo por chunk (en KB)
  maxChunkSize: 250,
  
  // Chunks a generar
  chunks: {
    vendor: {
      // Librerías de terceros
      test: /[\\/]node_modules[\\/]/,
      name: 'vendor',
      chunks: 'all',
      priority: 10
    },
    common: {
      // Código común compartido
      name: 'common',
      minChunks: 2,
      chunks: 'all',
      priority: 5,
      reuseExistingChunk: true
    },
    main: {
      // Código principal de la aplicación
      name: 'main',
      chunks: 'all',
      priority: 1
    }
  },
  
  // Librerías grandes que deben ser separadas
  largeLibraries: [
    'react',
    'react-dom',
    'react-router-dom',
    '@supabase/supabase-js',
    'pdfjs-dist',
    'xlsx',
    'mammoth',
    'groq-sdk',
    'brevo'
  ]
};

// ========================================
// PERFORMANCE BUDGET
// ========================================

/**
 * Presupuesto de performance para la aplicación
 */
export const performanceBudget = {
  // Tamaño máximo del bundle principal
  maxMainBundleSize: 250 * 1024, // 250 KB
  
  // Tamaño máximo por chunk
  maxChunkSize: 250 * 1024, // 250 KB
  
  // Número máximo de chunks
  maxChunks: 5,
  
  // Tiempo máximo de carga inicial
  maxInitialLoadTime: 3000, // 3 segundos
  
  // Lighthouse scores mínimos
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 95,
    seo: 90
  }
};

export default {
  routesWithCodeSplitting,
  withSuspense,
  bundleOptimization,
  performanceBudget
};