import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Sandbox number

// Inicializar cliente de Twilio
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface WhatsAppMessage {
  to: string; // Número con formato: +34633561792
  message: string;
}

// Formatear número para WhatsApp
function formatWhatsAppNumber(phone: string): string {
  // Limpiar el número
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Si no tiene código de país, agregar +34 (España)
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('34')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+34' + cleaned;
    }
  }

  return `whatsapp:${cleaned}`;
}

// Enviar mensaje de WhatsApp
export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage): Promise<{ success: boolean; error?: any }> {
  if (!client) {
    console.error('Twilio no está configurado. Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN');
    return { success: false, error: 'Twilio no configurado' };
  }

  try {
    const formattedTo = formatWhatsAppNumber(to);
    console.log('Enviando WhatsApp a:', formattedTo);

    const result = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: message,
    });

    console.log('WhatsApp enviado, SID:', result.sid);
    return { success: true };
  } catch (error: any) {
    console.error('Error enviando WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
}

// Verificar si Twilio está configurado
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken);
}
