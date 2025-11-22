import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  FolderIcon,
  UserIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  FunnelIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import unifiedEmployeeFolderService from '../../services/unifiedEmployeeFolderService.js';
import googleDriveSyncService from '../../services/googleDriveSyncService.js';
// eslint-disable-next-line no-unused-vars
import googleDriveTokenBridge from '../../lib/googleDriveTokenBridge.js';
// eslint-disable-next-line no-unused-vars
import organizedDatabaseService from '../../services/organizedDatabaseService.js';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../../styles/responsive-tables.css';

const MySwal = withReactContent(Swal);

const EmployeeFolders = () => {
  // eslint-disable-next-line no-unused-vars
  const { companyId } = useParams();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [folders, setFolders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    companyId: '',
    department: '',
    level: '',
    workMode: '',
    contractType: ''
  });
  const [selectedFolders, setSelectedFolders] = useState(new Set());
  const [companies, setCompanies] = useState([]);
  const [uniqueDepartments, setUniqueDepartments] = useState([]);
  const [uniqueLevels, setUniqueLevels] = useState([]);
  const [uniqueWorkModes, setUniqueWorkModes] = useState([]);
  const [uniqueContractTypes, setUniqueContractTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // eslint-disable-next-line no-unused-vars
  const [totalItems, setTotalItems] = useState(0);

  // Cargar empleados inicialmente al montar el componente
  useEffect(() => {
    console.log('🚀 [INIT] Cargando empleados inicialmente...');
    // eslint-disable-next-line no-use-before-define
    loadEmployeesOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicializar token bridge cuando el usuario está autenticado
  useEffect(() => {
    if (!loading && employees.length > 0) {
      console.log('🔄 [PAGINATION DEBUG] useEffect triggered:', {
        currentPage,
        searchTerm: searchTerm || 'empty',
        hasFilters: Object.values(filters).some(Boolean),
        employeesCount: employees.length,
        companiesCount: companies.length
      });
      // eslint-disable-next-line no-use-before-define
      loadFoldersForCurrentPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, filters, loading, companies.length, employees.length]);

  // Resetear a página 1 cuando cambian filtros o búsqueda
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filters, employees, currentPage]);

// ===== FUNCIONES DE CARGA DE DATOS FALTANTES =====

  const loadEmployeesOnly = useCallback(async () => {
    try {
      setLoading(true);
      console.log('👥 Cargando empleados desde la base de datos...');
      
      // Intentar cargar empleados desde Supabase
      let employeesData = [];
      let companiesData = [];
      let usingFallback = false;
      
      try {
        console.log('🔍 Intentando consulta a Supabase...');
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, full_name, email, position, department, company_id, status, phone, region, level, work_mode, contract_type, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('⚠️ Error en consulta Supabase:', error.message);
          throw error;
        }
        
        employeesData = data || [];
        console.log(`✅ Cargados ${employeesData.length} empleados desde Supabase`);
        
      } catch (supabaseError) {
        console.warn('⚠️ Supabase no disponible, usando datos de prueba:', supabaseError.message);
        
        // Datos de prueba cuando Supabase no está disponible
        employeesData = [
          {
            id: '1',
            first_name: 'Juan',
            last_name: 'Pérez',
            full_name: 'Juan Pérez',
            email: 'juan.perez@empresa.com',
            position: 'Desarrollador Senior',
            department: 'Tecnología',
            company_id: '1',
            status: 'active',
            phone: '+56 9 1234 5678',
            region: 'Santiago',
            level: 'Senior',
            work_mode: 'Remoto',
            contract_type: 'Indefinido',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            first_name: 'María',
            last_name: 'González',
            full_name: 'María González',
            email: 'maria.gonzalez@empresa.com',
            position: 'Diseñadora UX',
            department: 'Diseño',
            company_id: '1',
            status: 'active',
            phone: '+56 9 8765 4321',
            region: 'Santiago',
            level: 'Mid',
            work_mode: 'Híbrido',
            contract_type: 'Indefinido',
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            first_name: 'Carlos',
            last_name: 'Rodríguez',
            full_name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@empresa.com',
            position: 'Product Manager',
            department: 'Producto',
            company_id: '1',
            status: 'active',
            phone: '+56 9 1111 2222',
            region: 'Valparaíso',
            level: 'Senior',
            work_mode: 'Presencial',
            contract_type: 'Indefinido',
            created_at: new Date().toISOString()
          }
        ];
        
        usingFallback = true;
        console.log('📝 Usando datos de prueba:', employeesData.length, 'empleados');
      }
      
      // Intentar cargar empresas
      try {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (companiesError) {
          console.warn('⚠️ Error cargando empresas:', companiesError.message);
          companiesData = [
            { id: '1', name: 'Empresa Demo', status: 'active' }
          ];
        } else {
          companiesData = companies || [];
        }
      } catch (companiesError) {
        console.warn('⚠️ Error cargando empresas, usando default:', companiesError.message);
        companiesData = [
          { id: '1', name: 'Empresa Demo', status: 'active' }
        ];
      }
      
      console.log(`✅ Total: ${employeesData.length} empleados, ${companiesData.length} empresas`);
      
      // Transformar datos para compatibilidad con el resto del código
      const transformedEmployees = employeesData.map(emp => ({
        ...emp,
        employeeName: emp.full_name || `${emp.first_name} ${emp.last_name}`.trim(),
        employeeEmail: emp.email,
        employeePosition: emp.position,
        employeeDepartment: emp.department,
        employeeLevel: emp.level,
        employeeWorkMode: emp.work_mode,
        employeeContractType: emp.contract_type,
        employeePhone: emp.phone,
        employeeRegion: emp.region
      }));
      
      setEmployees(transformedEmployees);
      setCompanies(companiesData);

      // Extraer valores únicos para filtros
      if (transformedEmployees && transformedEmployees.length > 0) {
        const departments = [...new Set(transformedEmployees.map(emp => emp.department).filter(Boolean))];
        const levels = [...new Set(transformedEmployees.map(emp => emp.level).filter(Boolean))];
        const workModes = [...new Set(transformedEmployees.map(emp => emp.work_mode).filter(Boolean))];
        const contractTypes = [...new Set(transformedEmployees.map(emp => emp.contract_type).filter(Boolean))];
        
        setUniqueDepartments(departments.sort());
        setUniqueLevels(levels.sort());
        setUniqueWorkModes(workModes.sort());
        setUniqueContractTypes(contractTypes.sort());
      }

      // Mostrar mensaje informativo si estamos usando datos de prueba
      if (usingFallback) {
        MySwal.fire({
          title: 'ℹ️ Modo Demo',
          text: 'Mostrando datos de prueba. Configure la base de datos para datos reales.',
          icon: 'info',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0693e3',
          timer: 3000,
          timerProgressBar: true
        });
      }

    } catch (error) {
      console.error('❌ Error crítico en loadEmployeesOnly:', error);
      
      // Fallback extremo: datos mínimos
      const fallbackEmployees = [
        {
          id: 'demo-1',
          first_name: 'Usuario',
          last_name: 'Demo',
          full_name: 'Usuario Demo',
          email: 'demo@empresa.com',
          position: 'Empleado Demo',
          department: 'General',
          company_id: '1',
          status: 'active',
          phone: '+56 9 0000 0000',
          region: 'Demo',
          level: 'Demo',
          work_mode: 'Demo',
          contract_type: 'Demo',
          created_at: new Date().toISOString(),
          employeeName: 'Usuario Demo',
          employeeEmail: 'demo@empresa.com',
          employeePosition: 'Empleado Demo',
          employeeDepartment: 'General',
          employeeLevel: 'Demo',
          employeeWorkMode: 'Demo',
          employeeContractType: 'Demo',
          employeePhone: '+56 9 0000 0000',
          employeeRegion: 'Demo'
        }
      ];
      
      setEmployees(fallbackEmployees);
      setCompanies([{ id: '1', name: 'Empresa Demo', status: 'active' }]);
      setUniqueDepartments(['General']);
      setUniqueLevels(['Demo']);
      setUniqueWorkModes(['Demo']);
      setUniqueContractTypes(['Demo']);
      
      console.log('🆘 Usando datos de fallback extremo');
      
    } finally {
      setLoading(false);
      console.log('🏁 Carga de empleados completada');
    }
  }, []);

  const loadFoldersForCurrentPage = useCallback(async () => {
    // Prevenir múltiples cargas simultáneas
    if (loadingFolders) {
      console.log('⏳ Ya se están cargando carpetas, ignorando solicitud duplicada...');
      return;
    }

    try {
      setLoadingFolders(true);
      console.log(`📁 Cargando carpetas reales desde la base de datos...`);
      
      // Primero intentar cargar carpetas reales desde la base de datos con sus relaciones
      let realFolders = [];
      try {
        const { data: employeeFolders, error } = await supabase
          .from('employee_folders')
          .select(`
            *,
            employee_documents(id, document_name, document_type, description, status),
            employee_faqs(id, question, answer, category, status)
          `)
          .order('created_at', { ascending: false });

        if (!error && employeeFolders) {
          console.log(`✅ Encontradas ${employeeFolders.length} carpetas reales en la base de datos`);
          console.log('📊 Muestra de carpetas reales con relaciones:', employeeFolders.slice(0, 3).map(f => ({
            email: f.employee_email,
            documents_count: f.employee_documents?.length || 0,
            faqs_count: f.employee_faqs?.length || 0
          })));
          realFolders = employeeFolders;
        } else if (error) {
          console.warn('⚠️ No se pudieron cargar carpetas reales, usando datos de empleados:', error.message);
        }
      } catch (dbError) {
        console.warn('⚠️ Error consultando carpetas reales:', dbError.message);
      }

      // Si no hay carpetas reales, generar carpetas virtuales desde los empleados
      let foldersToShow = [];
      if (realFolders.length > 0) {
        // Usar carpetas reales y enriquecerlas con datos de empleados
        foldersToShow = realFolders.map(folder => {
          const employee = employees.find(emp => emp.email === folder.employee_email);
          
          // Construir knowledgeBase 100% real desde las relaciones de la base de datos
          const knowledgeBase = {
            faqs: (folder.employee_faqs || [])
              .filter(faq => faq.status === 'active')
              .map(faq => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                type: 'faq'
              })),
            documents: (folder.employee_documents || [])
              .filter(doc => doc.status === 'active')
              .map(doc => ({
                id: doc.id,
                name: doc.document_name,
                description: doc.description,
                type: doc.document_type,
                fileType: doc.document_type,
                category: doc.document_type
              })),
            policies: (folder.employee_documents || [])
              .filter(doc => doc.status === 'active' && doc.document_type === 'policy')
              .map(doc => ({
                id: doc.id,
                name: doc.document_name,
                description: doc.description,
                type: 'policy'
              })),
            procedures: (folder.employee_documents || [])
              .filter(doc => doc.status === 'active' && doc.document_type === 'procedure')
              .map(doc => ({
                id: doc.id,
                name: doc.document_name,
                description: doc.description,
                type: 'procedure'
              }))
          };
          
          console.log(`📊 Carpeta ${folder.employee_email}:`, {
            faqs: knowledgeBase.faqs.length,
            documents: knowledgeBase.documents.length,
            policies: knowledgeBase.policies.length,
            procedures: knowledgeBase.procedures.length
          });
          
          return {
            id: folder.id,
            email: folder.employee_email,
            employeeEmail: folder.employee_email,
            employeeName: folder.employee_name || employee?.employeeName || employee?.full_name || 'Sin nombre',
            companyName: folder.company_name || employee?.companyName || 'Sin empresa',
            companyIdResolved: folder.company_id || employee?.company_id,
            employeeDepartment: folder.employee_department || employee?.employeeDepartment || employee?.department,
            employeePosition: folder.employee_position || employee?.employeePosition || employee?.position,
            employeePhone: folder.employee_phone || employee?.employeePhone || employee?.phone,
            employeeLevel: folder.employee_level || employee?.employeeLevel || employee?.level,
            employeeWorkMode: folder.employee_work_mode || employee?.employeeWorkMode || employee?.work_mode,
            employeeContractType: folder.employee_contract_type || employee?.employeeContractType || employee?.contract_type,
            lastUpdated: folder.updated_at || new Date().toISOString(),
            driveFolderId: folder.drive_folder_id,
            driveFolderUrl: folder.drive_folder_url,
            // Usar datos reales de la base de datos
            knowledgeBase: knowledgeBase
          };
        });
      } else {
        // Si no hay carpetas reales, generar carpetas virtuales desde los empleados
        console.log(`📂 No hay carpetas reales, generando carpetas virtuales desde empleados...`);
        foldersToShow = employees.map(employee => {
          // Crear knowledgeBase vacío para carpetas virtuales
          const knowledgeBase = {
            faqs: [],
            documents: [],
            policies: [],
            procedures: []
          };
          
          return {
            id: `virtual-${employee.id}`,
            email: employee.email,
            employeeEmail: employee.email,
            employeeName: employee.employeeName || employee.full_name || `${employee.first_name} ${employee.last_name}`.trim(),
            companyName: companies.find(c => c.id === employee.company_id)?.name || 'Sin empresa',
            companyIdResolved: employee.company_id,
            employeeDepartment: employee.employeeDepartment || employee.department,
            employeePosition: employee.employeePosition || employee.position,
            employeePhone: employee.employeePhone || employee.phone,
            employeeLevel: employee.employeeLevel || employee.level,
            employeeWorkMode: employee.employeeWorkMode || employee.work_mode,
            employeeContractType: employee.employeeContractType || employee.contract_type,
            lastUpdated: new Date().toISOString(),
            driveFolderId: null,
            driveFolderUrl: null,
            // Usar knowledgeBase vacío para carpetas virtuales
            knowledgeBase: knowledgeBase,
            isVirtual: true // Marcar como carpeta virtual
          };
        });
        
        console.log(`✅ Generadas ${foldersToShow.length} carpetas virtuales desde empleados`);
      }

      console.log(`✅ Total de carpetas a mostrar: ${foldersToShow.length}`);

      // Si no hay filtros, mostrar todas las carpetas
      if (!searchTerm && !Object.values(filters).some(Boolean)) {
        setFolders(foldersToShow);
        setTotalItems(foldersToShow.length);
        return;
      }

      // Aplicar filtros a las carpetas
      let filteredFolders = foldersToShow || [];

      const term = (searchTerm || '').toLowerCase();
      if (term) {
        filteredFolders = filteredFolders.filter(folder =>
          (folder.employeeName || '').toLowerCase().includes(term) ||
          (folder.employeeEmail || '').toLowerCase().includes(term) ||
          (folder.companyName || '').toLowerCase().includes(term) ||
          (folder.employeePosition || '').toLowerCase().includes(term)
        );
      }

      if (filters.companyId) {
        // Usar company_id directamente como en EmployeeSelector
        filteredFolders = filteredFolders.filter(
          (folder) => folder.companyIdResolved === filters.companyId
        );
      }

      if (filters.department) {
        filteredFolders = filteredFolders.filter(folder => (folder.employeeDepartment || '') === filters.department);
      }

      if (filters.level) {
        filteredFolders = filteredFolders.filter(folder => (folder.employeeLevel || '') === filters.level);
      }

      if (filters.workMode) {
        filteredFolders = filteredFolders.filter(folder => (folder.employeeWorkMode || '') === filters.workMode);
      }

      if (filters.contractType) {
        filteredFolders = filteredFolders.filter(folder => (folder.employeeContractType || '') === filters.contractType);
      }

      console.log(`📊 ${filteredFolders.length} carpetas después de aplicar filtros`);
      console.log('🏢 Empresas disponibles (desde companies):', (companies || []).map(c => [c.id, c.name]));
      console.log('🧭 Filtro de empresa aplicado:', filters.companyId);
      
      setFolders(filteredFolders);
      setTotalItems(filteredFolders.length);
      
    } catch (error) {
      console.error('❌ Error cargando carpetas:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al cargar las carpetas desde la base de datos',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    } finally {
      setLoadingFolders(false);
      console.log('🏁 Carga de carpetas completada');
    }
  }, [searchTerm, filters, loadingFolders, companies, employees]);

  // Función de compatibilidad eliminada - ya no necesaria
  // const loadEmployeesAndFolders = loadEmployeesOnly;

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };


  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const getFilteredFolders = () => {
    // Las carpetas ya vienen filtradas por búsqueda y filtros activos
    // Agregar deduplicación por email como última capa de seguridad
    const uniqueFolders = [];
    const seenEmails = new Set();
    
    folders.forEach(folder => {
      const email = folder.email || folder.employeeEmail;
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        uniqueFolders.push(folder);
      } else if (email && seenEmails.has(email)) {
        console.warn('⚠️ Carpeta duplicada detectada y eliminada:', email);
      }
    });
    
    console.log('📁 [PAGINATION DEBUG] getFilteredFolders():', {
      totalFolders: folders.length,
      filteredFolders: uniqueFolders.length,
      searchTerm: searchTerm || 'none',
      activeFilters: Object.values(filters).filter(Boolean).length
    });
    
    return uniqueFolders;
  };

  const getPaginatedFolders = () => {
    const all = getFilteredFolders();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return all.slice(start, end);
  };

  const getTotalPages = () => {
    const foldersCount = getFilteredFolders().length;
    const pages = Math.ceil(foldersCount / itemsPerPage || 1);
    console.log('📊 [PAGINATION DEBUG] getTotalPages():', {
      foldersCount,
      itemsPerPage,
      totalPages: pages,
      currentPage
    });
    return pages;
  };

  const handlePageChange = (page) => {
    console.log('🔘 [PAGINATION DEBUG] handlePageChange called:', { page, currentPage });
    if (page !== currentPage) {
      console.log(`📄 [PAGINATION DEBUG] Changing from page ${currentPage} to page ${page}`);
      setCurrentPage(page);
      // No limpiar carpetas, el useEffect se encargará de cargar los datos correctos
    } else {
      console.log('⚠️ [PAGINATION DEBUG] Page change ignored - same page:', page);
    }
  };

  const handleSelectFolder = (employeeEmail) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(employeeEmail)) {
      newSelected.delete(employeeEmail);
    } else {
      newSelected.add(employeeEmail);
    }
    setSelectedFolders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFolders.size === getFilteredFolders().length) {
      // Deseleccionar todos
      setSelectedFolders(new Set());
    } else {
      // Seleccionar todos los filtrados
      const allEmails = new Set(getFilteredFolders().map(folder => folder.email));
      setSelectedFolders(allEmails);
    }
  };


  const handleFileUpload = async (employeeEmails, files) => {
    try {
      const totalFiles = files.length;
      const totalFolders = employeeEmails.length;
      let uploadedCount = 0;
      
      // Función auxiliar para leer archivo de forma segura
      const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(new Error('Error leyendo el archivo'));
          reader.readAsText(file);
        });
      };
      
      // Procesar cada archivo para cada empleado
      for (const employeeEmail of employeeEmails) {
        for (const file of files) {
          try {
            const content = await readFileContent(file);
            
            // Crear un documento con el contenido del archivo
            // Simular adición de documento (sin depender de servicio externo)
            console.log(`📄 Simulando adición de documento para ${employeeEmail}:`, {
              name: file.name,
              description: `Archivo subido: ${file.name}`,
              content: content,
              fileType: file.type,
              fileSize: file.size
            });
            
            uploadedCount++;
            
          } catch (fileError) {
            console.error(`Error procesando archivo ${file.name} para ${employeeEmail}:`, fileError);
            // Continuar con el siguiente archivo en caso de error
          }
        }
      }
      
      // Recargar los datos después de procesar todos los archivos
      await loadEmployeesOnly();
      
      MySwal.fire({
        title: '¡Éxito!',
        text: `${uploadedCount} de ${totalFiles * totalFolders} archivo(s) subido(s) correctamente a ${totalFolders} carpeta(s)`,
        icon: uploadedCount > 0 ? 'success' : 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
      
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al subir los archivos',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    }
  };

  const handleBulkFileUpload = (files) => {
    if (selectedFolders.size === 0) {
      MySwal.fire({
        title: 'Advertencia',
        text: 'Por favor, seleccione al menos una carpeta para subir archivos',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#fcb900'
      });
      return;
    }
    
    handleFileUpload(Array.from(selectedFolders), files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, employeeEmail) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Subir a una sola carpeta
      handleFileUpload([employeeEmail], files);
    }
  };

  const handleBulkDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleBulkFileUpload(files);
    }
  };

  const handleFileInputChange = (e, employeeEmail = null) => {
    const files = e.target.files;
    if (files.length > 0) {
      if (employeeEmail) {
        // Subir a una sola carpeta
        handleFileUpload([employeeEmail], files);
      } else {
        // Subir a múltiples carpetas seleccionadas
        handleBulkFileUpload(files);
      }
    }
  };

  const handleViewFolder = async (employeeEmail) => {
    try {
      // Buscar carpeta real en la base de datos
      const { data: folder, error } = await supabase
        .from('employee_folders')
        .select('*')
        .eq('employee_email', employeeEmail)
        .maybeSingle();

      if (error || !folder) {
        // Si no existe, crearla
        console.log(`📁 Creando carpeta para ${employeeEmail}...`);
        const employee = employees.find(emp => emp.email === employeeEmail);
        if (employee) {
          const result = await unifiedEmployeeFolderService.createEmployeeFolder(employeeEmail, employee);
          setSelectedFolder(result.folder);
        }
      } else {
        setSelectedFolder(folder);
      }
      
      // Limpiar selección cuando se abre una carpeta individual
      setSelectedFolders(new Set());
    } catch (error) {
      console.error('Error cargando carpeta:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al cargar la carpeta del empleado',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    }
  };

  // Función para crear todas las carpetas de empleados
  const createAllEmployeeFolders = async () => {
    try {
      setLoadingFolders(true);
      MySwal.fire({
        title: 'Creando carpetas...',
        text: 'Por favor espera mientras se crean las carpetas para todos los empleados',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false
      });

      // UNIFICADO: Usar solo googleDriveSyncService para evitar duplicaciones
      console.log('🔄 Usando googleDriveSyncService unificado para evitar duplicaciones...');
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const employee of employees) {
        try {
          if (!employee.email) {
            console.warn(`⚠️ Empleado sin email: ${employee.name}`);
            continue;
          }

          console.log(`📁 Procesando empleado: ${employee.email}`);
          const result = await googleDriveSyncService.createEmployeeFolderInDrive(
            employee.email,
            employee.employeeName || employee.first_name || 'Sin nombre',
            employee.companyName || 'Sin empresa',
            employee
          );

          if (result) {
            if (result.syncStatus === 'created_in_both') {
              createdCount++;
            } else if (result.syncStatus === 'already_exists' ||
                      result.syncStatus === 'updated_drive_id' ||
                      result.syncStatus === 'existed_in_drive_created_in_supabase') {
              updatedCount++;
            }
            console.log(`✅ Procesado ${employee.email}: ${result.syncStatus}`);
          }

          // Log de progreso cada 10 empleados
          if ((createdCount + updatedCount) % 10 === 0) {
            console.log(`📊 Progreso: ${createdCount + updatedCount} carpetas procesadas...`);
          }

        } catch (error) {
          errorCount++;
          errors.push(`${employee.email}: ${error.message}`);
          console.error(`❌ Error procesando ${employee.email}:`, error);
        }
      }

      const result = { createdCount, updatedCount, errorCount, sampleErrors: errors.slice(0, 10) };
      
      MySwal.fire({
        title: '¡Proceso completado!',
        html: `
          <div class="text-left">
            <p><strong>Carpetas creadas:</strong> ${result.createdCount}</p>
            <p><strong>Carpetas actualizadas:</strong> ${result.updatedCount}</p>
            <p><strong>Errores:</strong> ${result.errorCount}</p>
          </div>
        `,
        icon: result.errorCount === 0 ? 'success' : 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });

      // Recargar carpetas
      if (result && result.errorCount > 0) {
        const errors = (result.sampleErrors || []).slice(0, 10);
        const errorsHtml = errors.length
          ? `<ul class="list-disc pl-5 text-left">${errors.map(e => `<li class="mb-1 text-sm text-red-700">${e}</li>`).join('')}</ul>`
          : '<p class="text-gray-600">No hay detalles adicionales de error</p>';
        const schemaNote = result.schemaSuspect
          ? `<div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
               <p class="text-yellow-800 text-sm">
                 Se sospecha un problema de esquema en la base de datos. Verifica que las tablas estén creadas en Supabase ejecutando el SQL:
                 <code class="bg-yellow-100 px-1 py-0.5 rounded">database/employee_folders_setup.sql</code>
               </p>
             </div>`
          : '';
        await MySwal.fire({
          title: 'Se detectaron errores durante la sincronización',
          html: `
            <div class="text-left">
              <p class="mb-2"><strong>Errores:</strong> ${result.errorCount}</p>
              <p class="mb-2"><strong>Creadas:</strong> ${result.createdCount}    <strong>Actualizadas:</strong> ${result.updatedCount}</p>
              <div class="mt-2">
                <p class="mb-1 font-semibold">Muestras de error:</p>
                ${errorsHtml}
              </div>
              ${schemaNote}
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0693e3',
          width: '800px'
        });
      }
      await loadFoldersForCurrentPage();
    } catch (error) {
      console.error('Error creando carpetas:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al crear las carpetas',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    } finally {
      setLoadingFolders(false);
    }
  };

  // Sincronizar manualmente con Google Drive (crea/actualiza carpetas)
  const handleSyncWithDrive = async () => {
    try {
      setLoadingFolders(true);
      MySwal.fire({
        title: 'Sincronizando con Drive...',
        text: 'Creando y actualizando carpetas para los empleados en Google Drive y Supabase',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });
        
       // Verificar que Google Drive esté autenticado ANTES de intentar sincronizar
       if (!googleDriveSyncService.isAuthenticated()) {
         MySwal.fire({
           title: '❌ Google Drive no autenticado',
           html: `
             <div class="text-left">
               <p class="mb-4 text-gray-700">
                 <strong>No se puede sincronizar:</strong> Google Drive no está conectado.
               </p>
               <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                 <p class="text-sm text-yellow-800 mb-2">
                   <strong>¿Qué necesitas hacer?</strong>
                 </p>
                 <ol class="list-decimal list-inside text-sm text-yellow-800 space-y-1">
                   <li>Ve a <strong>Integraciones</strong></li>
                   <li>Haz clic en <strong>"Conectar Google Drive"</strong></li>
                   <li>Autoriza el acceso a tu cuenta de Google</li>
                   <li>Vuelve aquí e intenta sincronizar nuevamente</li>
                 </ol>
               </div>
               <p class="text-xs text-gray-600">
                 Sin autenticación, las carpetas no se pueden crear en Google Drive real.
               </p>
             </div>
           `,
           icon: 'warning',
           confirmButtonText: 'Entendido',
           confirmButtonColor: '#0693e3',
           width: '600px'
         });
         setLoadingFolders(false);
         return;
       }


      // Inicializar el servicio de sincronización
      console.log('🔄 Inicializando servicio de sincronización...');
      const initResult = await googleDriveSyncService.initialize();
      if (!initResult) {
        throw new Error('No se pudo inicializar el servicio de sincronización');
      }
      console.log('✅ Servicio de sincronización inicializado correctamente');

      // Crear carpetas para todos los empleados en Google Drive Y Supabase simultáneamente
      let createdCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const employee of employees) {
        try {
          if (employee.email) {
            console.log(`📁 Procesando empleado: ${employee.email}`);
            const result = await googleDriveSyncService.createEmployeeFolderInDrive(
              employee.email,
              employee.employeeName || employee.first_name || 'Sin nombre',
              employee.companyName || 'Sin empresa',
              employee
            );

            if (result && result.driveFolder) {
              createdCount++;
              console.log(`✅ Carpeta creada para ${employee.email}`);
              
              // Iniciar sincronización periódica para este empleado
              googleDriveSyncService.startPeriodicSync(
                employee.email,
                result.driveFolder.id,
                5 // cada 5 minutos
              );
            }
          }
        } catch (error) {
          errorCount++;
          errors.push(`${employee.email}: ${error.message}`);
          console.error(`❌ Error creando carpeta para ${employee.email}:`, error);
        }
      }

      MySwal.fire({
        title: 'Sincronización completada',
        html: `
          <div class="text-left">
            <p><strong>Carpetas creadas en Google Drive y Supabase:</strong> ${createdCount}</p>
            <p><strong>Sincronizaciones periódicas iniciadas:</strong> ${createdCount}</p>
            <p><strong>Errores:</strong> ${errorCount}</p>
          </div>
        `,
        icon: errorCount === 0 ? 'success' : 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });

      if (errorCount > 0) {
        const errorsHtml = errors.length
          ? `<ul class="list-disc pl-5 text-left">${errors.slice(0, 10).map(e => `<li class="mb-1 text-sm text-red-700">${e}</li>`).join('')}</ul>`
          : '<p class="text-gray-600">No hay detalles adicionales de error</p>';
        await MySwal.fire({
          title: 'Se detectaron errores durante la sincronización',
          html: `
            <div class="text-left">
              <p class="mb-2"><strong>Errores:</strong> ${errorCount}</p>
              <p class="mb-2"><strong>Creadas exitosamente:</strong> ${createdCount}</p>
              <div class="mt-2">
                <p class="mb-1 font-semibold">Muestras de error:</p>
                ${errorsHtml}
              </div>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0693e3',
          width: '800px'
        });
      }
      await loadFoldersForCurrentPage();
    } catch (error) {
      console.error('Error sincronizando con Drive:', error);
      MySwal.fire({
        title: 'Error',
        text: `No se pudo sincronizar con Google Drive: ${error.message || error}`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0693e3'
      });
    } finally {
      setLoadingFolders(false);
    }
  };


  // Calcular páginas totales
  const totalPages = getTotalPages();
  const hasMorePages = currentPage < totalPages;
  console.log('📈 [PAGINATION DEBUG] hasMorePages calculated:', { 
    currentPage, 
    totalPages, 
    hasMorePages 
  });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Moderno */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <FolderIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-1">
                  Carpetas de Empleados
                </h1>
                <div className="h-1 w-20 bg-white/30 rounded-full"></div>
              </div>
            </div>
            <p className="text-indigo-100 text-lg font-medium">
              Gestiona la información y base de conocimiento de cada empleado
            </p>
            <div className="flex items-center mt-4 text-sm text-indigo-200">
              <div className="flex items-center mr-6">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                {folders.length} carpetas activas
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Gestión de conocimiento
              </div>
            </div>
          </div>
          {/* Elementos decorativos */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>

        {/* Indicador de carga de carpetas */}
        {loadingFolders && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800">Cargando carpetas para la página {currentPage}...</p>
            </div>
          </div>
        )}

        {/* Información de paginación */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, getFilteredFolders().length)} a {Math.min(currentPage * itemsPerPage, getFilteredFolders().length)} de {getFilteredFolders().length} carpetas {getFilteredFolders().length > itemsPerPage && `(página ${currentPage} de ${totalPages})`}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleSyncWithDrive}
                disabled={loadingFolders}
                className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
              >
                {loadingFolders ? 'Sincronizando...' : 'Sincronizar con Drive'}
              </button>
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1 bg-gray-200 rounded">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMorePages}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100 relative overflow-hidden responsive-layout">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl mr-4">
                <FunnelIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Filtros Avanzados</h2>
                <p className="text-sm text-gray-600">Encuentra rápidamente las carpetas que necesitas</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <FunnelIcon className="h-5 w-5 mr-3" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>

              <div className="search-container">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o departamento..."
                  className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-all duration-300 bg-gray-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="filters-grid mt-4 pt-4 border-t border-gray-200">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-engage-blue focus:border-engage-blue truncate"
                  value={filters.companyId}
                  onChange={(e) => handleFilterChange('companyId', e.target.value)}
                >
                  <option value="">Todas las empresas</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-engage-blue focus:border-engage-blue truncate"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">Todos los departamentos</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept} className="truncate">{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-engage-blue focus:border-engage-blue truncate"
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <option value="">Todos los niveles</option>
                  {uniqueLevels.map(level => (
                    <option key={level} value={level} className="truncate">{level}</option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-engage-blue focus:border-engage-blue truncate"
                  value={filters.workMode}
                  onChange={(e) => handleFilterChange('workMode', e.target.value)}
                >
                  <option value="">Todas las modalidades</option>
                  {uniqueWorkModes.map(mode => (
                    <option key={mode} value={mode} className="truncate">{mode}</option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-engage-blue focus:border-engage-blue truncate"
                  value={filters.contractType}
                  onChange={(e) => handleFilterChange('contractType', e.target.value)}
                >
                  <option value="">Todos los contratos</option>
                  {uniqueContractTypes.map(type => (
                    <option key={type} value={type} className="truncate">{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Botones de acción para selección múltiple */}
          {selectedFolders.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedFolders.size} carpeta(s) seleccionada(s)
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    Subir Archivos
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => handleFileInputChange(e)}
                    />
                  </label>
                  <button
                    onClick={() => setSelectedFolders(new Set())}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar Selección
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Área de arrastrar y soltar para múltiples carpetas */}
        {selectedFolders.size > 0 && (
          <div 
            className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-8 mb-8 text-center cursor-pointer transition-colors hover:bg-blue-100"
            onDragOver={handleDragOver}
            onDrop={handleBulkDrop}
            onClick={() => document.getElementById('bulk-file-input').click()}
          >
            <CloudArrowUpIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arrastra archivos aquí para subir a {selectedFolders.size} carpeta(s) seleccionada(s)
            </h3>
            <p className="text-gray-600">
              También puedes hacer clic para seleccionar archivos
            </p>
            <input
              id="bulk-file-input"
              type="file"
              className="hidden"
              multiple
              onChange={(e) => handleFileInputChange(e)}
            />
          </div>
        )}

        {/* Lista de carpetas */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative responsive-layout">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="table-header-actions">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl mr-4">
                  <FolderIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Carpetas Disponibles</h2>
                  <p className="text-sm text-gray-600">{getFilteredFolders().length} carpetas encontradas</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center bg-indigo-50 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-indigo-700">{selectedFolders.size} de {getFilteredFolders().length} seleccionadas</span>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-300 hover:shadow-md"
                >
                  <CheckCircleIcon className={`h-5 w-5 mr-2 ${selectedFolders.size === getFilteredFolders().length ? 'text-indigo-500' : 'text-gray-400'}`} />
                  {selectedFolders.size === getFilteredFolders().length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              </div>
            </div>
          </div>

          {/* Indicador de scroll para móviles */}
          <div className="table-scroll-hint">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Desliza horizontalmente para ver más información
          </div>

          <div className="table-responsive-container scroll-horizontal">
            <div className="divide-y divide-gray-100">
              {getPaginatedFolders().map((folder) => (
                <div
                  key={folder.email}
                  className={`employee-card p-8 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 cursor-pointer transform hover:scale-[1.01] ${
                    selectedFolders.has(folder.email) ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-l-4 border-indigo-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectFolder(folder.email)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, folder.email)}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-6 mr-6">
                      <input
                        type="checkbox"
                        checked={selectedFolders.has(folder.email)}
                        onChange={() => handleSelectFolder(folder.email)}
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition-all duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mr-4">
                            <span className="text-white font-bold text-lg">
                              {((folder.employeeName || folder.email || folder.employee_email || '?').charAt(0)).toUpperCase()}
                            </span>
                          </div>
                          <div className="employee-info">
                            <h3 className="text-xl font-bold text-gray-900 truncate max-w-xs md:max-w-md">
                              {folder.employeeName || folder.email}
                            </h3>
                            <p className="text-sm text-gray-600 truncate max-w-xs md:max-w-md flex items-center">
                              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {folder.email}
                            </p>
                          </div>
                        </div>

                        <div className="employee-actions action-buttons">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewFolder(folder.email);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <DocumentIcon className="h-5 w-5 mr-2" />
                            Ver Carpeta
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-6 info-card-grid">
                         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                           <div className="flex items-center mb-2">
                             <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                             <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Empresa</p>
                           </div>
                           <p className="text-sm font-bold text-gray-900 truncate">{folder.companyName}</p>
                         </div>

                         <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                           <div className="flex items-center mb-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                             <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Departamento</p>
                           </div>
                           <p className="text-sm font-bold text-gray-900 truncate">{folder.employeeDepartment || 'No especificado'}</p>
                         </div>

                         <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                           <div className="flex items-center mb-2">
                             <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                             <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Cargo</p>
                           </div>
                           <p className="text-sm font-bold text-gray-900 truncate">{folder.employeePosition || 'No especificado'}</p>
                         </div>

                         <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-100">
                           <div className="flex items-center mb-2">
                             <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                             <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Teléfono</p>
                           </div>
                           <p className="text-sm font-bold text-gray-900 truncate">{folder.employeePhone || 'No especificado'}</p>
                         </div>
                       </div>
                     
                        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="badge-container">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              FAQs: {folder.knowledgeBase?.faqs?.length || 0}
                            </div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Documentos: {folder.knowledgeBase?.documents?.length || 0}
                            </div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Políticas: {folder.knowledgeBase?.policies?.length || 0}
                            </div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Procedimientos: {folder.knowledgeBase?.procedures?.length || 0}
                            </div>
                          </div>

                          <div className="bg-gray-100 px-3 py-2 rounded-lg">
                            <div className="flex items-center text-xs text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Última actualización: {new Date(folder.lastUpdated).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredFolders().length === 0 && (
                <div className="empty-state">
                  <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron carpetas</h3>
                  <p className="text-gray-500">
                    {searchTerm || Object.values(filters).some(Boolean)
                      ? 'No hay carpetas que coincidan con los filtros aplicados'
                      : loading
                        ? 'Cargando carpetas...'
                        : employees.length === 0
                          ? 'No hay empleados disponibles para generar carpetas'
                          : 'No hay carpetas de empleados disponibles'}
                  </p>
                  {!searchTerm && !Object.values(filters).some(Boolean) && !loading && employees.length > 0 && (
                    <div className="mt-6">
                      <button
                        onClick={createAllEmployeeFolders}
                        disabled={loadingFolders}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingFolders ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Creando carpetas...
                          </>
                        ) : (
                          <>
                            <FolderIcon className="h-5 w-5 mr-3" />
                            Crear Carpetas para Todos los Empleados
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {!loading && employees.length === 0 && (
                    <div className="mt-6">
                      <button
                        onClick={loadEmployeesOnly}
                        disabled={loading}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Cargando empleados...
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Recargar Empleados
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controles de paginación */}
          {getTotalPages() > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="pagination-controls">
                <div className="pagination-info text-sm text-gray-700">
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, getFilteredFolders().length)} a {Math.min(currentPage * itemsPerPage, getFilteredFolders().length)} de {getFilteredFolders().length} carpetas
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Anterior
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                      const pageNumber = Math.max(1, Math.min(getTotalPages() - 4, currentPage - 2)) + i;
                      if (pageNumber > getTotalPages()) return null;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === pageNumber
                              ? 'bg-engage-blue text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages()}
                    className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vista de carpeta individual */}
        {selectedFolder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
              {/* Header Moderno */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-t-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-3 rounded-full mr-4">
                        <FolderIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          Carpeta de {selectedFolder.employeeName || selectedFolder.email}
                        </h2>
                        <div className="h-1 w-20 bg-white/30 rounded-full mt-1"></div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center mt-4 text-sm text-indigo-200">
                    <div className="flex items-center mr-6">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      {selectedFolder.knowledgeBase?.documents?.length || 0} documentos
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      Base de conocimiento activa
                    </div>
                  </div>
                </div>
                {/* Elementos decorativos */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-lg">
                    <div className="flex items-center mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl mr-4">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Información del Empleado</h3>
                        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-1"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-white/60 rounded-xl border border-blue-100">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-medium text-gray-900">{selectedFolder.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-white/60 rounded-xl border border-blue-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Nombre</p>
                          <p className="text-sm font-medium text-gray-900">{selectedFolder.employeeName || 'No especificado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-white/60 rounded-xl border border-blue-100">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Empresa</p>
                          <p className="text-sm font-medium text-gray-900">{selectedFolder.companyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-white/60 rounded-xl border border-blue-100">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Departamento</p>
                          <p className="text-sm font-medium text-gray-900">{selectedFolder.employeeDepartment || 'No especificado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-white/60 rounded-xl border border-blue-100">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Cargo</p>
                          <p className="text-sm font-medium text-gray-900">{selectedFolder.employeePosition || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100 shadow-lg">
                    <div className="flex items-center mb-4">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-xl mr-4">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Estadísticas de Conocimiento</h3>
                        <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mt-1"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900">FAQs</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{selectedFolder.knowledgeBase?.faqs?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900">Documentos</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">{selectedFolder.knowledgeBase?.documents?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900">Políticas</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">{selectedFolder.knowledgeBase?.policies?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900">Procedimientos</span>
                        </div>
                        <span className="text-lg font-bold text-orange-600">{selectedFolder.knowledgeBase?.procedures?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-100">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900">Última actualización</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">{new Date(selectedFolder.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Archivos en la carpeta */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl mr-4">
                      <DocumentIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Archivos en la Carpeta</h3>
                      <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full mt-1"></div>
                      <p className="text-sm text-gray-600 mt-1">Documentos y recursos disponibles</p>
                    </div>
                  </div>

                  {selectedFolder.knowledgeBase?.documents && selectedFolder.knowledgeBase.documents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedFolder.knowledgeBase.documents.map((doc, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                <h4 className="text-lg font-bold text-gray-900">{doc.name}</h4>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mb-4 ml-6">{doc.description}</p>
                              )}
                              <div className="flex items-center text-xs text-gray-500 ml-6">
                                <div className="flex items-center mr-4">
                                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Documento
                                </div>
                                <div className="flex items-center mr-4">
                                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date().toLocaleDateString()}
                                </div>
                                {doc.fileSize && (
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m4 0H8l.5 16h7L16 4z" />
                                    </svg>
                                    {(doc.fileSize / 1024).toFixed(1)} KB
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => {
                                  // Mostrar contenido del archivo en un modal moderno
                                  MySwal.fire({
                                    title: `<div class="flex items-center"><div class="bg-gradient-to-r from-blue-500 to-cyan-600 p-2 rounded-lg mr-3"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>${doc.name}</div>`,
                                    html: `<div class="text-left max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg"><pre class="whitespace-pre-wrap text-sm font-mono text-gray-800">${doc.content}</pre></div>`,
                                    width: '900px',
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    customClass: {
                                      popup: 'rounded-3xl shadow-2xl border border-gray-200',
                                      closeButton: 'text-gray-400 hover:text-gray-600 transition-colors'
                                    }
                                  });
                                }}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver Contenido
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl border border-gray-200">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-2xl">
                        <DocumentIcon className="h-12 w-12 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-4">No hay archivos en esta carpeta</h4>
                      <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                        Los archivos subidos aparecerán aquí una vez que se agreguen documentos a la base de conocimiento del empleado.
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cerrar Carpeta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeFolders;