import { sendWhatsAppMessage, isTwilioConfigured } from './twilio';
import {
  getClientConfirmationMessage,
  getAdminNotificationMessage,
  getReminderMessage,
  getCancellationMessage,
  type ReservationData,
} from './templates';

export type { ReservationData };
export { isTwilioConfigured };

// Enviar confirmación al cliente por WhatsApp
export async function sendClientWhatsAppConfirmation(data: ReservationData): Promise<boolean> {
  if (!isTwilioConfigured()) {
    console.log('WhatsApp no configurado, saltando envío al cliente');
    return false;
  }

  try {
    const message = getClientConfirmationMessage(data);
    const result = await sendWhatsAppMessage({
      to: data.clienteTelefono,
      message,
    });
    return result.success;
  } catch (error) {
    console.error('Error enviando WhatsApp al cliente:', error);
    return false;
  }
}

// Enviar notificación al admin por WhatsApp
export async function sendAdminWhatsAppNotification(data: ReservationData, adminPhone: string): Promise<boolean> {
  if (!isTwilioConfigured()) {
    console.log('WhatsApp no configurado, saltando envío al admin');
    return false;
  }

  try {
    const message = getAdminNotificationMessage(data);
    const result = await sendWhatsAppMessage({
      to: adminPhone,
      message,
    });
    return result.success;
  } catch (error) {
    console.error('Error enviando WhatsApp al admin:', error);
    return false;
  }
}

// Enviar recordatorio al cliente
export async function sendWhatsAppReminder(data: ReservationData): Promise<boolean> {
  if (!isTwilioConfigured()) {
    return false;
  }

  try {
    const message = getReminderMessage(data);
    const result = await sendWhatsAppMessage({
      to: data.clienteTelefono,
      message,
    });
    return result.success;
  } catch (error) {
    console.error('Error enviando recordatorio WhatsApp:', error);
    return false;
  }
}

// Enviar notificación de cancelación
export async function sendWhatsAppCancellation(data: ReservationData): Promise<boolean> {
  if (!isTwilioConfigured()) {
    return false;
  }

  try {
    const message = getCancellationMessage(data);
    const result = await sendWhatsAppMessage({
      to: data.clienteTelefono,
      message,
    });
    return result.success;
  } catch (error) {
    console.error('Error enviando cancelación WhatsApp:', error);
    return false;
  }
}

// Función principal - enviar todas las notificaciones de WhatsApp
export async function sendReservationWhatsApp(
  reservationData: ReservationData,
  adminPhone?: string
): Promise<{ client: boolean; admin: boolean }> {
  console.log('=== INICIANDO ENVÍO DE WHATSAPP ===');

  const results = {
    client: false,
    admin: false,
  };

  // Enviar al cliente
  results.client = await sendClientWhatsAppConfirmation(reservationData);

  // Enviar al admin si hay teléfono configurado
  if (adminPhone) {
    results.admin = await sendAdminWhatsAppNotification(reservationData, adminPhone);
  }

  console.log('=== RESULTADOS WHATSAPP ===', results);
  return results;
}
