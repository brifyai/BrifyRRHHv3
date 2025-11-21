import React, { useState, useEffect, useCallback } from 'react'
import inMemoryUserService from '../../services/inMemoryUserService.js'
import {
  UserIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  CheckIcon,
  ArrowLeftIcon,
  DocumentCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const UserForm = ({ user, roles, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role_id: '',
    is_active: true
  })
  const [selectedRole, setSelectedRole] = useState(null)
  const [rolePermissions, setRolePermissions] = useState([])
  const [permissionsByCategory, setPermissionsByCategory] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        role_id: user.role_id || '',
        is_active: user.is_active !== false
      })
      setSelectedRole(user.role)
      loadRolePermissions(user.role_id)
    }
  }, [user])

const loadRolePermissions = async (roleId) => {
    if (!roleId) {
      setRolePermissions([])
      return
    }

    try {
      const permissions = await inMemoryUserService.getRolePermissions(roleId)
      setRolePermissions(permissions)
    } catch (error) {
      console.error('Error loading role permissions:', error)
    }
  }

  const loadPermissionsByCategory = useCallback(async () => {
    try {
      const categories = await inMemoryUserService.getPermissionsByCategory()
      setPermissionsByCategory(categories)
    } catch (error) {
      console.error('Error loading permissions by category:', error)
    }
  }, [])

  useEffect(() => {
    loadPermissionsByCategory()
  }, [loadPermissionsByCategory])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (field === 'role_id') {
      const role = roles.find(r => r.id === value)
      setSelectedRole(role)
      loadRolePermissions(value)
    }
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio')
      return false
    }

    if (!formData.full_name.trim()) {
      toast.error('El nombre completo es obligatorio')
      return false
    }

    if (!formData.role_id) {
      toast.error('Debe seleccionar un rol')
      return false
    }

    // Validar formato de email
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('El email no tiene un formato válido')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      if (user) {
        // Actualizar usuario existente
        await inMemoryUserService.updateUser(user.id, formData)
        toast.success('Usuario actualizado exitosamente')
      } else {
        // Crear nuevo usuario
        await inMemoryUserService.createUser(formData)
        toast.success('Usuario creado exitosamente')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Error al guardar el usuario')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'super_admin': return <ShieldCheckIcon className="h-5 w-5 text-red-600" />
      case 'director': return <Cog6ToothIcon className="h-5 w-5 text-purple-600" />
      case 'executive': return <UserIcon className="h-5 w-5 text-blue-600" />
      case 'redactor': return <UserGroupIcon className="h-5 w-5 text-green-600" />
      default: return <UserIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'dashboard': return '📊'
      case 'communication': return '💬'
      case 'files': return '📁'
      case 'drive': return '☁️'
      case 'plans': return '💳'
      case 'settings': return '⚙️'
      case 'profile': return '👤'
      case 'search': return '🔍'
      case 'legal': return '⚖️'
      default: return '🔧'
    }
  }

  const getCategoryName = (category) => {
    const names = {
      dashboard: 'Dashboard',
      communication: 'Comunicación',
      files: 'Archivos',
      drive: 'Google Drive',
      plans: 'Planes',
      settings: 'Configuración',
      profile: 'Perfil',
      search: 'Búsqueda',
      legal: 'Legal'
    }
    return names[category] || category
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
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mr-4">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h1>
            <p className="text-gray-600">
              {user ? 'Modifica la información del usuario' : 'Crea un nuevo usuario con rol y permisos'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <UserIcon className="h-6 w-6 mr-3 text-green-600" />
            Información del Usuario
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="usuario@empresa.cl"
                required
                disabled={!!user} // No permitir cambiar email de usuarios existentes
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="Juan Pérez González"
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={() => handleInputChange('is_active', true)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Activo</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_active"
                  checked={!formData.is_active}
                  onChange={() => handleInputChange('is_active', false)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Inactivo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Rol y Permisos */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <ShieldCheckIcon className="h-6 w-6 mr-3 text-blue-600" />
            Rol y Permisos
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Rol del Usuario *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.role_id === role.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={formData.role_id === role.id}
                    onChange={(e) => handleInputChange('role_id', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-1">
                    {getRoleIcon(role.name)}
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{role.name_es}</div>
                      <div className="text-sm text-gray-600">{role.description}</div>
                    </div>
                  </div>
                  {formData.role_id === role.id && (
                    <CheckIcon className="h-5 w-5 text-blue-600" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Mostrar permisos del rol seleccionado */}
          {selectedRole && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Permisos del Rol: {selectedRole.name_es}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  {showPermissions ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver Permisos
                    </>
                  )}
                </button>
              </div>

              {showPermissions && (
                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                    const rolePermsInCategory = rolePermissions.filter(p => p.category === category)

                    if (rolePermsInCategory.length === 0) return null

                    return (
                      <div key={category} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                          <span className="text-lg mr-2">{getCategoryIcon(category)}</span>
                          <h4 className="font-medium text-gray-900">{getCategoryName(category)}</h4>
                          <span className="ml-2 text-sm text-gray-500">
                            ({rolePermsInCategory.length} permisos)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {rolePermsInCategory.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border"
                            >
                              <CheckIcon className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                              {permission.name_es}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <div className="font-medium text-blue-900">
                      Nivel Jerárquico: {selectedRole.hierarchy_level}/100
                    </div>
                    <div className="text-sm text-blue-700">
                      {rolePermissions.length} permisos asignados automáticamente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentCheckIcon className="h-5 w-5 mr-2" />
            {loading ? 'Guardando...' : (user ? 'Actualizar Usuario' : 'Crear Usuario')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UserForm