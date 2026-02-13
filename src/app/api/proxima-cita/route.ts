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

interface RangoHorario {
  inicio: number;
  fin: number;
}

interface CitaDisponible {
  fecha: string;
  hora: string;
  barberoId: string;
  barberoNombre: string;
  barberoColor: string;
}

// Obtener slots disponibles para un barbero en una fecha específica
async function obtenerSlotsDisponibles(
  supabase: any,
  barbero: any,
  fecha: string,
  duracion: number,
  intervalo: number
): Promise<string[]> {
  // Verificar si el barbero trabaja ese día
  const fechaObj = new Date(fecha + 'T12:00:00');
  const diaSemana = fechaObj.getDay();
  const diasLaborales = barbero.dias_laborales || [1, 2, 3, 4, 5, 6];

  if (!diasLaborales.includes(diaSemana)) {
    return [];
  }

  // Obtener horarios del barbero
  let horaInicio1 = (barbero.hora_inicio || '09:00').toString().slice(0, 5);
  let horaFin1 = (barbero.hora_fin || '19:00').toString().slice(0, 5);
  let horaInicio2 = barbero.hora_inicio_2 ? barbero.hora_inicio_2.toString().slice(0, 5) : '';
  let horaFin2 = barbero.hora_fin_2 ? barbero.hora_fin_2.toString().slice(0, 5) : '';

  // Verificar horario especial
  const { data: horarioEspecial } = await supabase
    .from('horarios_especiales')
    .select('cerrado, hora_inicio, hora_fin')
    .eq('fecha', fecha)
    .or(`barbero_id.eq.${barbero.id},barbero_id.is.null`)
    .maybeSingle();

  if (horarioEspecial?.cerrado) {
    return [];
  }

  if (horarioEspecial) {
    if (horarioEspecial.hora_inicio) horaInicio1 = horarioEspecial.hora_inicio.toString().slice(0, 5);
    if (horarioEspecial.hora_fin) horaFin1 = horarioEspecial.hora_fin.toString().slice(0, 5);
  }

  // Obtener reservas existentes
  const { data: reservas } = await supabase
    .from('reservas')
    .select('hora_inicio, hora_fin')
    .eq('barbero_id', barbero.id)
    .eq('fecha', fecha)
    .not('estado', 'in', '("cancelada","no_asistio")');

  // Calcular minutos actuales si es hoy
  const ahora = new Date();
  const hoy = ahora.toISOString().split('T')[0];
  const esHoy = fecha === hoy;
  const minutosActuales = esHoy ? ahora.getHours() * 60 + ahora.getMinutes() + 30 : 0;

  // Crear rangos de horario
  const rangos: RangoHorario[] = [
    { inicio: horaAMinutos(horaInicio1), fin: horaAMinutos(horaFin1) }
  ];

  if (horaInicio2 && horaFin2) {
    const inicio2 = horaAMinutos(horaInicio2);
    if (inicio2 > rangos[0].fin) {
      rangos.push({ inicio: inicio2, fin: horaAMinutos(horaFin2) });
    }
  }

  // Generar slots
  const slots: string[] = [];
  const reservasFormateadas = (reservas || []).map((r: any) => ({
    inicio: horaAMinutos(r.hora_inicio.toString().slice(0, 5)),
    fin: horaAMinutos(r.hora_fin.toString().slice(0, 5))
  }));

  for (const rango of rangos) {
    for (let minutos = rango.inicio; minutos + duracion <= rango.fin; minutos += intervalo) {
      if (esHoy && minutos < minutosActuales) continue;

      const finSlot = minutos + duracion;
      let disponible = true;

      for (const reserva of reservasFormateadas) {
        if (minutos < reserva.fin && finSlot > reserva.inicio) {
          disponible = false;
          break;
        }
      }

      if (disponible) {
        slots.push(minutosAHora(minutos));
      }
    }
  }

  return slots;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const duracionParam = searchParams.get('duracion');
    const skipParam = searchParams.get('skip'); // Número de citas a saltar
    const barberoIdParam = searchParams.get('barbero_id'); // Opcional: filtrar por barbero

    const duracion = parseInt(duracionParam || '30');
    const skip = parseInt(skipParam || '0');
    const supabase = createServerSupabaseClient();

    // Obtener configuración
    const { data: configRows } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['intervalo_minutos', 'dias_anticipacion_maxima']);

    const configMap: Record<string, string> = {};
    configRows?.forEach(row => {
      configMap[row.clave] = row.valor;
    });

    const intervalo = parseInt(configMap['intervalo_minutos'] || '30');
    const diasAnticipacion = parseInt(configMap['dias_anticipacion_maxima'] || '30');

    // Obtener barberos activos
    let barberoQuery = supabase
      .from('barberos')
      .select('id, nombre, color, hora_inicio, hora_fin, hora_inicio_2, hora_fin_2, dias_laborales')
      .eq('activo', true);

    if (barberoIdParam) {
      barberoQuery = barberoQuery.eq('id', barberoIdParam);
    }

    const { data: barberos, error: barberosError } = await barberoQuery;

    if (barberosError || !barberos || barberos.length === 0) {
      return NextResponse.json({ error: 'No hay barberos disponibles', citas: [] });
    }

    // Buscar citas disponibles en los próximos días
    const citasDisponibles: CitaDisponible[] = [];
    const hoy = new Date();

    for (let dia = 0; dia < diasAnticipacion && citasDisponibles.length < skip + 10; dia++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + dia);
      const fechaStr = fecha.toISOString().split('T')[0];

      for (const barbero of barberos) {
        const slots = await obtenerSlotsDisponibles(
          supabase,
          barbero,
          fechaStr,
          duracion,
          intervalo
        );

        for (const hora of slots) {
          citasDisponibles.push({
            fecha: fechaStr,
            hora,
            barberoId: barbero.id,
            barberoNombre: barbero.nombre,
            barberoColor: barbero.color || '#3b82f6'
          });
        }
      }
    }

    // Ordenar por fecha y hora
    citasDisponibles.sort((a, b) => {
      const fechaCompare = a.fecha.localeCompare(b.fecha);
      if (fechaCompare !== 0) return fechaCompare;
      return horaAMinutos(a.hora) - horaAMinutos(b.hora);
    });

    // Aplicar skip y limitar resultados
    const citasFiltradas = citasDisponibles.slice(skip, skip + 5);

    return NextResponse.json({
      citas: citasFiltradas,
      total: citasDisponibles.length,
      hasMore: citasDisponibles.length > skip + 5
    });

  } catch (error) {
    console.error('Error en proxima-cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', citas: [] },
      { status: 500 }
    );
  }
}
