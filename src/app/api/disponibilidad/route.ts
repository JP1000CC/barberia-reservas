import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Convertir hora string a minutos
function horaAMinutos(hora: string): number {
  const parts = hora.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
}

// Convertir minutos a hora string HH:MM
function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const barberoId = searchParams.get('barbero_id');
    const duracionParam = searchParams.get('duracion');

    if (!fecha || !barberoId) {
      return NextResponse.json(
        { error: 'Faltan parámetros: fecha y barbero_id son requeridos', slots: [] },
        { status: 400 }
      );
    }

    const duracion = parseInt(duracionParam || '30');
    const supabase = createServerSupabaseClient();

    // 1. Obtener información del barbero
    const { data: barbero, error: barberoError } = await supabase
      .from('barberos')
      .select('id, nombre, hora_inicio, hora_fin, dias_laborales, activo')
      .eq('id', barberoId)
      .single();

    if (barberoError || !barbero) {
      console.error('Error obteniendo barbero:', barberoError);
      return NextResponse.json({ error: 'Barbero no encontrado', slots: [] }, { status: 404 });
    }

    if (!barbero.activo) {
      return NextResponse.json({ slots: [], message: 'Barbero no disponible' });
    }

    // 2. Verificar si el barbero trabaja ese día de la semana
    const fechaObj = new Date(fecha + 'T12:00:00'); // Usar mediodía para evitar problemas de zona horaria
    const diaSemana = fechaObj.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

    const diasLaborales = barbero.dias_laborales || [1, 2, 3, 4, 5, 6]; // Default: Lun-Sab
    if (!diasLaborales.includes(diaSemana)) {
      return NextResponse.json({ slots: [], message: 'El barbero no trabaja este día' });
    }

    // 3. Obtener configuración general para horario por defecto
    const { data: configRows } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['hora_apertura', 'hora_cierre', 'intervalo_minutos']);

    const configMap: Record<string, string> = {};
    configRows?.forEach(row => {
      configMap[row.clave] = row.valor;
    });

    // 4. Usar horarios del barbero o defaults de configuración
    let horaInicio = barbero.hora_inicio || configMap['hora_apertura'] || '09:00';
    let horaFin = barbero.hora_fin || configMap['hora_cierre'] || '19:00';
    const intervalo = parseInt(configMap['intervalo_minutos'] || '30');

    // Normalizar formato de hora (remover segundos si existen)
    horaInicio = horaInicio.toString().slice(0, 5);
    horaFin = horaFin.toString().slice(0, 5);

    // 5. Verificar si hay horario especial para este día
    const { data: horarioEspecial } = await supabase
      .from('horarios_especiales')
      .select('cerrado, hora_inicio, hora_fin')
      .eq('fecha', fecha)
      .or(`barbero_id.eq.${barberoId},barbero_id.is.null`)
      .maybeSingle();

    if (horarioEspecial) {
      if (horarioEspecial.cerrado) {
        return NextResponse.json({ slots: [], message: 'Cerrado este día' });
      }
      if (horarioEspecial.hora_inicio) {
        horaInicio = horarioEspecial.hora_inicio.toString().slice(0, 5);
      }
      if (horarioEspecial.hora_fin) {
        horaFin = horarioEspecial.hora_fin.toString().slice(0, 5);
      }
    }

    // 6. Obtener reservas existentes para esta fecha y barbero
    const { data: reservas } = await supabase
      .from('reservas')
      .select('hora_inicio, hora_fin, estado')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelada","no_asistio")');

    // 7. Generar slots de tiempo disponibles
    const slots: string[] = [];
    const inicioMinutos = horaAMinutos(horaInicio);
    const finMinutos = horaAMinutos(horaFin);

    // Si es hoy, no mostrar horas pasadas (con margen de 30 min)
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];
    const esHoy = fecha === hoy;
    const minutosActuales = esHoy ? ahora.getHours() * 60 + ahora.getMinutes() + 30 : 0;

    for (let minutos = inicioMinutos; minutos + duracion <= finMinutos; minutos += intervalo) {
      // Saltar horas pasadas si es hoy
      if (esHoy && minutos < minutosActuales) {
        continue;
      }

      const horaSlot = minutosAHora(minutos);
      const finSlot = minutos + duracion;

      // Verificar si hay solapamiento con reservas existentes
      let disponible = true;
      if (reservas && reservas.length > 0) {
        for (const reserva of reservas) {
          const reservaInicio = horaAMinutos(reserva.hora_inicio.toString().slice(0, 5));
          const reservaFin = horaAMinutos(reserva.hora_fin.toString().slice(0, 5));

          // Verificar solapamiento: el nuevo slot se solapa si empieza antes de que termine la reserva
          // Y termina después de que empiece la reserva
          if (minutos < reservaFin && finSlot > reservaInicio) {
            disponible = false;
            break;
          }
        }
      }

      if (disponible) {
        slots.push(horaSlot);
      }
    }

    return NextResponse.json({ slots });

  } catch (error) {
    console.error('Error en disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', slots: [] },
      { status: 500 }
    );
  }
}
