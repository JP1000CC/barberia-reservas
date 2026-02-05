import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: configuracion, error } = await supabase
      .from('configuracion')
      .select('*')
      .order('clave');

    if (error) {
      console.error('Error al obtener configuración:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: configuracion,
    });
  } catch (error) {
    console.error('Error en configuracion GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminSupabaseClient();

    // Actualizar cada configuración
    const updates = Object.entries(body).map(([clave, valor]) =>
      supabase
        .from('configuracion')
        .upsert(
          { clave, valor: valor as string },
          { onConflict: 'clave' }
        )
    );

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada',
    });
  } catch (error) {
    console.error('Error en configuracion PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
