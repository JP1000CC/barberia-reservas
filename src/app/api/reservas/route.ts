import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendReservationEmails } from '@/lib/email';
import { addReservationToCalendar } from '@/lib/calendar';

// Función para calcular hora_fin basada en duración
function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
  const [hours, minutes] = horaInicio.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duracionMinutos;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const fecha = searchParams.get('fecha');
    const barberoId = searchParams.get('barbero_id');
    const estado = searchParams.get('estado');

    let query = supabase
      .from('reservas')
      .select(`
        *,
        cliente:clientes(*),
        servicio:servicios(*),
        barbero:barberos(*)
      `)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (fecha) {
      query = query.eq('fecha', fecha);
    }
    if (barberoId) {
      query = query.eq('barbero_id', barberoId);
    }
    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener reservas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en GET /api/reservas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Mapeo de recurrencia a días
const RECURRENCE_DAYS: Record<string, number> = {
  '1_week': 7,
  '2_weeks': 14,
  '3_weeks': 21,
  '1_month': 30,
};

// Función para generar ID único
function generateRecurrenteId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Función para calcular la próxima fecha
function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      servicio_id,
      barbero_id,
      fecha,
      hora,
      notas,
      // Nuevos campos para recurrencia
      es_recurrente,
      recurrencia,
      num_citas_recurrentes
    } = body;

    // Validaciones básicas
    if (!cliente_nombre || !cliente_email || !cliente_telefono || !servicio_id || !barbero_id || !fecha || !hora) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono español
    const telefonoRegex = /^[6-9]\d{8}$/;
    if (!telefonoRegex.test(cliente_telefono)) {
      return NextResponse.json(
        { error: 'Teléfono inválido. Debe ser un número español de 9 dígitos' },
        { status: 400 }
      );
    }

    // Obtener información del servicio y barbero
    const { data: servicio } = await supabase
      .from('servicios')
      .select('nombre, precio, duracion_minutos')
      .eq('id', servicio_id)
      .single();

    const { data: barbero } = await supabase
      .from('barberos')
      .select('nombre')
      .eq('id', barbero_id)
      .single();

    if (!servicio || !barbero) {
      return NextResponse.json(
        { error: 'Servicio o barbero no encontrado' },
        { status: 400 }
      );
    }

    // Obtener configuración del negocio
    const { data: configData } = await supabase
      .from('configuracion')
      .select('clave, valor');

    const config: Record<string, string> = {};
    configData?.forEach((item: { clave: string; valor: string }) => {
      config[item.clave] = item.valor;
    });

    // Calcular hora_fin
    const hora_inicio = hora;
    const hora_fin = calcularHoraFin(hora_inicio, servicio.duracion_minutos);

    // Verificar disponibilidad
    const { data: existingReservation } = await supabase
      .from('reservas')
      .select('id')
      .eq('barbero_id', barbero_id)
      .eq('fecha', fecha)
      .eq('hora_inicio', hora_inicio)
      .neq('estado', 'cancelada')
      .single();

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Este horario ya no está disponible' },
        { status: 409 }
      );
    }

    // Buscar o crear cliente
    let clienteId;
    const { data: existingCliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', cliente_telefono)
      .single();

    if (existingCliente) {
      clienteId = existingCliente.id;
      await supabase
        .from('clientes')
        .update({ email: cliente_email, nombre: cliente_nombre })
        .eq('id', clienteId);
    } else {
      const { data: newCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nombre: cliente_nombre,
          email: cliente_email,
          telefono: cliente_telefono
        })
        .select('id')
        .single();

      if (clienteError) {
        console.error('Error al crear cliente:', clienteError);
        return NextResponse.json(
          { error: 'Error al registrar cliente' },
          { status: 500 }
        );
      }
      clienteId = newCliente.id;
    }

    // Preparar fechas para reservas
    const fechasReserva: string[] = [fecha];
    let recurrenteId: string | null = null;

    // Si es recurrente, generar fechas adicionales
    if (es_recurrente && recurrencia && num_citas_recurrentes > 0) {
      const diasIntervalo = RECURRENCE_DAYS[recurrencia];
      if (diasIntervalo) {
        recurrenteId = generateRecurrenteId();
        for (let i = 1; i <= num_citas_recurrentes; i++) {
          const nuevaFecha = addDaysToDate(fecha, diasIntervalo * i);
          fechasReserva.push(nuevaFecha);
        }
      }
    }

    console.log('=== CREANDO RESERVAS ===');
    console.log('Total de citas a crear:', fechasReserva.length);
    console.log('Es recurrente:', es_recurrente);
    console.log('Recurrente ID:', recurrenteId);

    const reservasCreadas: any[] = [];
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminSupabase = createAdminSupabaseClient();

    // Crear cada reserva
    for (let i = 0; i < fechasReserva.length; i++) {
      const fechaReserva = fechasReserva[i];
      const esPrimera = i === 0;

      console.log(`Creando reserva ${i + 1}/${fechasReserva.length} para fecha: ${fechaReserva}`);

      // Verificar disponibilidad para esta fecha
      const { data: existingReservation } = await supabase
        .from('reservas')
        .select('id')
        .eq('barbero_id', barbero_id)
        .eq('fecha', fechaReserva)
        .eq('hora_inicio', hora_inicio)
        .neq('estado', 'cancelada')
        .single();

      if (existingReservation) {
        console.log(`Horario no disponible para ${fechaReserva}, saltando...`);
        continue; // Saltar esta fecha si no está disponible
      }

      // Crear la reserva
      const { data: reserva, error: reservaError } = await supabase
        .from('reservas')
        .insert({
          cliente_id: clienteId,
          servicio_id,
          barbero_id,
          fecha: fechaReserva,
          hora_inicio,
          hora_fin,
          cliente_nombre,
          cliente_email,
          cliente_telefono,
          servicio_nombre: servicio.nombre,
          servicio_precio: servicio.precio,
          notas: notas || null,
          estado: 'confirmada',
          recurrente_id: recurrenteId
        })
        .select()
        .single();

      if (reservaError) {
        console.error(`Error al crear reserva para ${fechaReserva}:`, reservaError);
        continue;
      }

      reservasCreadas.push(reserva);

      // Agregar al calendario de Google
      try {
        const notasCalendario = recurrenteId
          ? `${notas || ''}\n📅 Cita ${i + 1} de ${fechasReserva.length} (recurrente)`
          : notas;

        const calendarResult = await addReservationToCalendar({
          clienteNombre: cliente_nombre,
          clienteTelefono: cliente_telefono,
          clienteEmail: cliente_email,
          servicioNombre: servicio.nombre,
          barberoNombre: barbero.nombre,
          fecha: fechaReserva,
          hora: hora_inicio,
          duracionMinutos: servicio.duracion_minutos,
          notas: notasCalendario,
          ubicacion: config.direccion,
          nombreNegocio: config.nombre_barberia
        });

        if (calendarResult.success && calendarResult.eventId) {
          await adminSupabase
            .from('reservas')
            .update({ google_calendar_event_id: calendarResult.eventId })
            .eq('id', reserva.id);
        }
      } catch (calendarError) {
        console.error('Error al agregar al calendario:', calendarError);
      }

      // Enviar email solo para la primera cita (incluirá info de las demás si es recurrente)
      if (esPrimera) {
        try {
          const reservationData = {
            clienteNombre: cliente_nombre,
            clienteEmail: cliente_email,
            clienteTelefono: cliente_telefono,
            servicioNombre: servicio.nombre,
            servicioPrecio: servicio.precio,
            barberoNombre: barbero.nombre,
            fecha: fechaReserva,
            hora: hora_inicio,
            duracionMinutos: servicio.duracion_minutos,
            notas,
            ubicacion: config.direccion,
            nombreNegocio: config.nombre_barberia,
            telefonoNegocio: config.telefono,
            reservaId: reserva.id,
            // Info de recurrencia para el email
            esRecurrente: es_recurrente && fechasReserva.length > 1,
            totalCitas: fechasReserva.length,
            fechasRecurrentes: fechasReserva.slice(1)
          };

          const emailResults = await sendReservationEmails(reservationData, adminEmail);
          console.log('Emails enviados:', emailResults);
        } catch (emailError) {
          console.error('Error al enviar emails:', emailError);
        }
      }
    }

    if (reservasCreadas.length === 0) {
      return NextResponse.json(
        { error: 'No se pudo crear ninguna reserva' },
        { status: 500 }
      );
    }

    console.log(`=== RESERVAS CREADAS: ${reservasCreadas.length}/${fechasReserva.length} ===`);

    return NextResponse.json({
      success: true,
      reserva: {
        ...reservasCreadas[0],
        servicio,
        barbero: { nombre: barbero.nombre }
      },
      totalCitasCreadas: reservasCreadas.length,
      recurrenteId
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/reservas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
