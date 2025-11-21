import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import { db, supabase } from '../../lib/supabase.js'
import googleDriveService from '../../lib/googleDrive.js'
import {
  FolderIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner.js'
import toast from 'react-hot-toast'

const Folders = () => {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [breadcrumb, setBreadcrumb] = useState([{ name: 'Inicio', id: null }])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [selectedParentFolder, setSelectedParentFolder] = useState(null)
  const [availableSubFolders, setAvailableSubFolders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Cargar carpetas de Google Drive y base de datos
  const loadFolders = useCallback(async (parentId = null) => {
    try {
      setLoading(true)
      
      let dbFolders = []
      
      if (parentId) {
        // Si estamos dentro de una carpeta, cargar subcarpetas (carpetas de usuario)
        const { data, error } = await db.userFolders.getByAdministrador(user.email)
        if (error) throw error
        dbFolders = (data || []).map(folder => ({
          ...folder,
          folder_name: folder.correo, // El nombre de la carpeta es el correo
          google_folder_id: folder.id_carpeta_drive,
          type: 'user'
        }))
      } else {
        // Cargar carpeta administrador y carpetas de usuario
        const { data: adminData, error: adminError } = await db.adminFolders.getByUser(user.id)
        if (adminError) throw adminError
        
        const { data: userData, error: userError } = await db.userFolders.getByAdministrador(user.email)
        if (userError) throw userError
        
        // Combinar carpetas admin y de usuario
        const adminFolders = (adminData || []).map(folder => ({
          ...folder,
          folder_name: 'Master - StaffHub',
          google_folder_id: folder.id_drive_carpeta,
          type: 'admin'
        }))
        
        const userFolders = (userData || []).map(folder => ({
          ...folder,
          folder_name: folder.correo,
          google_folder_id: folder.id_carpeta_drive,
          type: 'user'
        }))
        
        dbFolders = [...adminFolders, ...userFolders]
      }
      
      // Si el usuario tiene Google Drive conectado, sincronizar con Drive
      if (userProfile?.google_refresh_token) {
        try {
          const tokenSet = await googleDriveService.setTokens({
            refresh_token: userProfile.google_refresh_token
          })
          
          if (!tokenSet) {
            console.error('Failed to set Google Drive tokens')
            setFolders(dbFolders)
            return
          }
          
          // Obtener carpetas de Google Drive
          const driveFolders = await googleDriveService.listFiles(parentId, 'folder')
          
          // Combinar información de DB y Drive
          const combinedFolders = dbFolders.map(dbFolder => {
            const driveFolder = (driveFolders && Array.isArray(driveFolders)) 
              ? driveFolders.find(df => df.id === dbFolder.google_folder_id)
              : null
            return {
              ...dbFolder,
              driveInfo: driveFolder,
              synced: !!driveFolder
            }
          })
          
          setFolders(combinedFolders)
        } catch (error) {
          console.error('Error syncing with Google Drive:', error)
          setFolders(dbFolders.map(folder => ({ ...folder, synced: false })))
        }
      } else {
        setFolders(dbFolders.map(folder => ({ ...folder, synced: false })))
      }
      
    } catch (error) {
      console.error('Error loading folders:', error)
      toast.error('Error cargando las carpetas')
    } finally {
      setLoading(false)
    }
  }, [user.id, user.email, userProfile?.google_refresh_token])

  // Cargar subcarpetas disponibles para selección de carpeta padre
  const loadAvailableSubFolders = useCallback(async () => {
    try {
      console.log('🔄 Iniciando carga de subcarpetas...')
      
      // Realizar ambas consultas en paralelo para mejorar rendimiento
      const [subFoldersResult, userExtensionsResult] = await Promise.all([
        // Consulta de subcarpetas
        supabase
          .from('sub_carpetas_administrador')
          .select('*')
          .eq('administrador_email', user.email),
        // Consulta de extensiones del usuario
        supabase
          .from('plan_extensiones')
          .select(`
            *,
            extensiones (
              id,
              name,
              name_es,
              description,
              description_es,
              price,
              disponible
            )
          `)
          .eq('user_id', user.id)
      ])
      
      let subFolders = subFoldersResult.data
      let error = subFoldersResult.error
      
      // Si no encuentra subcarpetas, intentar con el email del administrador de carpeta_administrador
      if ((!subFolders || subFolders.length === 0) && !error) {
        console.log('🔍 No se encontraron subcarpetas, buscando con administrador...')
        const { data: adminData } = await db.adminFolders.getByUser(user.id)
        if (adminData && adminData.length > 0) {
          const adminEmail = adminData[0].administrador
          const result = await supabase
            .from('sub_carpetas_administrador')
            .select('*')
            .eq('administrador_email', adminEmail)
          subFolders = result.data
          error = result.error
        }
      }
      
      if (error) {
        console.error('❌ Error loading subfolders:', error)
        return
      }
      
      const userExtensions = userExtensionsResult.data
      if (userExtensionsResult.error) {
        console.error('❌ Error loading user extensions:', userExtensionsResult.error)
        return
      }
      
      console.log('📊 Extensiones del usuario:', userExtensions)
      console.log('📁 Subcarpetas encontradas:', subFolders)
      
      // Crear mapeo de extensiones activas para mejor rendimiento
      const activeExtensionTypes = new Set(['staffhub']) // StaffHub siempre disponible
      
      userExtensions?.forEach(ext => {
        const extensionName = ext.extensiones?.name_es || ext.extensiones?.name
        if (extensionName === 'Entrenador') activeExtensionTypes.add('entrenador')
        if (extensionName === 'Abogados') activeExtensionTypes.add('abogados')
        if (extensionName === 'Veterinarios') activeExtensionTypes.add('veterinarios')
      })
      
      console.log('🎯 Tipos de extensión activos:', Array.from(activeExtensionTypes))
      
      // Filtrar subcarpetas según extensiones activas del usuario
      const availableSubFolders = (subFolders || []).filter(subfolder => {
        const isAvailable = activeExtensionTypes.has(subfolder.tipo_extension)
        console.log(`📋 Subcarpeta ${subfolder.nombre_subcarpeta} (${subfolder.tipo_extension}): ${isAvailable ? 'DISPONIBLE' : 'NO DISPONIBLE'}`)
        return isAvailable
      })
      
      console.log('✅ Subcarpetas disponibles finales:', availableSubFolders)
      setAvailableSubFolders(availableSubFolders)
      
      // Seleccionar StaffHub por defecto si está disponible
      const defaultFolder = availableSubFolders.find(f => f.tipo_extension === 'staffhub') || availableSubFolders[0]
      console.log('🎯 Carpeta por defecto seleccionada:', defaultFolder)
      setSelectedParentFolder(defaultFolder)
    } catch (error) {
      console.error('❌ Error loading available subfolders:', error)
    }
  }, [user.id, user.email])

  // Cargar automáticamente la carpeta administrador por defecto
  const loadAdminFolderByDefault = useCallback(async () => {
    try {
      setLoading(true)
      
      // Obtener la carpeta administrador del usuario
      const { data: adminData, error: adminError } = await db.adminFolders.getByUser(user.id)
      if (adminError) throw adminError
      
      if (adminData && adminData.length > 0) {
        const adminFolder = adminData[0]
        // Establecer la carpeta administrador como carpeta actual
        setCurrentFolder({
          ...adminFolder,
          folder_name: 'Master - StaffHub',
          google_folder_id: adminFolder.id_drive_carpeta,
          type: 'admin'
        })
        setBreadcrumb([
          { name: 'Inicio', id: null },
          { name: 'Master - StaffHub', id: adminFolder.id }
        ])
        
        // Cargar las carpetas de usuario dentro de la carpeta administrador
        await loadFolders(adminFolder.id_drive_carpeta)
      } else {
        // Si no hay carpeta administrador, cargar vista normal
        await loadFolders()
      }
    } catch (error) {
      console.error('Error loading admin folder by default:', error)
      // En caso de error, cargar vista normal
      await loadFolders()
    }
  }, [user.id, loadFolders])

  // Cargar datos iniciales
  useEffect(() => {
    loadAdminFolderByDefault()
    loadAvailableSubFolders()
  }, [loadAdminFolderByDefault, loadAvailableSubFolders])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('El nombre de la carpeta es requerido')
      return
    }

    try {
      setCreating(true)
      
      let parentFolderId = selectedParentFolder?.id_drive_carpeta || null
      
      // Si no hay carpeta padre seleccionada, usar la carpeta actual
      if (!parentFolderId && currentFolder) {
        parentFolderId = currentFolder.google_folder_id
      }
      
      // Crear carpeta en Google Drive
      const folderData = {
        name: newFolderName.trim(),
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : []
      }
      
      const createdFolder = await googleDriveService.createFile(folderData)
      
      if (!createdFolder) {
        throw new Error('No se pudo crear la carpeta en Google Drive')
      }
      
      // Guardar en base de datos
      const folderRecord = {
        correo: newFolderName.trim(),
        id_carpeta_drive: createdFolder.id,
        administrador: user.email,
        fecha_creacion: new Date().toISOString()
      }
      
      const { error: dbError } = await db.userFolders.create(folderRecord)
      if (dbError) throw dbError
      
      toast.success('Carpeta creada exitosamente')
      setShowCreateModal(false)
      setNewFolderName('')
      
      // Recargar carpetas
      await loadFolders()
      
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Error creando la carpeta')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folder.folder_name}"?`)) {
      return
    }

    try {
      // Eliminar de Google Drive
      if (folder.google_folder_id) {
        await googleDriveService.deleteFile(folder.google_folder_id)
      }
      
      // Eliminar de base de datos
      const { error } = await db.userFolders.delete(folder.id)
      if (error) throw error
      
      toast.success('Carpeta eliminada exitosamente')
      
      // Recargar carpetas
      await loadFolders()
      
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Error eliminando la carpeta')
    }
  }

  const handleFolderClick = (folder) => {
    if (folder.type === 'admin') {
      // Navegar a la carpeta administrador
      setCurrentFolder(folder)
      setBreadcrumb([
        { name: 'Inicio', id: null },
        { name: 'Master - StaffHub', id: folder.id }
      ])
      loadFolders(folder.google_folder_id)
    } else {
      // Navegar a la carpeta de usuario
      navigate(`/employees?folder=${folder.google_folder_id}`)
    }
  }

  const handleBreadcrumbClick = (breadcrumbItem) => {
    if (breadcrumbItem.id === null) {
      // Volver al inicio
      setCurrentFolder(null)
      setBreadcrumb([{ name: 'Inicio', id: null }])
      loadFolders()
    } else {
      // Navegar a una carpeta específica
      const folder = folders.find(f => f.id === breadcrumbItem.id)
      if (folder) {
        handleFolderClick(folder)
      }
    }
  }

  // Filtrar carpetas según el término de búsqueda
  const filteredFolders = folders.filter(folder =>
    folder.folder_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carpetas</h1>
            <p className="text-gray-600">Gestiona las carpetas de empleados</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Carpeta
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 1 && (
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumb.map((item, index) => (
              <li key={item.id || 'home'} className="inline-flex items-center">
                {index > 0 && (
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <button
                  onClick={() => handleBreadcrumbClick(item)}
                  className={`inline-flex items-center text-sm font-medium ${
                    index === breadcrumb.length - 1
                      ? 'text-gray-500'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar carpetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredFolders.map((folder) => (
          <div
            key={folder.id}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FolderIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {folder.type === 'admin' ? 'Carpeta Administrador' : 'Carpeta de Usuario'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {folder.folder_name}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <button
                  onClick={() => handleFolderClick(folder)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Ver contenido
                </button>
              </div>
              {folder.type === 'user' && (
                <div className="mt-2 flex justify-between">
                  <span className="text-xs text-gray-500">
                    {folder.synced ? 'Sincronizado' : 'No sincronizado'}
                  </span>
                  <button
                    onClick={() => handleDeleteFolder(folder)}
                    className="text-xs text-red-600 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredFolders.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay carpetas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron carpetas que coincidan con tu búsqueda.' : 'Comienza creando una nueva carpeta.'}
          </p>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Crear Nueva Carpeta
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la carpeta
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nombre de la carpeta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {availableSubFolders.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carpeta padre (opcional)
                  </label>
                  <select
                    value={selectedParentFolder?.id || ''}
                    onChange={(e) => {
                      const folder = availableSubFolders.find(f => f.id === e.target.value)
                      setSelectedParentFolder(folder || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar carpeta padre</option>
                    {availableSubFolders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.nombre_subcarpeta}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewFolderName('')
                    setSelectedParentFolder(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={creating || !newFolderName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Folders