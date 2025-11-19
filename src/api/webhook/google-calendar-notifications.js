// Endpoint API para recibir notificaciones de Google Calendar (Google Meet)
// Procesa eventos de calendario que incluyen enlaces de Google Meet

import { supabase } from '../../lib/supabase.js';
import communicationService from '../../services/communicationService.js';

/**
 * Procesa notificaciones de Google Calendar recibidas desde Google Calendar API
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 */
export default async function handler(req, res) {
  // Solo aceptar métodos POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Solo se acepta POST.'
    });
  }

  try {
    console.log('📅 Webhook recibido desde Google Calendar:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const webhookData = req.body;

    // Validar que tenemos los datos necesarios
    if (!webhookData) {
      console.error('❌ Datos de webhook inválidos');
      return res.status(400).json({
        success: false,
        error: 'Datos de webhook inválidos'
      });
    }

    // Procesar notificación de Google Calendar
    await processGoogleCalendarNotification(webhookData, req);

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Notificación procesada correctamente'
    });

  } catch (error) {
    console.error('💥 Error procesando webhook de Google Calendar:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

/**
 * Procesa una notificación de Google Calendar
 * @param {Object} notification - Notificación de Google Calendar
 * @param {Object} req - Request object para acceder a headers
 */
async function processGoogleCalendarNotification(notification, req) {
  try {
    console.log('🔄 Procesando notificación de Google Calendar');

    // En las notificaciones de Google Calendar Push, solo obtenemos headers con metadatos
    // Necesitamos hacer una petición a la Calendar API para obtener los detalles del evento

    const channelId = req.headers['x-goog-channel-id'];    const resourceState = req.headers['x-goog-resource-state'];

    if (!channelId) {
      console.error('❌ No es una notificación válida de Google Calendar: falta x-goog-channel-id');
      return;
    }

    console.log('📡 Procesando notificación del canal:', channelId, 'Estado:', resourceState);

    // Buscar la suscripción de calendario en la base de datos
    const { data: subscription, error: subError } = await supabase
      .from('google_calendar_subscriptions')
      .select('id, user_id, calendar_id, resource_id')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .single();

    if (subError || !subscription) {
      console.error('❌ Suscripción de calendario no encontrada:', subError);
      return;
    }

    console.log('✅ Suscripción encontrada:', subscription);

    // Si es una notificación de sync, no necesitamos procesar cambios específicos
    if (resourceState === 'sync') {
      console.log('🔄 Notificación de sincronización, ignorando');
      return;
    }

    // Obtener eventos del calendario que han cambiado
    await processCalendarEvents(subscription);

  } catch (error) {
    console.error('❌ Error procesando notificación de calendario:', error);
  }
}

/**
 * Procesa los eventos del calendario que han cambiado
 * @param {Object} subscription - Datos de la suscripción
 */
async function processCalendarEvents(subscription) {
  try {
    // Obtener credenciales del usuario
    const { data: credentials, error } = await supabase
      .from('user_credentials')
      .select('google_access_token, google_refresh_token')
      .eq('user_id', subscription.user_id)
      .single();

    if (error || !credentials?.google_access_token) {
      console.error('❌ No se encontraron credenciales de Google para el usuario');
      return;
    }

    // Obtener eventos del calendario desde la última sincronización
    const events = await getCalendarEvents(subscription.calendar_id, credentials.google_access_token);

    if (!events || events.length === 0) {
      console.log('📭 No hay eventos nuevos para procesar');
      return;
    }

    // Procesar cada evento
    for (const event of events) {
      await processCalendarEvent(event, subscription.user_id);
    }

  } catch (error) {
    console.error('❌ Error procesando eventos del calendario:', error);
  }
}

/**
 * Obtiene eventos del calendario desde Google Calendar API
 * @param {string} calendarId - ID del calendario
 * @param {string} accessToken - Token de acceso
 * @returns {Array} Lista de eventos
 */
async function getCalendarEvents(calendarId, accessToken) {
  try {
    // Calcular el tiempo desde la última verificación (últimos 5 minutos)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const timeMin = fiveMinutesAgo.toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Error obteniendo eventos del calendario:', response.status);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Obtenidos ${data.items?.length || 0} eventos del calendario`);

    return data.items || [];

  } catch (error) {
    console.error('❌ Error obteniendo eventos del calendario:', error);
    return null;
  }
}

/**
 * Procesa un evento individual del calendario
 * @param {Object} event - Evento del calendario
 * @param {string} userId - ID del usuario
 */
async function processCalendarEvent(event, userId) {
  try {
    const eventId = event.id;
    const summary = event.summary || 'Sin título';
    const startTime = event.start?.dateTime || event.start?.date;    const description = event.description || '';
    const location = event.location || '';

    console.log('📅 Procesando evento:', summary, 'ID:', eventId);

    // Verificar si es un evento nuevo o actualizado
    const { data: existingEvent, error } = await supabase
      .from('google_calendar_events')
      .select('id, processed_at')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    const isNewEvent = !existingEvent || error;
    const isUpdated = existingEvent && existingEvent.processed_at < new Date(event.updated);

    if (!isNewEvent && !isUpdated) {
      console.log('⚠️ Evento ya procesado anteriormente');
      return;
    }

    // Verificar si contiene enlace de Google Meet
    const meetLink = extractMeetLink(description, location);
    if (!meetLink) {
      console.log('⚠️ Evento no contiene enlace de Google Meet, ignorando');
      return;
    }

    // Generar mensaje de WhatsApp
    let whatsappMessage = '';

    if (isNewEvent) {
      whatsappMessage = `Nueva reunión de Google Meet: "${summary}" el ${formatCalendarDate(startTime)}. Enlace: ${meetLink}`;
    } else if (isUpdated) {
      whatsappMessage = `Reunión actualizada: "${summary}" ahora es el ${formatCalendarDate(startTime)}. Enlace: ${meetLink}`;
    }

    // Enviar recordatorio si la reunión es próxima (menos de 15 minutos)
    if (startTime) {
      const eventTime = new Date(startTime);
      const now = new Date();
      const timeDiff = eventTime - now;
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff > 0 && minutesDiff <= 15) {
        whatsappMessage = `Tienes una reunión de Google Meet en ${Math.round(minutesDiff)} minutos: "${summary}". Enlace: ${meetLink}`;
      }
    }

    // Enviar notificación por WhatsApp
    await sendCalendarWhatsAppNotification(userId, whatsappMessage);

    // Guardar o actualizar el evento en la base de datos
    await saveCalendarEvent(event, userId, whatsappMessage);

  } catch (error) {
    console.error('❌ Error procesando evento del calendario:', error);
  }
}

/**
 * Extrae el enlace de Google Meet de la descripción o ubicación
 * @param {string} description - Descripción del evento
 * @param {string} location - Ubicación del evento
 * @returns {string|null} Enlace de Meet o null
 */
function extractMeetLink(description, location) {
  const meetUrlPattern = /https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+/;
  const hangoutsUrlPattern = /https:\/\/hangouts\.google\.com\/[a-zA-Z0-9-]+/;

  // Buscar en descripción
  let match = description.match(meetUrlPattern) || description.match(hangoutsUrlPattern);
  if (match) return match[0];

  // Buscar en ubicación
  match = location.match(meetUrlPattern) || location.match(hangoutsUrlPattern);
  if (match) return match[0];

  return null;
}

/**
 * Envía notificación por WhatsApp para eventos de calendario
 * @param {string} userId - ID del usuario
 * @param {string} message - Mensaje a enviar
 */
async function sendCalendarWhatsAppNotification(userId, message) {
  try {
    // Obtener empleados asociados al usuario
    const { data: employees } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .limit(10);

    if (!employees || employees.length === 0) {
      console.error('❌ No se encontraron empleados para enviar WhatsApp');
      return;
    }

    const recipientIds = employees.map(emp => emp.id);

    // Enviar mensaje usando el servicio de comunicación
    await communicationService.sendWhatsAppMessage(recipientIds, message);

    console.log('✅ Mensaje de WhatsApp enviado para calendario:', message);

  } catch (error) {
    console.error('❌ Error enviando mensaje de WhatsApp para calendario:', error);
  }
}

/**
 * Guarda el evento del calendario en la base de datos
 * @param {Object} event - Datos del evento
 * @param {string} userId - ID del usuario
 * @param {string} whatsappMessage - Mensaje enviado por WhatsApp
 */
async function saveCalendarEvent(event, userId, whatsappMessage) {
  try {
    const eventData = {
      event_id: event.id,
      user_id: userId,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      meet_link: extractMeetLink(event.description || '', event.location || ''),
      whatsapp_message: whatsappMessage,
      processed_at: new Date().toISOString(),
      updated_at: event.updated
    };

    const { data, error } = await supabase
      .from('google_calendar_events')
      .upsert(eventData, { onConflict: 'event_id,user_id' });

    if (error) {
      console.error('❌ Error guardando evento del calendario:', error);
    } else {
      console.log('✅ Evento del calendario guardado en BD');
    }
  } catch (error) {
    console.error('❌ Error guardando evento del calendario:', error);
  }
}

/**
 * Formatea fecha del calendario para mensajes
 * @param {string} dateTime - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatCalendarDate(dateTime) {
  const date = new Date(dateTime);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}