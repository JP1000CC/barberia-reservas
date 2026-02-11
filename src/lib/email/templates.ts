export interface ReservationEmailData {
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  servicioNombre: string;
  servicioPrecio: number;
  barberoNombre: string;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  notas?: string;
  ubicacion?: string;
  nombreNegocio?: string;
  telefonoNegocio?: string;
  reservaId?: string;
}

// Formatear fecha en español
function formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Capitalizar primera letra
function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generar enlace para agregar evento a Google Calendar
function generateGoogleCalendarLink(data: ReservationEmailData): string {
  const [year, month, day] = data.fecha.split('-').map(Number);
  const [hours, minutes] = data.hora.split(':').map(Number);

  // Calcular hora de fin
  const endHours = hours + Math.floor((minutes + data.duracionMinutos) / 60);
  const endMinutes = (minutes + data.duracionMinutos) % 60;

  // Formatear fecha en formato YYYYMMDDTHHMMSS (hora local de España)
  const formatDateLocal = (y: number, m: number, d: number, h: number, min: number) => {
    return `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}${String(min).padStart(2, '0')}00`;
  };

  const startDateStr = formatDateLocal(year, month, day, hours, minutes);
  const endDateStr = formatDateLocal(year, month, day, endHours, endMinutes);

  const nombreNegocio = data.nombreNegocio || 'Studio 1994';
  const ubicacion = data.ubicacion || '';

  const title = encodeURIComponent(`Cita en ${nombreNegocio} - ${data.servicioNombre}`);
  const details = encodeURIComponent(
    `Servicio: ${data.servicioNombre}\nBarbero: ${data.barberoNombre}\nDuración: ${data.duracionMinutos} minutos\nPrecio: ${data.servicioPrecio.toFixed(2)} €`
  );
  const location = encodeURIComponent(ubicacion);
  const dates = `${startDateStr}/${endDateStr}`;

  // Incluir timezone de España (ctz = calendar timezone)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&ctz=Europe/Madrid`;
}

// Generar enlace de WhatsApp para cancelar/modificar cita
function generateWhatsAppCancelLink(data: ReservationEmailData): string {
  const telefonoNegocio = data.telefonoNegocio?.replace(/[\s\-\(\)]/g, '') || '';
  let phone = telefonoNegocio;

  if (!phone.startsWith('+')) {
    if (phone.startsWith('34')) {
      phone = '+' + phone;
    } else {
      phone = '+34' + phone;
    }
  }

  const fechaFormateada = capitalizar(formatearFecha(data.fecha));
  const mensaje = encodeURIComponent(
    `Hola, soy ${data.clienteNombre}. Tengo una cita el ${fechaFormateada} a las ${data.hora} y quiero cancelarla o cambiarla.`
  );

  return `https://wa.me/${phone}?text=${mensaje}`;
}

// ==========================================
// TEMPLATE: Confirmación de Reserva (Cliente)
// ==========================================
export function getConfirmationEmailTemplate(data: ReservationEmailData): string {
  const fechaFormateada = capitalizar(formatearFecha(data.fecha));
  const nombreNegocio = data.nombreNegocio || 'Studio 1994';
  const ubicacion = data.ubicacion || '';
  const telefonoNegocio = data.telefonoNegocio || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 35px 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 24px;">✂️</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">${nombreNegocio}</h1>
              <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">Confirmación de Reserva</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 8px 0;">
                Hola <strong>${data.clienteNombre}</strong>,
              </p>
              <p style="color: #666666; font-size: 15px; margin: 0 0 25px 0;">
                Tu cita ha sido confirmada exitosamente. Aquí están los detalles:
              </p>

              <!-- Detalles de la cita -->
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #1a1a2e;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 600; margin-left: 10px;">${fechaFormateada}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">⏰ Hora:</span>
                          <span style="color: #e63946; font-size: 22px; font-weight: 700; margin-left: 10px;">${data.hora}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">✂️ Servicio:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 500; margin-left: 10px;">${data.servicioNombre}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👤 Barbero:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 500; margin-left: 10px;">${data.barberoNombre}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">💰 Precio:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 600; margin-left: 10px;">${data.servicioPrecio.toFixed(2)} €</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${ubicacion ? `
              <!-- Dirección -->
              <p style="color: #666666; font-size: 14px; margin: 0 0 20px 0;">
                📍 <strong>Dirección:</strong> ${ubicacion}
              </p>
              ` : ''}

              <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                Gracias por tu reserva. Te esperamos.
              </p>
              <p style="color: #888888; font-size: 13px; margin: 0 0 25px 0;">
                Si necesitas cancelar o modificar tu cita, contáctanos al ${telefonoNegocio}.
              </p>

              <!-- Botón Agregar a Google Calendar (ROJO) -->
              <div style="text-align: center; margin-bottom: 10px;">
                <a href="${generateGoogleCalendarLink(data)}"
                   target="_blank"
                   style="display: inline-block; background-color: #e63946; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(230,57,70,0.3);">
                  📅 Agregar a Google Calendar
                </a>
              </div>

              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
                ¡Te esperamos!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #333333; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">${nombreNegocio}</p>
              ${ubicacion ? `<p style="color: #666666; font-size: 12px; margin: 0 0 5px 0;">${ubicacion}</p>` : ''}
              ${telefonoNegocio ? `<p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">📞 ${telefonoNegocio}</p>` : ''}
              ${data.reservaId ? `<p style="color: #999999; font-size: 11px; margin: 0;">ID de reserva: ${data.reservaId}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Generar enlace de WhatsApp para que el admin contacte al cliente
function generateWhatsAppClientLink(data: ReservationEmailData): string {
  let phone = data.clienteTelefono.replace(/[\s\-\(\)]/g, '');

  if (!phone.startsWith('+')) {
    if (phone.startsWith('34')) {
      phone = '+' + phone;
    } else {
      phone = '+34' + phone;
    }
  }

  const fechaFormateada = capitalizar(formatearFecha(data.fecha));
  const mensaje = encodeURIComponent(
    `Hola ${data.clienteNombre}, te escribimos desde Studio 1994 respecto a tu cita del ${fechaFormateada} a las ${data.hora}.`
  );

  return `https://wa.me/${phone}?text=${mensaje}`;
}

// ==========================================
// TEMPLATE: Notificación Admin (Nueva Reserva)
// ==========================================
export function getAdminNotificationTemplate(data: ReservationEmailData): string {
  const fechaFormateada = capitalizar(formatearFecha(data.fecha));
  const nombreNegocio = data.nombreNegocio || 'Studio 1994';
  const ubicacion = data.ubicacion || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">

          <!-- Header Verde/Azul elegante -->
          <tr>
            <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 35px 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 28px;">🎉</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Nueva Reserva</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">¡Tienes una nueva cita!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 35px 30px;">

              <!-- Tarjeta del Cliente -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Cliente</p>
                    <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">${data.clienteNombre}</p>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 3px 0;">
                          <span style="color: rgba(255,255,255,0.9); font-size: 14px;">📱 ${data.clienteTelefono}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0;">
                          <span style="color: rgba(255,255,255,0.9); font-size: 14px;">📧 ${data.clienteEmail}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Detalles de la Cita -->
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #11998e;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 600; margin-left: 10px;">${fechaFormateada}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #666666; font-size: 14px;">⏰ Hora:</span>
                          <span style="color: #11998e; font-size: 26px; font-weight: 700; margin-left: 10px;">${data.hora}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #666666; font-size: 14px;">✂️ Servicio:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 500; margin-left: 10px;">${data.servicioNombre}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #666666; font-size: 14px;">👤 Barbero:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 500; margin-left: 10px;">${data.barberoNombre}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #666666; font-size: 14px;">💰 Precio:</span>
                          <span style="color: #333333; font-size: 16px; font-weight: 700; margin-left: 10px;">${data.servicioPrecio.toFixed(2)} €</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #666666; font-size: 14px;">⏱️ Duración:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 500; margin-left: 10px;">${data.duracionMinutos} minutos</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${data.notas ? `
              <!-- Notas -->
              <table role="presentation" style="width: 100%; background-color: #fff3cd; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #856404; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">📝 Notas del cliente</p>
                    <p style="color: #856404; font-size: 14px; margin: 0; font-style: italic;">${data.notas}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Botón WhatsApp para contactar al cliente -->
              <div style="text-align: center; margin-bottom: 10px;">
                <a href="${generateWhatsAppClientLink(data)}"
                   target="_blank"
                   style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(37,211,102,0.3);">
                  💬 Contactar Cliente por WhatsApp
                </a>
              </div>

              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
                La cita ya fue añadida a tu Google Calendar automáticamente
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #333333; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">${nombreNegocio}</p>
              ${ubicacion ? `<p style="color: #666666; font-size: 12px; margin: 0 0 5px 0;">${ubicacion}</p>` : ''}
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Notificación automática del sistema de reservas
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ==========================================
// TEMPLATE: Recordatorio de Cita (Cliente)
// ==========================================
export function getReminderEmailTemplate(data: ReservationEmailData): string {
  const fechaFormateada = capitalizar(formatearFecha(data.fecha));
  const nombreNegocio = data.nombreNegocio || 'Studio 1994';
  const ubicacion = data.ubicacion || '';
  const telefonoNegocio = data.telefonoNegocio || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Cita</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">

          <!-- Header Naranja -->
          <tr>
            <td style="background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); padding: 35px 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 24px;">⏰</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Recordatorio de Cita</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">¡Tu cita es mañana!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 8px 0;">
                Hola <strong>${data.clienteNombre}</strong>,
              </p>
              <p style="color: #666666; font-size: 15px; margin: 0 0 25px 0;">
                Este es un recordatorio de que tienes una cita programada para <strong>mañana</strong>.
              </p>

              <!-- Detalles de la cita (estilo naranja) -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #fff5e6 0%, #fff0e0 100%); border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #f39c12;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">📅 Fecha:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 600; margin-left: 10px;">${fechaFormateada}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">⏰ Hora:</span>
                          <span style="color: #e74c3c; font-size: 24px; font-weight: 700; margin-left: 10px;">${data.hora}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">✂️ Servicio:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 500; margin-left: 10px;">${data.servicioNombre}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">👤 Barbero:</span>
                          <span style="color: #333333; font-size: 15px; font-weight: 500; margin-left: 10px;">${data.barberoNombre}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${ubicacion ? `
              <!-- Dirección -->
              <p style="color: #666666; font-size: 14px; margin: 0 0 20px 0;">
                📍 <strong>Dirección:</strong> ${ubicacion}
              </p>
              ` : ''}

              <p style="color: #666666; font-size: 14px; margin: 0 0 25px 0;">
                Recordatorio: Tienes una cita mañana.
              </p>

              <p style="color: #888888; font-size: 13px; margin: 0 0 20px 0;">
                Si no puedes asistir, por favor avísanos con anticipación al ${telefonoNegocio}.
              </p>

              <!-- Botón WhatsApp para cancelar/modificar -->
              ${telefonoNegocio ? `
              <div style="text-align: center; margin-bottom: 15px;">
                <a href="${generateWhatsAppCancelLink(data)}"
                   target="_blank"
                   style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(37,211,102,0.3);">
                  💬 Contactar por WhatsApp
                </a>
              </div>
              ` : ''}

              <p style="color: #f39c12; font-size: 15px; margin: 20px 0 0 0; text-align: center; font-weight: 500;">
                ¡Te esperamos mañana!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #333333; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">${nombreNegocio}</p>
              ${ubicacion ? `<p style="color: #666666; font-size: 12px; margin: 0 0 5px 0;">${ubicacion}</p>` : ''}
              ${telefonoNegocio ? `<p style="color: #666666; font-size: 12px; margin: 0;">📞 ${telefonoNegocio}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
