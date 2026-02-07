import { google } from 'googleapis';

// Configuración de Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Inicializar cliente de Google
function getGoogleAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!credentials) {
    console.log('Google Calendar no configurado: falta GOOGLE_SERVICE_ACCOUNT_KEY');
    return null;
  }

  try {
    const parsedCredentials = JSON.parse(credentials);

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: SCOPES,
    });

    return auth;
  } catch (error) {
    console.error('Error parseando credenciales de Google:', error);
    return null;
  }
}

// Obtener cliente de Calendar
async function getCalendarClient() {
  const auth = getGoogleAuth();
  if (!auth) return null;

  const calendar = google.calendar({ version: 'v3', auth });
  return calendar;
}

// Verificar si Google Calendar está configurado
export function isGoogleCalendarConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_CALENDAR_ID);
}

export interface CalendarEventData {
  titulo: string;
  descripcion: string;
  fechaInicio: string; // formato ISO: 2024-02-09T10:00:00
  fechaFin: string;
  ubicacion?: string;
  clienteEmail?: string;
}

// Crear evento en Google Calendar
export async function createCalendarEvent(eventData: CalendarEventData): Promise<{ success: boolean; eventId?: string; error?: any }> {
  if (!isGoogleCalendarConfigured()) {
    console.log('Google Calendar no configurado, saltando creación de evento');
    return { success: false, error: 'No configurado' };
  }

  try {
    const calendar = await getCalendarClient();
    if (!calendar) {
      return { success: false, error: 'No se pudo inicializar el cliente' };
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    const event = {
      summary: eventData.titulo,
      description: eventData.descripcion,
      location: eventData.ubicacion,
      start: {
        dateTime: eventData.fechaInicio,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: eventData.fechaFin,
        timeZone: 'Europe/Madrid',
      },
      // Opcional: enviar invitación al cliente
      ...(eventData.clienteEmail && {
        attendees: [{ email: eventData.clienteEmail }],
        sendUpdates: 'all',
      }),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 }, // 1 hora antes
          { method: 'popup', minutes: 15 }, // 15 min antes
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log('Evento creado en Google Calendar:', response.data.id);
    return { success: true, eventId: response.data.id || undefined };
  } catch (error: any) {
    console.error('Error creando evento en Google Calendar:', error.message);
    return { success: false, error: error.message };
  }
}

// Actualizar evento en Google Calendar
export async function updateCalendarEvent(
  eventId: string,
  eventData: Partial<CalendarEventData>
): Promise<{ success: boolean; error?: any }> {
  if (!isGoogleCalendarConfigured()) {
    return { success: false, error: 'No configurado' };
  }

  try {
    const calendar = await getCalendarClient();
    if (!calendar) {
      return { success: false, error: 'No se pudo inicializar el cliente' };
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    const updateData: any = {};
    if (eventData.titulo) updateData.summary = eventData.titulo;
    if (eventData.descripcion) updateData.description = eventData.descripcion;
    if (eventData.ubicacion) updateData.location = eventData.ubicacion;
    if (eventData.fechaInicio) {
      updateData.start = { dateTime: eventData.fechaInicio, timeZone: 'Europe/Madrid' };
    }
    if (eventData.fechaFin) {
      updateData.end = { dateTime: eventData.fechaFin, timeZone: 'Europe/Madrid' };
    }

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updateData,
    });

    console.log('Evento actualizado en Google Calendar:', eventId);
    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando evento:', error.message);
    return { success: false, error: error.message };
  }
}

// Eliminar evento de Google Calendar
export async function deleteCalendarEvent(eventId: string): Promise<{ success: boolean; error?: any }> {
  if (!isGoogleCalendarConfigured()) {
    return { success: false, error: 'No configurado' };
  }

  try {
    const calendar = await getCalendarClient();
    if (!calendar) {
      return { success: false, error: 'No se pudo inicializar el cliente' };
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log('Evento eliminado de Google Calendar:', eventId);
    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando evento:', error.message);
    return { success: false, error: error.message };
  }
}
