import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { List } from 'react-window';
import { EditorState, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import organizedDatabaseService from '../../services/organizedDatabaseService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import templateService from '../../services/templateService.js';
import inMemoryDraftService from '../../services/inMemoryDraftService.js';
import { supabase } from '../../lib/supabase.js';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import communicationService from '../../services/communicationService.js';

const SendMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [message, setMessage] = useState('');
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    console.log('SendMessages mounted with location state:', location.state);

    // Obtener los empleados seleccionados del estado de navegación
    if (location.state && location.state.selectedEmployees) {
      loadSelectedEmployees(location.state.selectedEmployees);
    } else if (window.tempSelectedEmployees) {
      // Usar datos almacenados temporalmente (de navegación desde menú)
      loadSelectedEmployees(window.tempSelectedEmployees);
      // Limpiar los datos temporales
      delete window.tempSelectedEmployees;
    } else if (window.selectedEmployeesData) {
      // Fallback: usar datos almacenados en window (de la implementación anterior)
      setSelectedEmployees(window.selectedEmployeesData);
      // Limpiar los datos temporales
      delete window.selectedEmployeesData;
    } else {
      // Si no hay empleados seleccionados, mostrar mensaje y redirigir
      console.log('No selected employees found, showing alert and redirecting');
      Swal.fire({
        title: 'No hay empleados seleccionados',
        text: 'Por favor, seleccione empleados desde la base de datos antes de enviar mensajes.',
        icon: 'info',
        confirmButtonText: 'Ir a la base de datos',
        confirmButtonColor: '#0693e3'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/base-de-datos');
        }
      });
    }
  }, [location, navigate]);

  useEffect(() => {
    // Cargar plantillas
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    try {
      const templatesData = await templateService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setMessage(template.content);
      setSelectedTemplate(templateId);
    }
  };

  const canSendMessages = () => {
    // Temporalmente permitir envío para desarrollo/testing
    // TODO: Restaurar validación de permisos en producción
    return true; // userPermissions.some(p => p.name === 'communication.send');
  };

  const loadSelectedEmployees = async (employeeIds) => {
    try {
      console.log('Loading selected employees:', employeeIds);
      const employeesData = await Promise.all(
        employeeIds.map(id => organizedDatabaseService.getEmployeeById(id))
      );
      console.log('Loaded employees data:', employeesData);
      setSelectedEmployees(employeesData);
    } catch (error) {
      console.error('Error loading selected employees:', error);
      setError('Error al cargar los empleados seleccionados');
    }
  };

  const handleSendMessage = async (channel) => {
    // Verificar que haya empleados seleccionados
    if (selectedEmployees.length === 0) {
      setError('Debe seleccionar al menos un empleado para enviar mensajes.');
      return;
    }

    if (!message.trim() && !media) {
      setError('Por favor, ingrese un mensaje o adjunte un archivo');
      return;
    }

    if (!canSendMessages()) {
      setError('No tienes permisos para enviar mensajes.');
      return;
    }

    // Configuración de control de tasa por canal
    const rateLimits = {
      'WhatsApp': { batchSize: 50, delayBetweenBatches: 5000 }, // 50 mensajes cada 5 segundos
      'Telegram': { batchSize: 30, delayBetweenBatches: 3000 },  // 30 mensajes cada 3 segundos
      'SMS': { batchSize: 100, delayBetweenBatches: 10000 },    // 100 mensajes cada 10 segundos
      'Email': { batchSize: 200, delayBetweenBatches: 15000 }   // 200 mensajes cada 15 segundos
    };

    const config = rateLimits[channel] || { batchSize: 50, delayBetweenBatches: 5000 };
    const employeeCount = selectedEmployees.length;
    const numberOfBatches = Math.ceil(employeeCount / config.batchSize);
    const totalEstimatedTime = (numberOfBatches - 1) * config.delayBetweenBatches;
    
    // Formatear tiempo total estimado
    const formatTime = (milliseconds) => {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0) {
        return `${minutes} minuto${minutes > 1 ? 's' : ''} y ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
      }
      return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    };

    // Mostrar alerta de control de tasa
    const rateLimitResult = await Swal.fire({
      title: '⚡ Control de Tasa de Envío',
      html: `
        <div style="text-align: left; font-size: 16px; line-height: 1.6;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">📊 Información de Envío</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px;">
                <div style="font-size: 14px; opacity: 0.9;">Total de mensajes</div>
                <div style="font-size: 20px; font-weight: bold;">${employeeCount}</div>
              </div>
              <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px;">
                <div style="font-size: 14px; opacity: 0.9;">Canal</div>
                <div style="font-size: 20px; font-weight: bold;">${channel}</div>
              </div>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #007bff;">
            <h4 style="margin: 0 0 16px 0; color: #007bff; font-size: 16px; font-weight: 600;">⏱️ Configuración de Tasa</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
              <div style="text-align: center; padding: 12px; background: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #28a745;">${config.batchSize}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Mensajes por bloque</div>
              </div>
              <div style="text-align: center; padding: 12px; background: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${config.delayBetweenBatches / 1000}s</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Tiempo entre bloques</div>
              </div>
              <div style="text-align: center; padding: 12px; background: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${numberOfBatches}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Número de bloques</div>
              </div>
            </div>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h4 style="margin: 0 0 12px 0; color: #856404; font-size: 16px; font-weight: 600;">🕐 Tiempo Estimado</h4>
            <div style="display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(255, 193, 7, 0.1); border-radius: 8px;">
              <div style="text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #856404;">${formatTime(totalEstimatedTime)}</div>
                <div style="font-size: 14px; color: #856404; margin-top: 4px;">Tiempo total de envío</div>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: #856404;">
              <strong>⚠️ Importante:</strong> Los mensajes se enviarán en bloques de ${config.batchSize} destinatarios cada ${config.delayBetweenBatches / 1000} segundos para evitar límites de la API y garantizar la entrega.
            </div>
          </div>

          <div style="background: #d1ecf1; padding: 16px; border-radius: 8px; border-left: 4px solid #17a2b8;">
            <div style="display: flex; align-items: center;">
              <div style="margin-right: 12px; font-size: 20px;">ℹ️</div>
              <div style="font-size: 14px; color: #0c5460;">
                <strong>Proceso:</strong> El sistema mostrará el progreso en tiempo real y podrás cancelar en cualquier momento si es necesario.
              </div>
            </div>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: getChannelColor(channel),
      cancelButtonColor: '#6c757d',
      confirmButtonText: `🚀 Iniciar Envío`,
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-rate-limit'
      },
      width: 700
    });

    if (!rateLimitResult.isConfirmed) {
      return;
    }

    // Obtener información para la confirmación final
    const appliedFilters = location.state?.filters || {};

    // Crear información detallada de empleados
    let employeesInfo = '';
    if (selectedEmployees.length > 0 && selectedEmployees.length <= 10) {
      employeesInfo = selectedEmployees
        .map(employee => `• ${employee.name} (${employee.position}, ${employee.company?.name || 'Empresa'})`)
        .join('\n');
    } else if (selectedEmployees.length > 10) {
      employeesInfo = `• ${selectedEmployees.slice(0, 5).map(e => e.name).join(', ')}\n• ... y ${selectedEmployees.length - 5} más empleados`;
    }

    // Crear mensaje de filtros aplicados
    let filtersText = '';
    if (Object.keys(appliedFilters).length > 0) {
      filtersText = '\n\n<strong>Filtros aplicados:</strong>\n' +
        Object.entries(appliedFilters)
          .map(([key, value]) => `• ${key}: ${value}`)
          .join('\n');
    }

    // Mostrar modal de confirmación final
    const result = await Swal.fire({
      title: 'Confirmar Envío Final',
      html: `
        <div style="text-align: left; font-size: 16px; line-height: 1.6;">
          <p style="margin-bottom: 12px;"><strong>¿Está seguro de enviar ${employeeCount} mensaje(s) por ${channel}?</strong></p>
          <p style="margin-bottom: 8px;"><strong>Configuración de envío:</strong></p>
          <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; font-size: 14px; margin-bottom: 8px;">
            • ${config.batchSize} mensajes por bloque<br>
            • ${config.delayBetweenBatches / 1000} segundos entre bloques<br>
            • ${numberOfBatches} bloques totales<br>
            • Tiempo estimado: ${formatTime(totalEstimatedTime)}
          </div>
          <p style="margin-bottom: 8px;"><strong>Destinatarios:</strong></p>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 14px; margin-bottom: 8px; white-space: pre-line;">
            ${employeesInfo}
          </div>
          ${filtersText}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: getChannelColor(channel),
      cancelButtonColor: '#6c757d',
      confirmButtonText: `✅ Sí, enviar ahora`,
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-confirmation'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      // Obtener los IDs de los empleados seleccionados
      const employeeIds = selectedEmployees.map(emp => emp.id);
      
      console.log(`🚀 Enviando mensaje por ${channel} a ${employeeIds.length} empleados:`, employeeIds);
      console.log('💬 Mensaje:', message);
      
      // Enviar el mensaje usando el servicio de comunicación
      let result;
      if (channel === 'WhatsApp') {
        console.log('📱 Llamando a sendWhatsAppMessage...');
        result = await communicationService.sendWhatsAppMessage(employeeIds, message);
      } else if (channel === 'Telegram') {
        console.log('✈️ Llamando a sendTelegramMessage...');
        result = await communicationService.sendTelegramMessage(employeeIds, message);
      } else if (channel === 'SMS') {
        console.log('📱 Llamando a sendSMSMessage...');
        result = await communicationService.sendSMSMessage(employeeIds, message);
      } else if (channel === 'Email') {
        console.log('📧 Llamando a sendEmailMessage...');
        const subject = await Swal.fire({
          title: 'Asunto del Email',
          input: 'text',
          inputLabel: 'Ingrese el asunto del correo electrónico',
          inputValue: 'Mensaje de StaffHub',
          showCancelButton: true,
          confirmButtonText: 'Enviar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#007bff'
        });
        
        if (subject.isConfirmed && subject.value) {
          result = await communicationService.sendEmailMessage(employeeIds, message, subject.value);
        } else {
          setSending(false);
          return;
        }
      }

      console.log('📊 Resultado del envío:', result);

      if (result && result.success) {
        setSent(true);
        const successMsg = result.message || `Mensaje enviado exitosamente a ${selectedEmployees.length} empleados vía ${channel}`;
        setSuccessMessage(successMsg);
        
        // Mostrar toast de éxito con más detalles
        toast.success(successMsg, {
          duration: 4000,
          position: 'top-center'
        });

        // Navegar de vuelta después de un breve delay
        setTimeout(() => {
          console.log('🔄 Navegando de vuelta al dashboard de comunicación...');
          navigate('/communication');
        }, 2000);
      } else {
        console.error('❌ El servicio reportó fallo:', result);
        const errorMsg = result?.error || 'Error desconocido al enviar el mensaje';
        setError(`Error al enviar el mensaje: ${errorMsg}`);
        toast.error(`Error: ${errorMsg}`, {
          duration: 5000,
          position: 'top-center'
        });
      }
    } catch (err) {
      console.error('❌ Error general en handleSendMessage:', err);
      const errorMessage = err.message || 'Error al enviar el mensaje. Por favor, inténtelo de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center'
      });
    } finally {
      setSending(false);
    }
  };

  // Función para obtener el color del canal
  const getChannelColor = (channel) => {
    switch (channel) {
      case 'WhatsApp': return '#25D366';
      case 'Telegram': return '#0088cc';
      case 'SMS': return '#ff6b35';
      case 'Email': return '#007bff';
      default: return '#6c757d';
    }
  };

  // Función para obtener configuración de fallback de la empresa
  const getCompanyFallbackConfig = async () => {
    try {
      // Determinar la empresa principal (la más común entre los empleados seleccionados)
      const companyCounts = {};
      selectedEmployees.forEach(employee => {
        const companyId = employee.company?.id;
        if (companyId) {
          companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
        }
      });

      const primaryCompanyId = Object.keys(companyCounts).reduce((a, b) =>
        companyCounts[a] > companyCounts[b] ? a : b, null
      );

      if (!primaryCompanyId) {
        // Si no hay empresa, usar orden por defecto
        return ['WhatsApp', 'Telegram', 'SMS', 'Email'];
      }

      // Obtener configuración de fallback de la empresa
      const { data: company, error } = await supabase
        .from('companies')
        .select('fallback_config')
        .eq('id', primaryCompanyId)
        .single();

      if (error || !company?.fallback_config?.order) {
        console.warn('No se encontró configuración de fallback, usando orden por defecto');
        return ['WhatsApp', 'Telegram', 'SMS', 'Email'];
      }

      return company.fallback_config.order;
    } catch (error) {
      console.error('Error obteniendo configuración de fallback:', error);
      return ['WhatsApp', 'Telegram', 'SMS', 'Email'];
    }
  };

  // Función para enviar con fallback inteligente
  const handleSendWithFallback = async (primaryChannel = 'WhatsApp') => {
    // Verificar que haya empleados seleccionados
    if (selectedEmployees.length === 0) {
      setError('Debe seleccionar al menos un empleado para enviar mensajes.');
      return;
    }

    if (!message.trim() && !media) {
      setError('Por favor, ingrese un mensaje o adjunte un archivo');
      return;
    }

    if (!canSendMessages()) {
      setError('No tienes permisos para enviar mensajes.');
      return;
    }

    // Obtener configuración de fallback dinámica
    const fallbackOrder = await getCompanyFallbackConfig();
    
    // Asegurar que el canal principal esté primero y eliminar duplicados
    const uniqueChannels = [...new Set([primaryChannel, ...fallbackOrder.filter(ch => ch !== primaryChannel)])];
    
    // Mostrar modal de confirmación para fallback
    const result = await Swal.fire({
      title: '🔄 Envío Inteligente con Fallback',
      html: `
        <div style="text-align: left; font-size: 16px; line-height: 1.6;">
          <p style="margin-bottom: 12px;"><strong>¿Desea enviar con fallback inteligente?</strong></p>
          <p style="margin-bottom: 8px;">El sistema intentará enviar por <strong>${primaryChannel}</strong> primero, y si algún empleado no tiene disponible ese canal, usará automáticamente:</p>
          <div style="background: #f0f8ff; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div style="color: #007bff; font-weight: bold; margin-bottom: 4px;">🔄 Orden de Fallback:</div>
            <div style="font-size: 14px;">
              ${uniqueChannels.join(' → ')}
            </div>
          </div>
          <p style="margin-bottom: 8px;"><strong>Destinatarios:</strong> ${selectedEmployees.length} empleados</p>
          <p style="margin-bottom: 8px;"><strong>Canal principal:</strong> ${primaryChannel}</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: getChannelColor(primaryChannel),
      cancelButtonColor: '#6c757d',
      confirmButtonText: `🚀 Enviar con Fallback`,
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-confirmation'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const employeeIds = selectedEmployees.map(emp => emp.id);
      
      console.log(`🚀 Enviando mensaje con fallback inteligente a ${employeeIds.length} empleados:`, employeeIds);
      console.log('💬 Mensaje:', message);
      console.log('🎯 Canal principal:', primaryChannel);
      console.log('🔄 Orden de fallback:', uniqueChannels);
      
      // Enviar usando el servicio de fallback con orden personalizado
      const fallbackResult = await communicationService.sendWithFallback(
        employeeIds,
        message,
        primaryChannel.toLowerCase(),
        uniqueChannels
      );

      console.log('📊 Resultado del envío con fallback:', fallbackResult);

      if (fallbackResult && fallbackResult.success) {
        setSent(true);
        const successMsg = fallbackResult.message || `Mensaje enviado con fallback a ${selectedEmployees.length} empleados`;
        setSuccessMessage(successMsg);
        
        // Mostrar detalles del envío
        const detailsHtml = fallbackResult.details.map(detail => `
          <div style="margin-bottom: 8px; padding: 8px; background: ${detail.status === 'success' ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
            <strong>${detail.channel}:</strong> ${detail.recipientCount} destinatarios - ${detail.status}
            ${detail.error ? `<br><small>Error: ${detail.error}</small>` : ''}
          </div>
        `).join('');

        Swal.fire({
          title: '✅ Envío con Fallback Completado',
          html: `
            <div style="text-align: left; font-size: 16px; line-height: 1.6;">
              <p style="margin-bottom: 12px;"><strong>${successMsg}</strong></p>
              <p style="margin-bottom: 8px;"><strong>Tasa de éxito:</strong> ${fallbackResult.successRate.toFixed(1)}%</p>
              <p style="margin-bottom: 8px;"><strong>Detalles por canal:</strong></p>
              ${detailsHtml}
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#28a745'
        });

        // Navegar de vuelta después de un breve delay
        setTimeout(() => {
          console.log('🔄 Navegando de vuelta al dashboard de comunicación...');
          navigate('/communication');
        }, 2000);
      } else {
        console.error('❌ El fallback reportó fallo:', fallbackResult);
        const errorMsg = fallbackResult?.error || 'Error desconocido al enviar el mensaje';
        setError(`Error al enviar el mensaje: ${errorMsg}`);
        toast.error(`Error: ${errorMsg}`, {
          duration: 5000,
          position: 'top-center'
        });
      }
    } catch (err) {
      console.error('❌ Error general en handleSendWithFallback:', err);
      const errorMessage = err.message || 'Error al enviar el mensaje. Por favor, inténtelo de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center'
      });
    } finally {
      setSending(false);
    }
  };




  // Componente memoizado para lista de empleados con virtualización
  const EmployeeListItem = React.memo(({ employee, style }) => (
    <div style={style} className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300">
      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">
          {employee.name?.charAt(0) || '?'}
        </span>
      </div>
      <div className="ml-4 min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {employee.name}
        </p>
        <p className="text-xs text-gray-600 truncate">
          {employee.position}
        </p>
        <div className="flex items-center mt-1">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
            {employee.company?.name || 'Empresa'}
          </span>
        </div>
      </div>
      <div className="ml-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  ));

  // Función para manejar cambios en el editor
  const handleEditorChange = (state) => {
    setEditorState(state);
    const contentState = state.getCurrentContent();
    const plainText = contentState.getPlainText();
    setMessage(plainText);
  };

  // Variables dinámicas disponibles para autocompletado
  const variables = useMemo(() => [
    { text: '{{nombre}}', value: '{{nombre}}', description: 'Nombre del empleado' },
    { text: '{{empresa}}', value: '{{empresa}}', description: 'Nombre de la empresa' },
    { text: '{{cargo}}', value: '{{cargo}}', description: 'Cargo del empleado' },
    { text: '{{fecha}}', value: '{{fecha}}', description: 'Fecha actual' },
  ], []);

  const getPersonalizedMessage = () => {
    if (!selectedEmployees.length) return message;
    const employee = selectedEmployees[0];
    return message.replace(/\{\{nombre\}\}/g, employee.name);
  };

  const showPreview = async () => {
    const { value: channel } = await Swal.fire({
      title: 'Seleccionar Canal',
      input: 'select',
      inputOptions: {
        whatsapp: 'WhatsApp',
        telegram: 'Telegram'
      },
      inputPlaceholder: 'Elige el canal',
      showCancelButton: true,
      confirmButtonText: 'Ver Vista Previa',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#25D366',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes seleccionar un canal';
        }
      }
    });

    if (channel) {
      if (channel === 'whatsapp') {
        showWhatsAppPreview();
      } else if (channel === 'telegram') {
        showTelegramPreview();
      }
    }
  };

  const showWhatsAppPreview = () => {
    const personalizedMessage = getPersonalizedMessage();
    const employee = selectedEmployees[0];

    let mediaHtml = '';
    if (media) {
      if (mediaType === 'image') {
        mediaHtml = `<img src="${URL.createObjectURL(media)}" alt="Imagen adjunta" style="max-width: 180px; max-height: 180px; border-radius: 8px; margin-bottom: 8px;">`;
      } else if (mediaType === 'video') {
        mediaHtml = `<video controls style="max-width: 180px; max-height: 180px; border-radius: 8px; margin-bottom: 8px;"><source src="${URL.createObjectURL(media)}" type="${media.type}"></video>`;
      } else {
        mediaHtml = `<div style="background: #f0f0f0; padding: 8px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">📎</span>
          <span style="font-size: 12px;">${media.name}</span>
        </div>`;
      }
    }

    const html = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 600px;">
        <!-- iPhone Frame -->
        <div style="position: relative; width: 320px; height: 568px; background: #000; border-radius: 36px; padding: 12px; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
          <!-- Notch -->
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 160px; height: 30px; background: #000; border-radius: 0 0 20px 20px; z-index: 10;"></div>

          <!-- Screen -->
          <div style="width: 100%; height: 100%; background: #f8f8f8; border-radius: 24px; overflow: hidden; position: relative; display: flex; flex-direction: column;">
            <!-- Status Bar -->
            <div style="height: 44px; background: #f8f8f8; display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 14px; color: #333;">
              <span>9:41</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span>📶</span><span>📶</span><span>🔋</span>
              </div>
            </div>

            <!-- WhatsApp Header -->
            <div style="height: 56px; background: #075e54; display: flex; align-items: center; padding: 0 16px; color: white;">
              <div style="width: 32px; height: 32px; background: #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">
                ${employee?.name?.charAt(0) || '👤'}
              </div>
              <div style="flex: 1;">
                <div style="font-size: 16px; font-weight: 600;">${employee?.name || 'Empleado'}</div>
                <div style="font-size: 12px; opacity: 0.8;">en línea</div>
              </div>
              <div style="display: flex; gap: 16px;">
                <span>📞</span><span>📹</span><span>ℹ️</span>
              </div>
            </div>

            <!-- Chat Area -->
            <div style="flex: 1; background: #e5ddd5; padding: 16px; display: flex; flex-direction: column; overflow-y: auto; min-height: 300px;">
              <!-- Message Bubble (mensaje del usuario) -->
              <div style="align-self: flex-end; max-width: 70%; margin-bottom: 8px;">
                <div style="background: #dcf8c6; padding: 8px 12px; border-radius: 8px 8px 4px 8px; position: relative;">
                  ${mediaHtml}
                  <div style="font-size: 14px; line-height: 1.4; white-space: pre-wrap; color: #303030;">${personalizedMessage}</div>
                  <div style="font-size: 11px; color: #666; text-align: right; margin-top: 4px;">12:34 ✓✓</div>
                </div>
              </div>

              <!-- Espacio vacío abajo para que los mensajes queden arriba -->
              <div style="flex: 1;"></div>
            </div>

            <!-- Input Area -->
            <div style="height: 56px; background: #f0f0f0; display: flex; align-items: center; padding: 0 16px; border-top: 1px solid #ddd; position: absolute; bottom: 0; left: 0; right: 0;">
              <div style="flex: 1; background: white; border-radius: 20px; padding: 8px 16px; margin-right: 8px; font-size: 14px; color: #666;">
                Escribe un mensaje...
              </div>
              <div style="width: 32px; height: 32px; background: #25d366; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 16px;">➤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Vista Previa - WhatsApp',
      html: html,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: 'swal-iphone'
      },
      width: 'auto'
    });
  };

  const showTelegramPreview = () => {
    const personalizedMessage = getPersonalizedMessage();
    const employee = selectedEmployees[0];

    let mediaHtml = '';
    if (media) {
      if (mediaType === 'image') {
        mediaHtml = `<img src="${URL.createObjectURL(media)}" alt="Imagen adjunta" style="max-width: 180px; max-height: 180px; border-radius: 8px; margin-bottom: 8px;">`;
      } else if (mediaType === 'video') {
        mediaHtml = `<video controls style="max-width: 180px; max-height: 180px; border-radius: 8px; margin-bottom: 8px;"><source src="${URL.createObjectURL(media)}" type="${media.type}"></video>`;
      } else {
        mediaHtml = `<div style="background: #f0f0f0; padding: 8px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">📎</span>
          <span style="font-size: 12px;">${media.name}</span>
        </div>`;
      }
    }

    const html = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 600px;">
        <!-- iPhone Frame -->
        <div style="position: relative; width: 320px; height: 568px; background: #000; border-radius: 36px; padding: 12px; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
          <!-- Notch -->
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 160px; height: 30px; background: #000; border-radius: 0 0 20px 20px; z-index: 10;"></div>

          <!-- Screen -->
          <div style="width: 100%; height: 100%; background: #f8f8f8; border-radius: 24px; overflow: hidden; position: relative; display: flex; flex-direction: column;">
            <!-- Status Bar -->
            <div style="height: 44px; background: #f8f8f8; display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 14px; color: #333;">
              <span>9:41</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span>📶</span><span>📶</span><span>🔋</span>
              </div>
            </div>

            <!-- Telegram Header -->
            <div style="height: 56px; background: #0088cc; display: flex; align-items: center; padding: 0 16px; color: white;">
              <div style="width: 32px; height: 32px; background: #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">
                ${employee?.name?.charAt(0) || '👤'}
              </div>
              <div style="flex: 1;">
                <div style="font-size: 16px; font-weight: 600;">${employee?.name || 'Empleado'}</div>
                <div style="font-size: 12px; opacity: 0.8;">en línea</div>
              </div>
              <div style="display: flex; gap: 16px;">
                <span>📞</span><span>📹</span><span>ℹ️</span>
              </div>
            </div>

            <!-- Chat Area -->
            <div style="flex: 1; background: #ffffff; padding: 16px; display: flex; flex-direction: column; overflow-y: auto; min-height: 300px;">
              <!-- Message Bubble (mensaje del usuario) -->
              <div style="align-self: flex-end; max-width: 70%; margin-bottom: 8px;">
                <div style="background: #0088cc; color: white; padding: 8px 12px; border-radius: 8px 8px 4px 8px; position: relative;">
                  ${mediaHtml}
                  <div style="font-size: 14px; line-height: 1.4; white-space: pre-wrap;">${personalizedMessage}</div>
                  <div style="font-size: 11px; opacity: 0.8; text-align: right; margin-top: 4px;">12:34 ✓✓</div>
                </div>
              </div>

              <!-- Espacio vacío abajo para que los mensajes queden arriba -->
              <div style="flex: 1;"></div>
            </div>

            <!-- Input Area -->
            <div style="height: 56px; background: #f8f8f8; display: flex; align-items: center; padding: 0 16px; border-top: 1px solid #e0e0e0; position: absolute; bottom: 0; left: 0; right: 0;">
              <div style="flex: 1; background: white; border-radius: 20px; padding: 8px 16px; margin-right: 8px; font-size: 14px; color: #666; border: 1px solid #e0e0e0;">
                Escribe un mensaje...
              </div>
              <div style="width: 32px; height: 32px; background: #0088cc; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 16px;">➤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Vista Previa - Telegram',
      html: html,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: 'swal-iphone'
      },
      width: 'auto'
    });
  };

  // Función para programar envío
  const scheduleMessage = async () => {
    if (!message.trim() && !media) {
      setError('Por favor, ingrese un mensaje o adjunte un archivo para programar');
      return;
    }

    if (!canSendMessages()) {
      setError('No tienes permisos para programar mensajes.');
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: '📅 Programar Envío',
      html: `
        <div style="text-align: left; padding: 10px 0;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px; color: #374151;">📆 Fecha y Hora:</label>
            <input type="datetime-local" id="schedule-datetime" class="swal2-input" style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 6px;" min="${new Date().toISOString().slice(0, 16)}">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px; color: #374151;">🏷️ Título:</label>
            <input type="text" id="schedule-title" class="swal2-input" style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 6px;" placeholder="Ej: Recordatorio semanal">
          </div>
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px; color: #374151;">📱 Canal:</label>
            <select id="schedule-channel" class="swal2-select" style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 6px; background: white;">
              <option value="whatsapp">📱 WhatsApp</option>
              <option value="telegram">✈️ Telegram</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const datetime = document.getElementById('schedule-datetime').value;
        const title = document.getElementById('schedule-title').value;
        const channel = document.getElementById('schedule-channel').value;

        if (!datetime) {
          Swal.showValidationMessage('⚠️ Debes seleccionar fecha y hora');
          return false;
        }

        if (!title.trim()) {
          Swal.showValidationMessage('⚠️ Debes ingresar un título');
          return false;
        }

        return { datetime, title, channel };
      },
      showCancelButton: true,
      confirmButtonText: '⏰ Programar Envío',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      width: 500,
      padding: '20px'
    });

    if (formValues) {
      // Simular programación del mensaje
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`Mensaje programado para ${new Date(formValues.datetime).toLocaleString('es-ES')}`);
    }
  };

  // Función para guardar como borrador
  const handleSaveDraft = async () => {
    if (!message.trim() && !media) {
      setError('Por favor, ingrese un mensaje o adjunte un archivo para guardar como borrador');
      return;
    }

    if (!user) {
      setError('Debes estar autenticado para guardar borradores');
      return;
    }

    const { value: draftTitle } = await Swal.fire({
      title: '💾 Guardar como Borrador',
      input: 'text',
      inputLabel: 'Título del borrador',
      inputPlaceholder: 'Ej: Recordatorio semanal de equipo',
      inputValidator: (value) => {
        if (!value?.trim()) {
          return 'Debes ingresar un título para el borrador';
        }
      },
      showCancelButton: true,
      confirmButtonText: '💾 Guardar Borrador',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#6b7280',
      inputAttributes: {
        maxlength: 100
      }
    });

    if (!draftTitle) return;

    setSavingDraft(true);
    setError('');
    setSuccessMessage('');

    try {
      // Determinar la empresa principal (la más común entre los empleados seleccionados)
      const companyCounts = {};
      selectedEmployees.forEach(employee => {
        const companyId = employee.company?.id;
        if (companyId) {
          companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
        }
      });

      const primaryCompanyId = Object.keys(companyCounts).reduce((a, b) =>
        companyCounts[a] > companyCounts[b] ? a : b, null
      );

      // Preparar datos del borrador
      const draftData = {
        title: draftTitle.trim(),
        message: message.trim(),
        selectedEmployeeIds: selectedEmployees.map(emp => emp.id),
        filters: location.state?.filters || {},
        company: primaryCompanyId ? { id: primaryCompanyId, name: selectedEmployees.find(emp => emp.company?.id === primaryCompanyId)?.company?.name } : null,
        media: media ? {
          name: media.name,
          type: mediaType,
          url: URL.createObjectURL(media) // En producción, subir a storage
        } : null,
        createdBy: user.id
      };

      // Guardar el borrador
      await inMemoryDraftService.createDraft(draftData);

      setSuccessMessage(`Borrador "${draftTitle}" guardado exitosamente`);

      // Mostrar confirmación
      setTimeout(() => {
        Swal.fire({
          title: '✅ Borrador Guardado',
          text: `Tu borrador "${draftTitle}" ha sido guardado y puedes acceder a él desde el panel de borradores.`,
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#10b981'
        });
      }, 1000);

    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Error al guardar el borrador. Por favor, inténtelo de nuevo.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Función para crear evento en Google Calendar
  const createGoogleCalendarEvent = async (eventData, userId) => {
    try {
      // Obtener credenciales del usuario
      const { data: credentials, error } = await supabase
        .from('user_credentials')
        .select('google_access_token, google_refresh_token')
        .eq('user_id', userId)
        .single();

      if (error || !credentials?.google_access_token) {
        console.error('❌ No se encontraron credenciales de Google para el usuario');
        return null;
      }

      // Obtener calendario principal del usuario
      const calendarId = 'primary'; // Usar calendario principal por defecto

      // Preparar datos del evento para Google Calendar
      const googleEvent = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: new Date(eventData.datetime).toISOString(),
          timeZone: 'America/Santiago'
        },
        end: {
          dateTime: new Date(new Date(eventData.datetime).getTime() + 60 * 60 * 1000).toISOString(), // 1 hora por defecto
          timeZone: 'America/Santiago'
        },
        location: eventData.location || '',
        attendees: [], // Los empleados serán invitados por WhatsApp, no por calendario
        reminders: {
          useDefault: true
        }
      };

      // Si es Google Meet, agregar configuración de videollamada
      if (eventData.platform === 'google-meet') {
        googleEvent.conferenceData = {
          createRequest: {
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            },
            requestId: `meet-${Date.now()}`
          }
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.google_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googleEvent)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error creando evento en Google Calendar:', errorData);
        return null;
      }

      const createdEvent = await response.json();
      console.log('✅ Evento creado en Google Calendar:', createdEvent.id);

      return {
        eventId: createdEvent.id,
        calendarId: calendarId,
        platform: 'google-calendar',
        meetLink: createdEvent.hangoutLink || null
      };

    } catch (error) {
      console.error('❌ Error creando evento en Google Calendar:', error);
      return null;
    }
  };

  // Función para crear evento en Microsoft 365
  const createMicrosoft365Event = async (eventData, userId) => {
    try {
      // Obtener credenciales del usuario
      const { data: credentials, error } = await supabase
        .from('user_credentials')
        .select('microsoft_access_token')
        .eq('user_id', userId)
        .single();

      if (error || !credentials?.microsoft_access_token) {
        console.error('❌ No se encontraron credenciales de Microsoft para el usuario');
        return null;
      }

      // Preparar datos del evento para Microsoft Graph
      const microsoftEvent = {
        subject: eventData.title,
        body: {
          contentType: 'text',
          content: eventData.description
        },
        start: {
          dateTime: new Date(eventData.datetime).toISOString(),
          timeZone: 'Pacific SA Standard Time'
        },
        end: {
          dateTime: new Date(new Date(eventData.datetime).getTime() + 60 * 60 * 1000).toISOString(), // 1 hora por defecto
          timeZone: 'Pacific SA Standard Time'
        },
        location: {
          displayName: eventData.location || 'Ubicación por confirmar'
        },
        attendees: [], // Los empleados serán invitados por WhatsApp, no por calendario
        isOnlineMeeting: eventData.platform === 'microsoft-teams',
        onlineMeetingProvider: eventData.platform === 'microsoft-teams' ? 'teamsForBusiness' : null
      };

      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.microsoft_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(microsoftEvent)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error creando evento en Microsoft 365:', errorData);
        return null;
      }

      const createdEvent = await response.json();
      console.log('✅ Evento creado en Microsoft 365:', createdEvent.id);

      return {
        eventId: createdEvent.id,
        calendarId: 'primary',
        platform: 'microsoft-365',
        meetLink: createdEvent.onlineMeetingUrl || null
      };

    } catch (error) {
      console.error('❌ Error creando evento en Microsoft 365:', error);
      return null;
    }
  };

  // Función para enviar agendas de citas
  const sendAppointmentAgenda = async () => {
    const { value: formValues } = await Swal.fire({
      title: '',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <!-- Header con colores del sistema -->
          <div style="background: linear-gradient(135deg, #0693e3 0%, #fcb900 100%); color: white; padding: 24px; text-align: center;">
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">📅 Agendar Nueva Reunión</h2>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Integra calendario y videollamada automáticamente</p>
          </div>

          <!-- Formulario en layout horizontal -->
          <div style="padding: 32px;">

            <!-- Primera fila: Título y Fecha/Hora -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div>
                <label for="appointment-title" style="display: block; font-weight: 600; font-size: 14px; color: #0693e3; margin-bottom: 8px;">Título de la reunión</label>
                <input type="text" id="appointment-title" class="swal2-input" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; transition: border-color 0.2s;" placeholder="Ingrese el título de la reunión">
              </div>
              <div>
                <label for="appointment-datetime" style="display: block; font-weight: 600; font-size: 14px; color: #0693e3; margin-bottom: 8px;">Fecha y hora</label>
                <input type="datetime-local" id="appointment-datetime" class="swal2-input" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; transition: border-color 0.2s;" min="${new Date().toISOString().slice(0, 16)}">
              </div>
            </div>

            <!-- Segunda fila: Calendario y Ubicación -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div>
                <label for="appointment-calendar" style="display: block; font-weight: 600; font-size: 14px; color: #0693e3; margin-bottom: 8px;">Plataforma de calendario</label>
                <select id="appointment-calendar" class="swal2-select" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; transition: border-color 0.2s;" onchange="updateVideoPlatform()">
                  <option value="">Seleccionar calendario</option>
                  <option value="google-calendar">🌐 Google Calendar</option>
                  <option value="microsoft-365">🏢 Microsoft 365</option>
                </select>
              </div>
              <div>
                <label for="appointment-location" style="display: block; font-weight: 600; font-size: 14px; color: #0693e3; margin-bottom: 8px;">Ubicación (opcional)</label>
                <input type="text" id="appointment-location" class="swal2-input" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; transition: border-color 0.2s;" placeholder="Sala de reuniones, dirección, etc.">
              </div>
            </div>

            <!-- Tercera fila: Videollamada y Canal -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div>
                <label for="appointment-platform" style="display: block; font-weight: 600; font-size: 14px; color: #0693e3; margin-bottom: 8px;">Videollamada</label>
                <select id="appointment-platform" class="swal2-select" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; transition: border-color 0.2s;">
                  <option value="">Seleccionar plataforma</option>
                  <option value="google-meet">📹 Google Meet</option>
                  <option value="microsoft-teams">👥 Microsoft Teams</option>
                  <option value="zoom">🔍 Zoom</option>
                  <option value="presencial">🏢 Presencial</option>
                </select>
                <div style="margin-top: 6px; font-size: 12px; color: #6b7280;">Se selecciona automáticamente según el calendario</div>
              </div>
              <div>
                <label for="appointment-channel" style="display: block; font-weight: 600; font-size: 14px; color: #0693e3; margin-bottom: 8px;">Canal de envío</label>
                <select id="appointment-channel" class="swal2-select" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; transition: border-color 0.2s;">
                  <option value="">Seleccionar canal</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="telegram">✈️ Telegram</option>
                </select>
              </div>
            </div>

            <!-- Descripción completa -->
            <div style="margin-bottom: 24px;">
              <label for="appointment-description" style="display: block; font-weight: 600; font-size: 14px; color: #0693e3; margin-bottom: 8px;">Descripción y agenda</label>
              <textarea id="appointment-description" class="swal2-textarea" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 2px solid #e5e7eb; border-radius: 8px; min-height: 100px; background: white; resize: vertical; transition: border-color 0.2s;" placeholder="Describa el propósito de la reunión, temas a tratar, objetivos esperados..."></textarea>
            </div>

            <!-- Información importante con colores del sistema -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcb900 100%); border: 2px solid #fcb900; border-radius: 8px; padding: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="background: #0693e3; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 12px;">ℹ️ INFO</span>
                <strong style="font-size: 16px; color: #92400e;">Información importante</strong>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; border-left: 4px solid #0693e3;">
                  <div style="font-weight: 600; color: #0693e3; font-size: 14px; margin-bottom: 4px;">📅 Evento real</div>
                  <div style="font-size: 13px; color: #78350f;">Se creará un evento real en el calendario seleccionado</div>
                </div>
                <div style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; border-left: 4px solid #fcb900;">
                  <div style="font-weight: 600; color: #fcb900; font-size: 14px; margin-bottom: 4px;">📱 Notificaciones</div>
                  <div style="font-size: 13px; color: #78350f;">Los empleados recibirán recordatorios automáticos</div>
                </div>
                <div style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; border-left: 4px solid #10b981;">
                  <div style="font-weight: 600; color: #10b981; font-size: 14px; margin-bottom: 4px;">🎥 Videollamada</div>
                  <div style="font-size: 13px; color: #78350f;">Los enlaces serán funcionales inmediatamente</div>
                </div>
                <div style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
                  <div style="font-weight: 600; color: #8b5cf6; font-size: 14px; margin-bottom: 4px;">⚡ Automático</div>
                  <div style="font-size: 13px; color: #78350f;">El proceso es completamente automatizado</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <script>
          function updateVideoPlatform() {
            const calendarSelect = document.getElementById('appointment-calendar');
            const platformSelect = document.getElementById('appointment-platform');            if (selectedCalendar === 'google-calendar') {
              platformSelect.value = 'google-meet';
            } else if (selectedCalendar === 'microsoft-365') {
              platformSelect.value = 'microsoft-teams';
            }
          }

          // Add focus effects
          document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('.swal2-input, .swal2-select, .swal2-textarea');
            inputs.forEach(input => {
              input.addEventListener('focus', function() {
                this.style.borderColor = '#3b82f6';
                this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              });
              input.addEventListener('blur', function() {
                this.style.borderColor = '#e5e7eb';
                this.style.boxShadow = 'none';
              });
            });
          });

          // Initialize
          updateVideoPlatform();
        </script>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const title = document.getElementById('appointment-title').value;
        const datetime = document.getElementById('appointment-datetime').value;
        const calendar = document.getElementById('appointment-calendar').value;
        const location = document.getElementById('appointment-location').value;
        const platform = document.getElementById('appointment-platform').value;
        const description = document.getElementById('appointment-description').value;
        const channel = document.getElementById('appointment-channel').value;

        if (!title.trim()) {
          Swal.showValidationMessage('Debes ingresar un título para la reunión');
          return false;
        }

        if (!datetime) {
          Swal.showValidationMessage('Debes seleccionar fecha y hora');
          return false;
        }

        if (!description.trim()) {
          Swal.showValidationMessage('Debes ingresar una descripción de la reunión');
          return false;
        }

        return { title, datetime, calendar, location, platform, description, channel };
      },
      showCancelButton: true,
      confirmButtonText: '🚀 Crear y Enviar Agenda',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      width: 950,
      padding: '0',
      customClass: {
        popup: 'appointment-modal',
        title: 'appointment-title'
      },
      showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster'
      }
    });

    if (formValues) {
      // Crear evento en el calendario seleccionado
      let calendarEvent = null;
      let meetingLink = '';
      let platformName = '';
      let calendarName = '';

      // Determinar nombre del calendario
      switch (formValues.calendar) {
        case 'google-calendar':
          calendarName = 'Google Calendar';
          break;
        case 'microsoft-365':
          calendarName = 'Microsoft 365';
          break;
        default:
          console.warn('Calendario no reconocido:', formValues.calendar);
          calendarName = 'Calendario no especificado';
          break;
      }

      // Crear evento en el calendario correspondiente
      try {
        if (formValues.calendar === 'google-calendar') {
          calendarEvent = await createGoogleCalendarEvent(formValues, user.id);
        } else if (formValues.calendar === 'microsoft-365') {
          calendarEvent = await createMicrosoft365Event(formValues, user.id);
        }

        if (calendarEvent) {
          console.log('✅ Evento creado en calendario:', calendarEvent);
          // Usar el link real de videollamada si está disponible
          if (calendarEvent.meetLink) {
            meetingLink = calendarEvent.meetLink;
          }
        }
      } catch (calendarError) {
        console.error('❌ Error creando evento en calendario:', calendarError);
        // Continuar con el envío de WhatsApp aunque falle la creación del calendario
      }

      // Si no se pudo crear el evento en calendario, generar link simulado
      if (!meetingLink) {
        switch (formValues.platform) {
          case 'google-meet':
            meetingLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;
            platformName = 'Google Meet';
            break;
          case 'microsoft-teams':
            meetingLink = `https://teams.microsoft.com/l/meetup-join/${Math.random().toString(36).substring(2, 15)}`;
            platformName = 'Microsoft Teams';
            break;
          case 'zoom':
            meetingLink = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`;
            platformName = 'Zoom';
            break;
          case 'presencial':
            meetingLink = formValues.location || 'Ubicación por confirmar';
            platformName = 'Presencial';
            break;
          default:
            console.warn('Plataforma no reconocida:', formValues.platform);
            meetingLink = formValues.location || 'Ubicación por confirmar';
            platformName = 'Presencial';
            break;
        }
      } else {
        // Determinar nombre de plataforma basado en el link real
        if (meetingLink.includes('meet.google.com')) {
          platformName = 'Google Meet';
        } else if (meetingLink.includes('teams.microsoft.com')) {
          platformName = 'Microsoft Teams';
        } else {
          platformName = formValues.platform === 'presencial' ? 'Presencial' : 'Videollamada';
        }
      }

      // Crear mensaje de agenda
      const appointmentDate = new Date(formValues.datetime);
      const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const agendaMessageText = `*Título:* ${formValues.title}\n` +
        `*Fecha:* ${formattedDate}\n` +
        `*Hora:* ${formattedTime}\n` +
        `*Calendario:* ${calendarName}\n` +
        (formValues.location && formValues.platform !== 'presencial' ? `*Ubicación:* ${formValues.location}\n` : '') +
        `*Plataforma:* ${platformName}\n` +
        (formValues.platform !== 'presencial' ? `*Link de reunión:* ${meetingLink}\n\n` : `*Lugar:* ${meetingLink}\n\n`) +
        `*Descripción:*\n${formValues.description}\n\n` +
        `*Recordatorio:* Se enviará un recordatorio 15 minutos antes de la reunión.\n\n` +
        `*Confirmación:* Por favor confirma tu asistencia respondiendo a este mensaje.`;

      console.log('📅 Mensaje de agenda generado:', agendaMessageText);

      // Enviar el mensaje
      setSending(true);
      setError('');
      setSuccessMessage('');

      try {
        // Simular envío de mensaje
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSent(true);
        const calendarStatus = calendarEvent ? ' (evento creado en calendario)' : ' (sin evento en calendario)';
        setSuccessMessage(`Agenda de cita enviada exitosamente a ${selectedEmployees.length} empleados vía ${formValues.channel}${calendarStatus}`);

        // Mostrar confirmación detallada
        setTimeout(() => {
          const calendarStatus = calendarEvent
            ? `<p style="color: #10b981; font-size: 14px;">✅ Evento creado en ${calendarName}</p>`
            : `<p style="color: #f59e0b; font-size: 14px;">⚠️ Evento no creado en calendario (continúa funcionando)</p>`;

          Swal.fire({
            title: '✅ Agenda Enviada',
            html: `
              <div style="text-align: left;">
                <p><strong>Cita:</strong> ${formValues.title}</p>
                <p><strong>Fecha:</strong> ${formattedDate} a las ${formattedTime}</p>
                <p><strong>Calendario:</strong> ${calendarName}</p>
                <p><strong>Plataforma:</strong> ${platformName}</p>
                <p><strong>Destinatarios:</strong> ${selectedEmployees.length} empleados</p>
                <p><strong>Canal:</strong> ${formValues.channel}</p>
                ${formValues.platform !== 'presencial' ? `<p><strong>Link:</strong> <a href="${meetingLink}" target="_blank" style="color: #10b981;">${meetingLink}</a></p>` : ''}
                ${calendarStatus}
                <br>
                <p style="color: #6b7280; font-size: 14px;">Los empleados recibirán recordatorios automáticos antes de la reunión.</p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Entendido'
          });
        }, 1000);

      } catch (err) {
        setError('Error al enviar la agenda. Por favor, inténtelo de nuevo.');
      } finally {
        setSending(false);
      }
    }
  };

  // Función para mostrar análisis y reportes
  const showAnalytics = () => {
    const mockAnalytics = {
      totalSent: 1247,
      delivered: 1189,
      read: 892,
      responses: 156,
      avgResponseTime: '2.3 horas',
      topPerformingTemplates: [
        { name: 'Recordatorio de reunión', sent: 234, responseRate: 68 },
        { name: 'Actualización de políticas', sent: 189, responseRate: 72 },
        { name: 'Felicitaciones', sent: 156, responseRate: 85 }
      ]
    };

    const html = `
      <div style="max-width: 600px; margin: 0 auto;">
        <!-- Métricas principales -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">${mockAnalytics.totalSent}</div>
            <div style="font-size: 14px; opacity: 0.9;">Mensajes Enviados</div>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">${Math.round((mockAnalytics.responses / mockAnalytics.totalSent) * 100)}%</div>
            <div style="font-size: 14px; opacity: 0.9;">Tasa de Respuesta</div>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">${mockAnalytics.avgResponseTime}</div>
            <div style="font-size: 14px; opacity: 0.9;">Tiempo Promedio</div>
          </div>
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">${mockAnalytics.responses}</div>
            <div style="font-size: 14px; opacity: 0.9;">Respuestas</div>
          </div>
        </div>

        <!-- Plantillas más efectivas -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">📊 Plantillas Más Efectivas</h3>
          ${mockAnalytics.topPerformingTemplates.map(template => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px;">
              <div>
                <div style="font-weight: 600; color: #333;">${template.name}</div>
                <div style="font-size: 12px; color: #666;">${template.sent} envíos</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 20px; font-weight: bold; color: #28a745;">${template.responseRate}%</div>
                <div style="font-size: 12px; color: #666;">tasa respuesta</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Gráfico simple -->
        <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e9ecef;">
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">📈 Tendencia Mensual</h3>
          <div style="height: 120px; display: flex; align-items: end; justify-content: space-between; gap: 8px;">
            ${[65, 78, 82, 75, 88, 92, 85].map((height, index) => `
              <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                <div style="width: 100%; height: ${height}px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px 4px 0 0; margin-bottom: 4px;"></div>
                <div style="font-size: 10px; color: #666;">${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'][index]}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: '📊 Análisis y Reportes',
      html: html,
      showConfirmButton: false,
      showCloseButton: true,
      width: '800px',
      customClass: {
        popup: 'swal-analytics'
      }
    });
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Mensaje Enviado!</h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSent(false);
                setMessage('');
                setMedia(null);
                setMediaType('');
              }}
              className="w-full px-4 py-2 bg-engage-blue hover:bg-engage-yellow text-white font-bold rounded-lg transition-all duration-300"
            >
              Enviar otro mensaje
            </button>
            <button
              onClick={() => navigate('/base-de-datos')}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-all duration-300"
            >
              Volver a la base de datos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Moderno */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-3">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <PaperAirplaneIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-1">
                  Centro de Mensajes
                </h1>
                <div className="h-1 w-20 bg-white/30 rounded-full"></div>
              </div>
            </div>
            <p className="text-green-100 text-lg font-medium">
              Gestiona y envía mensajes personalizados a tus empleados
            </p>
            <div className="flex items-center mt-4 text-sm text-green-200">
              <div className="flex items-center mr-6">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                {selectedEmployees.length} empleados seleccionados
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                {canSendMessages() ? 'Permisos completos' : 'Sin permisos'}
              </div>
            </div>
          </div>
          {/* Elementos decorativos */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Contenido de envío de mensajes */}
        <div className="space-y-8">
          {/* Destinatarios a lo ancho */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Destinatarios</h2>
                <p className="text-sm text-gray-600">{selectedEmployees.length} empleados</p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {selectedEmployees.length > 0 ? (
                selectedEmployees.length > 50 ? (
                  // Virtualización para listas grandes
                  <List
                    height={384}
                    itemCount={selectedEmployees.length}
                    itemSize={100}
                    itemData={selectedEmployees}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    {({ index, style, data }) => (
                      <div style={style} className="p-2">
                        <EmployeeListItem
                          employee={data[index]}
                        />
                      </div>
                    )}
                  </List>
                ) : (
                  // Lista normal para listas pequeñas
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">
                            {employee.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {employee.position}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              {employee.company?.name || 'Empresa'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg font-medium">No hay empleados seleccionados</p>
                  <p className="text-sm mt-1">Selecciona empleados desde la base de datos</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel de envío de mensajes a lo ancho */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
            <div className="flex items-center mb-8">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Crear Mensaje</h2>
                <p className="text-sm text-gray-600">Personaliza tu mensaje para los destinatarios</p>
              </div>
            </div>

            {/* Selector de plantillas */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Plantillas de Mensaje
                </label>
                <a
                  href="/communication/templates"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gestionar Plantillas →
                </a>
              </div>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Seleccionar una plantilla...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'})
                  </option>
                ))}
                <option value="manage-notifications" disabled style={{fontWeight: 'bold', color: '#7c3aed'}}>
                  ──────────────────
                </option>
                <option value="manage-notifications" style={{fontWeight: 'bold', color: '#7c3aed'}}>
                  🔔 Gestionar Notificaciones y Actualizaciones
                </option>
              </select>
            </div>

            {/* Área de texto para el mensaje con editor avanzado */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Contenido del Mensaje
              </label>
              <div className="relative">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <Editor
                    editorState={editorState}
                    onEditorStateChange={handleEditorChange}
                    toolbar={{
                      options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'emoji'],
                      inline: {
                        options: ['bold', 'italic', 'underline', 'strikethrough']
                      },
                      blockType: {
                        options: ['Normal', 'H1', 'H2', 'H3', 'Blockquote']
                      },
                      fontSize: {
                        options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96]
                      },
                      list: {
                        options: ['unordered', 'ordered']
                      },
                      textAlign: {
                        options: ['left', 'center', 'right', 'justify']
                      },
                      link: {
                        options: ['link', 'unlink']
                      }
                    }}
                    placeholder="Escribe tu mensaje personalizado aquí... Usa {{nombre}} para personalizar con el nombre del empleado."
                    wrapperClassName="wrapper-class"
                    editorClassName="editor-class px-4 py-3 min-h-[200px] bg-gray-50 focus-within:bg-white transition-colors"
                    toolbarClassName="toolbar-class border-b border-gray-200 bg-white px-3 py-2"
                  />
                </div>
                <div className="absolute bottom-3 right-3 flex items-center space-x-4 text-xs text-gray-500 bg-white px-3 py-1 rounded-lg shadow-sm">
                  <span className={`${message.length > 900 ? 'text-red-500 font-medium' : ''}`}>
                    {message.length}/1000 caracteres
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className={`${Math.ceil(message.length / 160) > 5 ? 'text-orange-500 font-medium' : ''}`}>
                    {Math.ceil(message.length / 160)} mensajes
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Variables disponibles: </span>
                  {variables.map((variable, index) => (
                    <button
                      key={variable.text}
                      onClick={() => {
                        // Insertar variable al final del mensaje actual
                        const currentText = message;
                        const newText = currentText + variable.value;
                        setMessage(newText);

                        // Actualizar el editor state
                        const contentState = ContentState.createFromText(newText);
                        setEditorState(EditorState.createWithContent(contentState));
                      }}
                      className="ml-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-mono transition-colors"
                      title={variable.description}
                    >
                      {variable.text}
                    </button>
                  ))}
                </div>
                <button
                  onClick={showPreview}
                  disabled={!message.trim() && !media}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors flex items-center ${
                    !message.trim() && !media
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                  }`}
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  Vista Previa
                </button>
              </div>
            </div>


            {/* Botones de acciones */}
            <div className="flex flex-col gap-6">
              {/* Botones principales */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft || (!message.trim() && !media)}
                  className={`flex items-center justify-center px-6 py-3 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    savingDraft || (!message.trim() && !media)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
                  }`}
                >
                  {savingDraft ? (
                    <div>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-bold">Guardando...</span>
                    </div>
                  ) : (
                    <React.Fragment>
                      <DocumentTextIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-bold">Guardar Borrador</div>
                        <div className="text-xs opacity-90">Guardar para después</div>
                      </div>
                    </React.Fragment>
                  )}
                </button>

                <button
                  onClick={sendAppointmentAgenda}
                  disabled={selectedEmployees.length === 0}
                  className={`flex items-center justify-center px-6 py-3 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    selectedEmployees.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-sm font-bold">Agenda de Cita</div>
                    <div className="text-xs opacity-90">Videollamada integrada</div>
                  </div>
                </button>

                <button
                  onClick={scheduleMessage}
                  disabled={!message.trim() && !media}
                  className={`flex items-center justify-center px-6 py-3 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    !message.trim() && !media
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                  }`}
                >
                  <ClockIcon className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="text-sm font-bold">Programar</div>
                    <div className="text-xs opacity-90">Envío automático</div>
                  </div>
                </button>

                <button
                  onClick={showAnalytics}
                  className="flex items-center justify-center px-6 py-3 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
                >
                  <ChartBarIcon className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="text-sm font-bold">Analytics</div>
                    <div className="text-xs opacity-90">Ver estadísticas</div>
                  </div>
                </button>
              </div>

              {/* Botones de envío */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleSendMessage('WhatsApp')}
                  disabled={sending || selectedEmployees.length === 0}
                  className={`flex items-center justify-center px-6 py-4 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    sending || selectedEmployees.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  }`}
                >
                  {sending ? (
                    <div>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Enviando...</span>
                    </div>
                  ) : (
                    <React.Fragment>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <div className="text-left">
                        <div className="text-sm font-bold">WhatsApp</div>
                        <div className="text-xs opacity-90">Instantáneo</div>
                      </div>
                    </React.Fragment>
                  )}
                </button>

                <button
                  onClick={() => handleSendMessage('Telegram')}
                  disabled={sending || selectedEmployees.length === 0}
                  className={`flex items-center justify-center px-6 py-4 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    sending || selectedEmployees.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  }`}
                >
                  {sending ? (
                    <div>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Enviando...</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.788-1.48-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <div className="text-left">
                        <div className="text-sm font-bold">Telegram</div>
                        <div className="text-xs opacity-90">Seguro</div>
                      </div>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleSendMessage('SMS')}
                  disabled={sending || selectedEmployees.length === 0}
                  className={`flex items-center justify-center px-6 py-4 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    sending || selectedEmployees.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                  }`}
                >
                  {sending ? (
                    <div>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Enviando...</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-sm font-bold">SMS</div>
                        <div className="text-xs opacity-90">Texto directo</div>
                      </div>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleSendMessage('Email')}
                  disabled={sending || selectedEmployees.length === 0}
                  className={`flex items-center justify-center px-6 py-4 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    sending || selectedEmployees.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'
                  }`}
                >
                  {sending ? (
                    <div>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Enviando...</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-sm font-bold">Email</div>
                        <div className="text-xs opacity-90">Correos</div>
                      </div>
                    </div>
                  )}
                </button>
              </div>

              {/* Botón de Fallback Inteligente */}
              <div className="mt-4">
                <button
                  onClick={() => handleSendWithFallback('WhatsApp')}
                  disabled={sending || selectedEmployees.length === 0}
                  className={`w-full flex items-center justify-center px-8 py-4 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    sending || selectedEmployees.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white'
                  }`}
                >
                  {sending ? (
                    <div>
                      <svg className="animate-spin -ml-1 mr-4 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-lg">Enviando con Fallback...</span>
                    </div>
                  ) : (
                    <React.Fragment>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-lg font-bold">🔄 Fallback Inteligente</div>
                        <div className="text-sm opacity-90">Entrega garantizada con múltiples canales</div>
                      </div>
                    </React.Fragment>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessages;