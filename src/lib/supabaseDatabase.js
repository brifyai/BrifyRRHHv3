import { supabase } from './supabaseClient.js'
import { withRateLimit } from './supabaseRateLimiter.js'

// 🔥 NUEVO: Función auxiliar para reintentos con backoff exponencial simple
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      return result
    } catch (error) {
      console.warn(`Intento ${attempt}/${maxRetries} falló:`, error.message)
      
      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Función auxiliar para manejar errores de red
const handleNetworkError = (error, operation) => {
  console.error(`❌ Error en ${operation}:`, error)
  
  if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES') || 
      error.message?.includes('Failed to fetch') ||
      error.code === 'NETWORK_ERROR') {
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: `Error de conexión en ${operation}. Reintentando...`,
        originalError: error
      }
    }
  }
  
  return { data: null, error }
}

// Funciones de base de datos
export const db = {
  // Usuarios
  users: {
    create: async (userData) => {
      try {
        if (!userData || typeof userData !== 'object') {
          throw new Error('userData debe ser un objeto válido');
        }
        if (!userData.email || !userData.email.includes('@')) {
          throw new Error('Email inválido');
        }

        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en users.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    upsert: async (userData) => {
      try {
        if (!userData || typeof userData !== 'object') {
          throw new Error('userData debe ser un objeto válido');
        }
        if (!userData.id) {
          throw new Error('ID es requerido para upsert');
        }

        const { data, error } = await supabase
          .from('users')
          .upsert([userData], { onConflict: 'id' })
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en users.upsert:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getById: async (id) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }

        // 🔥 NUEVO: Usar rate limiting para evitar ERR_INSUFFICIENT_RESOURCES
        const result = await withRateLimit(`users.getById.${id}`, async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle()
          
          if (error) {
            console.error('Error fetching user by ID:', error)
            return { data: null, error }
          }
          
          return { data, error: null }
        })
        
        return result
      } catch (fetchError) {
        console.error('Network error fetching user:', fetchError)
        return { data: null, error: { code: 'NETWORK_ERROR', message: 'Failed to fetch user data' } }
      }
    },
    
    getByTelegramId: async (telegramId) => {
      try {
        if (!telegramId) {
          throw new Error('Telegram ID es requerido');
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramId)
          .single()
        return { data, error }
      } catch (error) {
        console.error('Error en users.getByTelegramId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    update: async (id, updates) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', id)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en users.update:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

  // Planes
  plans: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('price', { ascending: true })
        return { data, error }
      } catch (error) {
        console.error('Error en plans.getAll:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getById: async (id) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }

        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('id', id)
          .single()
        return { data, error }
      } catch (error) {
        console.error('Error en plans.getById:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

  // Pagos
  payments: {
    create: async (paymentData) => {
      try {
        if (!paymentData || typeof paymentData !== 'object') {
          throw new Error('paymentData debe ser un objeto válido');
        }
        if (!paymentData.user_id || !paymentData.plan_id || !paymentData.amount) {
          throw new Error('user_id, plan_id y amount son requeridos');
        }

        const { data, error } = await supabase
          .from('payments')
          .insert([paymentData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en payments.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByUserId: async (userId) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }

        const { data, error } = await supabase
          .from('payments')
          .select('*, plans(*)')
          .eq('user_id', userId)
          .order('paid_at', { ascending: false })
        return { data, error }
      } catch (error) {
        console.error('Error en payments.getByUserId:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

  // Carpetas de usuario
  userFolders: {
    create: async (folderData) => {
      try {
        if (!folderData || typeof folderData !== 'object') {
          throw new Error('folderData debe ser un objeto válido');
        }
        if (!folderData.nombre || !folderData.administrador) {
          throw new Error('nombre y administrador son requeridos');
        }

        const { data, error } = await supabase
          .from('carpetas_usuario')
          .insert([folderData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userFolders.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByTelegramId: async (telegramId) => {
      try {
        if (!telegramId) {
          throw new Error('Telegram ID es requerido');
        }

        const { data, error } = await supabase
          .from('carpetas_usuario')
          .select('*')
          .eq('telegram_id', telegramId)
        return { data, error }
      } catch (error) {
        console.error('Error en userFolders.getByTelegramId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByAdministrador: async (adminEmail) => {
      try {
        if (!adminEmail || !adminEmail.includes('@')) {
          throw new Error('Email de administrador inválido');
        }

        return await retryWithBackoff(async () => {
          const { data, error } = await supabase
            .from('carpetas_usuario')
            .select('*')
            .eq('administrador', adminEmail)
          
          if (error) throw error
          return { data, error: null }
        })
      } catch (error) {
        return handleNetworkError(error, 'getByAdministrador')
      }
    },
    
    getByUser: async (userId) => {
      try {
        // Esta función necesita importar auth para obtener el usuario actual
        // Para evitar dependencia circular, asumimos que el userId se pasa como parámetro
        if (!userId) {
          throw new Error('User ID es requerido');
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();
        
        if (userError || !userData?.email) {
          return { data: [], error: userError || { message: 'Usuario no encontrado' } };
        }
        
        const result = await supabase
          .from('carpetas_usuario')
          .select('*')
          .eq('administrador', userData.email);
        
        return { data: result.data || [], error: result.error };
      } catch (error) {
        console.error('Error en userFolders.getByUser:', error);
        return { data: [], error: { message: error.message } };
      }
    },
    
    getByParent: async (parentId) => {
      // Para carpetas de usuario, no hay jerarquía de parent, todas están bajo la carpeta admin
      return { data: [], error: null }
    }
  },

  // Carpetas de administrador
  adminFolders: {
    create: async (folderData) => {
      try {
        if (!folderData || typeof folderData !== 'object') {
          throw new Error('folderData debe ser un objeto válido');
        }
        if (!folderData.nombre || !folderData.correo) {
          throw new Error('nombre y correo son requeridos');
        }

        const { data, error } = await supabase
          .from('carpeta_administrador')
          .insert([folderData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en adminFolders.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByEmail: async (email) => {
      try {
        if (!email || !email.includes('@')) {
          throw new Error('Email inválido');
        }

        return await retryWithBackoff(async () => {
          const { data, error } = await supabase
            .from('carpeta_administrador')
            .select('*')
            .eq('correo', email)
          
          if (error) throw error
          return { data, error: null }
        })
      } catch (error) {
        return handleNetworkError(error, 'adminFolders.getByEmail')
      }
    },
    
    getByTelegramId: async (telegramId) => {
      try {
        if (!telegramId) {
          throw new Error('Telegram ID es requerido');
        }

        const { data, error } = await supabase
          .from('carpeta_administrador')
          .select('*')
          .eq('telegram_id', telegramId)
        return { data, error }
      } catch (error) {
        console.error('Error en adminFolders.getByTelegramId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByUser: async (userId) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }

        return await retryWithBackoff(async () => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single()
          
          if (userError) throw userError
          
          const { data, error } = await supabase
            .from('carpeta_administrador')
            .select('*')
            .eq('correo', userData.email)
          
          if (error) throw error
          return { data, error: null }
        })
      } catch (error) {
        return handleNetworkError(error, 'adminFolders.getByUser')
      }
    }
  },

  // Subcarpetas de administrador (extensiones)
  subCarpetasAdministrador: {
    create: async (subcarpetaData) => {
      try {
        if (!subcarpetaData || typeof subcarpetaData !== 'object') {
          throw new Error('subcarpetaData debe ser un objeto válido');
        }
        if (!subcarpetaData.nombre || !subcarpetaData.administrador_email) {
          throw new Error('nombre y administrador_email son requeridos');
        }

        const { data, error } = await supabase
          .from('sub_carpetas_administrador')
          .insert([subcarpetaData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en subCarpetasAdministrador.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByEmail: async (email) => {
      try {
        if (!email || !email.includes('@')) {
          throw new Error('Email inválido');
        }

        const { data, error } = await supabase
          .from('sub_carpetas_administrador')
          .select('*')
          .eq('administrador_email', email)
        return { data, error }
      } catch (error) {
        console.error('Error en subCarpetasAdministrador.getByEmail:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByMasterFolderId: async (masterFolderId) => {
      try {
        if (!masterFolderId) {
          throw new Error('Master Folder ID es requerido');
        }

        const { data, error } = await supabase
          .from('sub_carpetas_administrador')
          .select('*')
          .eq('file_id_master', masterFolderId)
        return { data, error }
      } catch (error) {
        console.error('Error en subCarpetasAdministrador.getByMasterFolderId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByTipoExtension: async (email, tipoExtension) => {
      try {
        if (!email || !email.includes('@')) {
          throw new Error('Email inválido');
        }
        if (!tipoExtension) {
          throw new Error('Tipo de extensión es requerido');
        }

        const { data, error } = await supabase
          .from('sub_carpetas_administrador')
          .select('*')
          .eq('administrador_email', email)
          .eq('tipo_extension', tipoExtension)
          .single()
        return { data, error }
      } catch (error) {
        console.error('Error en subCarpetasAdministrador.getByTipoExtension:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    update: async (id, updates) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('sub_carpetas_administrador')
          .update(updates)
          .eq('id', id)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en subCarpetasAdministrador.update:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    delete: async (id) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }

        const { data, error } = await supabase
          .from('sub_carpetas_administrador')
          .delete()
          .eq('id', id)
        return { data, error }
      } catch (error) {
        console.error('Error en subCarpetasAdministrador.delete:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

  // Credenciales de usuario para Google Drive
  userCredentials: {
    create: async (credentialsData) => {
      try {
        if (!credentialsData || typeof credentialsData !== 'object') {
          throw new Error('credentialsData debe ser un objeto válido');
        }
        if (!credentialsData.user_id) {
          throw new Error('user_id es requerido');
        }

        const { data, error } = await supabase
          .from('user_credentials')
          .insert([credentialsData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userCredentials.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    upsert: async (credentialsData) => {
      try {
        if (!credentialsData || typeof credentialsData !== 'object') {
          throw new Error('credentialsData debe ser un objeto válido');
        }
        if (!credentialsData.user_id) {
          throw new Error('user_id es requerido para upsert');
        }

        const { data, error } = await supabase
          .from('user_credentials')
          .upsert([credentialsData], {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userCredentials.upsert:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByUserId: async (userId) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }

        const { data, error } = await supabase
          .from('user_credentials')
          .select('*')
          .eq('user_id', userId)
          .single()
        return { data, error }
      } catch (error) {
        console.error('Error en userCredentials.getByUserId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByTelegramId: async (telegramId) => {
      try {
        if (!telegramId) {
          throw new Error('Telegram ID es requerido');
        }

        const { data, error } = await supabase
          .from('user_credentials')
          .select('*')
          .eq('telegram_chat_id', telegramId)
          .single()
        return { data, error }
      } catch (error) {
        console.error('Error en userCredentials.getByTelegramId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    update: async (userId, updates) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('user_credentials')
          .update(updates)
          .eq('user_id', userId)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userCredentials.update:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    updateByTelegramId: async (telegramId, updates) => {
      try {
        if (!telegramId) {
          throw new Error('Telegram ID es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('user_credentials')
          .update(updates)
          .eq('telegram_chat_id', telegramId)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userCredentials.updateByTelegramId:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

   // Credenciales de Google Drive
   googleDriveCredentials: {
     create: async (credentialsData) => {
       try {
         if (!credentialsData || typeof credentialsData !== 'object') {
           throw new Error('credentialsData debe ser un objeto válido');
         }
         if (!credentialsData.user_id) {
           throw new Error('user_id es requerido');
         }

         const { data, error } = await supabase
           .from('user_google_drive_credentials')
           .insert([credentialsData])
           .select()
         return { data, error }
       } catch (error) {
         console.error('Error en googleDriveCredentials.create:', error);
         return { data: null, error: { message: error.message } }
       }
     },
     
     upsert: async (credentialsData) => {
       try {
         if (!credentialsData || typeof credentialsData !== 'object') {
           throw new Error('credentialsData debe ser un objeto válido');
         }
         if (!credentialsData.user_id) {
           throw new Error('user_id es requerido para upsert');
         }

         const { data, error } = await supabase
           .from('user_google_drive_credentials')
           .upsert([credentialsData], {
             onConflict: 'user_id',
             ignoreDuplicates: false
           })
           .select()
         return { data, error }
       } catch (error) {
         console.error('Error en googleDriveCredentials.upsert:', error);
         return { data: null, error: { message: error.message } }
       }
     },
     
     getByUserId: async (userId) => {
       try {
         if (!userId) {
           throw new Error('User ID es requerido');
         }

         const { data, error } = await supabase
           .from('user_google_drive_credentials')
           .select('*')
           .eq('user_id', userId)
           .maybeSingle()
         return { data, error }
       } catch (error) {
         console.error('Error en googleDriveCredentials.getByUserId:', error);
         return { data: null, error: { message: error.message } }
       }
     },
     
     update: async (userId, updates) => {
       try {
         if (!userId) {
           throw new Error('User ID es requerido');
         }
         if (!updates || typeof updates !== 'object') {
           throw new Error('Updates debe ser un objeto válido');
         }

         const { data, error } = await supabase
           .from('user_google_drive_credentials')
           .update(updates)
           .eq('user_id', userId)
           .select()
         return { data, error }
       } catch (error) {
         console.error('Error en googleDriveCredentials.update:', error);
         return { data: null, error: { message: error.message } }
       }
     },
     
     delete: async (userId) => {
       try {
         if (!userId) {
           throw new Error('User ID es requerido');
         }

         const { data, error } = await supabase
           .from('user_google_drive_credentials')
           .delete()
           .eq('user_id', userId)
         return { data, error }
       } catch (error) {
         console.error('Error en googleDriveCredentials.delete:', error);
         return { data: null, error: { message: error.message } }
       }
     }
   },



  // Uso de tokens de usuario
  userTokensUsage: {
    create: async (tokenData) => {
      try {
        if (!tokenData || typeof tokenData !== 'object') {
          throw new Error('tokenData debe ser un objeto válido');
        }
        if (!tokenData.user_id) {
          throw new Error('user_id es requerido');
        }

        const { data, error } = await supabase
          .from('user_tokens_usage')
          .insert([tokenData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userTokensUsage.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    upsert: async (tokenData) => {
      try {
        if (!tokenData || typeof tokenData !== 'object') {
          throw new Error('tokenData debe ser un objeto válido');
        }
        if (!tokenData.user_id) {
          throw new Error('user_id es requerido para upsert');
        }

        const { data, error } = await supabase
          .from('user_tokens_usage')
          .upsert([tokenData], { 
            onConflict: 'user_id',
            returning: 'minimal' 
          })
        return { data, error }
      } catch (error) {
        console.error('Error en userTokensUsage.upsert:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByUserId: async (userId) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }

        const { data, error } = await supabase
          .from('user_tokens_usage')
          .select('*')
          .eq('user_id', userId)
          .single()
        return { data, error }
      } catch (error) {
        console.error('Error en userTokensUsage.getByUserId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    update: async (userId, updates) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('user_tokens_usage')
          .update(updates)
          .eq('user_id', userId)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userTokensUsage.update:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

  // Documentos del entrenador
  trainerDocuments: {
    create: async (documentData) => {
      try {
        if (!documentData || typeof documentData !== 'object') {
          throw new Error('documentData debe ser un objeto válido');
        }
        if (!documentData.entrenador || !documentData.nombre) {
          throw new Error('entrenador y nombre son requeridos');
        }

        const { data, error } = await supabase
          .from('documentos_entrenador')
          .insert([documentData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en trainerDocuments.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByUser: async (userId) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single()
        
        if (userError) return { data: null, error: userError }
        
        const { data, error } = await supabase
          .from('documentos_entrenador')
          .select('*')
          .eq('entrenador', userData.email)
          .order('created_at', { ascending: false })
        return { data, error }
      } catch (error) {
        console.error('Error en trainerDocuments.getByUser:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByFolder: async (folderId) => {
      try {
        if (!folderId) {
          throw new Error('Folder ID es requerido');
        }

        const { data, error } = await supabase
          .from('documentos_entrenador')
          .select('*')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false })
        return { data, error }
      } catch (error) {
        console.error('Error en trainerDocuments.getByFolder:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    update: async (id, updates) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('documentos_entrenador')
          .update(updates)
          .eq('id', id)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en trainerDocuments.update:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    delete: async (id) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }

        const { data, error } = await supabase
          .from('documentos_entrenador')
          .delete()
          .eq('id', id)
        return { data, error }
      } catch (error) {
        console.error('Error en trainerDocuments.delete:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

  // Documentos de usuario para entrenador (archivos subidos)
  userTrainerDocuments: {
    create: async (documentData) => {
      try {
        if (!documentData || typeof documentData !== 'object') {
          throw new Error('documentData debe ser un objeto válido');
        }
        if (!documentData.telegram_id || !documentData.file_id) {
          throw new Error('telegram_id y file_id son requeridos');
        }

        const { data, error } = await supabase
          .from('documentos_usuario_entrenador')
          .insert([documentData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userTrainerDocuments.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByUser: async (userId) => {
      try {
        if (!userId) {
          throw new Error('User ID es requerido');
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('telegram_id')
          .eq('id', userId)
          .single()
        
        if (userError) return { data: null, error: userError }
        
        const { data, error } = await supabase
          .from('documentos_usuario_entrenador')
          .select('*')
          .eq('telegram_id', userData.telegram_id)
          .order('created_at', { ascending: false })
        return { data, error }
      } catch (error) {
        console.error('Error en userTrainerDocuments.getByUser:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByTelegramId: async (telegramId) => {
      try {
        if (!telegramId) {
          throw new Error('Telegram ID es requerido');
        }

        const { data, error } = await supabase
          .from('documentos_usuario_entrenador')
          .select('*')
          .eq('telegram_id', telegramId)
          .order('created_at', { ascending: false })
        return { data, error }
      } catch (error) {
        console.error('Error en userTrainerDocuments.getByTelegramId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    update: async (id, updates) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('documentos_usuario_entrenador')
          .update(updates)
          .eq('id', id)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en userTrainerDocuments.update:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    delete: async (id) => {
      try {
        if (!id) {
          throw new Error('ID es requerido');
        }

        const { data, error } = await supabase
          .from('documentos_usuario_entrenador')
          .delete()
          .eq('id', id)
        return { data, error }
      } catch (error) {
        console.error('Error en userTrainerDocuments.delete:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    deleteByFileId: async (fileId) => {
      try {
        if (!fileId) {
          throw new Error('File ID es requerido');
        }

        const { data, error } = await supabase
          .from('documentos_usuario_entrenador')
          .delete()
          .eq('file_id', fileId)
        return { data, error }
      } catch (error) {
        console.error('Error en userTrainerDocuments.deleteByFileId:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  },

  // Credenciales de empresa (para MultiAccountServiceUI)
  companyCredentials: {
    create: async (credentialsData) => {
      try {
        if (!credentialsData || typeof credentialsData !== 'object') {
          throw new Error('credentialsData debe ser un objeto válido');
        }
        if (!credentialsData.company_id) {
          throw new Error('company_id es requerido');
        }
        if (!credentialsData.integration_type) {
          throw new Error('integration_type es requerido');
        }

        const { data, error } = await supabase
          .from('company_credentials')
          .insert([credentialsData])
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en companyCredentials.create:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    upsert: async (credentialsData) => {
      try {
        if (!credentialsData || typeof credentialsData !== 'object') {
          throw new Error('credentialsData debe ser un objeto válido');
        }
        if (!credentialsData.company_id) {
          throw new Error('company_id es requerido para upsert');
        }
        if (!credentialsData.integration_type) {
          throw new Error('integration_type es requerido para upsert');
        }

        const { data, error } = await supabase
          .from('company_credentials')
          .upsert([credentialsData], {
            onConflict: 'company_id,integration_type',
            ignoreDuplicates: false
          })
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en companyCredentials.upsert:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByCompanyId: async (companyId, integrationType = null) => {
      try {
        if (!companyId) {
          throw new Error('Company ID es requerido');
        }

        let query = supabase
          .from('company_credentials')
          .select('*')
          .eq('company_id', companyId);

        if (integrationType) {
          query = query.eq('integration_type', integrationType);
        }

        const { data, error } = await query;
        return { data, error }
      } catch (error) {
        console.error('Error en companyCredentials.getByCompanyId:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    getByType: async (integrationType) => {
      try {
        if (!integrationType) {
          throw new Error('Integration type es requerido');
        }

        const { data, error } = await supabase
          .from('company_credentials')
          .select('*')
          .eq('integration_type', integrationType);
        return { data, error }
      } catch (error) {
        console.error('Error en companyCredentials.getByType:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    update: async (companyId, integrationType, updates) => {
      try {
        if (!companyId) {
          throw new Error('Company ID es requerido');
        }
        if (!integrationType) {
          throw new Error('Integration type es requerido');
        }
        if (!updates || typeof updates !== 'object') {
          throw new Error('Updates debe ser un objeto válido');
        }

        const { data, error } = await supabase
          .from('company_credentials')
          .update(updates)
          .eq('company_id', companyId)
          .eq('integration_type', integrationType)
          .select()
        return { data, error }
      } catch (error) {
        console.error('Error en companyCredentials.update:', error);
        return { data: null, error: { message: error.message } }
      }
    },
    
    delete: async (companyId, integrationType) => {
      try {
        if (!companyId) {
          throw new Error('Company ID es requerido');
        }
        if (!integrationType) {
          throw new Error('Integration type es requerido');
        }

        const { data, error } = await supabase
          .from('company_credentials')
          .delete()
          .eq('company_id', companyId)
          .eq('integration_type', integrationType)
        return { data, error }
      } catch (error) {
        console.error('Error en companyCredentials.delete:', error);
        return { data: null, error: { message: error.message } }
      }
    }
  }
}

export default db;