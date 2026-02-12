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
  ubicacion?: string;
  nombreNegocio?: string;
  // ID del calendario específico del barbero
  googleCalendarId?: string | null;
}

// Formatear número de teléfono para WhatsApp
function formatPhoneForWhatsApp(phone: string): string {
  // Eliminar espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Si no empieza con +, agregar +34 (España)
  if (!cleaned.startsWith('+')) {
    // Si empieza con 34, agregar +
    if (cleaned.startsWith('34')) {
      cleaned = '+' + cleaned;
    } else {
      // Asumir que es un número español
      cleaned = '+34' + cleaned;
    }
  }

  return cleaned;
}

// Agregar reserva al calendario
export async function addReservationToCalendar(data: ReservationCalendarData) {
  const [year, month, day] = data.fecha.split('-').map(Number);
  const [hours, minutes] = data.hora.split(':').map(Number);

  const fechaInicio = new Date(year, month - 1, day, hours, minutes);
  const fechaFin = new Date(fechaInicio.getTime() + data.duracionMinutos * 60000);

  // Generar enlace de WhatsApp
  const whatsappNumber = formatPhoneForWhatsApp(data.clienteTelefono);
  const whatsappMessage = encodeURIComponent('Hola, ¿vienes en camino?');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const descripcion = [
    `📱 Teléfono: ${data.clienteTelefono}`,
    `💬 WhatsApp: ${whatsappLink}`,
    data.clienteEmail ? `📧 Email: ${data.clienteEmail}` : '',
    `✂️ Servicio: ${data.servicioNombre}`,
    `👤 Barbero: ${data.barberoNombre}`,
    `⏱️ Duración: ${data.duracionMinutos} minutos`,
    data.notas ? `📝 Notas: ${data.notas}` : '',
  ].filter(Boolean).join('\n');

  const ubicacion = data.ubicacion || 'Studio 1994 by Dago';
  const nombreNegocio = data.nombreNegocio || 'Studio 1994';

  return await createCalendarEvent(
    {
      titulo: `💈 ${data.clienteNombre} - ${data.servicioNombre}`,
      descripcion,
      fechaInicio,
      fechaFin,
      ubicacion,
    },
    data.googleCalendarId // Pasar el ID del calendario del barbero
  );
}

// Eliminar reserva del calendario
export async function removeReservationFromCalendar(eventId: string, googleCalendarId?: string | null) {
  return await deleteCalendarEvent(eventId, googleCalendarId);
}
