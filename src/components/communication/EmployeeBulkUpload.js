import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import organizedDatabaseService from '../../services/organizedDatabaseService.js';

const MySwal = withReactContent(Swal);

const EmployeeBulkUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);
  const [companies, setCompanies] = useState([]);

  const loadCompanies = useCallback(async () => {
    try {
      const companiesData = await organizedDatabaseService.getCompanies();
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Estructura esperada del Excel
  const expectedColumns = [
    'name', 'email', 'phone', 'company', 'region', 
    'department', 'level', 'position', 'workMode', 'contractType'
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea un archivo Excel
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type)) {
        MySwal.fire({
          title: 'Error',
          text: 'Por favor selecciona un archivo Excel (.xls o .xlsx)',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#0693e3'
        });
        return;
      }
      
      setSelectedFile(file);
      processExcelFile(file);
    }
  };

  const processExcelFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Usar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Mostrar vista previa (máximo 10 registros)
        setPreviewData(jsonData.slice(0, 10));
        
        // Validar datos
        validateEmployeeData(jsonData);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        MySwal.fire({
          title: 'Error',
          text: 'Hubo un problema al procesar el archivo Excel',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#0693e3'
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const validateEmployeeData = (data) => {
    const results = data.map((row, index) => {
      const errors = [];
      
      // Validar campos requeridos
      if (!row.name || row.name.trim() === '') {
        errors.push('Nombre es requerido');
      }
      
      if (!row.email || row.email.trim() === '') {
        errors.push('Email es requerido');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Formato de email inválido');
      }
      
      if (!row.company || row.company.trim() === '') {
        errors.push('Empresa es requerida');
      }
      
      // Validar que la empresa exista
      const companyExists = companies.some(comp =>
        comp.name.toLowerCase() === (row.company || '').toLowerCase()
      );
      
      if (row.company && !companyExists) {
        errors.push(`Empresa "${row.company}" no encontrada en el sistema`);
      }
      
      return {
        row: index + 1,
        data: row,
        valid: errors.length === 0,
        errors: errors
      };
    });
    
    setValidationResults(results);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      MySwal.fire({
        title: 'Advertencia',
        text: 'Por favor selecciona un archivo Excel',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#fcb900'
      });
      return;
    }
    
    const invalidRecords = validationResults.filter(result => !result.valid);
    if (invalidRecords.length > 0) {
      MySwal.fire({
        title: 'Datos inválidos',
        text: `Hay ${invalidRecords.length} registros con errores. Por favor corrige los datos antes de continuar.`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#fcb900'
      });
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simular progreso
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Procesar y guardar empleados
      const employeesToCreate = validationResults.map(result => result.data);
      let successCount = 0;
      let errorCount = 0;
      
      // Guardar empleados en la base de datos real
      for (const employeeData of employeesToCreate) {
        try {
          // Buscar la empresa por nombre
          const company = companies.find(comp =>
            comp.name.toLowerCase() === employeeData.company.toLowerCase()
          );
          
          if (company) {
            // Crear empleado con datos reales
            await organizedDatabaseService.createEmployee({
              name: employeeData.name,
              email: employeeData.email,
              phone: employeeData.phone || '',
              position: employeeData.position || 'Empleado',
              department: employeeData.department || 'General',
              level: employeeData.level || 'Staff',
              workMode: employeeData.workMode || 'Presencial',
              contractType: employeeData.contractType || 'Indefinido',
              company_id: company.id,
              is_active: true
            });
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Error creating employee:', error);
          errorCount++;
        }
      }
      
      clearInterval(interval);
      setUploadProgress(100);
      
      // Actualizar resultados
      setUploadResults({
        total: employeesToCreate.length,
        success: successCount,
        errors: errorCount
      });
      
      MySwal.fire({
        title: '¡Éxito!',
        text: `Se han procesado ${successCount} empleados correctamente`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
      
      // Limpiar formulario
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewData([]);
        setValidationResults([]);
        setUploadResults(null);
        setUploadProgress(0);
        setUploading(false);
      }, 3000);
    } catch (error) {
      console.error('Error subiendo empleados:', error);
      setUploading(false);
      setUploadProgress(0);
      
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al cargar los empleados',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setValidationResults([]);
    setUploadResults(null);
    setUploadProgress(0);
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Moderno */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <ArrowUpTrayIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-1">
                  Carga Masiva de Empleados
                </h1>
                <div className="h-1 w-20 bg-white/30 rounded-full"></div>
              </div>
            </div>
            <p className="text-indigo-100 text-lg font-medium">
              Importa múltiples empleados desde archivos Excel de forma rápida y segura
            </p>
            <div className="flex items-center mt-4 text-sm text-indigo-200">
              <div className="flex items-center mr-6">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Validación automática
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Procesamiento masivo
              </div>
            </div>
          </div>
          {/* Elementos decorativos */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Instrucciones */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl mr-4">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Instrucciones de Carga</h2>
                <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-1"></div>
                <p className="text-sm text-gray-600 mt-1">Sigue estos pasos para importar empleados correctamente</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 mb-6">
              <div className="flex items-start">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-2 rounded-lg mr-4 flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Formato del Archivo Excel</h3>
                  <p className="text-blue-800 mb-4">
                    El archivo debe contener las siguientes columnas obligatorias:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {expectedColumns.map(column => (
                      <div key={column} className="bg-white p-3 rounded-xl border border-blue-200 text-center shadow-sm">
                        <span className="text-sm font-bold text-blue-700">{column}</span>
                        {['name', 'email', 'company'].includes(column) && (
                          <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/60 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Requisitos importantes:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Archivo Excel (.xls o .xlsx)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Primera fila con encabezados de columna
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Campos marcados con <span className="inline-block w-2 h-2 bg-red-500 rounded-full mx-1"></span> son obligatorios
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        El nombre de empresa debe coincidir exactamente
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Selector de archivo */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-xl mr-4">
                <ArrowUpTrayIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Seleccionar Archivo</h3>
                <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mt-1"></div>
                <p className="text-sm text-gray-600 mt-1">Elige el archivo Excel con los datos de empleados</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-3xl border border-gray-200">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-lg group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ArrowUpTrayIcon className="w-8 h-8 text-white" />
                  </div>
                  <p className="mb-2 text-lg font-semibold text-gray-700">
                    <span className="text-blue-600">Haz clic para seleccionar</span> o arrastra un archivo
                  </p>
                  <p className="text-sm text-gray-500">
                    XLS, XLSX (Máx. 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-200 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl mr-4">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-green-900">{selectedFile.name}</h4>
                      <p className="text-sm text-green-700">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Excel válido
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={resetUpload}
                      className="bg-red-500 hover:bg-red-600 p-2 rounded-xl text-white transition-all duration-300 hover:scale-105"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Progreso de carga */}
          {uploading && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-3xl border border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-xl mr-4">
                    <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-900">Procesando Empleados</h3>
                    <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mt-1"></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-purple-700 font-medium">Cargando datos...</span>
                  <span className="text-purple-700 font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-purple-600 mt-2">Validando y procesando la información...</p>
              </div>
            </div>
          )}
          
          {/* Vista previa de datos */}
          {previewData.length > 0 && !uploadResults && (
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Vista Previa de Datos</h3>
                  <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full mt-1"></div>
                  <p className="text-sm text-gray-600 mt-1">Primeros registros del archivo Excel</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-3xl border border-cyan-200 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-cyan-200">
                    <thead className="bg-gradient-to-r from-cyan-100 to-blue-100">
                      <tr>
                        {Object.keys(previewData[0]).map(key => (
                          <th key={key} className="px-6 py-4 text-left text-xs font-bold text-cyan-800 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white/60 divide-y divide-cyan-100">
                      {previewData.map((row, index) => (
                        <tr key={index} className="hover:bg-cyan-50/50 transition-colors duration-200">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                              {value || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length < validationResults.length && (
                    <div className="mt-4 p-3 bg-cyan-100/50 rounded-xl border border-cyan-200">
                      <p className="text-sm text-cyan-700 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mostrando {previewData.length} de {validationResults.length} registros
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Resultados de validación */}
          {validationResults.length > 0 && !uploadResults && (
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl mr-4">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Validación de Datos</h3>
                  <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mt-1"></div>
                  <p className="text-sm text-gray-600 mt-1">Verificación automática de la información</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-3xl border border-orange-200 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/60 p-4 rounded-xl border border-orange-200">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                      <span className="text-sm font-semibold text-gray-700">Total Registros</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{validationResults.length}</p>
                  </div>

                  <div className="bg-white/60 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-semibold text-green-700">Válidos</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{validationResults.filter(r => r.valid).length}</p>
                  </div>

                  <div className="bg-white/60 p-4 rounded-xl border border-red-200">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-semibold text-red-700">Inválidos</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{validationResults.filter(r => !r.valid).length}</p>
                  </div>
                </div>

                {validationResults.filter(r => !r.valid).length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-red-900">Errores Encontrados</h4>
                      <button
                        onClick={() => {
                          const invalidRecords = validationResults.filter(r => !r.valid);
                          console.log('Registros inválidos:', invalidRecords);
                          // Aquí podrías mostrar un modal con los detalles de los errores
                        }}
                        className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Detalles
                      </button>
                    </div>

                    <div className="bg-white/60 p-4 rounded-xl border border-red-200 max-h-60 overflow-y-auto">
                      {validationResults.filter(r => !r.valid).slice(0, 5).map((result, index) => (
                        <div key={index} className="flex items-start mb-3 p-3 bg-red-50 rounded-lg border border-red-100">
                          <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              Fila {result.row}
                            </p>
                            <p className="text-sm text-red-700">
                              {result.errors.join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {validationResults.filter(r => !r.valid).length > 5 && (
                        <div className="text-center p-3 bg-red-100/50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700 font-medium">
                            ... y {validationResults.filter(r => !r.valid).length - 5} errores más
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Resultados de carga */}
          {uploadResults && (
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl mr-4">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Resultados de Carga</h3>
                  <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-1"></div>
                  <p className="text-sm text-gray-600 mt-1">Procesamiento completado exitosamente</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl border border-green-200 shadow-lg">
                <div className="flex items-center justify-center">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full mr-6">
                    <CheckCircleIcon className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-green-900 mb-2">¡Carga Completada Exitosamente!</h4>
                    <p className="text-lg text-green-700">
                      Se procesaron <span className="font-bold text-green-900">{uploadResults.success}</span> de <span className="font-bold text-green-900">{uploadResults.total}</span> empleados
                    </p>
                    <div className="mt-3 flex items-center text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Todos los datos han sido validados y guardados correctamente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de carga */}
          {selectedFile && validationResults.length > 0 && !uploadResults && (
            <div className="flex justify-end space-x-4">
              <button
                onClick={resetUpload}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                disabled={uploading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando Empleados...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                    Cargar Empleados
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Información adicional */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl mr-4">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Empresas Disponibles</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-1"></div>
              <p className="text-sm text-gray-600 mt-1">Lista de organizaciones registradas en el sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companies.map(company => (
              <div key={company.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-indigo-900">{company.name}</h4>
                    <div className="h-0.5 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-1"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-700">ID Empresa</span>
                  <span className="text-sm font-bold text-indigo-900 bg-indigo-100 px-3 py-1 rounded-full">{company.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeBulkUpload;