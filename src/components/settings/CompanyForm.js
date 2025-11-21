import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext.js'
import { supabase } from '../../lib/supabaseClient.js'
import organizedDatabaseService from '../../services/organizedDatabaseService.js'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  ChatBubbleLeftIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  BriefcaseIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CompanyForm = ({ company, onSuccess, onCancel, companyId, isCompanySpecificMode }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    telegram_bot: '',
    whatsapp_number: '',
    status: 'active',
    fallback_config: { order: ['WhatsApp', 'Telegram', 'SMS', 'Email'] },
    // Configuración de Email
    email_enabled: false,
    email_sender_name: '',
    email_sender_email: '',
    email_reply_to: '',
    email_config: {},
    // Configuración de SMS
    sms_enabled: false,
    sms_sender_name: '',
    sms_sender_phone: '',
    sms_config: {},
    // Configuración de Telegram (mejorada)
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_bot_username: '',
    telegram_webhook_url: '',
    telegram_config: {},
    // Configuración de WhatsApp (mejorada)
    whatsapp_enabled: false,
    whatsapp_access_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_webhook_verify_token: '',
    whatsapp_config: {},
    // Configuración de Groq AI
    groq_enabled: false,
    groq_api_key: '',
    groq_model: 'gemma2-9b-it',
    groq_temperature: 0.7,
    groq_max_tokens: 800,
    groq_config: {},
    // Configuración de Google Workspace
    google_enabled: false,
    google_api_key: '',
    google_client_id: '',
    google_client_secret: '',
    google_config: {},
    // Configuración de Microsoft 365
    microsoft_enabled: false,
    microsoft_client_id: '',
    microsoft_client_secret: '',
    microsoft_tenant_id: '',
    microsoft_config: {},
    // Configuración de Slack
    slack_enabled: false,
    slack_bot_token: '',
    slack_signing_secret: '',
    slack_default_channel: '',
    slack_config: {},
    // Configuración de Teams
    teams_enabled: false,
    teams_app_id: '',
    teams_client_secret: '',
    teams_tenant_id: '',
    teams_config: {},
    // Configuración de HubSpot
    hubspot_enabled: false,
    hubspot_api_key: '',
    hubspot_portal_id: '',
    hubspot_config: {},
    // Configuración de Salesforce
    salesforce_enabled: false,
    salesforce_consumer_key: '',
    salesforce_consumer_secret: '',
    salesforce_username: '',
    salesforce_password: '',
    salesforce_config: {}
  })
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [employeesPerPage] = useState(10)
  const [fallbackOrder, setFallbackOrder] = useState(['WhatsApp', 'Telegram', 'SMS', 'Email'])
  const [activeChannelTab, setActiveChannelTab] = useState('email')
  
  // Estado para manejar debounce de guardado automático
  const [debounceTimers, setDebounceTimers] = useState({})

  const loadEmployees = useCallback(async () => {
    if (!company) return

    try {
      // Usar el servicio de base de datos organizada para cargar empleados reales
      const allEmployees = await organizedDatabaseService.getEmployees()
      const companyEmployees = allEmployees.filter(emp => emp.company_id === company.id)
      setEmployees(companyEmployees)

    } catch (error) {
      console.error('Error loading employees:', error)
      toast.error('Error al cargar empleados')
    }
  }, [company])

  useEffect(() => {
    if (company) {
      const fallbackConfig = company.fallback_config || { order: ['WhatsApp', 'Telegram', 'SMS', 'Email'] }
      setFormData({
        name: company.name || '',
        description: company.description || '',
        telegram_bot: company.telegram_bot || '',
        whatsapp_number: company.whatsapp_number || '',
        status: company.status || 'active',
        fallback_config: fallbackConfig,
        // Configuración de canales
        email_enabled: company.email_enabled || false,
        email_sender_name: company.email_sender_name || '',
        email_sender_email: company.email_sender_email || '',
        email_reply_to: company.email_reply_to || '',
        email_config: company.email_config || {},
        sms_enabled: company.sms_enabled || false,
        sms_sender_name: company.sms_sender_name || '',
        sms_sender_phone: company.sms_sender_phone || '',
        sms_config: company.sms_config || {},
        telegram_enabled: company.telegram_enabled || false,
        telegram_bot_token: company.telegram_bot_token || '',
        telegram_bot_username: company.telegram_bot_username || '',
        telegram_webhook_url: company.telegram_webhook_url || '',
        telegram_config: company.telegram_config || {},
        whatsapp_enabled: company.whatsapp_enabled || false,
        whatsapp_access_token: company.whatsapp_access_token || '',
        whatsapp_phone_number_id: company.whatsapp_phone_number_id || '',
        whatsapp_webhook_verify_token: company.whatsapp_webhook_verify_token || '',
        whatsapp_config: company.whatsapp_config || {},
        groq_enabled: company.groq_enabled || false,
        groq_api_key: company.groq_api_key || '',
        groq_model: company.groq_model || 'gemma2-9b-it',
        groq_temperature: company.groq_temperature || 0.7,
        groq_max_tokens: company.groq_max_tokens || 800,
        groq_config: company.groq_config || {},
        google_enabled: company.google_enabled || false,
        google_api_key: company.google_api_key || '',
        google_client_id: company.google_client_id || '',
        google_client_secret: company.google_client_secret || '',
        google_config: company.google_config || {},
        microsoft_enabled: company.microsoft_enabled || false,
        microsoft_client_id: company.microsoft_client_id || '',
        microsoft_client_secret: company.microsoft_client_secret || '',
        microsoft_tenant_id: company.microsoft_tenant_id || '',
        microsoft_config: company.microsoft_config || {},
        slack_enabled: company.slack_enabled || false,
        slack_bot_token: company.slack_bot_token || '',
        slack_signing_secret: company.slack_signing_secret || '',
        slack_default_channel: company.slack_default_channel || '',
        slack_config: company.slack_config || {},
        teams_enabled: company.teams_enabled || false,
        teams_app_id: company.teams_app_id || '',
        teams_client_secret: company.teams_client_secret || '',
        teams_tenant_id: company.teams_tenant_id || '',
        teams_config: company.teams_config || {},
        hubspot_enabled: company.hubspot_enabled || false,
        hubspot_api_key: company.hubspot_api_key || '',
        hubspot_portal_id: company.hubspot_portal_id || '',
        hubspot_config: company.hubspot_config || {},
        salesforce_enabled: company.salesforce_enabled || false,
        salesforce_consumer_key: company.salesforce_consumer_key || '',
        salesforce_consumer_secret: company.salesforce_consumer_secret || '',
        salesforce_username: company.salesforce_username || '',
        salesforce_password: company.salesforce_password || '',
        salesforce_config: company.salesforce_config || {}
      })
      setFallbackOrder(fallbackConfig.order || ['WhatsApp', 'Telegram', 'SMS', 'Email'])
      loadEmployees()
    } else {
      // Nueva empresa - agregar un empleado por defecto
      setEmployees([{
        id: 'temp-' + Date.now(),
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        isNew: true
      }])
    }
  }, [company, loadEmployees])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addEmployee = () => {
    setEmployees(prev => [...prev, {
      id: 'temp-' + Date.now(),
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      isNew: true
    }])
  }

  const updateEmployee = (index, field, value) => {
    // Calcular el índice global basado en la página actual
    const globalIndex = indexOfFirstEmployee + index
    setEmployees(prev => prev.map((emp, i) =>
      i === globalIndex ? { ...emp, [field]: value } : emp
    ))
  }

  const removeEmployee = (index) => {
    // Calcular el índice global basado en la página actual
    const globalIndex = indexOfFirstEmployee + index
    setEmployees(prev => prev.filter((_, i) => i !== globalIndex))
  }

  // Funciones para reordenar el fallback
  const moveChannelUp = (index) => {
    if (index > 0) {
      const newOrder = [...fallbackOrder]
      ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      setFallbackOrder(newOrder)
      setFormData(prev => ({
        ...prev,
        fallback_config: { ...prev.fallback_config, order: newOrder }
      }))
    }
  }

  const moveChannelDown = (index) => {
    if (index < fallbackOrder.length - 1) {
      const newOrder = [...fallbackOrder]
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      setFallbackOrder(newOrder)
      setFormData(prev => ({
        ...prev,
        fallback_config: { ...prev.fallback_config, order: newOrder }
      }))
    }
  }

  const resetFallbackOrder = () => {
    const defaultOrder = ['WhatsApp', 'Telegram', 'SMS', 'Email']
    setFallbackOrder(defaultOrder)
    setFormData(prev => ({
      ...prev,
      fallback_config: { ...prev.fallback_config, order: defaultOrder }
    }))
  }

  // Calcular empleados de la página actual
  const indexOfLastEmployee = currentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = employees.slice(indexOfFirstEmployee, indexOfLastEmployee)

  // Calcular total de páginas
  const totalPages = Math.ceil(employees.length / employeesPerPage)

  // Funciones de paginación
  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast.error('El nombre de la empresa es obligatorio')
      return false
    }

    // Validar empleados solo si no está en modo específico
    if (!isCompanySpecificMode) {
      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i]
        if (!emp.name?.trim() || !emp.email?.trim()) {
          toast.error(`El empleado ${i + 1} debe tener nombre y email`)
          return false
        }
      }
    }

    return true
  }

  // Función para guardar automáticamente un canal específico
  const saveChannelConfig = async (channelType, channelData) => {
    if (!company?.id || !isCompanySpecificMode) return

    try {
      const updateData = {
        [`${channelType}_enabled`]: channelData[`${channelType}_enabled`],
        updated_at: new Date().toISOString()
      }

      // Agregar campos específicos del canal
      Object.keys(channelData).forEach(key => {
        if (key.startsWith(`${channelType}_`) && key !== `${channelType}_enabled`) {
          updateData[key] = channelData[key]
        }
      })

      console.log(`Guardando automáticamente configuración ${channelType}:`, updateData)
      
      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id)

      if (error) {
        console.error(`Error guardando ${channelType}:`, error)
        // Mostrar error sutil sin cerrar la página
        toast.error(`Error al guardar ${channelType}: ${error.message}`, {
          duration: 3000,
          position: 'bottom-right'
        })
      } else {
        console.log(`Configuración ${channelType} guardada automáticamente`)
        // Mostrar éxito sutil
        toast.success(`${channelType} guardado automáticamente`, {
          duration: 2000,
          position: 'bottom-right'
        })
      }
    } catch (error) {
      console.error(`Error en guardado automático de ${channelType}:`, error)
      // Mostrar error sin cerrar la página
      toast.error(`Error inesperado guardando ${channelType}`, {
        duration: 3000,
        position: 'bottom-right'
      })
    }
  }

  // Función para manejar cambios en los campos de canales con guardado automático
  const handleChannelChange = (field, value) => {
    handleInputChange(field, value)
    
    // Extraer el tipo de canal del nombre del campo
    const channelType = field.split('_')[0]
    
    // Cancelar el timer existente para este canal
    if (debounceTimers[channelType]) {
      clearTimeout(debounceTimers[channelType])
    }
    
    // Crear un nuevo timer para guardar después de 1.5 segundos
    const newTimer = setTimeout(() => {
      // Obtener todos los datos del canal actual
      const channelData = {}
      Object.keys(formData).forEach(key => {
        if (key.startsWith(`${channelType}_`)) {
          channelData[key] = formData[key]
        }
      })
      
      // Guardar automáticamente solo si estamos en modo específico
      if (isCompanySpecificMode && company?.id) {
        saveChannelConfig(channelType, channelData)
      }
      
      // Limpiar el timer después de ejecutar
      setDebounceTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[channelType];
        return newTimers;
      })
    }, 1500) // Aumentado a 1.5 segundos para evitar guardados frecuentes
    
    // Guardar el nuevo timer
    setDebounceTimers(prev => ({
      ...prev,
      [channelType]: newTimer
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // En modo específico, solo validar que el nombre de la empresa exista
    if (isCompanySpecificMode) {
      if (!formData.name?.trim()) {
        toast.error('El nombre de la empresa es obligatorio')
        return
      }
    } else {
      if (!validateForm()) return
    }

    setLoading(true)

    try {
      let companyId = company?.id

      // En modo específico, guardar toda la configuración de canales
      if (isCompanySpecificMode) {
        const updateData = {
          // Configuración completa de Email
          email_enabled: formData.email_enabled,
          email_sender_name: formData.email_sender_name,
          email_sender_email: formData.email_sender_email,
          email_reply_to: formData.email_reply_to,
          email_config: formData.email_config,
          // Configuración completa de SMS
          sms_enabled: formData.sms_enabled,
          sms_sender_name: formData.sms_sender_name,
          sms_sender_phone: formData.sms_sender_phone,
          sms_config: formData.sms_config,
          // Configuración completa de Telegram
          telegram_enabled: formData.telegram_enabled,
          telegram_bot_token: formData.telegram_bot_token,
          telegram_bot_username: formData.telegram_bot_username,
          telegram_webhook_url: formData.telegram_webhook_url,
          telegram_config: formData.telegram_config,
          // Configuración completa de WhatsApp
          whatsapp_enabled: formData.whatsapp_enabled,
          whatsapp_access_token: formData.whatsapp_access_token,
          whatsapp_phone_number_id: formData.whatsapp_phone_number_id,
          whatsapp_webhook_verify_token: formData.whatsapp_webhook_verify_token,
          whatsapp_config: formData.whatsapp_config,
          // Configuración completa de Groq AI
          groq_enabled: formData.groq_enabled,
          groq_api_key: formData.groq_api_key,
          groq_model: formData.groq_model,
          groq_temperature: formData.groq_temperature,
          groq_max_tokens: formData.groq_max_tokens,
          groq_config: formData.groq_config,
          // Configuración completa de Google Workspace
          google_enabled: formData.google_enabled,
          google_api_key: formData.google_api_key,
          google_client_id: formData.google_client_id,
          google_client_secret: formData.google_client_secret,
          google_config: formData.google_config,
          // Configuración completa de Microsoft 365
          microsoft_enabled: formData.microsoft_enabled,
          microsoft_client_id: formData.microsoft_client_id,
          microsoft_client_secret: formData.microsoft_client_secret,
          microsoft_tenant_id: formData.microsoft_tenant_id,
          microsoft_config: formData.microsoft_config,
          // Configuración completa de Slack
          slack_enabled: formData.slack_enabled,
          slack_bot_token: formData.slack_bot_token,
          slack_signing_secret: formData.slack_signing_secret,
          slack_default_channel: formData.slack_default_channel,
          slack_config: formData.slack_config,
          // Configuración completa de Teams
          teams_enabled: formData.teams_enabled,
          teams_app_id: formData.teams_app_id,
          teams_client_secret: formData.teams_client_secret,
          teams_tenant_id: formData.teams_tenant_id,
          teams_config: formData.teams_config,
          // Configuración completa de HubSpot
          hubspot_enabled: formData.hubspot_enabled,
          hubspot_api_key: formData.hubspot_api_key,
          hubspot_portal_id: formData.hubspot_portal_id,
          hubspot_config: formData.hubspot_config,
          // Configuración completa de Salesforce
          salesforce_enabled: formData.salesforce_enabled,
          salesforce_consumer_key: formData.salesforce_consumer_key,
          salesforce_consumer_secret: formData.salesforce_consumer_secret,
          salesforce_username: formData.salesforce_username,
          salesforce_password: formData.salesforce_password,
          salesforce_config: formData.salesforce_config,
          updated_at: new Date().toISOString()
        }

        console.log('Guardando configuración completa de canales:', updateData)
        const { error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', company.id)

        if (error) {
          console.error('Error específico de Supabase:', error)
          throw error
        }

        toast.success('Configuración de canales guardada exitosamente')
        // En modo específico, no llamar a onSuccess() para evitar redirección infinita
        // El usuario permanece en la página de configuración
        return
      }

      // Crear o actualizar empresa (modo normal)
      if (company) {
        // Actualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            description: formData.description,
            telegram_bot: formData.telegram_bot,
            whatsapp_number: formData.whatsapp_number,
            status: formData.status,
            fallback_config: formData.fallback_config,
            // Configuración de Email
            email_enabled: formData.email_enabled,
            email_sender_name: formData.email_sender_name,
            email_sender_email: formData.email_sender_email,
            email_reply_to: formData.email_reply_to,
            email_config: formData.email_config,
            // Configuración de SMS
            sms_enabled: formData.sms_enabled,
            sms_sender_name: formData.sms_sender_name,
            sms_sender_phone: formData.sms_sender_phone,
            sms_config: formData.sms_config,
            // Configuración de Telegram
            telegram_enabled: formData.telegram_enabled,
            telegram_bot_token: formData.telegram_bot_token,
            telegram_bot_username: formData.telegram_bot_username,
            telegram_webhook_url: formData.telegram_webhook_url,
            telegram_config: formData.telegram_config,
            // Configuración de WhatsApp
            whatsapp_enabled: formData.whatsapp_enabled,
            whatsapp_access_token: formData.whatsapp_access_token,
            whatsapp_phone_number_id: formData.whatsapp_phone_number_id,
            whatsapp_webhook_verify_token: formData.whatsapp_webhook_verify_token,
            whatsapp_config: formData.whatsapp_config,
            // Configuración de Groq AI
            groq_enabled: formData.groq_enabled,
            groq_api_key: formData.groq_api_key,
            groq_model: formData.groq_model,
            groq_temperature: formData.groq_temperature,
            groq_max_tokens: formData.groq_max_tokens,
            groq_config: formData.groq_config,
            // Configuración de Google Workspace
            google_enabled: formData.google_enabled,
            google_api_key: formData.google_api_key,
            google_client_id: formData.google_client_id,
            google_client_secret: formData.google_client_secret,
            google_config: formData.google_config,
            // Configuración de Microsoft 365
            microsoft_enabled: formData.microsoft_enabled,
            microsoft_client_id: formData.microsoft_client_id,
            microsoft_client_secret: formData.microsoft_client_secret,
            microsoft_tenant_id: formData.microsoft_tenant_id,
            microsoft_config: formData.microsoft_config,
            // Configuración de Slack
            slack_enabled: formData.slack_enabled,
            slack_bot_token: formData.slack_bot_token,
            slack_signing_secret: formData.slack_signing_secret,
            slack_default_channel: formData.slack_default_channel,
            slack_config: formData.slack_config,
            // Configuración de Teams
            teams_enabled: formData.teams_enabled,
            teams_app_id: formData.teams_app_id,
            teams_client_secret: formData.teams_client_secret,
            teams_tenant_id: formData.teams_tenant_id,
            teams_config: formData.teams_config,
            // Configuración de HubSpot
            hubspot_enabled: formData.hubspot_enabled,
            hubspot_api_key: formData.hubspot_api_key,
            hubspot_portal_id: formData.hubspot_portal_id,
            hubspot_config: formData.hubspot_config,
            // Configuración de Salesforce
            salesforce_enabled: formData.salesforce_enabled,
            salesforce_consumer_key: formData.salesforce_consumer_key,
            salesforce_consumer_secret: formData.salesforce_consumer_secret,
            salesforce_username: formData.salesforce_username,
            salesforce_password: formData.salesforce_password,
            salesforce_config: formData.salesforce_config,
            updated_at: new Date().toISOString()
          })
          .eq('id', company.id)

        if (error) throw error
      } else {
        // Crear nueva empresa
        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            description: formData.description,
            telegram_bot: formData.telegram_bot,
            whatsapp_number: formData.whatsapp_number,
            status: formData.status,
            fallback_config: formData.fallback_config,
            // Configuración de Email
            email_enabled: formData.email_enabled,
            email_sender_name: formData.email_sender_name,
            email_sender_email: formData.email_sender_email,
            email_reply_to: formData.email_reply_to,
            email_config: formData.email_config,
            // Configuración de SMS
            sms_enabled: formData.sms_enabled,
            sms_sender_name: formData.sms_sender_name,
            sms_sender_phone: formData.sms_sender_phone,
            sms_config: formData.sms_config,
            // Configuración de Telegram
            telegram_enabled: formData.telegram_enabled,
            telegram_bot_token: formData.telegram_bot_token,
            telegram_bot_username: formData.telegram_bot_username,
            telegram_webhook_url: formData.telegram_webhook_url,
            telegram_config: formData.telegram_config,
            // Configuración de WhatsApp
            whatsapp_enabled: formData.whatsapp_enabled,
            whatsapp_access_token: formData.whatsapp_access_token,
            whatsapp_phone_number_id: formData.whatsapp_phone_number_id,
            whatsapp_webhook_verify_token: formData.whatsapp_webhook_verify_token,
            whatsapp_config: formData.whatsapp_config,
            // Configuración de Groq AI
            groq_enabled: formData.groq_enabled,
            groq_api_key: formData.groq_api_key,
            groq_model: formData.groq_model,
            groq_temperature: formData.groq_temperature,
            groq_max_tokens: formData.groq_max_tokens,
            groq_config: formData.groq_config,
            // Configuración de Google Workspace
            google_enabled: formData.google_enabled,
            google_api_key: formData.google_api_key,
            google_client_id: formData.google_client_id,
            google_client_secret: formData.google_client_secret,
            google_config: formData.google_config,
            // Configuración de Microsoft 365
            microsoft_enabled: formData.microsoft_enabled,
            microsoft_client_id: formData.microsoft_client_id,
            microsoft_client_secret: formData.microsoft_client_secret,
            microsoft_tenant_id: formData.microsoft_tenant_id,
            microsoft_config: formData.microsoft_config,
            // Configuración de Slack
            slack_enabled: formData.slack_enabled,
            slack_bot_token: formData.slack_bot_token,
            slack_signing_secret: formData.slack_signing_secret,
            slack_default_channel: formData.slack_default_channel,
            slack_config: formData.slack_config,
            // Configuración de Teams
            teams_enabled: formData.teams_enabled,
            teams_app_id: formData.teams_app_id,
            teams_client_secret: formData.teams_client_secret,
            teams_tenant_id: formData.teams_tenant_id,
            teams_config: formData.teams_config,
            // Configuración de HubSpot
            hubspot_enabled: formData.hubspot_enabled,
            hubspot_api_key: formData.hubspot_api_key,
            hubspot_portal_id: formData.hubspot_portal_id,
            hubspot_config: formData.hubspot_config,
            // Configuración de Salesforce
            salesforce_enabled: formData.salesforce_enabled,
            salesforce_consumer_key: formData.salesforce_consumer_key,
            salesforce_consumer_secret: formData.salesforce_consumer_secret,
            salesforce_username: formData.salesforce_username,
            salesforce_password: formData.salesforce_password,
            salesforce_config: formData.salesforce_config,
            user_id: user.id
          })
          .select()
          .single()

        if (error) throw error
        companyId = data.id
      }

      // Procesar empleados (solo en modo normal)
      for (const emp of employees) {
        if (emp.isNew) {
          // Crear nuevo empleado
          const { error } = await supabase
            .from('employees')
            .insert({
              company_id: companyId,
              name: emp.name,
              email: emp.email,
              phone: emp.phone || null,
              department: emp.department || null,
              position: emp.position || null,
              is_active: true
            })

          if (error) throw error
        } else {
          // Actualizar empleado existente
          const { error } = await supabase
            .from('employees')
            .update({
              name: emp.name,
              email: emp.email,
              phone: emp.phone || null,
              department: emp.department || null,
              position: emp.position || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', emp.id)

          if (error) throw error
        }
      }

      toast.success(company ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente')
      onSuccess()
    } catch (error) {
      console.error('Error saving company:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Mostrar error detallado pero sin cerrar la página
      const errorMessage = error.message || 'Error desconocido'
      toast.error(`Error al guardar: ${errorMessage}`, {
        duration: 5000,
        position: 'top-center'
      })
      
      // En modo específico, no cerrar la página incluso si hay error
      if (isCompanySpecificMode) {
        console.log('Error en modo específico, manteniendo la página abierta')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onCancel}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver
        </button>

        <div className="flex items-center">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mr-4">
            <BuildingOfficeIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isCompanySpecificMode ? 'Configuración de Empresa' : (company ? 'Editar Empresa' : 'Nueva Empresa')}
            </h1>
            <p className="text-gray-600">
              {isCompanySpecificMode
                ? 'Configura las credenciales y canales de comunicación específicos para esta empresa'
                : (company ? 'Modifica los datos de la empresa' : 'Crea una nueva empresa con sus empleados')
              }
            </p>
            {isCompanySpecificMode && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>URL específica:</strong> {window.location.pathname}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información de la Empresa */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <BuildingOfficeIcon className="h-6 w-6 mr-3 text-blue-600" />
            Información de la Empresa
            {isCompanySpecificMode && (
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Modo específico
              </span>
            )}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Ej: Empresa XYZ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={() => handleInputChange('status', 'active')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activa</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'inactive'}
                    onChange={() => handleInputChange('status', 'inactive')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inactiva</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Descripción opcional de la empresa"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Bot de Telegram
              </label>
              <input
                type="url"
                value={formData.telegram_bot}
                onChange={(e) => handleInputChange('telegram_bot', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://t.me/tu_bot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2" />
                Número de WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp_number}
                onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="+56912345678"
              />
            </div>
          </div>
        </div>

        {/* Configuración de Fallback */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ArrowsUpDownIcon className="h-6 w-6 mr-3 text-purple-600" />
              🔄 Orden de Fallback de Comunicación
            </h2>
            <button
              type="button"
              onClick={resetFallbackOrder}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Restablecer por defecto
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Arrastra y reordena los canales de comunicación para definir el orden en que se usarán como fallback cuando un canal falle.
          </p>

          <div className="space-y-3">
            {fallbackOrder.map((channel, index) => (
              <div
                key={channel}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-semibold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{channel}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => moveChannelUp(index)}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Subir"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveChannelDown(index)}
                    disabled={index === fallbackOrder.length - 1}
                    className="p-2 text-gray-600 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Bajar"
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Este orden se usará automáticamente cuando un canal de comunicación falle.
              El sistema intentará el siguiente canal en la lista hasta encontrar uno que funcione.
            </p>
          </div>
        </div>

        {/* Configuración de Canales de Comunicación */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Cog6ToothIcon className="h-6 w-6 mr-3 text-indigo-600" />
              🔧 Configuración de Canales de Comunicación
            </h2>
            <div className="text-sm text-gray-500">
              Configura las credenciales específicas para cada canal
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Aquí puedes configurar las credenciales específicas para cada canal de comunicación que esta empresa utilizará.
            Estas configuraciones sobrescribirán las configuraciones globales cuando se envíen mensajes para esta empresa.
          </p>

          {/* Pestañas de Canales - Rediseñadas en Grupos */}
          <div className="mb-6">
            {/* Canales de Comunicación Principales */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">📱 Canales de Comunicación</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'email', name: 'Email', icon: EnvelopeIcon, color: 'blue' },
                  { id: 'sms', name: 'SMS', icon: DevicePhoneMobileIcon, color: 'green' },
                  { id: 'telegram', name: 'Telegram', icon: ChatBubbleLeftIcon, color: 'blue' },
                  { id: 'whatsapp', name: 'WhatsApp', icon: PhoneIcon, color: 'green' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChannelTab(tab.id)}
                    className={`p-3 rounded-xl border-2 font-medium text-sm flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                      activeChannelTab === tab.id
                        ? `border-${tab.color}-500 bg-${tab.color}-50 text-${tab.color}-700 shadow-lg`
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className={`h-6 w-6 ${activeChannelTab === tab.id ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inteligencia Artificial */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">🤖 Inteligencia Artificial</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { id: 'groq', name: 'Groq AI', icon: Cog6ToothIcon, color: 'purple' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChannelTab(tab.id)}
                    className={`p-3 rounded-xl border-2 font-medium text-sm flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                      activeChannelTab === tab.id
                        ? `border-${tab.color}-500 bg-${tab.color}-50 text-${tab.color}-700 shadow-lg`
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className={`h-6 w-6 ${activeChannelTab === tab.id ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Productividad y Colaboración */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">💼 Productividad y Colaboración</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'google', name: 'Google', icon: GlobeAltIcon, color: 'red' },
                  { id: 'microsoft', name: 'Microsoft', icon: ComputerDesktopIcon, color: 'blue' },
                  { id: 'slack', name: 'Slack', icon: ChatBubbleLeftRightIcon, color: 'purple' },
                  { id: 'teams', name: 'Teams', icon: BriefcaseIcon, color: 'purple' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChannelTab(tab.id)}
                    className={`p-3 rounded-xl border-2 font-medium text-sm flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                      activeChannelTab === tab.id
                        ? `border-${tab.color}-500 bg-${tab.color}-50 text-${tab.color}-700 shadow-lg`
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className={`h-6 w-6 ${activeChannelTab === tab.id ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CRM y Ventas */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">🎯 CRM y Ventas</h4>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                {[
                  { id: 'hubspot', name: 'HubSpot', icon: CubeIcon, color: 'orange' },
                  { id: 'salesforce', name: 'Salesforce', icon: BriefcaseIcon, color: 'blue' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChannelTab(tab.id)}
                    className={`p-3 rounded-xl border-2 font-medium text-sm flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                      activeChannelTab === tab.id
                        ? `border-${tab.color}-500 bg-${tab.color}-50 text-${tab.color}-700 shadow-lg`
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className={`h-6 w-6 ${activeChannelTab === tab.id ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido de las Pestañas */}
          <div className="space-y-6">
            {/* Email Configuration */}
            {activeChannelTab === 'email' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Configuración de Email
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.email_enabled}
                      onChange={(e) => handleChannelChange('email_enabled', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Email</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Remitente
                    </label>
                    <input
                      type="text"
                      value={formData.email_sender_name}
                      onChange={(e) => handleChannelChange('email_sender_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Empresa XYZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email del Remitente
                    </label>
                    <input
                      type="email"
                      value={formData.email_sender_email}
                      onChange={(e) => handleChannelChange('email_sender_email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="noreply@empresa.cl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de Respuesta
                    </label>
                    <input
                      type="email"
                      value={formData.email_reply_to}
                      onChange={(e) => handleChannelChange('email_reply_to', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="soporte@empresa.cl"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> La configuración de SMTP se gestiona desde la página de
                    <a href="/configuracion/integraciones" className="text-blue-600 underline ml-1">Integraciones</a>.
                    Aquí solo configuras los datos específicos de esta empresa.
                  </p>
                </div>
              </div>
            )}

            {/* SMS Configuration */}
            {activeChannelTab === 'sms' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-green-600" />
                    Configuración de SMS
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sms_enabled}
                      onChange={(e) => handleChannelChange('sms_enabled', e.target.checked)}
                      className="text-green-600 focus:ring-green-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar SMS</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Remitente SMS
                    </label>
                    <input
                      type="text"
                      value={formData.sms_sender_name}
                      onChange={(e) => handleChannelChange('sms_sender_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="EmpresaXYZ"
                      maxLength={11}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Remitente
                    </label>
                    <input
                      type="tel"
                      value={formData.sms_sender_phone}
                      onChange={(e) => handleChannelChange('sms_sender_phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="+56912345678"
                    />
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-800">
                    <strong>Nota:</strong> La configuración del proveedor de SMS (Brevo) se gestiona desde
                    <a href="/configuracion/integraciones" className="text-green-600 underline ml-1">Integraciones</a>.
                  </p>
                </div>
              </div>
            )}

            {/* Telegram Configuration */}
            {activeChannelTab === 'telegram' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Configuración de Telegram
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.telegram_enabled}
                      onChange={(e) => handleChannelChange('telegram_enabled', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Telegram</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token del Bot
                    </label>
                    <input
                      type="password"
                      value={formData.telegram_bot_token}
                      onChange={(e) => handleChannelChange('telegram_bot_token', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de Usuario del Bot
                    </label>
                    <input
                      type="text"
                      value={formData.telegram_bot_username}
                      onChange={(e) => handleChannelChange('telegram_bot_username', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="@mi_bot_empresa"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Webhook
                    </label>
                    <input
                      type="url"
                      value={formData.telegram_webhook_url}
                      onChange={(e) => handleChannelChange('telegram_webhook_url', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="https://tu-sitio.com/api/telegram/webhook"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Configuration */}
            {activeChannelTab === 'whatsapp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2 text-green-600" />
                    Configuración de WhatsApp
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.whatsapp_enabled}
                      onChange={(e) => handleChannelChange('whatsapp_enabled', e.target.checked)}
                      className="text-green-600 focus:ring-green-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar WhatsApp</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={formData.whatsapp_access_token}
                      onChange={(e) => handleChannelChange('whatsapp_access_token', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="EAAKZC..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp_phone_number_id}
                      onChange={(e) => handleChannelChange('whatsapp_phone_number_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="123456789012345"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Verify Token
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp_webhook_verify_token}
                      onChange={(e) => handleChannelChange('whatsapp_webhook_verify_token', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="token_secreto_verificacion"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Groq AI Configuration */}
            {activeChannelTab === 'groq' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Cog6ToothIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Configuración de Groq AI
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.groq_enabled}
                      onChange={(e) => handleChannelChange('groq_enabled', e.target.checked)}
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Groq AI</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={formData.groq_api_key}
                      onChange={(e) => handleChannelChange('groq_api_key', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="gsk_..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo
                    </label>
                    <select
                      value={formData.groq_model}
                      onChange={(e) => handleChannelChange('groq_model', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="gemma2-9b-it">Gemma 2 9B IT</option>
                      <option value="llama3-8b-8192">Llama 3 8B 8192</option>
                      <option value="llama3-70b-8192">Llama 3 70B 8192</option>
                      <option value="mixtral-8x7b-32768">Mixtral 8x7B 32768</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.groq_temperature}
                      onChange={(e) => handleChannelChange('groq_temperature', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8000"
                      value={formData.groq_max_tokens}
                      onChange={(e) => handleChannelChange('groq_max_tokens', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Google Workspace Configuration */}
            {activeChannelTab === 'google' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-red-600" />
                    Configuración de Google Workspace
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.google_enabled}
                      onChange={(e) => handleChannelChange('google_enabled', e.target.checked)}
                      className="text-red-600 focus:ring-red-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Google</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={formData.google_api_key}
                      onChange={(e) => handleChannelChange('google_api_key', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      placeholder="AIza..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.google_client_id}
                      onChange={(e) => handleChannelChange('google_client_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      placeholder="123456789-abc123.apps.googleusercontent.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={formData.google_client_secret}
                      onChange={(e) => handleChannelChange('google_client_secret', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      placeholder="GOCSPX-..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Microsoft 365 Configuration */}
            {activeChannelTab === 'microsoft' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ComputerDesktopIcon className="h-5 w-5 mr-2 text-blue-700" />
                    Configuración de Microsoft 365
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.microsoft_enabled}
                      onChange={(e) => handleChannelChange('microsoft_enabled', e.target.checked)}
                      className="text-blue-700 focus:ring-blue-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Microsoft</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.microsoft_client_id}
                      onChange={(e) => handleChannelChange('microsoft_client_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-colors"
                      placeholder="12345678-1234-1234-1234-123456789012"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tenant ID
                    </label>
                    <input
                      type="text"
                      value={formData.microsoft_tenant_id}
                      onChange={(e) => handleChannelChange('microsoft_tenant_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-colors"
                      placeholder="12345678-1234-1234-1234-123456789012"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={formData.microsoft_client_secret}
                      onChange={(e) => handleChannelChange('microsoft_client_secret', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-colors"
                      placeholder="~secret..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Slack Configuration */}
            {activeChannelTab === 'slack' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-purple-700" />
                    Configuración de Slack
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.slack_enabled}
                      onChange={(e) => handleChannelChange('slack_enabled', e.target.checked)}
                      className="text-purple-700 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Slack</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bot Token
                    </label>
                    <input
                      type="password"
                      value={formData.slack_bot_token}
                      onChange={(e) => handleChannelChange('slack_bot_token', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent transition-colors"
                      placeholder="xoxb-..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signing Secret
                    </label>
                    <input
                      type="password"
                      value={formData.slack_signing_secret}
                      onChange={(e) => handleChannelChange('slack_signing_secret', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent transition-colors"
                      placeholder="a1b2c3d4..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canal por Defecto
                    </label>
                    <input
                      type="text"
                      value={formData.slack_default_channel}
                      onChange={(e) => handleChannelChange('slack_default_channel', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-700 focus:border-transparent transition-colors"
                      placeholder="#general"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Teams Configuration */}
            {activeChannelTab === 'teams' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BriefcaseIcon className="h-5 w-5 mr-3 text-purple-600" />
                    Configuración de Microsoft Teams
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.teams_enabled}
                      onChange={(e) => handleChannelChange('teams_enabled', e.target.checked)}
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Teams</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={formData.teams_app_id}
                      onChange={(e) => handleChannelChange('teams_app_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors"
                      placeholder="12345678-1234-1234-1234-123456789012"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tenant ID
                    </label>
                    <input
                      type="text"
                      value={formData.teams_tenant_id}
                      onChange={(e) => handleChannelChange('teams_tenant_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors"
                      placeholder="12345678-1234-1234-1234-123456789012"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={formData.teams_client_secret}
                      onChange={(e) => handleChannelChange('teams_client_secret', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors"
                      placeholder="~secret..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HubSpot Configuration */}
            {activeChannelTab === 'hubspot' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <CubeIcon className="h-5 w-5 mr-3 text-orange-600" />
                    Configuración de HubSpot
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hubspot_enabled}
                      onChange={(e) => handleChannelChange('hubspot_enabled', e.target.checked)}
                      className="text-orange-600 focus:ring-orange-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar HubSpot</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={formData.hubspot_api_key}
                      onChange={(e) => handleChannelChange('hubspot_api_key', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors"
                      placeholder="pat_eu1_..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portal ID
                    </label>
                    <input
                      type="text"
                      value={formData.hubspot_portal_id}
                      onChange={(e) => handleChannelChange('hubspot_portal_id', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors"
                      placeholder="1234567"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Salesforce Configuration */}
            {activeChannelTab === 'salesforce' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BriefcaseIcon className="h-5 w-5 mr-3 text-blue-800" />
                    Configuración de Salesforce
                  </h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.salesforce_enabled}
                      onChange={(e) => handleChannelChange('salesforce_enabled', e.target.checked)}
                      className="text-blue-800 focus:ring-blue-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar Salesforce</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consumer Key
                    </label>
                    <input
                      type="text"
                      value={formData.salesforce_consumer_key}
                      onChange={(e) => handleChannelChange('salesforce_consumer_key', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors"
                      placeholder="3MVG9..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consumer Secret
                    </label>
                    <input
                      type="password"
                      value={formData.salesforce_consumer_secret}
                      onChange={(e) => handleChannelChange('salesforce_consumer_secret', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors"
                      placeholder="1234567890ABCDEF..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="email"
                      value={formData.salesforce_username}
                      onChange={(e) => handleChannelChange('salesforce_username', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors"
                      placeholder="usuario@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.salesforce_password}
                      onChange={(e) => handleChannelChange('salesforce_password', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-colors"
                      placeholder="contraseña123"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empleados - Solo mostrar si no está en modo específico */}
        {!isCompanySpecificMode && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <UserGroupIcon className="h-6 w-6 mr-3 text-green-600" />
                Empleados ({employees.length})
              </h2>
              <button
                type="button"
                onClick={addEmployee}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Empleado
              </button>
            </div>

          <div className="space-y-4">
            {currentEmployees.map((employee, index) => (
              <div key={employee.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Empleado {index + 1}
                  </h3>
                  {employees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmployee(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar empleado"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={employee.name}
                      onChange={(e) => updateEmployee(index, 'name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Juan Pérez González"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={employee.email}
                      onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="juan.perez@empresa.cl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={employee.phone}
                      onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="+56912345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={employee.department}
                      onChange={(e) => updateEmployee(index, 'department', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Operaciones"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={employee.position}
                      onChange={(e) => updateEmployee(index, 'position', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Jefe de Operaciones"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Mostrando {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, employees.length)} de {employees.length} empleados
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                {/* Números de página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === number
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            {loading ? 'Guardando...' : (isCompanySpecificMode ? 'Guardar Configuración' : (company ? 'Actualizar Empresa' : 'Crear Empresa'))}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CompanyForm