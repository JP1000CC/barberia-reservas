import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { removeReservationFromCalendar } from '@/lib/calendar';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { estado, notas } = body;

    const supabase = createAdminSupabaseClient();

    // Si se va a cancelar, primero obtenemos el evento de calendar
    let googleCalendarEventId: string | null = null;
    if (estado === 'cancelada') {
      console.log('=== CANCELANDO RESERVA ===');
      console.log('Reserva ID:', params.id);

      const { data: reservaActual, error: fetchError } = await supabase
        .from('reservas')
        .select('google_calendar_event_id')
        .eq('id', params.id)
        .single();

      if (fetchError) {
        console.error('Error al obtener reserva:', fetchError);
      }

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

    // Si se canceló y hay evento en Google Calendar, eliminarlo
    if (estado === 'cancelada') {
      if (googleCalendarEventId) {
        console.log('Eliminando evento de Google Calendar:', googleCalendarEventId);
        try {
          const calendarResult = await removeReservationFromCalendar(googleCalendarEventId);
          console.log('Resultado eliminación calendario:', calendarResult);
        } catch (calendarError) {
          console.error('Error al eliminar evento del calendario:', calendarError);
          // No fallar la operación si el calendario falla
        }
      } else {
        console.log('Esta reserva NO tiene evento en Google Calendar (fue creada antes de la integración)');
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

    // Primero obtener el evento de calendar antes de cancelar
    const { data: reservaActual } = await supabase
      .from('reservas')
      .select('google_calendar_event_id')
      .eq('id', params.id)
      .single();

    const googleCalendarEventId = reservaActual?.google_calendar_event_id;

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
        const calendarResult = await removeReservationFromCalendar(googleCalendarEventId);
        console.log('Evento eliminado del calendario:', calendarResult);
      } catch (calendarError) {
        console.error('Error al eliminar evento del calendario:', calendarError);
        // No fallar la operación si el calendario falla
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
