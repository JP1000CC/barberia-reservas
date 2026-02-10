import { sendEmail } from './resend';
import {
  getConfirmationEmailTemplate,
  getAdminNotificationTemplate,
  getReminderEmailTemplate,
  ReservationEmailData
} from './templates';

// Enviar email de confirmación al cliente
export async function sendConfirmationEmail(data: ReservationEmailData): Promise<boolean> {
  const html = getConfirmationEmailTemplate(data);
  const nombreNegocio = data.nombreNegocio || 'Studio 1994';

  const result = await sendEmail({
    to: data.clienteEmail,
    subject: `✅ Confirmación de Cita - ${nombreNegocio}`,
    html,
  });

  return result.success;
}

// Enviar notificación al administrador
export async function sendAdminNotification(data: ReservationEmailData, adminEmail: string): Promise<boolean> {
  console.log('=== ENVIANDO EMAIL ADMIN ===');
  console.log('Admin email destino:', adminEmail);

  if (!adminEmail) {
    console.error('ERROR: adminEmail está vacío o undefined');
    return false;
  }

  const html = getAdminNotificationTemplate(data);

  const result = await sendEmail({
    to: adminEmail,
    subject: `📅 Nueva Reserva: ${data.clienteNombre} - ${data.servicioNombre}`,
    html,
  });

  console.log('Resultado envío admin:', result);
  return result.success;
}

// Enviar email de recordatorio al cliente
export async function sendReminderEmail(data: ReservationEmailData): Promise<boolean> {
  const html = getReminderEmailTemplate(data);
  const nombreNegocio = data.nombreNegocio || 'Studio 1994';

  const result = await sendEmail({
    to: data.clienteEmail,
    subject: `⏰ Recordatorio: Tu cita es mañana - ${nombreNegocio}`,
    html,
  });

  return result.success;
}

// Enviar ambos emails (cliente + admin)
export async function sendReservationEmails(
  reservationData: ReservationEmailData,
  adminEmail?: string
): Promise<{ client: boolean; admin: boolean }> {
  console.log('Enviando emails de reserva...');
  console.log('Email cliente:', reservationData.clienteEmail);
  console.log('Email admin:', adminEmail);

  // Enviar ambos emails en paralelo
  const promises: Promise<boolean>[] = [
    sendConfirmationEmail(reservationData)
  ];

  if (adminEmail) {
    promises.push(sendAdminNotification(reservationData, adminEmail));
  }

  const results = await Promise.all(promises);

  const response = {
    client: results[0],
    admin: adminEmail ? results[1] : false
  };

  console.log('Resultados de emails:', response);

  return response;
}

export type { ReservationEmailData };
export { getReminderEmailTemplate };
