// Templates de mensajes de WhatsApp

export interface ReservationData {
  clienteNombre: string;
  clienteTelefono: string;
  servicioNombre: string;
  servicioPrecio: number;
  barberoNombre: string;
  fecha: string;
  hora: string;
  nombreBarberia: string;
  direccion?: string;
}

// Mensaje de confirmación al cliente
export function getClientConfirmationMessage(data: ReservationData): string {
  return `✅ *¡Reserva Confirmada!*

Hola ${data.clienteNombre}, tu cita ha sido reservada en *${data.nombreBarberia}*.

📋 *Detalles de tu cita:*
• Servicio: ${data.servicioNombre}
• Barbero: ${data.barberoNombre}
• Fecha: ${data.fecha}
• Hora: ${data.hora}
• Total: ${data.servicioPrecio} €

${data.direccion ? `📍 Dirección: ${data.direccion}` : ''}

Si necesitas cancelar o modificar tu cita, avísanos con al menos 2 horas de anticipación.

¡Te esperamos! 💈`;
}

// Notificación al admin/barbería
export function getAdminNotificationMessage(data: ReservationData): string {
  return `🗓️ *Nueva Reserva*

Cliente: ${data.clienteNombre}
Teléfono: ${data.clienteTelefono}

📋 *Detalles:*
• Servicio: ${data.servicioNombre}
• Barbero: ${data.barberoNombre}
• Fecha: ${data.fecha}
• Hora: ${data.hora}
• Precio: ${data.servicioPrecio} €`;
}

// Recordatorio al cliente (para usar con cron)
export function getReminderMessage(data: ReservationData): string {
  return `⏰ *Recordatorio de Cita*

Hola ${data.clienteNombre}, te recordamos que tienes una cita *mañana*:

• Servicio: ${data.servicioNombre}
• Barbero: ${data.barberoNombre}
• Hora: ${data.hora}

${data.direccion ? `📍 ${data.direccion}` : ''}

¡Te esperamos en *${data.nombreBarberia}*! 💈`;
}

// Mensaje de cancelación
export function getCancellationMessage(data: ReservationData): string {
  return `❌ *Cita Cancelada*

Hola ${data.clienteNombre}, tu cita ha sido cancelada:

• Servicio: ${data.servicioNombre}
• Fecha: ${data.fecha}
• Hora: ${data.hora}

Si deseas agendar una nueva cita, visita nuestra página de reservas.

*${data.nombreBarberia}*`;
}
