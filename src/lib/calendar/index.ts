import { createCalendarEvent, deleteCalendarEvent } from './google';

export interface ReservationCalendarData {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  servicioNombre: string;
  barberoNombre: string;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  notas?: string;
}

// Agregar reserva al calendario
export async function addReservationToCalendar(data: ReservationCalendarData) {
  const [year, month, day] = data.fecha.split('-').map(Number);
  const [hours, minutes] = data.hora.split(':').map(Number);

  const fechaInicio = new Date(year, month - 1, day, hours, minutes);
  const fechaFin = new Date(fechaInicio.getTime() + data.duracionMinutos * 60000);

  const descripcion = [
    `📱 Teléfono: ${data.clienteTelefono}`,
    data.clienteEmail ? `📧 Email: ${data.clienteEmail}` : '',
    `✂️ Servicio: ${data.servicioNombre}`,
    `👤 Barbero: ${data.barberoNombre}`,
    `⏱️ Duración: ${data.duracionMinutos} minutos`,
    data.notas ? `📝 Notas: ${data.notas}` : '',
  ].filter(Boolean).join('\n');

  return await createCalendarEvent({
    titulo: `💈 ${data.clienteNombre} - ${data.servicioNombre}`,
    descripcion,
    fechaInicio,
    fechaFin,
    ubicacion: 'Studio 1994 by Dago',
  });
}

// Eliminar reserva del calendario
export async function removeReservationFromCalendar(eventId: string) {
  return await deleteCalendarEvent(eventId);
}
