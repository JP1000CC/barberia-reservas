import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { horaAMinutos, minutosAHora, validarEmail, validarTelefono } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      servicioId,
      barberoId,
      fecha,
      hora,
      clienteNombre,
      clienteEmail,
      clienteTelefono,
      notas,
    } = body;

    // Validaciones
    if (!servicioId || !barberoId || !fecha || !hora) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos de la reserva' },
        { status: 400 }
      );
    }

    if (!clienteNombre || clienteNombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!clienteEmail || !validarEmail(clienteEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (!clienteTelefono || !validarTelefono(clienteTelefono)) {
      return NextResponse.json(
        { success: false, error: 'Teléfono inválido' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Obtener servicio
    const { data: servicio, error: servicioError } = await supabase
      .from('servicios')
      .select('*')
      .eq('id', servicioId)
      .single();

    if (servicioError || !servicio) {
      return NextResponse.json(
        { success: false, error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

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

    // Calcular hora de fin
    const horaInicioMinutos = horaAMinutos(hora);
    const horaFin = minutosAHora(horaInicioMinutos + servicio.duracion_minutos);

    // Verificar disponibilidad (doble check)
    const { data: reservasExistentes } = await supabase
      .from('reservas')
      .select('id')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelada","no_asistio")')
      .or(`hora_inicio.lt.${horaFin},hora_fin.gt.${hora}`);

    if (reservasExistentes && reservasExistentes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El horario ya no está disponible. Por favor, selecciona otro.' },
        { status: 409 }
      );
    }

    // Buscar o crear cliente
    let clienteId = null;
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .or(`telefono.eq.${clienteTelefono},email.eq.${clienteEmail}`)
      .limit(1)
      .single();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
      // Actualizar datos del cliente
      await supabase
        .from('clientes')
        .update({
          nombre: clienteNombre,
          email: clienteEmail,
          telefono: clienteTelefono,
        })
        .eq('id', clienteId);
    } else {
      // Crear nuevo cliente
      const { data: nuevoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nombre: clienteNombre,
          email: clienteEmail,
          telefono: clienteTelefono,
        })
        .select('id')
        .single();

      if (!clienteError && nuevoCliente) {
        clienteId = nuevoCliente.id;
      }
    }

    // Crear la reserva
    const { data: reserva, error: reservaError } = await supabase
      .from('reservas')
      .insert({
        cliente_id: clienteId,
        barbero_id: barberoId,
        servicio_id: servicioId,
        fecha,
        hora_inicio: hora,
        hora_fin: horaFin,
        cliente_nombre: clienteNombre,
        cliente_email: clienteEmail,
        cliente_telefono: clienteTelefono,
        servicio_nombre: servicio.nombre,
        servicio_precio: servicio.precio,
        estado: 'pendiente',
        notas: notas || null,
      })
      .select(`
        *,
        barbero:barberos(nombre),
        servicio:servicios(nombre, precio, duracion_minutos)
      `)
      .single();

    if (reservaError) {
      console.error('Error al crear reserva:', reservaError);
      return NextResponse.json(
        { success: false, error: 'Error al crear la reserva' },
        { status: 500 }
      );
    }

    // TODO: Enviar email de confirmación aquí

    return NextResponse.json({
      success: true,
      data: reserva,
      message: 'Reserva creada exitosamente',
    });
  } catch (error) {
    console.error('Error en reservas POST:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const barberoId = searchParams.get('barberoId');
    const estado = searchParams.get('estado');

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from('reservas')
      .select(`
        *,
        barbero:barberos(id, nombre, color),
        servicio:servicios(id, nombre, duracion_minutos),
        cliente:clientes(id, nombre, telefono, email)
      `)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    // Filtros
    if (fecha) {
      query = query.eq('fecha', fecha);
    } else if (fechaInicio && fechaFin) {
      query = query.gte('fecha', fechaInicio).lte('fecha', fechaFin);
    }

    if (barberoId) {
      query = query.eq('barbero_id', barberoId);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data: reservas, error } = await query;

    if (error) {
      console.error('Error al obtener reservas:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener reservas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reservas,
    });
  } catch (error) {
    console.error('Error en reservas GET:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
