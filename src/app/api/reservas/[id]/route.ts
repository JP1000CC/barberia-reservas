import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { removeReservationFromCalendar } from '@/lib/calendar';
import { sendCancellationEmail } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { estado, notas } = body;

    const supabase = createAdminSupabaseClient();

    // Si se va a cancelar, primero obtenemos los datos completos de la reserva
    let googleCalendarEventId: string | null = null;
    let reservaCompleta: any = null;

    if (estado === 'cancelada') {
      console.log('=== CANCELANDO RESERVA ===');
      console.log('Reserva ID:', params.id);

      const { data: reservaActual, error: fetchError } = await supabase
        .from('reservas')
        .select(`
          *,
          barbero:barberos(nombre, google_calendar_id)
        `)
        .eq('id', params.id)
        .single();

      if (fetchError) {
        console.error('Error al obtener reserva:', fetchError);
      }

      reservaCompleta = reservaActual;
      googleCalendarEventId = reservaActual?.google_calendar_event_id;
      console.log('Google Calendar Event ID encontrado:', googleCalendarEventId || 'NO TIENE');
    }

    const updateData: Record<string, any> = {};

    if (estado) {
      updateData.estado = estado;
      if (estado === 'cancelada') {
        updateData.cancelado_at = new Date().toISOString();
      } else if (estado === 'completada') {
        updateData.completado_at = new Date().toISOString();
      }
    }

    if (notas !== undefined) {
      updateData.notas = notas;
    }

    const { data: reserva, error } = await supabase
      .from('reservas')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar reserva:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la reserva' },
        { status: 500 }
      );
    }

    // Si se canceló, eliminar del calendario y enviar email
    if (estado === 'cancelada' && reservaCompleta) {
      // Eliminar del calendario si existe el evento
      if (googleCalendarEventId) {
        console.log('Eliminando evento de Google Calendar:', googleCalendarEventId);
        try {
          const calendarResult = await removeReservationFromCalendar(
            googleCalendarEventId,
            reservaCompleta.barbero?.google_calendar_id
          );
          console.log('Resultado eliminación calendario:', calendarResult);
        } catch (calendarError) {
          console.error('Error al eliminar evento del calendario:', calendarError);
        }
      } else {
        console.log('Esta reserva NO tiene evento en Google Calendar');
      }

      // Obtener configuración del negocio para el email
      const { data: configData } = await supabase
        .from('configuracion')
        .select('clave, valor');

      const config: Record<string, string> = {};
      configData?.forEach((item: { clave: string; valor: string }) => {
        config[item.clave] = item.valor;
      });

      // Enviar email de cancelación al cliente
      if (reservaCompleta.cliente_email) {
        try {
          console.log('Enviando email de cancelación a:', reservaCompleta.cliente_email);
          await sendCancellationEmail({
            clienteNombre: reservaCompleta.cliente_nombre,
            clienteEmail: reservaCompleta.cliente_email,
            clienteTelefono: reservaCompleta.cliente_telefono,
            servicioNombre: reservaCompleta.servicio_nombre,
            servicioPrecio: reservaCompleta.servicio_precio,
            barberoNombre: reservaCompleta.barbero?.nombre || 'Barbero',
            fecha: reservaCompleta.fecha,
            hora: reservaCompleta.hora_inicio,
            duracionMinutos: 30,
            ubicacion: config.direccion,
            nombreNegocio: config.nombre_barberia,
            telefonoNegocio: config.telefono,
          });
          console.log('Email de cancelación enviado correctamente');
        } catch (emailError) {
          console.error('Error al enviar email de cancelación:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: reserva,
    });
  } catch (error) {
    console.error('Error en reservas PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Primero obtener los datos completos de la reserva
    const { data: reservaCompleta } = await supabase
      .from('reservas')
      .select(`
        *,
        barbero:barberos(nombre, google_calendar_id)
      `)
      .eq('id', params.id)
      .single();

    const googleCalendarEventId = reservaCompleta?.google_calendar_event_id;

    // Cambiar estado a cancelada en lugar de eliminar
    const { error } = await supabase
      .from('reservas')
      .update({
        estado: 'cancelada',
        cancelado_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error al cancelar reserva:', error);
      return NextResponse.json(
        { success: false, error: 'Error al cancelar la reserva' },
        { status: 500 }
      );
    }

    // Eliminar evento del calendario si existe
    if (googleCalendarEventId) {
      try {
        const calendarResult = await removeReservationFromCalendar(
          googleCalendarEventId,
          reservaCompleta?.barbero?.google_calendar_id
        );
        console.log('Evento eliminado del calendario:', calendarResult);
      } catch (calendarError) {
        console.error('Error al eliminar evento del calendario:', calendarError);
      }
    }

    // Obtener configuración del negocio para el email
    const { data: configData } = await supabase
      .from('configuracion')
      .select('clave, valor');

    const config: Record<string, string> = {};
    configData?.forEach((item: { clave: string; valor: string }) => {
      config[item.clave] = item.valor;
    });

    // Enviar email de cancelación al cliente
    if (reservaCompleta?.cliente_email) {
      try {
        console.log('Enviando email de cancelación a:', reservaCompleta.cliente_email);
        await sendCancellationEmail({
          clienteNombre: reservaCompleta.cliente_nombre,
          clienteEmail: reservaCompleta.cliente_email,
          clienteTelefono: reservaCompleta.cliente_telefono,
          servicioNombre: reservaCompleta.servicio_nombre,
          servicioPrecio: reservaCompleta.servicio_precio,
          barberoNombre: reservaCompleta.barbero?.nombre || 'Barbero',
          fecha: reservaCompleta.fecha,
          hora: reservaCompleta.hora_inicio,
          duracionMinutos: 30,
          ubicacion: config.direccion,
          nombreNegocio: config.nombre_barberia,
          telefonoNegocio: config.telefono,
        });
        console.log('Email de cancelación enviado correctamente');
      } catch (emailError) {
        console.error('Error al enviar email de cancelación:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada',
    });
  } catch (error) {
    console.error('Error en reservas DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
