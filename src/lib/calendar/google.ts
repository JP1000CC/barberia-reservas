import { google } from 'googleapis';

// Tipos para los eventos del calendario
export interface CalendarEventData {
  titulo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion?: string;
}

// Configurar el cliente de Google Calendar con Service Account
async function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

// Crear un evento en el calendario
export async function createCalendarEvent(eventData: CalendarEventData): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const calendar = await getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      console.error('GOOGLE_CALENDAR_ID no está configurado');
      return { success: false, error: 'Calendar ID no configurado' };
    }

    const event = {
      summary: eventData.titulo,
      description: eventData.descripcion,
      location: eventData.ubicacion || '',
      start: {
        dateTime: eventData.fechaInicio.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: eventData.fechaFin.toISOString(),
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

    console.log('Intentando crear evento en calendario:', calendarId);
    console.log('Datos del evento:', JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    console.log('Evento creado exitosamente:', response.data.id);

    return {
      success: true,
      eventId: response.data.id || undefined,
    };
  } catch (error) {
    console.error('Error al crear evento en Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Actualizar un evento existente
export async function updateCalendarEvent(
  eventId: string,
  eventData: Partial<CalendarEventData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = await getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return { success: false, error: 'Calendar ID no configurado' };
    }

    const updateData: Record<string, unknown> = {};

    if (eventData.titulo) updateData.summary = eventData.titulo;
    if (eventData.descripcion) updateData.description = eventData.descripcion;
    if (eventData.ubicacion) updateData.location = eventData.ubicacion;
    if (eventData.fechaInicio) {
      updateData.start = {
        dateTime: eventData.fechaInicio.toISOString(),
        timeZone: 'Europe/Madrid',
      };
    }
    if (eventData.fechaFin) {
      updateData.end = {
        dateTime: eventData.fechaFin.toISOString(),
        timeZone: 'Europe/Madrid',
      };
    }

    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Eliminar un evento del calendario
export async function deleteCalendarEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = await getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return { success: false, error: 'Calendar ID no configurado' };
    }

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
