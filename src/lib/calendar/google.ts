import { google } from 'googleapis';

export interface CalendarEventData {
  titulo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion?: string;
}

// Configurar cliente de Google Calendar
function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

// Crear evento en el calendario
export async function createCalendarEvent(
  eventData: CalendarEventData
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      console.error('GOOGLE_CALENDAR_ID no configurado');
      return { success: false, error: 'Calendar ID no configurado' };
    }

    console.log('Creando evento en calendario:', calendarId);

    // Formatear fecha sin conversión a UTC (mantener hora local de España)
    const formatLocalDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const event = {
      summary: eventData.titulo,
      description: eventData.descripcion,
      location: eventData.ubicacion || '',
      start: {
        dateTime: formatLocalDateTime(eventData.fechaInicio),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: formatLocalDateTime(eventData.fechaFin),
        timeZone: 'Europe/Madrid',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log('Evento creado:', response.data.id);

    return {
      success: true,
      eventId: response.data.id || undefined,
    };
  } catch (error) {
    console.error('Error creando evento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Eliminar evento del calendario
export async function deleteCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return { success: false, error: 'Calendar ID no configurado' };
    }

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log('Evento eliminado:', eventId);
    return { success: true };
  } catch (error) {
    console.error('Error eliminando evento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
