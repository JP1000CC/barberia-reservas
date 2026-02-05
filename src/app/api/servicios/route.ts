import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: servicios, error } = await supabase
      .from('servicios')
      .select('*')
      .order('orden')
      .order('nombre');

    if (error) {
      console.error('Error al obtener servicios:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener servicios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: servicios,
    });
  } catch (error) {
    console.error('Error en servicios GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, duracion_minutos, precio, activo } = body;

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!duracion_minutos || duracion_minutos < 5) {
      return NextResponse.json(
        { success: false, error: 'La duración mínima es 5 minutos' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: servicio, error } = await supabase
      .from('servicios')
      .insert({
        nombre: nombre.trim(),
        descripcion,
        duracion_minutos,
        precio: precio || 0,
        activo: activo !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear servicio:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: servicio,
    });
  } catch (error) {
    console.error('Error en servicios POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
