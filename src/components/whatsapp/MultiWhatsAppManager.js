/**
 * Componente para gestionar múltiples números de WhatsApp
 * 
 * Este componente permite a las agencias configurar y gestionar
 * múltiples números de WhatsApp, uno por cada empresa/cliente.
 * 
 * Características:
 * - Configurar WhatsApp para cada empresa
 * - Ver estadísticas de uso por empresa
 * - Probar conexión de cada número
 * - Gestionar límites de uso
 * - Ver logs de mensajes
 */

import React, { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChartBarIcon,
  CogIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import communicationService from '../../services/communicationService.js';

const MultiWhatsAppManager = () => {
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({});
  const [formData, setFormData] = useState({
    companyId: '',
    accessToken: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    testMode: false,
    isDefault: false,
    dailyLimit: 1000,
    monthlyLimit: 30000
  });
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Este es un mensaje de prueba desde StaffHub');
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    loadConfigurations();
    loadCompanies();
    loadTemplates();
  }, [loadCompanies]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const result = await communicationService.getAllWhatsAppConfigurations();
      if (result.success) {
        setConfigurations(result.configurations);
      }
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const result = await communicationService.getCompanies();
      if (result) {
        setCompanies(result);
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
    }
  };

  const loadStats = async (companyId) => {
    try {
      const result = await communicationService.getWhatsAppUsageStats(companyId);
      if (result.success) {
        setStats(prev => ({
          ...prev,
          [companyId]: result.statistics
        }));
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const result = await communicationService.getWhatsAppTemplates();
      if (result.success) {
        setTemplates(result.templates || []);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const result = await communicationService.getWhatsAppUsageStats();
      if (result.success) {
        setLogs(result.statistics?.recentMessages || []);
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await communicationService.configureWhatsAppForCompany(
        formData.companyId,
        formData
      );
      
      if (result.success) {
        await loadConfigurations();
        setShowAddForm(false);
        setEditingConfig(null);
        resetForm();
        alert('Configuración guardada exitosamente');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    }
  };

  const resetForm = () => {
    setFormData({
      companyId: '',
      accessToken: '',
      phoneNumberId: '',
      webhookVerifyToken: '',
      testMode: false,
      isDefault: false,
      dailyLimit: 1000,
      monthlyLimit: 30000
    });
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      companyId: config.company_id,
      accessToken: config.access_token,
      phoneNumberId: config.phone_number_id,
      webhookVerifyToken: config.webhook_verify_token || '',
      testMode: config.test_mode || false,
      isDefault: config.is_default || false,
      dailyLimit: config.daily_limit || 1000,
      monthlyLimit: config.monthly_limit || 30000
    });
    setShowAddForm(true);
  };

  const handleDelete = async (config) => {
    if (!window.confirm(`¿Está seguro de eliminar la configuración de WhatsApp para ${config.company_name}?`)) {
      return;
    }
    
    try {
      const result = await communicationService.deleteWhatsAppConfiguration(config.company_id);
      
      if (result.success) {
        await loadConfigurations();
        alert('Configuración eliminada exitosamente');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error eliminando configuración:', error);
      alert('Error al eliminar la configuración');
    }
  };

  const handleTest = async (config) => {
    if (!testPhone.trim()) {
      alert('Por favor ingrese un número de teléfono para probar');
      return;
    }

    try {
      // Usar el método específico para enviar mensaje por empresa
      const result = await communicationService.sendWhatsAppMessageByCompany(
        config.company_id,
        [testPhone],
        testMessage
      );
      
      if (result.success) {
        alert('Mensaje de prueba enviado exitosamente');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error enviando mensaje de prueba:', error);
      alert('Error al enviar mensaje de prueba');
    }
  };

  const getStatusBadge = (config) => {
    if (config.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Activo
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Inactivo
        </span>
      );
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'No configurado';
    return phone.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '+$1 $2 $3 $4');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión Multi-WhatsApp</h1>
        <p className="mt-2 text-gray-600">
          Configure y gestione múltiples números de WhatsApp para sus clientes
        </p>
      </div>

      {/* Botones de acción */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingConfig(null);
            resetForm();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Agregar Configuración
        </button>
        
        <button
          onClick={() => {
            setShowLogs(!showLogs);
            if (!showLogs) loadLogs();
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <EyeIcon className="w-4 h-4 mr-2" />
          {showLogs ? 'Ocultar Logs' : 'Ver Logs'}
        </button>
        
        <button
          onClick={loadConfigurations}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Actualizar
        </button>
        
        <button
          onClick={() => {
            setShowTemplates(!showTemplates);
            if (!showTemplates) loadTemplates();
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <CogIcon className="w-4 h-4 mr-2" />
          {showTemplates ? 'Ocultar Plantillas' : 'Gestionar Plantillas'}
        </button>
      </div>

      {/* Dashboard de estadísticas generales */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{configurations.length}</div>
          <div className="text-sm text-gray-600">Configuraciones Activas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {configurations.filter(c => c.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Conectadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {configurations.filter(c => c.test_mode).length}
          </div>
          <div className="text-sm text-gray-600">Modo Prueba</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{templates.length}</div>
          <div className="text-sm text-gray-600">Plantillas</div>
        </div>
      </div>

      {/* Sección de Logs */}
      {showLogs && (
        <div className="mb-8 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Logs de Actividad Reciente</h3>
          </div>
          <div className="p-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay logs de actividad reciente
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.companies?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.recipient_phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'sent' ? 'bg-green-100 text-green-800' :
                            log.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                            log.status === 'read' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${log.cost?.toFixed(4) || '0.0000'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Plantillas */}
      {showTemplates && (
        <div className="mb-8 bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Plantillas de WhatsApp</h3>
          </div>
          <div className="p-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay plantillas configuradas
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {template.status || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                    <div className="text-xs text-gray-500">
                      <div>Categoría: {template.category || 'General'}</div>
                      <div>Idioma: {template.language || 'es'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={() => alert('Función de crear plantilla próximamente')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear Nueva Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de configuraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configurations.map((config) => (
          <div key={config.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {config.company_name}
              </h3>
              {getStatusBadge(config)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="w-4 h-4 mr-2" />
                {formatPhoneNumber(config.display_phone_number)}
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Nombre verificado:</span> {config.verified_name || 'No verificado'}
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Calidad:</span> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  config.quality_rating === 'GREEN' ? 'bg-green-100 text-green-800' :
                  config.quality_rating === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                  config.quality_rating === 'RED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {config.quality_rating || 'Desconocido'}
                </span>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Uso diario:</span> {config.current_daily_usage || 0}/{config.daily_limit || 1000}
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Uso mensual:</span> {config.current_monthly_usage || 0}/{config.monthly_limit || 30000}
              </div>

              {config.is_default && (
                <div className="text-sm text-blue-600 font-medium">
                  Configuración por defecto
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => loadStats(config.company_id)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChartBarIcon className="w-3 h-3 mr-1" />
                Estadísticas
              </button>

              <button
                onClick={() => handleTest(config)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PhoneIcon className="w-3 h-3 mr-1" />
                Probar
              </button>

              <button
                onClick={() => handleEdit(config)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="w-3 h-3 mr-1" />
                Editar
              </button>

              <button
                onClick={() => handleDelete(config)}
                className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <TrashIcon className="w-3 h-3 mr-1" />
                Eliminar
              </button>
            </div>

            {/* Estadísticas */}
            {stats[config.company_id] && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Estadísticas recientes</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Total mensajes:</span> {stats[config.company_id].totalMessages || 0}
                  </div>
                  <div>
                    <span className="font-medium">Enviados:</span> {stats[config.company_id].sentMessages || 0}
                  </div>
                  <div>
                    <span className="font-medium">Entregados:</span> {stats[config.company_id].deliveredMessages || 0}
                  </div>
                  <div>
                    <span className="font-medium">Leídos:</span> {stats[config.company_id].readMessages || 0}
                  </div>
                  <div>
                    <span className="font-medium">Costo total:</span> ${stats[config.company_id].totalCost?.toFixed(2) || 0}
                  </div>
                  <div>
                    <span className="font-medium">Tasa entrega:</span> {stats[config.company_id].deliveryRate?.toFixed(1) || 0}%
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Formulario para agregar/editar configuración */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {editingConfig ? 'Editar Configuración' : 'Nueva Configuración de WhatsApp'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Empresa
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="">Seleccione una empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Access Token
                  </label>
                  <input
                    type="text"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({...formData, phoneNumberId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Webhook Verify Token (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.webhookVerifyToken}
                    onChange={(e) => setFormData({...formData, webhookVerifyToken: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Límite diario
                    </label>
                    <input
                      type="number"
                      value={formData.dailyLimit}
                      onChange={(e) => setFormData({...formData, dailyLimit: parseInt(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Límite mensual
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyLimit}
                      onChange={(e) => setFormData({...formData, monthlyLimit: parseInt(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.testMode}
                      onChange={(e) => setFormData({...formData, testMode: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Modo prueba</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Configuración por defecto</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingConfig(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingConfig ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para probar conexión */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Probar WhatsApp - {selectedCompany.company_name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de teléfono
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+56912345678"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mensaje de prueba
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleTest(selectedCompany)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Enviar prueba
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {configurations.length === 0 && (
        <div className="text-center py-12">
          <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay configuraciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comience agregando una configuración de WhatsApp para una empresa
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Agregar Configuración
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiWhatsAppManager;