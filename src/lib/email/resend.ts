import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'Studio 1994 <reservas@studio1994bydago.com>';

    console.log('Enviando email a:', to);
    console.log('Desde:', fromEmail);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('Error de Resend:', error);
      return { success: false, error: error.message };
    }

    console.log('Email enviado exitosamente:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
