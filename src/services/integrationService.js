/**
 * Servicio Unificado de Integraciones
 * Maneja la conexión y configuración de todas las integraciones por empresa
 */

import { supabase } from '../lib/supabaseClient.js';
import toast from 'react-hot-toast';

class IntegrationService {
  constructor() {
    this.integrations = {
      googleDrive: {
        name: 'Google Drive',
        color: 'green',
        icon: '📁',
        scopes: ['https://www.googleapis.com/auth/drive'],
        authUrl: '/auth/google-drive',
        callbackUrl: '/auth/google-drive/callback'
      },
      googleMeet: {
        name: 'Google Meet',
        color: 'blue',
        icon: '📹',
        scopes: ['https://www.googleapis.com/auth/calendar'],
        authUrl: '/auth/google-meet',
        callbackUrl: '/auth/google-meet/callback'
      },
      slack: {
        name: 'Slack',
        color: 'purple',
        icon: '💬',
        scopes: ['channels:read', 'chat:write', 'users:read'],
        authUrl: '/auth/slack',
        callbackUrl: '/auth/slack/callback'
      },
      teams: {
        name: 'Microsoft Teams',
        color: 'indigo',
        icon: '👥',
        scopes: ['Channel.ReadBasic.All', 'Chat.ReadWrite'],
        authUrl: '/auth/teams',
        callbackUrl: '/auth/teams/callback'
      },
      hubspot: {
        name: 'HubSpot',
        color: 'orange',
        icon: '🧡',
        scopes: ['contacts', 'companies', 'deals'],
        authUrl: '/auth/hubspot',
        callbackUrl: '/auth/hubspot/callback'
      },
      brevo: {
        name: 'Brevo',
        color: 'blue',
        icon: '📧',
        scopes: ['contacts', 'campaigns'],
        authUrl: '/auth/brevo',
        callbackUrl: '/auth/brevo/callback'
      },
      whatsappBusiness: {
        name: 'WhatsApp Business',
        color: 'green',
        icon: '📱',
        scopes: ['whatsapp_business_messaging'],
        authUrl: '/auth/whatsapp-business',
        callbackUrl: '/auth/whatsapp-business/callback'
      },
      whatsappOfficial: {
        name: 'WhatsApp Official API',
        color: 'green',
        icon: '📱',
        scopes: ['whatsapp'],
        authUrl: '/auth/whatsapp-official',
        callbackUrl: '/auth/whatsapp-official/callback'
      },
      whatsappWAHA: {
        name: 'WhatsApp WAHA API',
        color: 'purple',
        icon: '📱',
        scopes: ['whatsapp'],
        authUrl: '/auth/whatsapp-waha',
        callbackUrl: '/auth/whatsapp-waha/callback'
      },
      telegram: {
        name: 'Telegram Bot',
        color: 'blue',
        icon: '🤖',
        scopes: ['bot'],
        authUrl: '/auth/telegram',
        callbackUrl: '/auth/telegram/callback'
      }
    };
  }

  /**
   * Inicia el proceso de OAuth para una integración específica
   * @param {string} integrationType - Tipo de integración
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<object>} - Resultado del proceso
   */
  async initiateOAuth(integrationType, companyId) {
    try {
      const integration = this.integrations[integrationType];
      if (!integration) {
        throw new Error(`Integración ${integrationType} no encontrada`);
      }

      // Generar state para seguridad
      const state = this.generateSecureState(companyId, integrationType);
      
      // Construir URL de autorización
      const authUrl = this.buildAuthUrl(integration, state);
      
      // Guardar estado temporal en la base de datos
      await this.saveOAuthState(state, companyId, integrationType);
      
      // Abrir ventana de autorización
      const authWindow = window.open(
        authUrl,
        'oauth_auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      return {
        success: true,
        authUrl,
        state,
        message: `Iniciando autorización para ${integration.name}`
      };
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast.error(`Error iniciando OAuth: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Maneja el callback de OAuth
   * @param {string} code - Código de autorización
   * @param {string} state - Estado de seguridad
   * @returns {Promise<object>} - Resultado del procesamiento
   */
  async handleOAuthCallback(code, state) {
    try {
      // Verificar y validar el estado
      const stateData = await this.validateOAuthState(state);
      if (!stateData) {
        throw new Error('Estado de OAuth inválido o expirado');
      }

      const { companyId, integrationType } = stateData;
      const integration = this.integrations[integrationType];

      // Intercambiar código por tokens
      const tokens = await this.exchangeCodeForTokens(integrationType, code);
      
      // Guardar credenciales de la empresa
      await this.saveCompanyIntegrationCredentials(companyId, integrationType, tokens);
      
      // Probar la conexión
      const connectionTest = await this.testIntegrationConnection(integrationType, tokens);
      
      // Limpiar estado temporal
      await this.clearOAuthState(state);
      
      return {
        success: true,
        companyId,
        integrationType,
        connectionTest,
        message: `${integration.name} conectado exitosamente para la empresa`
      };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prueba la conexión con una integración
   * @param {string} integrationType - Tipo de integración
   * @param {object} credentials - Credenciales de la integración
   * @returns {Promise<object>} - Resultado de la prueba
   */
  async testIntegrationConnection(integrationType, credentials) {
    try {
      switch (integrationType) {
        case 'googleDrive':
          return await this.testGoogleDriveConnection(credentials);
        case 'googleMeet':
          return await this.testGoogleMeetConnection(credentials);
        case 'slack':
          return await this.testSlackConnection(credentials);
        case 'teams':
          return await this.testTeamsConnection(credentials);
        case 'hubspot':
          return await this.testHubSpotConnection(credentials);
        case 'brevo':
          return await this.testBrevoConnection(credentials);
        case 'whatsappBusiness':
          return await this.testWhatsAppBusinessConnection(credentials);
        case 'whatsappOfficial':
          return await this.testWhatsAppOfficialConnection(credentials);
        case 'whatsappWAHA':
          return await this.testWhatsAppWAHAConnection(credentials);
        case 'telegram':
          return await this.testTelegramConnection(credentials);
        default:
          throw new Error(`Tipo de integración ${integrationType} no soportado`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el estado de las integraciones de una empresa
   * @param {string} companyId - ID de la empresa
   * @returns {Promise<object>} - Estado de las integraciones
   */
  async getCompanyIntegrationsStatus(companyId) {
    try {
      const { data, error } = await supabase
        .from('company_integrations')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;

      const status = {};
      Object.keys(this.integrations).forEach(integrationType => {
        const integration = data?.find(i => i.integration_type === integrationType);
        status[integrationType] = {
          connected: !!integration,
          connectedAt: integration?.created_at,
          lastTested: integration?.last_tested,
          status: integration?.status || 'disconnected',
          credentials: integration?.credentials ? this.sanitizeCredentials(integration.credentials) : null
        };
      });

      return status;
    } catch (error) {
      console.error('Error getting integrations status:', error);
      return {};
    }
  }

  /**
   * Desconecta una integración de una empresa
   * @param {string} companyId - ID de la empresa
   * @param {string} integrationType - Tipo de integración
   * @returns {Promise<object>} - Resultado de la desconexión
   */
  async disconnectIntegration(companyId, integrationType) {
    try {
      const { error } = await supabase
        .from('company_integrations')
        .delete()
        .eq('company_id', companyId)
        .eq('integration_type', integrationType);

      if (error) throw error;

      return {
        success: true,
        message: `${this.integrations[integrationType].name} desconectado exitosamente`
      };
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Métodos de prueba específicos para cada integración

  async testGoogleDriveConnection(credentials) {
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { user: data.user } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testGoogleMeetConnection(credentials) {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { calendars: data.items?.length || 0 } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testSlackConnection(credentials) {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return {
        success: data.ok,
        data: data.ok ? { team: data.team, user: data.user } : data,
        message: data.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testTeamsConnection(credentials) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { user: data.displayName, email: data.mail } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testHubSpotConnection(credentials) {
    try {
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { connected: true } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testBrevoConnection(credentials) {
    try {
      const response = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': credentials.api_key
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { account: data } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWhatsAppBusinessConnection(credentials) {
    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${credentials.phone_number_id}`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { phoneNumber: data.display_phone_number } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWhatsAppOfficialConnection(credentials) {
    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${credentials.phone_number_id}`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { phoneNumber: data.display_phone_number } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWhatsAppWAHAConnection(credentials) {
    try {
      const response = await fetch(`${credentials.base_url}/api/status`, {
        headers: {
          'X-Api-Key': credentials.api_key
        }
      });
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? { status: data.status } : data,
        message: response.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testTelegramConnection(credentials) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${credentials.bot_token}/getMe`);
      
      const data = await response.json();
      return {
        success: data.ok,
        data: data.ok ? { bot: data.result } : data,
        message: data.ok ? 'Conexión exitosa' : 'Error en la conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Métodos auxiliares

  generateSecureState(companyId, integrationType) {
    const state = {
      companyId,
      integrationType,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 15)
    };
    return btoa(JSON.stringify(state));
  }

  buildAuthUrl(integration, state) {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      client_id: integration.client_id || 'default',
      redirect_uri: `${baseUrl}${integration.callbackUrl}`,
      scope: integration.scopes.join(' '),
      response_type: 'code',
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${baseUrl}${integration.authUrl}?${params.toString()}`;
  }

  async saveOAuthState(state, companyId, integrationType) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    const { error } = await supabase
      .from('oauth_states')
      .upsert({
        state,
        company_id: companyId,
        integration_type: integrationType,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async validateOAuthState(state) {
    try {
      const stateData = JSON.parse(atob(state));
      const { companyId, integrationType, timestamp } = stateData;

      // Verificar que no haya expirado (10 minutos)
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        return null;
      }

      // Verificar que existe en la base de datos
      const { data } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .eq('company_id', companyId)
        .eq('integration_type', integrationType)
        .single();

      return data ? { companyId, integrationType } : null;
    } catch (error) {
      return null;
    }
  }

  async clearOAuthState(state) {
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);
  }

  async exchangeCodeForTokens(integrationType, code) {
    // Implementación específica para cada integración
    // Por ahora, simulamos el intercambio
    return {
      access_token: `mock_token_${integrationType}`,
      refresh_token: `mock_refresh_${integrationType}`,
      expires_in: 3600
    };
  }

  async saveCompanyIntegrationCredentials(companyId, integrationType, tokens) {
    const { error } = await supabase
      .from('company_integrations')
      .upsert({
        company_id: companyId,
        integration_type: integrationType,
        credentials: tokens,
        status: 'connected',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  sanitizeCredentials(credentials) {
    // Remover información sensible para mostrar al usuario
    const sanitized = { ...credentials };
    if (sanitized.access_token) {
      sanitized.access_token = '••••••••';
    }
    if (sanitized.refresh_token) {
      sanitized.refresh_token = '••••••••';
    }
    if (sanitized.api_key) {
      sanitized.api_key = '••••••••';
    }
    if (sanitized.bot_token) {
      sanitized.bot_token = '••••••••';
    }
    return sanitized;
  }
}

// Instancia singleton
const integrationService = new IntegrationService();

export default integrationService;
export { IntegrationService };