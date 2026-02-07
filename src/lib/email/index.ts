import { sendEmail } from './resend';
import {
  getConfirmationEmailTemplate,
  getAdminNotificationEmailTemplate,
  type ReservationEmailData,
} from './templates';

export type { ReservationEmailData };

// Formatear fecha para emails
export function formatearFechaEmail(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
}

// Enviar email de confirmación al cliente
export async function sendConfirmationEmail(data: ReservationEmailData) {
  const html = getConfirmationEmailTemplate(data);
  return sendEmail({
    to: data.clienteEmail,
    subject: `✅ Reserva confirmada - ${data.fecha} a las ${data.hora}`,
    html,
  });
}

// Enviar notificación al admin
export async function sendAdminNotification(data: ReservationEmailData, adminEmail: string) {
  const html = getAdminNotificationEmailTemplate(data);
  return sendEmail({
    to: adminEmail,
    subject: `🗓️ Nueva reserva: ${data.clienteNombre} - ${data.fecha} ${data.hora}`,
    html,
  });
}

// Función principal para enviar todos los emails de una nueva reserva
export async function sendReservationEmails(
  reservationData: ReservationEmailData,
  adminEmail?: string
) {
  const results = {
    clientConfirmation: { success: false, error: null as any },
    adminNotification: { success: false, error: null as any },
  };

  // Enviar confirmación al cliente
  try {
    const clientResult = await sendConfirmationEmail(reservationData);
    results.clientConfirmation = clientResult;
  } catch (error) {
    console.error('Error enviando email al cliente:', error);
    results.clientConfirmation.error = error;
  }

  // Enviar notificación al admin
  if (adminEmail) {
    try {
      const adminResult = await sendAdminNotification(reservationData, adminEmail);
      results.adminNotification = adminResult;
    } catch (error) {
      console.error('Error enviando email al admin:', error);
      results.adminNotification.error = error;
    }
  }

  return results;
}
