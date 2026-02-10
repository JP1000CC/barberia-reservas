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
      notas
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

    // Crear la reserva
    const { data: reserva, error: reservaError } = await supabase
      .from('reservas')
      .insert({
        cliente_id: clienteId,
        servicio_id,
        barbero_id,
        fecha,
        hora_inicio,
        hora_fin,
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        servicio_nombre: servicio.nombre,
        servicio_precio: servicio.precio,
        notas: notas || null,
        estado: 'confirmada'
      })
      .select()
      .single();

    if (reservaError) {
      console.error('Error al crear reserva:', reservaError);
      return NextResponse.json(
        { error: 'Error al crear la reserva' },
        { status: 500 }
      );
    }

    // Datos para email y calendario
    const reservationData = {
      clienteNombre: cliente_nombre,
      clienteEmail: cliente_email,
      clienteTelefono: cliente_telefono,
      servicioNombre: servicio.nombre,
      servicioPrecio: servicio.precio,
      barberoNombre: barbero.nombre,
      fecha,
      hora: hora_inicio,
      duracionMinutos: servicio.duracion_minutos,
      notas
    };

    // Enviar emails
    const adminEmail = process.env.ADMIN_EMAIL;
    console.log('=== CONFIGURACIÓN EMAILS ===');
    console.log('ADMIN_EMAIL env:', adminEmail ? `configurado (${adminEmail})` : 'NO CONFIGURADO');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'configurado' : 'NO CONFIGURADO');

    try {
      const emailResults = await sendReservationEmails(reservationData, adminEmail);
      console.log('Emails enviados:', emailResults);
    } catch (emailError) {
      console.error('Error al enviar emails:', emailError);
    }

    // Agregar al calendario de Google
    try {
      const calendarResult = await addReservationToCalendar({
        clienteNombre: cliente_nombre,
        clienteTelefono: cliente_telefono,
        clienteEmail: cliente_email,
        servicioNombre: servicio.nombre,
        barberoNombre: barbero.nombre,
        fecha,
        hora: hora_inicio,
        duracionMinutos: servicio.duracion_minutos,
        notas
      });

      console.log('=== RESULTADO CALENDARIO ===');
      console.log('Success:', calendarResult.success);
      console.log('Event ID:', calendarResult.eventId);
      console.log('Error:', calendarResult.error);

      // Guardar ID del evento si se creó (usar admin client para bypass RLS)
      if (calendarResult.success && calendarResult.eventId) {
        console.log('Guardando event ID en reserva:', reserva.id);

        const adminSupabase = createAdminSupabaseClient();
        const { data: updateData, error: updateError } = await adminSupabase
          .from('reservas')
          .update({ google_calendar_event_id: calendarResult.eventId })
          .eq('id', reserva.id)
          .select();

        if (updateError) {
          console.error('ERROR al guardar event ID en Supabase:', updateError);
        } else {
          console.log('Event ID guardado correctamente:', updateData);
        }
      } else {
        console.log('No se guardó event ID - success:', calendarResult.success, 'eventId:', calendarResult.eventId);
      }
    } catch (calendarError) {
      console.error('Error al agregar al calendario:', calendarError);
    }

    return NextResponse.json({
      success: true,
      reserva: {
        ...reserva,
        servicio,
        barbero: { nombre: barbero.nombre }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/reservas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
