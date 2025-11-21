import React, { useState, useEffect, useCallback } from 'react';
import companySyncService from '../../services/companySyncService.js';

const CompanySyncTest = () => {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRefreshCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    addLog('Iniciando refreshCompanies...');
    
    try {
      const result = await companySyncService.refreshCompanies();
      setCompanies(result);
      addLog(`✅ Empresas obtenidas: ${result.length}`);
    } catch (err) {
      setError(err.message);
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const testGetCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    addLog('Iniciando getCompanies...');
    
    try {
      const result = await companySyncService.getCompanies();
      setCompanies(result);
      addLog(`✅ Empresas obtenidas (con caché): ${result.length}`);
    } catch (err) {
      setError(err.message);
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const testGetStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    addLog('Iniciando getCompanyStats...');
    
    try {
      const result = await companySyncService.getCompanyStats();
      setStats(result);
      addLog(`✅ Estadísticas obtenidas: ${JSON.stringify(result)}`);
    } catch (err) {
      setError(err.message);
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const testSubscription = useCallback(() => {
    addLog('Configurando suscripción a eventos...');
    
    const unsubscribe = companySyncService.subscribe('companies:refreshed', (data) => {
      addLog(`🔔 Evento recibido: companies:refreshed (${data.length} empresas)`);
      setCompanies(data);
    });

    addLog('✅ Suscripción configurada');
    
    return () => {
      unsubscribe();
      addLog('🔌 Suscripción cancelada');
    };
  }, []);

  useEffect(() => {
    const unsubscribe = testSubscription();
    return unsubscribe;
  }, [testSubscription]);

  useEffect(() => {
    testGetCompanies();
    testGetStats();
  }, [testGetCompanies, testGetStats]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Sincronización de Empresas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testRefreshCompanies}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Refresh Companies'}
        </button>
        
        <button
          onClick={testGetCompanies}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Get Companies'}
        </button>
        
        <button
          onClick={testGetStats}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Get Stats'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Empresas ({companies.length})</h2>
          <div className="bg-gray-100 rounded p-4 max-h-64 overflow-y-auto">
            {companies.map((company, index) => (
              <div key={index} className="mb-2 p-2 bg-white rounded">
                <strong>{company.name}</strong> - {company.employeeCount} empleados
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Estadísticas</h2>
          {stats && (
            <div className="bg-gray-100 rounded p-4">
              <p><strong>Total:</strong> {stats.total}</p>
              <p><strong>Activas:</strong> {stats.active}</p>
              <p><strong>Inactivas:</strong> {stats.inactive}</p>
              <p><strong>Total Empleados:</strong> {stats.totalEmployees}</p>
              <p><strong>Última Actualización:</strong> {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'N/A'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Logs</h2>
        <div className="bg-gray-900 text-green-400 rounded p-4 max-h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanySyncTest;