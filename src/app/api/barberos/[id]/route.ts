import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = createAdminSupabaseClient();

    const { data: barbero, error } = await supabase
      .from('barberos')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar barbero:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar barbero' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: barbero,
    });
  } catch (error) {
    console.error('Error en barberos PATCH:', error);
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

    // En lugar de eliminar, desactivamos
    const { error } = await supabase
      .from('barberos')
      .update({ activo: false })
      .eq('id', params.id);

    if (error) {
      console.error('Error al eliminar barbero:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar barbero' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Barbero eliminado',
    });
  } catch (error) {
    console.error('Error en barberos DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
