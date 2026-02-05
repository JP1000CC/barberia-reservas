import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = createAdminSupabaseClient();

    const { data: servicio, error } = await supabase
      .from('servicios')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar servicio:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: servicio,
    });
  } catch (error) {
    console.error('Error en servicios PATCH:', error);
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

    const { error } = await supabase
      .from('servicios')
      .update({ activo: false })
      .eq('id', params.id);

    if (error) {
      console.error('Error al eliminar servicio:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Servicio eliminado',
    });
  } catch (error) {
    console.error('Error en servicios DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
