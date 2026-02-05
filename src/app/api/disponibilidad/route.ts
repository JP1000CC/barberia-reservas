import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generarSlotsHorarios, formatearFecha } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const barberoId = searchParams.get('barberoId');
    const servicioId = searchParams.get('servicioId');

    if (!fecha || !barberoId || !servicioId) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Obtener barbero
    const { data: barbero, error: barberoError } = await supabase
      .from('barberos')
      .select('*')
      .eq('id', barberoId)
      .single();

    if (barberoError || !barbero) {
      return NextResponse.json(
        { success: false, error: 'Barbero no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el barbero trabaja ese día
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaSemana = fechaObj.getDay();
    if (!barbero.dias_laborales?.includes(diaSemana)) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Obtener servicio para saber la duración
    const { data: servicio, error: servicioError } = await supabase
      .from('servicios')
      .select('duracion_minutos')
      .eq('id', servicioId)
      .single();

    if (servicioError || !servicio) {
      return NextResponse.json(
        { success: false, error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Obtener reservas existentes del barbero para esa fecha
    const { data: reservas } = await supabase
      .from('reservas')
      .select('hora_inicio, hora_fin, estado')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelada","no_asistio")');

    // Verificar si hay un horario especial para este día
    const { data: horarioEspecial } = await supabase
      .from('horarios_especiales')
      .select('*')
      .or(`barbero_id.eq.${barberoId},barbero_id.is.null`)
      .eq('fecha', fecha)
      .limit(1)
      .single();

    let horaInicio = barbero.hora_inicio;
    let horaFin = barbero.hora_fin;

    if (horarioEspecial) {
      if (horarioEspecial.cerrado) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      if (horarioEspecial.hora_inicio) horaInicio = horarioEspecial.hora_inicio;
      if (horarioEspecial.hora_fin) horaFin = horarioEspecial.hora_fin;
    }

    // Obtener intervalo de configuración
    const { data: configIntervalo } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'intervalo_minutos')
      .single();

    const intervalo = parseInt(configIntervalo?.valor || '30');

    // Generar slots de horarios
    const slots = generarSlotsHorarios(
      horaInicio,
      horaFin,
      servicio.duracion_minutos,
      intervalo,
      reservas || [],
      fecha
    );

    return NextResponse.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Error en disponibilidad:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
