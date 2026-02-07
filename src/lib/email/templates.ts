// Templates de email para el sistema de reservas

export interface ReservationEmailData {
  clienteNombre: string;
  clienteEmail: string;
  servicioNombre: string;
  servicioPrecio: number;
  barberoNombre: string;
  fecha: string;
  hora: string;
  nombreBarberia: string;
  direccion?: string;
  telefono?: string;
}

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background: white; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
  .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; }
  .content { padding: 40px 30px; }
  .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
  .details-card { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { color: #6c757d; font-size: 14px; }
  .detail-value { color: #333; font-weight: 500; font-size: 14px; text-align: right; }
  .price { color: #667eea; font-size: 18px; font-weight: 700; }
  .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
  .footer p { color: #6c757d; font-size: 14px; margin: 5px 0; }
  .success-icon { width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
`;

export function getConfirmationEmailTemplate(data: ReservationEmailData): string {
  const direccionHtml = data.direccion
    ? `<p style="color: #666;"><strong>📍 Dirección:</strong> ${data.direccion}</p>`
    : '';

  const footerDireccion = data.direccion ? `<p>📍 ${data.direccion}</p>` : '';
  const footerTelefono = data.telefono ? `<p>📞 ${data.telefono}</p>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.nombreBarberia}</h1>
      <p>Confirmación de Reserva</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h2 style="color: #333; margin: 0;">¡Reserva Confirmada!</h2>
      </div>
      <p class="greeting">Hola <strong>${data.clienteNombre}</strong>,</p>
      <p style="color: #666; line-height: 1.6;">
        Tu cita ha sido reservada exitosamente. A continuación encontrarás los detalles:
      </p>
      <div class="details-card">
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.servicioNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Barbero</span>
          <span class="detail-value">${data.barberoNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value">${data.fecha}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hora</span>
          <span class="detail-value">${data.hora}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total a pagar</span>
          <span class="detail-value price">${data.servicioPrecio} €</span>
        </div>
      </div>
      ${direccionHtml}
      <p style="color: #666; font-size: 14px;">
        Si necesitas cancelar o modificar tu reserva, contáctanos con al menos 2 horas de anticipación.
      </p>
    </div>
    <div class="footer">
      <p><strong>${data.nombreBarberia}</strong></p>
      ${footerDireccion}
      ${footerTelefono}
    </div>
  </div>
</body>
</html>`;
}

export function getAdminNotificationEmailTemplate(data: ReservationEmailData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗓️ Nueva Reserva</h1>
      <p>${data.nombreBarberia}</p>
    </div>
    <div class="content">
      <p class="greeting">¡Tienes una nueva reserva!</p>
      <div class="details-card">
        <div class="detail-row">
          <span class="detail-label">Cliente</span>
          <span class="detail-value">${data.clienteNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${data.clienteEmail}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.servicioNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Barbero</span>
          <span class="detail-value">${data.barberoNombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value"><strong>${data.fecha}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hora</span>
          <span class="detail-value"><strong>${data.hora}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Precio</span>
          <span class="detail-value price">${data.servicioPrecio} €</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Notificación automática del sistema de reservas.</p>
    </div>
  </div>
</body>
</html>`;
}
