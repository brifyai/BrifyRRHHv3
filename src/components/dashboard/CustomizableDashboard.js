/**
 * Customizable Dashboard
 * Dashboard personalizable con widgets arrastrables y temas
 * 
 * ✅ NO MODIFICA código existente
 * ✅ Completamente independiente
 * ✅ Puede ser desactivado sin afectar el sistema
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CogIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

// Configuración de widgets por defecto
const DEFAULT_WIDGETS = [
  {
    id: 'stats-overview',
    type: 'stats',
    title: 'Resumen de Estadísticas',
    size: 'large',
    position: { x: 0, y: 0, w: 2, h: 1 },
    config: {
      showTrends: true,
      metrics: ['users', 'messages', 'engagement']
    }
  },
  {
    id: 'recent-activity',
    type: 'activity',
    title: 'Actividad Reciente',
    size: 'medium',
    position: { x: 2, y: 0, w: 1, h: 2 },
    config: {
      maxItems: 10,
      showTimestamp: true
    }
  },
  {
    id: 'quick-actions',
    type: 'actions',
    title: 'Acciones Rápidas',
    size: 'small',
    position: { x: 3, y: 0, w: 1, h: 1 },
    config: {
      actions: ['new-message', 'add-user', 'view-reports']
    }
  },
  {
    id: 'chart-performance',
    type: 'chart',
    title: 'Rendimiento',
    size: 'large',
    position: { x: 0, y: 1, w: 2, h: 2 },
    config: {
      chartType: 'line',
      timeRange: '7d'
    }
  },
  {
    id: 'notifications',
    type: 'notifications',
    title: 'Notificaciones',
    size: 'medium',
    position: { x: 2, y: 2, w: 1, h: 1 },
    config: {
      maxItems: 5,
      showUnreadOnly: true
    }
  }
]

// Temos disponibles
const THEMES = {
  light: {
    name: 'Claro',
    icon: SunIcon,
    colors: {
      background: 'bg-gray-50',
      card: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-gray-200',
      primary: 'bg-blue-500',
      secondary: 'bg-gray-100'
    }
  },
  dark: {
    name: 'Oscuro',
    icon: MoonIcon,
    colors: {
      background: 'bg-gray-900',
      card: 'bg-gray-800',
      text: 'text-gray-100',
      textSecondary: 'text-gray-400',
      border: 'border-gray-700',
      primary: 'bg-blue-600',
      secondary: 'bg-gray-700'
    }
  },
  auto: {
    name: 'Automático',
    icon: ComputerDesktopIcon,
    colors: {
      background: 'bg-gray-50 dark:bg-gray-900',
      card: 'bg-white dark:bg-gray-800',
      text: 'text-gray-900 dark:text-gray-100',
      textSecondary: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700',
      primary: 'bg-blue-500 dark:bg-blue-600',
      secondary: 'bg-gray-100 dark:bg-gray-700'
    }
  }
}

const CustomizableDashboard = ({ userId = 'default' }) => {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [theme, setTheme] = useState('auto')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false)
  const [savedLayouts, setSavedLayouts] = useState([])
  const [currentLayoutName, setCurrentLayoutName] = useState('Por Defecto')
  const [showLayoutDialog, setShowLayoutDialog] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState(null)
  
  // Cargar configuración guardada
  useEffect(() => {
    loadDashboardConfig()
    setupKeyboardShortcuts()
    setupThemeDetection()
  }, [userId])

  const loadDashboardConfig = useCallback(() => {
    try {
      const savedConfig = localStorage.getItem(`dashboard_config_${userId}`)
      if (savedConfig) {
        const config = JSON.parse(savedConfig)
        setWidgets(config.widgets || DEFAULT_WIDGETS)
        setTheme(config.theme || 'auto')
        setIsCompactMode(config.compactMode || false)
        setCurrentLayoutName(config.layoutName || 'Por Defecto')
      }

      const savedLayoutsData = localStorage.getItem(`dashboard_layouts_${userId}`)
      if (savedLayoutsData) {
        setSavedLayouts(JSON.parse(savedLayoutsData))
      }
    } catch (error) {
      console.error('Error loading dashboard config:', error)
    }
  }, [userId])

  const saveDashboardConfig = useCallback(() => {
    try {
      const config = {
        widgets,
        theme,
        compactMode: isCompactMode,
        layoutName: currentLayoutName,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(`dashboard_config_${userId}`, JSON.stringify(config))
    } catch (error) {
      console.error('Error saving dashboard config:', error)
    }
  }, [widgets, theme, isCompactMode, currentLayoutName, userId])

  const setupKeyboardShortcuts = useCallback(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + E: Edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        setIsEditMode(!isEditMode)
      }
      
      // Ctrl/Cmd + S: Save layout
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCurrentLayout()
      }
      
      // Ctrl/Cmd + D: Toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        toggleTheme()
      }
      
      // Escape: Exit edit mode
      if (e.key === 'Escape' && isEditMode) {
        setIsEditMode(false)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isEditMode])

  const setupThemeDetection = useCallback(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      if (theme === 'auto') {
        applyTheme('auto')
      }
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [theme])

  const applyTheme = useCallback((newTheme) => {
    const root = document.documentElement
    
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else if (newTheme === 'light') {
      root.classList.remove('dark')
    } else {
      // Auto theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const themes = Object.keys(THEMES)
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }, [theme, applyTheme])

  // Guardar configuración cuando cambia
  useEffect(() => {
    saveDashboardConfig()
  }, [saveDashboardConfig])

  // Aplicar tema cuando cambia
  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return

    const items = Array.from(widgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setWidgets(items)
  }, [widgets])

  const removeWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
  }, [])

  const addWidget = useCallback((widgetType) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: `Nuevo ${widgetType}`,
      size: 'medium',
      position: { x: 0, y: 0, w: 1, h: 1 },
      config: {}
    }
    setWidgets(prev => [...prev, newWidget])
  }, [])

  const updateWidgetConfig = useCallback((widgetId, newConfig) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, config: { ...widget.config, ...newConfig } }
        : widget
    ))
  }, [])

  const saveCurrentLayout = useCallback(() => {
    const layoutName = prompt('Nombre del layout:', currentLayoutName)
    if (!layoutName) return

    const layout = {
      name: layoutName,
      widgets,
      theme,
      compactMode: isCompactMode,
      createdAt: new Date().toISOString()
    }

    const existingLayoutIndex = savedLayouts.findIndex(l => l.name === layoutName)
    let newLayouts
    
    if (existingLayoutIndex >= 0) {
      newLayouts = [...savedLayouts]
      newLayouts[existingLayoutIndex] = layout
    } else {
      newLayouts = [...savedLayouts, layout]
    }

    setSavedLayouts(newLayouts)
    setCurrentLayoutName(layoutName)
    localStorage.setItem(`dashboard_layouts_${userId}`, JSON.stringify(newLayouts))
  }, [widgets, theme, isCompactMode, currentLayoutName, savedLayouts, userId])

  const loadLayout = useCallback((layoutName) => {
    const layout = savedLayouts.find(l => l.name === layoutName)
    if (!layout) return

    setWidgets(layout.widgets)
    setTheme(layout.theme)
    setIsCompactMode(layout.compactMode)
    setCurrentLayoutName(layoutName)
  }, [savedLayouts])

  const deleteLayout = useCallback((layoutName) => {
    // Usar window.confirm para evitar el warning de ESLint
    if (!window.confirm(`¿Eliminar el layout "${layoutName}"?`)) return

    const newLayouts = savedLayouts.filter(l => l.name !== layoutName)
    setSavedLayouts(newLayouts)
    localStorage.setItem(`dashboard_layouts_${userId}`, JSON.stringify(newLayouts))

    if (currentLayoutName === layoutName) {
      // Cargar layout por defecto
      setWidgets(DEFAULT_WIDGETS)
      setCurrentLayoutName('Por Defecto')
    }
  }, [savedLayouts, currentLayoutName, userId])

  const getWidgetSize = useCallback((size) => {
    const baseClass = isCompactMode ? 'p-3' : 'p-6'
    const sizeClasses = {
      small: `col-span-1 row-span-1 ${baseClass}`,
      medium: `col-span-1 row-span-2 ${baseClass}`,
      large: `col-span-2 row-span-2 ${baseClass}`,
      full: `col-span-4 row-span-2 ${baseClass}`
    }
    return sizeClasses[size] || sizeClasses.medium
  }, [isCompactMode])

  const currentTheme = THEMES[theme]

  // Componente Widget
  const Widget = ({ widget, index }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    const renderWidgetContent = () => {
      switch (widget.type) {
        case 'stats':
          return <StatsWidget config={widget.config} isCompact={isCompactMode} />
        case 'activity':
          return <ActivityWidget config={widget.config} isCompact={isCompactMode} />
        case 'actions':
          return <ActionsWidget config={widget.config} isCompact={isCompactMode} />
        case 'chart':
          return <ChartWidget config={widget.config} isCompact={isCompactMode} />
        case 'notifications':
          return <NotificationsWidget config={widget.config} isCompact={isCompactMode} />
        default:
          return <div>Widget no encontrado</div>
      }
    }

    return (
      <Draggable draggableId={widget.id} index={index} isDragDisabled={!isEditMode}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
              ${getWidgetSize(widget.size)}
              ${currentTheme.colors.card} 
              ${currentTheme.colors.border} 
              border rounded-lg shadow-sm hover:shadow-md transition-all duration-200
              ${snapshot.isDragging ? 'opacity-50 scale-105' : ''}
              ${isEditMode ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
              relative group
            `}
          >
            {/* Header del widget */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${currentTheme.colors.text}`}>
                {widget.title}
              </h3>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isEditMode && (
                  <>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className={`p-1 rounded ${currentTheme.colors.secondary} ${currentTheme.colors.textSecondary} hover:bg-red-100 hover:text-red-600`}
                      title="Eliminar widget"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <div {...provided.dragHandleProps} className="cursor-move">
                      <ArrowsPointingOutIcon className={`w-4 h-4 ${currentTheme.colors.textSecondary}`} />
                    </div>
                  </>
                )}
                
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`p-1 rounded ${currentTheme.colors.secondary} ${currentTheme.colors.textSecondary}`}
                  title={isExpanded ? "Comprimir" : "Expandir"}
                >
                  {isExpanded ? (
                    <ArrowsPointingInIcon className="w-4 h-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Contenido del widget */}
            <div className={isExpanded ? 'max-h-96 overflow-y-auto' : 'overflow-hidden'}>
              {renderWidgetContent()}
            </div>
          </div>
        )}
      </Draggable>
    )
  }

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} ${currentTheme.colors.text}`}>
      {/* Header de control */}
      <div className={`${currentTheme.colors.card} ${currentTheme.colors.border} border-b sticky top-0 z-10`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className={`text-2xl font-bold ${currentTheme.colors.text}`}>
                Dashboard Personalizable
              </h1>
              
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${currentTheme.colors.textSecondary}`}>
                  Layout: {currentLayoutName}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Selector de tema */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg ${currentTheme.colors.secondary} ${currentTheme.colors.text} hover:opacity-80`}
                  title={`Tema: ${currentTheme.name}`}
                >
                  <currentTheme.icon className="w-5 h-5" />
                </button>
              </div>

              {/* Modo compacto */}
              <button
                onClick={() => setIsCompactMode(!isCompactMode)}
                className={`p-2 rounded-lg ${currentTheme.colors.secondary} ${currentTheme.colors.text} hover:opacity-80`}
                title="Modo compacto"
              >
                <ArrowsPointingInIcon className="w-5 h-5" />
              </button>

              {/* Edit mode */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditMode 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : `${currentTheme.colors.secondary} ${currentTheme.colors.text}`
                }`}
              >
                {isEditMode ? 'Guardar' : 'Editar'}
              </button>

              {/* Layouts */}
              <div className="relative">
                <button
                  onClick={() => setShowLayoutDialog(!showLayoutDialog)}
                  className={`p-2 rounded-lg ${currentTheme.colors.secondary} ${currentTheme.colors.text} hover:opacity-80`}
                  title="Gestionar layouts"
                >
                  <CogIcon className="w-5 h-5" />
                </button>

                {showLayoutDialog && (
                  <div className={`absolute right-0 mt-2 w-64 ${currentTheme.colors.card} ${currentTheme.colors.border} border rounded-lg shadow-lg z-20`}>
                    <div className="p-4">
                      <h4 className={`font-semibold ${currentTheme.colors.text} mb-3`}>
                        Layouts Guardados
                      </h4>
                      
                      <div className="space-y-2">
                        {savedLayouts.map(layout => (
                          <div key={layout.name} className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                loadLayout(layout.name)
                                setShowLayoutDialog(false)
                              }}
                              className={`text-left ${currentTheme.colors.textSecondary} hover:${currentTheme.colors.text}`}
                            >
                              {layout.name}
                            </button>
                            <button
                              onClick={() => deleteLayout(layout.name)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={saveCurrentLayout}
                          className={`w-full px-3 py-2 ${currentTheme.colors.primary} text-white rounded-lg hover:opacity-90`}
                        >
                          Guardar Layout Actual
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Atajos de teclado */}
          {isEditMode && (
            <div className={`mt-3 text-sm ${currentTheme.colors.textSecondary}`}>
              Atajos: <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+E</kbd> Editar • 
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+S</kbd> Guardar • 
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+D</kbd> Tema • 
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> Salir
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-4 gap-4 auto-rows-min"
              >
                {widgets.map((widget, index) => (
                  <Widget key={widget.id} widget={widget} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Botón para agregar widget (solo en modo edición) */}
        {isEditMode && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => {
                const widgetTypes = ['stats', 'activity', 'actions', 'chart', 'notifications']
                const type = prompt(`Tipo de widget (${widgetTypes.join(', ')}):`)
                if (type && widgetTypes.includes(type)) {
                  addWidget(type)
                }
              }}
              className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
              title="Agregar widget"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Widgets componentes (simplificados para ejemplo)
const StatsWidget = ({ config, isCompact }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">1,234</div>
        <div className={`text-xs ${isCompact ? 'text-gray-500' : 'text-gray-600'}`}>Usuarios</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">5,678</div>
        <div className={`text-xs ${isCompact ? 'text-gray-500' : 'text-gray-600'}`}>Mensajes</div>
      </div>
    </div>
  </div>
)

const ActivityWidget = ({ config, isCompact }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className={`text-sm ${isCompact ? 'text-gray-700' : 'text-gray-600'}`}>Nuevo usuario registrado</span>
      <span className="text-xs text-gray-400">hace 5 min</span>
    </div>
    <div className="flex items-center justify-between">
      <span className={`text-sm ${isCompact ? 'text-gray-700' : 'text-gray-600'}`}>Mensaje enviado</span>
      <span className="text-xs text-gray-400">hace 15 min</span>
    </div>
  </div>
)

const ActionsWidget = ({ config, isCompact }) => (
  <div className="grid grid-cols-2 gap-2">
    <button className={`p-2 ${isCompact ? 'text-xs' : 'text-sm'} bg-blue-500 text-white rounded hover:bg-blue-600`}>
      Nuevo Mensaje
    </button>
    <button className={`p-2 ${isCompact ? 'text-xs' : 'text-sm'} bg-green-500 text-white rounded hover:bg-green-600`}>
      Agregar Usuario
    </button>
  </div>
)

const ChartWidget = ({ config, isCompact }) => (
  <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
    <span className="text-gray-500">Gráfico de rendimiento</span>
  </div>
)

const NotificationsWidget = ({ config, isCompact }) => (
  <div className="space-y-2">
    <div className={`p-2 ${isCompact ? 'text-xs' : 'text-sm'} bg-blue-50 dark:bg-blue-900/20 rounded`}>
      <div className="font-medium">Nueva notificación</div>
      <div className="text-gray-600 dark:text-gray-400">Sistema actualizado</div>
    </div>
  </div>
)

export default CustomizableDashboard