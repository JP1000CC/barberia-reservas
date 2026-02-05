import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: barberos, error } = await supabase
      .from('barberos')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al obtener barberos:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener barberos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: barberos,
    });
  } catch (error) {
    console.error('Error en barberos GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, telefono, hora_inicio, hora_fin, dias_laborales, color, activo } = body;

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: barbero, error } = await supabase
      .from('barberos')
      .insert({
        nombre: nombre.trim(),
        email,
        telefono,
        hora_inicio,
        hora_fin,
        dias_laborales,
        color: color || '#3b82f6',
        activo: activo !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear barbero:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear barbero' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: barbero,
    });
  } catch (error) {
    console.error('Error en barberos POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
