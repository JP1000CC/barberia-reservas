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
}

export function getConfirmationEmailTemplate(data: ReservationEmailData): string {
  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmacion de Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Studio 1994 by Dago</h1>
              <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px;">Confirmacion de Reserva</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">
                Hola <strong>${data.clienteNombre}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; margin: 0 0 30px 0;">
                Tu reserva ha sido confirmada. Aqui tienes los detalles:
              </p>
              <table role="presentation" style="width: 100%; background-color: #f8f8f8; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Servicio</span><br>
                          <strong style="color: #333333; font-size: 16px;">${data.servicioNombre}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Barbero</span><br>
                          <strong style="color: #333333; font-size: 16px;">${data.barberoNombre}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Fecha</span><br>
                          <strong style="color: #333333; font-size: 16px;">${fechaFormateada}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Hora</span><br>
                          <strong style="color: #333333; font-size: 16px;">${data.hora}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Duracion</span><br>
                          <strong style="color: #333333; font-size: 16px;">${data.duracionMinutos} minutos</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #666666; font-size: 14px;">Precio</span><br>
                          <strong style="color: #333333; font-size: 18px;">${data.servicioPrecio.toFixed(2)} EUR</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Si necesitas cancelar o modificar tu cita, por favor contactanos con anticipacion.
              </p>
              <p style="color: #666666; font-size: 14px; margin: 0;">
                Te esperamos!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Studio 1994 by Dago<br>
                Este email fue enviado automaticamente, por favor no responder.
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

export function getAdminNotificationTemplate(data: ReservationEmailData): string {
  const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nueva Reserva Recibida</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">
                Se ha recibido una nueva reserva con los siguientes detalles:
              </p>
              <table role="presentation" style="width: 100%; background-color: #f0f9ff; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">Datos del Cliente</h3>
                    <p style="margin: 5px 0; color: #333333;"><strong>Nombre:</strong> ${data.clienteNombre}</p>
                    <p style="margin: 5px 0; color: #333333;"><strong>Telefono:</strong> ${data.clienteTelefono}</p>
                    <p style="margin: 5px 0; color: #333333;"><strong>Email:</strong> ${data.clienteEmail}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" style="width: 100%; background-color: #f8f8f8; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">Detalles de la Reserva</h3>
                    <p style="margin: 5px 0; color: #333333;"><strong>Servicio:</strong> ${data.servicioNombre}</p>
                    <p style="margin: 5px 0; color: #333333;"><strong>Barbero:</strong> ${data.barberoNombre}</p>
                    <p style="margin: 5px 0; color: #333333;"><strong>Fecha:</strong> ${fechaFormateada}</p>
                    <p style="margin: 5px 0; color: #333333;"><strong>Hora:</strong> ${data.hora}</p>
                    <p style="margin: 5px 0; color: #333333;"><strong>Duracion:</strong> ${data.duracionMinutos} minutos</p>
                    <p style="margin: 5px 0; color: #333333;"><strong>Precio:</strong> ${data.servicioPrecio.toFixed(2)} EUR</p>
                    ${data.notas ? `<p style="margin: 5px 0; color: #333333;"><strong>Notas:</strong> ${data.notas}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Notificacion automatica del sistema de reservas
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
