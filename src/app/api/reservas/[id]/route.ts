import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { estado, notas } = body;

    const supabase = createAdminSupabaseClient();

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
