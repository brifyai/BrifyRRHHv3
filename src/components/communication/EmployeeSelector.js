import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import organizedDatabaseService from '../../services/organizedDatabaseService.js';
import {
  getSimulatedWhatsApp,
  getSimulatedTelegram,
  getSimulatedSMS,
  getSimulatedMailing
} from '../../utils/communicationUtils.js';

const MySwal = withReactContent(Swal);

const EmployeeSelector = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [filters, setFilters] = useState({
    companyId: '',
    region: '',
    department: '',
    level: '',
    workMode: '',
    contractType: ''
  });

  // Filtros únicos para los dropdowns
  const [uniqueRegions, setUniqueRegions] = useState([]);
  const [uniqueDepartments, setUniqueDepartments] = useState([]);
  const [uniqueLevels, setUniqueLevels] = useState([]);
  const [uniqueWorkModes, setUniqueWorkModes] = useState([]);
  const [uniqueContractTypes, setUniqueContractTypes] = useState([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const extractUniqueFilters = useCallback(() => {
    const regions = [...new Set(employees.map(emp => emp.region))];
    const departments = [...new Set(employees.map(emp => emp.department))];
    const levels = [...new Set(employees.map(emp => emp.level))];
    const workModes = [...new Set(employees.map(emp => emp.work_mode))];
    const contractTypes = [...new Set(employees.map(emp => emp.contract_type))];
    
    setUniqueRegions(regions.sort());
    setUniqueDepartments(departments.sort());
    setUniqueLevels(levels.sort());
    setUniqueWorkModes(workModes.sort());
    setUniqueContractTypes(contractTypes.sort());
  }, [employees]);

  const applyFilters = useCallback(() => {
    let result = [...employees];
    
    if (filters.companyId) {
      result = result.filter(emp => emp.company_id === filters.companyId);
    }
    
    if (filters.region) {
      result = result.filter(emp => emp.region === filters.region);
    }
    
    if (filters.department) {
      result = result.filter(emp => emp.department === filters.department);
    }
    
    if (filters.level) {
      result = result.filter(emp => emp.level === filters.level);
    }
    
    if (filters.workMode) {
      result = result.filter(emp => emp.work_mode === filters.workMode);
    }
    
    if (filters.contractType) {
      result = result.filter(emp => emp.contract_type === filters.contractType);
    }
    
    setFilteredEmployees(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [employees, filters]);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const employeeData = await organizedDatabaseService.getEmployees();
      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const companyData = await organizedDatabaseService.getCompanies();
      setCompanies(companyData);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    loadCompanies();
    
    // Si hay datos temporales de empleados seleccionados, cargarlos
    if (window.tempSelectedEmployees) {
      const tempSelected = new Set(window.tempSelectedEmployees);
      setSelectedEmployees(tempSelected);
      delete window.tempSelectedEmployees;
    }
  }, [loadEmployees, loadCompanies]);

  useEffect(() => {
    applyFilters();
  }, [employees, filters, applyFilters]);

  useEffect(() => {
    extractUniqueFilters();
  }, [employees, extractUniqueFilters]);


  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSelectEmployee = (employeeId) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      // Deseleccionar todos
      setSelectedEmployees(new Set());
    } else {
      // Seleccionar todos los filtrados
      const allIds = new Set(filteredEmployees.map(emp => emp.id));
      setSelectedEmployees(allIds);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      companyId: '',
      region: '',
      department: '',
      level: '',
      workMode: '',
      contractType: ''
    });
    setCurrentPage(1);
  };

  // Funciones de paginación
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSyncEmployees = async () => {
    try {
      setLoading(true);
      // Ya no necesitamos sincronizar empleados ya que usamos datos reales de la BD
      await organizedDatabaseService.getEmployees();
      await loadEmployees();
      
      // Mostrar alerta de éxito
      MySwal.fire({
        title: '¡Éxito!',
        text: 'Empleados sincronizados correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    } catch (error) {
      console.error('Error syncing employees:', error);
      
      // Mostrar alerta de error
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al sincronizar los empleados',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessages = async () => {
    if (selectedEmployees.size > 0) {
      try {
        // Obtener los datos completos de los empleados seleccionados
        const selectedEmployeeIds = Array.from(selectedEmployees);
        
        console.log('Navegando a /communication/send con:', selectedEmployeeIds);
        
        // Navegar a la página de envío de mensajes pasando los IDs de empleados
        navigate('/communication/send', { 
          state: { selectedEmployees: selectedEmployeeIds } 
        });
      } catch (error) {
        console.error('Error preparing employee data:', error);
        MySwal.fire({
          title: 'Error',
          text: 'Hubo un problema al preparar los datos de los empleados seleccionados',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#0693e3'
        });
      }
    } else {
      // Mostrar alerta de advertencia con SweetAlert
      MySwal.fire({
        title: 'Advertencia',
        text: 'Debe seleccionar al menos un empleado para enviar mensajes',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#fcb900'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-engage-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Moderno */}
        <div className="bg-gradient-to-r from-engage-blue via-blue-600 to-engage-yellow rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-3">
                  <div className="bg-white/20 p-3 rounded-full mr-4">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-1">
                      Base de Datos de Empleados
                    </h1>
                    <div className="h-1 w-20 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <p className="text-blue-100 text-lg font-medium">
                  Seleccione empleados para enviar mensajes masivos personalizados
                </p>
                <div className="flex items-center mt-4 text-sm text-blue-200">
                  <div className="flex items-center mr-6">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    {filteredEmployees.length} empleados disponibles
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                    {selectedEmployees.size} empleados seleccionados
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSyncEmployees}
                  className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-3" />
                  Sincronizar Empleados
                </button>
                <button
                  onClick={handleSendMessages}
                  className={`inline-flex items-center px-6 py-3 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    selectedEmployees.size === 0
                      ? 'bg-white/10 text-white/50 cursor-not-allowed backdrop-blur-sm'
                      : 'bg-white hover:bg-yellow-50 text-engage-black transform hover:scale-105'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Mensajes ({selectedEmployees.size})
                </button>
              </div>
            </div>
          </div>
          {/* Elementos decorativos */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-engage-blue via-blue-500 to-engage-yellow"></div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-engage-blue to-blue-600 p-3 rounded-xl mr-4">
                <FunnelIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Filtros Avanzados</h2>
                <p className="text-sm text-gray-600">Refina tu búsqueda de empleados</p>
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-300 hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select
                value={filters.companyId}
                onChange={(e) => handleFilterChange('companyId', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-engage-blue focus:ring-engage-blue"
              >
                <option value="">Todas las empresas</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-engage-blue focus:ring-engage-blue"
              >
                <option value="">Todas las regiones</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-engage-blue focus:ring-engage-blue"
              >
                <option value="">Todos los departamentos</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-engage-blue focus:ring-engage-blue"
              >
                <option value="">Todos los niveles</option>
                {uniqueLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
              <select
                value={filters.workMode}
                onChange={(e) => handleFilterChange('workMode', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-engage-blue focus:ring-engage-blue"
              >
                <option value="">Todas las modalidades</option>
                {uniqueWorkModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
              <select
                value={filters.contractType}
                onChange={(e) => handleFilterChange('contractType', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-engage-blue focus:ring-engage-blue"
              >
                <option value="">Todos los tipos</option>
                {uniqueContractTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de empleados */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-engage-blue via-blue-500 to-engage-yellow"></div>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="bg-gradient-to-r from-engage-blue to-blue-600 p-3 rounded-xl mr-4">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Empleados Disponibles</h2>
                <p className="text-sm text-gray-600">{filteredEmployees.length} empleados encontrados</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-blue-700">{selectedEmployees.size} seleccionados</span>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-engage-blue hover:text-engage-yellow font-medium transition-colors duration-300"
                >
                  {selectedEmployees.size === filteredEmployees.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                Página {currentPage} de {totalPages} • {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} de {filteredEmployees.length}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-engage-blue border-gray-300 rounded focus:ring-engage-blue"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telegram
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SMS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mailing
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] ${selectedEmployees.has(employee.id) ? 'bg-gradient-to-r from-blue-100 to-indigo-100 shadow-md' : ''}`}
                    onClick={() => handleSelectEmployee(employee.id)}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(employee.id)}
                          onChange={() => handleSelectEmployee(employee.id)}
                          className="h-5 w-5 text-engage-blue border-gray-300 rounded focus:ring-engage-blue transition-all duration-300"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-engage-blue to-blue-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">
                            {employee.first_name ? employee.first_name.charAt(0) : '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {employee.first_name && employee.last_name
                              ? `${employee.first_name} ${employee.last_name}`
                              : employee.first_name || employee.last_name || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                            {employee.position || 'Sin posición'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full inline-block">
                        {employee.companies?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block font-medium">
                        {employee.department || 'Sin departamento'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${employee.email ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="text-sm text-gray-900 font-medium">{employee.email || 'Sin email'}</div>
                        {employee.email && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Activo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getSimulatedWhatsApp(employee).enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="text-sm text-gray-900">{getSimulatedWhatsApp(employee).phone}</div>
                        {getSimulatedWhatsApp(employee).enabled && (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getSimulatedTelegram(employee).enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="text-sm text-gray-900">
                          {getSimulatedTelegram(employee).username}
                        </div>
                        {getSimulatedTelegram(employee).enabled && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const whatsappData = getSimulatedWhatsApp(employee);
                          const smsData = getSimulatedSMS(employee, whatsappData);
                          return (
                            <>
                              <div className={`w-2 h-2 rounded-full ${smsData.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <div className="text-sm text-gray-900">{smsData.phone}</div>
                              {smsData.enabled && (
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getSimulatedMailing(employee).enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="text-sm text-gray-900">
                          {getSimulatedMailing(employee).status}
                        </div>
                        {getSimulatedMailing(employee).enabled && (
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación Moderna */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-engage-blue to-blue-600 text-white shadow-lg transform scale-105'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Siguiente
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Página <span className="text-engage-blue font-bold">{currentPage}</span> de <span className="font-bold">{totalPages}</span>
                </span>
              </div>
            </div>
          )}

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron empleados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Intente ajustar los filtros o sincronizar los empleados.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleSyncEmployees}
                  className="inline-flex items-center px-4 py-2 bg-engage-blue hover:bg-engage-yellow text-white font-bold rounded-lg transition-all duration-300"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Sincronizar Empleados
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelector;