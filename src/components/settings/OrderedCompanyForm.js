/**
 * ORDERED COMPANY FORM
 * Formulario de empresa con flujo ordenado y estructura Gmail/No-Gmail
 * 
 * Características:
 * - Usa OrderedCompanyCreationService para flujo ordenado
 * - Indicadores de progreso en tiempo real
 * - Validación de estructura Gmail/No-Gmail
 * - Sincronización con Google Drive
 * - Manejo de errores con rollback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { supabase } from '../../lib/supabaseClient.js';
import orderedCompanyCreationService from '../../services/orderedCompanyCreationService.js';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  FolderIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const OrderedCompanyForm = ({ company, onSuccess, onCancel, companyId, isCompanySpecificMode }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  // Estados para el flujo ordenado
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState({
    step: 0,
    totalSteps: 6,
    currentStep: '',
    completed: false,
    error: null
  });

  // Pasos del flujo ordenado
  const creationSteps = [
    { id: 1, name: 'Validando datos', description: 'Verificando información de la empresa' },
    { id: 2, name: 'Generando IDs', description: 'Creando token_id y carpeta_id únicos' },
    { id: 3, name: 'Creando en Supabase', description: 'Guardando empresa en base de datos' },
    { id: 4, name: 'Creando carpeta principal', description: 'Estructura en Google Drive' },
    { id: 5, name: 'Creando subcarpetas', description: 'Carpetas Gmail y No-Gmail' },
    { id: 6, name: 'Finalizando', description: 'Confirmando sincronización' }
  ];

  // Inicializar servicio
  useEffect(() => {
    const initializeService = async () => {
      try {
        await orderedCompanyCreationService.initialize();
      } catch (error) {
        console.error('Error inicializando servicio:', error);
        toast.error('Error inicializando servicio de creación');
      }
    };

    initializeService();
  }, []);

  // Cargar datos de empresa existente
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        status: company.status || 'active'
      });
    }
  }, [company]);

  // Actualizar progreso
  const updateProgress = (step, currentStep, completed = false, error = null) => {
    setCreationProgress({
      step,
      totalSteps: 6,
      currentStep,
      completed,
      error
    });
  };

  // Validar formulario
  const validateForm = () => {
    const errors = [];

    if (!formData.name?.trim()) {
      errors.push('El nombre de la empresa es obligatorio');
    }

    if (formData.name && formData.name.length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }

    // Validar caracteres especiales
    if (formData.name && !/^[a-zA-Z0-9\s\-_&().,]+$/.test(formData.name)) {
      errors.push('El nombre contiene caracteres no válidos');
    }

    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }

    return true;
  };

  // Crear empresa con flujo ordenado
  const handleOrderedCreation = async (companyData) => {
    try {
      updateProgress(1, 'Validando datos');

      // Llamar al servicio de creación ordenada
      const result = await orderedCompanyCreationService.createCompanyWithOrderedFlow(
        companyData,
        user?.id
      );

      if (result.success) {
        updateProgress(6, 'Finalizando', true);
        toast.success('Empresa creada exitosamente con estructura Gmail/No-Gmail');
        
        // Llamar callback de éxito
        if (onSuccess) {
          onSuccess(result.company);
        }

        return result;
      } else {
        throw new Error(result.error || 'Error desconocido en la creación');
      }
    } catch (error) {
      updateProgress(creationProgress.step, creationProgress.currentStep, false, error.message);
      toast.error(`Error: ${error.message}`);
      throw error;
    }
  };

  // Actualizar empresa existente (mantener funcionalidad original)
  const handleUpdate = async (companyData) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          description: companyData.description,
          status: companyData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      toast.success('Empresa actualizada exitosamente');
      
      if (onSuccess) {
        onSuccess();
      }

      return { success: true };
    } catch (error) {
      toast.error(`Error actualizando empresa: ${error.message}`);
      throw error;
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!validateForm()) return;

    setIsCreating(true);
    updateProgress(0, 'Iniciando creación');

    try {
      // Si es empresa existente, usar actualización normal
      if (company) {
        await handleUpdate(formData);
      } else {
        // Si es nueva empresa, usar flujo ordenado
        await handleOrderedCreation(formData);
      }
    } catch (error) {
      console.error('Error en creación:', error);
    } finally {
      setIsCreating(false);
      updateProgress(0, '', false, null);
// Mostrar información de la estructura Gmail/No-Gmail
  const StructureInfo = () => {
    if (company || isCreating) return null;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <FolderIcon className="h-5 w-5 text-green-600 mr-2" />
          <h4 className="text-sm font-semibold text-green-900">
            Estructura de Carpetas Automática
          </h4>
        </div>
        <p className="text-sm text-green-800 mb-3">
          Al crear la empresa, se generará automáticamente la siguiente estructura en Google Drive:
        </p>
        <div className="bg-white rounded border p-3 text-xs font-mono">
          <div className="text-green-700">📁 StaffHub - [Nombre Empresa]/</div>
          <div className="text-green-600 ml-4">├── 📁 Gmail/</div>
          <div className="text-green-600 ml-4">└── 📁 No-Gmail/</div>
        </div>
        <div className="mt-3 text-xs text-green-700">
          <p className="font-medium mb-1">Clasificación de cuentas:</p>
          <ul className="space-y-1 ml-2">
            <li>• <strong>Gmail/</strong>: Cuentas @gmail.com + Gmail de empresa (ej: usuario@empresa.com con Gmail)</li>
            <li>• <strong>No-Gmail/</strong>: Outlook, Yahoo, y otros servicios de email</li>
          </ul>
        </div>
      </div>
    );
  };
    }
  };

  // Componente de indicador de progreso
  const ProgressIndicator = () => {
    if (!isCreating) return null;

    const currentStep = creationSteps.find(step => step.id === creationProgress.step) || 
                       creationSteps[creationProgress.step - 1];

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin mr-3" />
          <h3 className="text-lg font-semibold text-blue-900">
            Creando Empresa con Flujo Ordenado
          </h3>
        </div>

        <div className="space-y-3">
          {creationSteps.map((step, index) => {
            const isCompleted = step.id < creationProgress.step;
            const isCurrent = step.id === creationProgress.step;
            const isError = creationProgress.error && isCurrent;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100 text-green-600' :
                  isCurrent ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : isCurrent ? (
                    <ClockIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-green-900' :
                    isCurrent ? 'text-blue-900' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className={`text-xs ${
                    isCompleted ? 'text-green-700' :
                    isCurrent ? 'text-blue-700' :
                    'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>

                {isError && (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            );
          })}
        </div>

        {creationProgress.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {creationProgress.error}
            </p>
          </div>
        )}

        {creationProgress.completed && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              <CheckCircleIcon className="h-4 w-4 inline mr-2" />
              ¡Empresa creada exitosamente con estructura Gmail/No-Gmail!
            </p>
          </div>
        )}
      </div>
    );
  };

  // Mostrar información de la estructura Gmail/No-Gmail
  const StructureInfo = () => {
    if (company || isCreating) return null;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <FolderIcon className="h-5 w-5 text-green-600 mr-2" />
          <h4 className="text-sm font-semibold text-green-900">
            Estructura de Carpetas Automática
          </h4>
        </div>
        <p className="text-sm text-green-800 mb-3">
          Al crear la empresa, se generará automáticamente la siguiente estructura en Google Drive:
        </p>
        <div className="bg-white rounded border p-3 text-xs font-mono">
          <div className="text-green-700">📁 StaffHub - [Nombre Empresa]/</div>
          <div className="text-green-600 ml-4">├── 📁 Gmail/</div>
          <div className="text-green-600 ml-4">└── 📁 No-Gmail/</div>
        </div>
        <p className="text-xs text-green-700 mt-2">
          Los empleados se clasificarán automáticamente según su tipo de email.
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {company ? 'Editar Empresa' : 'Crear Nueva Empresa'}
              </h2>
              <p className="text-sm text-gray-600">
                {company ? 'Actualizar información de la empresa' : 'Crear empresa con estructura Gmail/No-Gmail automática'}
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de progreso */}
        <ProgressIndicator />

        {/* Información de estructura */}
        <StructureInfo />

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Mi Empresa S.A."
                disabled={isCreating}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción de la empresa..."
                disabled={isCreating}
              />
            </div>

            {!company && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isCreating}
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isCreating}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !formData.name.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCreating ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  {company ? 'Actualizar Empresa' : 'Crear con Flujo Ordenado'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderedCompanyForm;