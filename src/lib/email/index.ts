import { sendEmail } from './resend';
import { getConfirmationEmailTemplate, getAdminNotificationTemplate, ReservationEmailData } from './templates';

// Enviar email de confirmación al cliente
export async function sendConfirmationEmail(data: ReservationEmailData): Promise<boolean> {
  const html = getConfirmationEmailTemplate(data);

  const result = await sendEmail({
    to: data.clienteEmail,
    subject: `Confirmacion de Reserva - ${data.servicioNombre}`,
    html,
  });

  return result.success;
}

// Enviar notificación al administrador
export async function sendAdminNotification(data: ReservationEmailData, adminEmail: string): Promise<boolean> {
  const html = getAdminNotificationTemplate(data);

  const result = await sendEmail({
    to: adminEmail,
    subject: `Nueva Reserva: ${data.clienteNombre} - ${data.servicioNombre}`,
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
