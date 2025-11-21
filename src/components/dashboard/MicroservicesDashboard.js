import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';

/**
 * Dashboard con Microservicios
 * 
 * Este componente demuestra cómo usar microservicios para procesar
 * múltiples empresas sin bloquear la UI
 */

const MicroservicesDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState({});
  const [insights, setInsights] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [webhookUrl] = useState(`${window.location.origin}/api/webhook/insights-ready`);

  // 1. CARGAR EMPRESAS AL MONTAR
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // 2. SUSCRIBIRSE A NOTIFICACIONES EN TIEMPO REAL
  useEffect(() => {
    const subscription = supabase
      .channel('insights-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'realtime_notifications',
        filter: `event_type=eq.insights_ready`
      }, (payload) => {
        const { company_id, payload: data } = payload.new;
        handleInsightsReceived(company_id, data);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Carga las empresas desde Supabase
/**
   * Procesa una empresa individualmente
   */
  const processSingleCompany = async (company) => {
    try {
      console.log(`🔄 Procesando empresa individualmente: ${company.name}`);
      
      // Simular procesamiento individual
      const jobId = `job_${Date.now()}_${company.id}`;
      
      setJobs(prev => ({
        ...prev,
        [company.id]: {
          jobId,
          status: 'processing',
          startTime: new Date(),
          companyName: company.name
        }
      }));
      
      // Simular tiempo de procesamiento
      setTimeout(() => {
        setJobs(prev => ({
          ...prev,
          [company.id]: {
            ...prev[company.id],
            status: 'completed',
            endTime: new Date()
          }
        }));
        
        // Simular insights recibidos
        setInsights(prev => ({
          ...prev,
          [company.id]: {
            insights: `Insights generados para ${company.name}`,
            timestamp: new Date()
          }
        }));
      }, 3000);
      
    } catch (error) {
      console.error('Error procesando empresa:', error);
      setJobs(prev => ({
        ...prev,
        [company.id]: {
          ...prev[company.id],
          status: 'error',
          error: error.message
        }
      }));
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      setCompanies(data || []);
    } catch (error) {
      console.error('Error cargando empresas:', error);
    }
  };

  /**
   * 3. INICIAR PROCESAMIENTO VIA MICROSERVICIO
   */
  const processCompanies = async () => {
    if (companies.length === 0) return;

    setIsProcessing(true);
    
    // Crear estado inicial de jobs
    const initialJobs = {};
    companies.forEach(company => {
      initialJobs[company.id] = {
        status: 'queued',
        companyName: company.name,
        startTime: Date.now(),
        progress: 0
      };
    });
    setJobs(initialJobs);

    // Llamar al microservicio para cada empresa
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      try {
        // ACTIVAR MICROSERVICIO
        const response = await callMicroservice(company);
        
        setJobs(prev => ({
          ...prev,
          [company.id]: {
            ...prev[company.id],
            status: 'processing',
            jobId: response.jobId,
            estimatedTime: response.estimatedTime
          }
        }));

        // Notificar progreso
        showNotification(`Iniciado análisis para ${company.name}`);

      } catch (error) {
        setJobs(prev => ({
          ...prev,
          [company.id]: {
            ...prev[company.id],
            status: 'error',
            error: error.message
          }
        }));
      }
    }
  };

  /**
   * 4. LLAMADA AL MICROSERVICIO
   */
  const callMicroservice = async (company) => {
    const response = await fetch('/.netlify/functions/analyze-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || 'anonymous'}`
      },
      body: JSON.stringify({
        companyId: company.id,
        companyName: company.name,
        webhookUrl: webhookUrl,
        userId: 'current-user-id'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  };

  /**
   * 5. MANEJAR RESULTADO DEL WEBHOOK
   */
  const handleInsightsReceived = useCallback((companyId, data) => {
    console.log(`[DASHBOARD] Insights recibidos para empresa ${companyId}`);

    // Actualizar insights en estado
    setInsights(prev => ({
      ...prev,
      [companyId]: data.insights
    }));

    // Actualizar job a completado
    setJobs(prev => {
      const job = prev[companyId];
      if (!job) return prev;
      
      return {
        ...prev,
        [companyId]: {
          ...job,
          status: 'completed',
          endTime: Date.now(),
          duration: Date.now() - job.startTime
        }
      };
    });

    // Mostrar notificación
    showNotification(`✅ Análisis completado para ${data.companyName}`);
  }, []);

  /**
   * 6. CANCELAR PROCESAMIENTO
   */
  const cancelProcessing = () => {
    setIsProcessing(false);
    
    // Actualizar todos los jobs a cancelado
    setJobs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (updated[id].status === 'processing' || updated[id].status === 'queued') {
          updated[id].status = 'cancelled';
        }
      });
      return updated;
    });

    showNotification('Procesamiento cancelado');
  };

  /**
   * 7. REINTENTAR EMPRESA FALLIDA
   */
  const retryCompany = async (company) => {
    setJobs(prev => ({
      ...prev,
      [company.id]: {
        ...prev[company.id],
        status: 'queued',
        error: null,
        startTime: Date.now()
      }
    }));

    try {
      const response = await callMicroservice(company);
      
      setJobs(prev => ({
        ...prev,
        [company.id]: {
          ...prev[company.id],
          status: 'processing',
          jobId: response.jobId
        }
      }));
    } catch (error) {
      setJobs(prev => ({
        ...prev,
        [company.id]: {
          ...prev[company.id],
          status: 'error',
          error: error.message
        }
      }));
    }
  };

  // Función auxiliar para mostrar notificaciones
  const showNotification = (message) => {
    // Puedes integrar con tu sistema de notificaciones
    console.log(`[NOTIFICATION] ${message}`);
    // O usar una librería como react-hot-toast
    // toast.success(message);
  };

  // Verificar si todos los jobs están completados
  const allCompleted = Object.values(jobs).every(job => job.status === 'completed' || job.status === 'error' || job.status === 'cancelled');
  
  useEffect(() => {
    if (allCompleted && isProcessing) {
      setIsProcessing(false);
      showNotification('🎉 Procesamiento finalizado');
    }
  }, [allCompleted, isProcessing]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard con Microservicios
        </h1>
        <p className="text-gray-600">
          Procesa múltiples empresas sin bloquear la interfaz usando arquitectura serverless
        </p>
      </div>

      {/* CONTROLES */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Control de Procesamiento</h2>
            <p className="text-sm text-gray-600">
              Empresas cargadas: <span className="font-bold">{companies.length}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={processCompanies}
              disabled={isProcessing || companies.length === 0}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                'Procesar Todas las Empresas'
              )}
            </button>
            
            <button
              onClick={cancelProcessing}
              disabled={!isProcessing}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Webhook configurado:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{webhookUrl}</code>
          </p>
        </div>
      </div>

      {/* RESUMEN DE PROGRESO */}
      {Object.keys(jobs).length > 0 && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Resumen de Progreso</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-700">
                {Object.values(jobs).filter(j => j.status === 'queued').length}
              </div>
              <div className="text-sm text-gray-600">En Cola</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-700">
                {Object.values(jobs).filter(j => j.status === 'processing').length}
              </div>
              <div className="text-sm text-blue-600">Procesando</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-700">
                {Object.values(jobs).filter(j => j.status === 'completed').length}
              </div>
              <div className="text-sm text-green-600">Completadas</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-700">
                {Object.values(jobs).filter(j => j.status === 'error').length}
              </div>
              <div className="text-sm text-red-600">Con Error</div>
            </div>
          </div>
        </div>
      )}

      {/* GRID DE EMPRESAS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map(company => {
          const job = jobs[company.id];
          const insight = insights[company.id];

          return (
            <div key={company.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{company.name}</h3>
                  <JobStatusBadge status={job?.status} />
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* Barra de progreso */}
                {job?.status === 'processing' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Procesando...</span>
                      <span>{job.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full animate-pulse transition-all duration-300"
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tiempo estimado */}
                {job?.status === 'processing' && job.estimatedTime && (
                  <p className="text-xs text-gray-500 mb-3">
                    ⏱️ Estimado: {job.estimatedTime}
                  </p>
                )}

                {/* Insights */}
                {insight && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-sm text-green-800 mb-2">✅ Insights Generados:</h4>
                    <div className="space-y-1">
                      {insight.frontInsights?.map((item, idx) => (
                        <div key={idx} className="text-sm text-green-700">• {item.title}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {job?.status === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 mb-2">
                      ❌ {job.error || 'Error desconocido'}
                    </p>
                    <button
                      onClick={() => retryCompany(company)}
                      className="w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* Duración */}
                {job?.duration && (
                  <p className="text-xs text-gray-500 mb-3">
                    ⏱️ Completado en {job.duration}ms
                  </p>
                )}

                {/* ID de trabajo */}
                {job?.jobId && (
                  <p className="text-xs text-gray-400">
                    Job ID: {job.jobId.substring(0, 8)}...
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => processSingleCompany(company)}
                  disabled={job?.status === 'processing'}
                  className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {job?.status === 'processing' ? 'Procesando...' : 'Procesar Individualmente'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MENSAJE SI NO HAY EMPRESAS */}
      {companies.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500">No hay empresas para procesar</p>
        </div>
      )}

      {/* DEBUG INFO */}
      {Object.keys(jobs).length > 0 && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-bold text-lg mb-4 text-gray-800">🔍 Información de Debug</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-gray-700">Jobs Activos:</strong>
              <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto">
                {JSON.stringify(workerTrendsService.getActiveJobs?.() || 'No disponible', null, 2)}
              </pre>
            </div>
            
            <div>
              <strong className="text-gray-700">Estadísticas:</strong>
              <ul className="mt-2 space-y-1">
                <li>Total: {Object.keys(jobs).length} empresas</li>
                <li>Completadas: {Object.values(jobs).filter(j => j.status === 'completed').length}</li>
                <li>Con errores: {Object.values(jobs).filter(j => j.status === 'error').length}</li>
                <li>Webhook: {webhookUrl ? '✅ Activo' : '❌ Inactivo'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para mostrar estado
const JobStatusBadge = ({ status }) => {
  const labels = {
    queued: 'En Cola',
    processing: 'Procesando',
    completed: 'Completado',
    error: 'Error',
    cancelled: 'Cancelado'
  };

  const styles = {
    queued: 'bg-gray-100 text-gray-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    cancelled: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.queued}`}>
      {labels[status] || 'Pendiente'}
    </span>
  );
};

// Servicio wrapper para el worker (placeholder para futura implementación)
const workerTrendsService = {
  getActiveJobs: () => {
    // En una implementación real, esto conectaría con el microservicio
    return { message: 'Worker service no implementado en esta demo' };
  }
};

export default MicroservicesDashboard;