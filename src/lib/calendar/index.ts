import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './google';

// Datos necesarios para crear un evento de reserva
export interface ReservationCalendarData {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  servicioNombre: string;
  barberoNombre: string;
  fecha: string; // formato YYYY-MM-DD
  hora: string; // formato HH:MM
  duracionMinutos: number;
  notas?: string;
}

// Agregar una reserva al calendario
export async function addReservationToCalendar(data: ReservationCalendarData) {
  // Crear fecha de inicio
  const [year, month, day] = data.fecha.split('-').map(Number);
  const [hours, minutes] = data.hora.split(':').map(Number);

  const fechaInicio = new Date(year, month - 1, day, hours, minutes);
  const fechaFin = new Date(fechaInicio.getTime() + data.duracionMinutos * 60000);

  const eventData = {
    titulo: `💈 ${data.clienteNombre} - ${data.servicioNombre}`,
    descripcion: `
📱 Teléfono: ${data.clienteTelefono}
${data.clienteEmail ? `📧 Email: ${data.clienteEmail}` : ''}
✂️ Servicio: ${data.servicioNombre}
👤 Barbero: ${data.barberoNombre}
⏱️ Duración: ${data.duracionMinutos} minutos
${data.notas ? `📝 Notas: ${data.notas}` : ''}
    `.trim(),
    fechaInicio,
    fechaFin,
    ubicacion: 'Studio 1994 by Dago',
  };

  console.log('Agregando reserva al calendario:', eventData);

  return await createCalendarEvent(eventData);
}

// Actualizar una reserva en el calendario
export async function updateReservationInCalendar(
  eventId: string,
  data: Partial<ReservationCalendarData>
) {
  const updateData: {
    titulo?: string;
    descripcion?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  } = {};

  if (data.clienteNombre && data.servicioNombre) {
    updateData.titulo = `💈 ${data.clienteNombre} - ${data.servicioNombre}`;
  }

  if (data.fecha && data.hora && data.duracionMinutos) {
    const [year, month, day] = data.fecha.split('-').map(Number);
    const [hours, minutes] = data.hora.split(':').map(Number);

    updateData.fechaInicio = new Date(year, month - 1, day, hours, minutes);
    updateData.fechaFin = new Date(updateData.fechaInicio.getTime() + data.duracionMinutos * 60000);
  }

  return await updateCalendarEvent(eventId, updateData);
}

// Eliminar una reserva del calendario
export async function removeReservationFromCalendar(eventId: string) {
  return await deleteCalendarEvent(eventId);
}
