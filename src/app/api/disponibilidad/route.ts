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

// Interfaz para rangos de tiempo
interface RangoHorario {
  inicio: number; // en minutos
  fin: number;    // en minutos
}

// Generar slots para un rango de tiempo dado
function generarSlotsParaRango(
  rango: RangoHorario,
  duracion: number,
  intervalo: number,
  reservas: Array<{ hora_inicio: string; hora_fin: string }>,
  minutosActuales: number,
  esHoy: boolean
): string[] {
  const slots: string[] = [];

  for (let minutos = rango.inicio; minutos + duracion <= rango.fin; minutos += intervalo) {
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

        // Verificar solapamiento
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

  return slots;
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

    // 1. Obtener información del barbero (incluyendo horario partido)
    const { data: barbero, error: barberoError } = await supabase
      .from('barberos')
      .select('id, nombre, hora_inicio, hora_fin, hora_inicio_2, hora_fin_2, dias_laborales, activo')
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
    const fechaObj = new Date(fecha + 'T12:00:00');
    const diaSemana = fechaObj.getDay();

    const diasLaborales = barbero.dias_laborales || [1, 2, 3, 4, 5, 6];
    if (!diasLaborales.includes(diaSemana)) {
      return NextResponse.json({ slots: [], message: 'El barbero no trabaja este día' });
    }

    // 3. Obtener configuración general (incluyendo horario partido del local)
    const { data: configRows } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['hora_apertura', 'hora_cierre', 'hora_apertura_2', 'hora_cierre_2', 'intervalo_minutos']);

    const configMap: Record<string, string> = {};
    configRows?.forEach(row => {
      configMap[row.clave] = row.valor;
    });

    // 4. Determinar horarios (barbero tiene prioridad sobre configuración general)
    // Primer turno
    let horaInicio1 = barbero.hora_inicio || configMap['hora_apertura'] || '09:00';
    let horaFin1 = barbero.hora_fin || configMap['hora_cierre'] || '19:00';

    // Segundo turno (horario partido)
    let horaInicio2 = barbero.hora_inicio_2 || configMap['hora_apertura_2'] || '';
    let horaFin2 = barbero.hora_fin_2 || configMap['hora_cierre_2'] || '';

    const intervalo = parseInt(configMap['intervalo_minutos'] || '30');

    // Normalizar formato de hora (remover segundos si existen)
    horaInicio1 = horaInicio1.toString().slice(0, 5);
    horaFin1 = horaFin1.toString().slice(0, 5);
    if (horaInicio2) horaInicio2 = horaInicio2.toString().slice(0, 5);
    if (horaFin2) horaFin2 = horaFin2.toString().slice(0, 5);

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
      // Los horarios especiales sobrescriben solo el primer turno por ahora
      if (horarioEspecial.hora_inicio) {
        horaInicio1 = horarioEspecial.hora_inicio.toString().slice(0, 5);
      }
      if (horarioEspecial.hora_fin) {
        horaFin1 = horarioEspecial.hora_fin.toString().slice(0, 5);
      }
    }

    // 6. Obtener reservas existentes para esta fecha y barbero
    const { data: reservas } = await supabase
      .from('reservas')
      .select('hora_inicio, hora_fin, estado')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelada","no_asistio")');

    const reservasFormateadas = (reservas || []).map(r => ({
      hora_inicio: r.hora_inicio,
      hora_fin: r.hora_fin
    }));

    // 7. Calcular minutos actuales si es hoy
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];
    const esHoy = fecha === hoy;
    const minutosActuales = esHoy ? ahora.getHours() * 60 + ahora.getMinutes() + 30 : 0;

    // 8. Generar slots para cada rango de horario
    const rangos: RangoHorario[] = [];

    // Primer turno siempre existe
    rangos.push({
      inicio: horaAMinutos(horaInicio1),
      fin: horaAMinutos(horaFin1)
    });

    // Segundo turno solo si está configurado (horario partido)
    if (horaInicio2 && horaFin2 && horaInicio2.length >= 4 && horaFin2.length >= 4) {
      const inicio2 = horaAMinutos(horaInicio2);
      const fin2 = horaAMinutos(horaFin2);

      // Validar que el segundo turno sea después del primero
      if (inicio2 > rangos[0].fin) {
        rangos.push({
          inicio: inicio2,
          fin: fin2
        });
      }
    }

    // 9. Generar slots para todos los rangos
    let todosLosSlots: string[] = [];

    for (const rango of rangos) {
      const slotsRango = generarSlotsParaRango(
        rango,
        duracion,
        intervalo,
        reservasFormateadas,
        minutosActuales,
        esHoy
      );
      todosLosSlots = todosLosSlots.concat(slotsRango);
    }

    // 10. Ordenar slots por hora
    todosLosSlots.sort((a, b) => horaAMinutos(a) - horaAMinutos(b));

    return NextResponse.json({
      slots: todosLosSlots,
      // Información adicional para el frontend
      horarioPartido: rangos.length > 1,
      rangos: rangos.map(r => ({
        inicio: minutosAHora(r.inicio),
        fin: minutosAHora(r.fin)
      }))
    });

  } catch (error) {
    console.error('Error en disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', slots: [] },
      { status: 500 }
    );
  }
}
