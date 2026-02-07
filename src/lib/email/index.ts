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
export async function sendConfirmationEmail(data: ReservationEmailData): Promise<boolean> {
  try {
    console.log('Enviando email de confirmación a:', data.clienteEmail);
    const html = getConfirmationEmailTemplate(data);
    const result = await sendEmail({
      to: data.clienteEmail,
      subject: `✅ Reserva confirmada - ${data.fecha} a las ${data.hora}`,
      html,
    });
    console.log('Resultado confirmación cliente:', result.success);
    return result.success;
  } catch (error) {
    console.error('Error en sendConfirmationEmail:', error);
    return false;
  }
}

// Enviar notificación al admin
export async function sendAdminNotification(data: ReservationEmailData, adminEmail: string): Promise<boolean> {
  try {
    console.log('Enviando notificación a admin:', adminEmail);
    const html = getAdminNotificationEmailTemplate(data);
    const result = await sendEmail({
      to: adminEmail,
      subject: `🗓️ Nueva reserva: ${data.clienteNombre} - ${data.fecha} ${data.hora}`,
      html,
    });
    console.log('Resultado notificación admin:', result.success);
    return result.success;
  } catch (error) {
    console.error('Error en sendAdminNotification:', error);
    return false;
  }
}

// Función principal - envía AMBOS emails en paralelo
export async function sendReservationEmails(
  reservationData: ReservationEmailData,
  adminEmail?: string
): Promise<{ client: boolean; admin: boolean }> {
  console.log('=== INICIANDO ENVÍO DE EMAILS ===');
  console.log('Cliente:', reservationData.clienteEmail);
  console.log('Admin:', adminEmail);

  // Crear array de promesas
  const promises: Promise<boolean>[] = [];

  // Siempre enviar al cliente
  promises.push(sendConfirmationEmail(reservationData));

  // Enviar al admin si hay email configurado
  if (adminEmail) {
    promises.push(sendAdminNotification(reservationData, adminEmail));
  }

  // Ejecutar en paralelo
  const results = await Promise.all(promises);

  const finalResult = {
    client: results[0] || false,
    admin: adminEmail ? (results[1] || false) : false,
  };

  console.log('=== RESULTADOS DE EMAILS ===', finalResult);
  return finalResult;
}
