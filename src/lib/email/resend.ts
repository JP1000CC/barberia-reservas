import { Resend } from 'resend';

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailData) {
  // Usar el dominio de pruebas de Resend por defecto
  // IMPORTANTE: Con onboarding@resend.dev solo puedes enviar a TU email de Resend
  // Para producción, configura tu propio dominio en Resend
  const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'Mi Barbería <onboarding@resend.dev>';

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return { success: false, error };
    }

    console.log('Email enviado exitosamente:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error en servicio de email:', error);
    return { success: false, error };
  }
}

export async function sendMultipleEmails(emails: EmailData[]) {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  );

  return results.map((result, index) => ({
    email: emails[index].to,
    success: result.status === 'fulfilled' && result.value.success,
  }));
}
