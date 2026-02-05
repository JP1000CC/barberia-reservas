import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('q');

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('clientes')
      .select('*')
      .order('total_visitas', { ascending: false })
      .order('nombre');

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
    }

    const { data: clientes, error } = await query;

    if (error) {
      console.error('Error al obtener clientes:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener clientes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: clientes,
    });
  } catch (error) {
    console.error('Error en clientes GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
