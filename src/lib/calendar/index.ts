import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  isGoogleCalendarConfigured,
  type CalendarEventData,
} from './google';

export {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  isGoogleCalendarConfigured,
  type CalendarEventData,
};

export interface ReservationCalendarData {
  reservaId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  servicioNombre: string;
  servicioPrecio: number;
  barberoNombre: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM
  horaFin: string; // HH:MM
  nombreBarberia: string;
  direccion?: string;
}

// Crear evento de reserva en Google Calendar
export async function addReservationToCalendar(data: ReservationCalendarData): Promise<{ success: boolean; eventId?: string }> {
  if (!isGoogleCalendarConfigured()) {
    console.log('Google Calendar no configurado');
    return { success: false };
  }

  // Construir fechas ISO
  const fechaInicio = `${data.fecha}T${data.horaInicio}:00`;
  const fechaFin = `${data.fecha}T${data.horaFin}:00`;

  const eventData: CalendarEventData = {
    titulo: `💈 ${data.clienteNombre} - ${data.servicioNombre}`,
    descripcion: `📋 Reserva en ${data.nombreBarberia}

👤 Cliente: ${data.clienteNombre}
📧 Email: ${data.clienteEmail}
📱 Teléfono: ${data.clienteTelefono}

✂️ Servicio: ${data.servicioNombre}
👨‍🦱 Barbero: ${data.barberoNombre}
💰 Precio: ${data.servicioPrecio} €

🔖 ID Reserva: ${data.reservaId}`,
    fechaInicio,
    fechaFin,
    ubicacion: data.direccion,
    clienteEmail: data.clienteEmail,
  };

  const result = await createCalendarEvent(eventData);
  return { success: result.success, eventId: result.eventId };
}

// Cancelar reserva en Google Calendar
export async function cancelReservationInCalendar(eventId: string): Promise<boolean> {
  if (!eventId || !isGoogleCalendarConfigured()) {
    return false;
  }

  const result = await deleteCalendarEvent(eventId);
  return result.success;
}

// Actualizar reserva en Google Calendar
export async function updateReservationInCalendar(
  eventId: string,
  data: Partial<ReservationCalendarData>
): Promise<boolean> {
  if (!eventId || !isGoogleCalendarConfigured()) {
    return false;
  }

  const updateData: Partial<CalendarEventData> = {};

  if (data.clienteNombre && data.servicioNombre) {
    updateData.titulo = `💈 ${data.clienteNombre} - ${data.servicioNombre}`;
  }

  if (data.fecha && data.horaInicio) {
    updateData.fechaInicio = `${data.fecha}T${data.horaInicio}:00`;
  }

  if (data.fecha && data.horaFin) {
    updateData.fechaFin = `${data.fecha}T${data.horaFin}:00`;
  }

  if (data.direccion) {
    updateData.ubicacion = data.direccion;
  }

  const result = await updateCalendarEvent(eventId, updateData);
  return result.success;
}
