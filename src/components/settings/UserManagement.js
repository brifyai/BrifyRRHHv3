import React, { useState, useEffect, useCallback } from 'react'
import organizedDatabaseService from '../../services/organizedDatabaseService.js'
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import UserForm from './UserForm.js'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Cargar usuarios y roles desde la base de datos organizada
      const [usersData, rolesData] = await Promise.all([
        organizedDatabaseService.getUsers(),
        organizedDatabaseService.getRoles()
      ])

      setUsers(usersData || [])
      setRoles(rolesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateUser = () => {
    setEditingUser(null)
    setShowUserForm(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowUserForm(true)
  }

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) return

    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div>
          <p className="font-medium">¿Eliminar usuario "{userToDelete.full_name}"?</p>
          <p className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                resolve(true)
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Eliminar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                resolve(false)
              }}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      ), { duration: 10000 })
    })

    if (!confirmed) return

    try {
      await organizedDatabaseService.deleteUser(userId)
      toast.success('Usuario eliminado exitosamente')
      loadData()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar el usuario')
    }
  }

  const handleToggleUserStatus = async (userId) => {
    try {
      await organizedDatabaseService.toggleUserStatus(userId)
      toast.success('Estado del usuario actualizado')
      loadData()
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Error al cambiar el estado del usuario')
    }
  }

  const handleFormSuccess = () => {
    setShowUserForm(false)
    setEditingUser(null)
    loadData()
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.name_es?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (roleName) => {
    switch (roleName) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'director': return 'bg-purple-100 text-purple-800'
      case 'executive': return 'bg-blue-100 text-blue-800'
      case 'redactor': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'super_admin': return <ShieldCheckIcon className="h-4 w-4" />
      case 'director': return <Cog6ToothIcon className="h-4 w-4" />
      case 'executive': return <UserIcon className="h-4 w-4" />
      case 'redactor': return <UserGroupIcon className="h-4 w-4" />
      default: return <UserIcon className="h-4 w-4" />
    }
  }

  if (showUserForm) {
    return (
      <UserForm
        user={editingUser}
        roles={roles}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowUserForm(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <UserGroupIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
            <p className="text-gray-600">Administra usuarios, roles y permisos del sistema</p>
          </div>
        </div>
        <button
          onClick={handleCreateUser}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar usuarios por nombre, email o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredUsers.length} de {users.length} usuarios
          </div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron usuarios con ese criterio de búsqueda.' : 'Comienza creando el primer usuario.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={handleCreateUser}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crear Primer Usuario
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="relative bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mr-3">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{user.full_name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleUserStatus(user.id)}
                  className={`p-1 rounded-full ${
                    user.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                >
                  {user.is_active ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Role Badge */}
              <div className="mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role.name)}`}>
                  {getRoleIcon(user.role.name)}
                  <span className="ml-2">{user.role.name_es}</span>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${user.is_active ? 'text-green-700' : 'text-red-700'}`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Permissions Count */}
              <div className="mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{user.permissions.length}</span> permisos asignados
                </div>
              </div>

              {/* Last Login */}
              {user.last_login && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500">
                    Último acceso: {new Date(user.last_login).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditUser(user)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar usuario"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar usuario"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roles Summary */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Roles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roles.map((role) => {
            const roleUsers = users.filter(u => u.role_id === role.id)
            const activeUsers = roleUsers.filter(u => u.is_active)

            return (
              <div key={role.id} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${getRoleBadgeColor(role.name)}`}>
                  {getRoleIcon(role.name)}
                </div>
                <div className="text-sm font-medium text-gray-900">{role.name_es}</div>
                <div className="text-lg font-bold text-gray-700">{activeUsers.length}</div>
                <div className="text-xs text-gray-500">
                  {roleUsers.length - activeUsers.length > 0 && `${roleUsers.length - activeUsers.length} inactivos`}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UserManagement