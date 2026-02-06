import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// Convertir hora string a minutos
function horaAMinutos(hora: string): number {
  const parts = hora.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
}

// Convertir minutos a hora string
function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Validar email
function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validar teléfono español
function validarTelefono(telefono: string): boolean {
  const limpio = telefono.replace(/[\s\-]/g, '');
  // Español: 9 dígitos empezando con 6,7,8,9 o formato internacional +34
  return /^[6-9]\d{8}$/.test(limpio) ||
         /^\+34[6-9]\d{8}$/.test(limpio) ||
         /^34[6-9]\d{8}$/.test(limpio);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Aceptar ambos formatos de nombres (camelCase y snake_case)
    const servicioId = body.servicio_id || body.servicioId;
    const barberoId = body.barbero_id || body.barberoId;
    const fecha = body.fecha;
    const hora = body.hora;
    const clienteNombre = body.cliente_nombre || body.clienteNombre;
    const clienteEmail = body.cliente_email || body.clienteEmail;
    const clienteTelefono = body.cliente_telefono || body.clienteTelefono;
    const notas = body.notas;

    // Validaciones
    if (!servicioId || !barberoId || !fecha || !hora) {
      return NextResponse.json(
        { error: 'Faltan datos de la reserva (servicio, barbero, fecha, hora)' },
        { status: 400 }
      );
    }

    if (!clienteNombre || clienteNombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    if (!clienteEmail || !validarEmail(clienteEmail)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (!clienteTelefono || !validarTelefono(clienteTelefono)) {
      return NextResponse.json(
        { error: 'Teléfono inválido (debe ser un número español de 9 dígitos)' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Obtener servicio
    const { data: servicio, error: servicioError } = await supabase
      .from('servicios')
      .select('id, nombre, duracion_minutos, precio')
      .eq('id', servicioId)
      .single();

    if (servicioError || !servicio) {
      console.error('Error obteniendo servicio:', servicioError);
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    // Obtener barbero
    const { data: barbero, error: barberoError } = await supabase
      .from('barberos')
      .select('id, nombre')
      .eq('id', barberoId)
      .single();

    if (barberoError || !barbero) {
      console.error('Error obteniendo barbero:', barberoError);
      return NextResponse.json(
        { error: 'Barbero no encontrado' },
        { status: 404 }
      );
    }

    // Calcular hora de fin
    const horaInicioMinutos = horaAMinutos(hora);
    const horaFin = minutosAHora(horaInicioMinutos + servicio.duracion_minutos);

    // Verificar disponibilidad (doble check para evitar race conditions)
    const { data: reservasExistentes } = await supabase
      .from('reservas')
      .select('id')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelada","no_asistio")');

    // Verificar manualmente el solapamiento
    if (reservasExistentes && reservasExistentes.length > 0) {
      // Obtener las reservas completas para verificar solapamiento
      const { data: reservasCompletas } = await supabase
        .from('reservas')
        .select('hora_inicio, hora_fin')
        .eq('barbero_id', barberoId)
        .eq('fecha', fecha)
        .not('estado', 'in', '("cancelada","no_asistio")');

      if (reservasCompletas) {
        for (const reserva of reservasCompletas) {
          const reservaInicio = horaAMinutos(reserva.hora_inicio.toString().slice(0, 5));
          const reservaFin = horaAMinutos(reserva.hora_fin.toString().slice(0, 5));
          const nuevoInicio = horaInicioMinutos;
          const nuevoFin = horaInicioMinutos + servicio.duracion_minutos;

          if (nuevoInicio < reservaFin && nuevoFin > reservaInicio) {
            return NextResponse.json(
              { error: 'El horario ya no está disponible. Por favor, selecciona otro.' },
              { status: 409 }
            );
          }
        }
      }
    }

    // Buscar o crear cliente
    let clienteId = null;
    const telefonoLimpio = clienteTelefono.replace(/[\s\-]/g, '');

    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .or(`telefono.eq.${telefonoLimpio},email.eq.${clienteEmail}`)
      .maybeSingle();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
      // Actualizar datos del cliente
      await supabase
        .from('clientes')
        .update({
          nombre: clienteNombre.trim(),
          email: clienteEmail.trim(),
          telefono: telefonoLimpio,
        })
        .eq('id', clienteId);
    } else {
      // Crear nuevo cliente
      const { data: nuevoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nombre: clienteNombre.trim(),
          email: clienteEmail.trim(),
          telefono: telefonoLimpio,
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
        cliente_nombre: clienteNombre.trim(),
        cliente_email: clienteEmail.trim(),
        cliente_telefono: telefonoLimpio,
        servicio_nombre: servicio.nombre,
        servicio_precio: servicio.precio,
        estado: 'pendiente',
        notas: notas || null,
      })
      .select()
      .single();

    if (reservaError) {
      console.error('Error al crear reserva:', reservaError);
      return NextResponse.json(
        { error: reservaError.message || 'Error al crear la reserva' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reserva,
      message: 'Reserva creada exitosamente',
    });
  } catch (error) {
    console.error('Error en reservas POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const fechaInicio = searchParams.get('fechaInicio') || searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fechaFin') || searchParams.get('fecha_fin');
    const barberoId = searchParams.get('barberoId') || searchParams.get('barbero_id');
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
        { error: 'Error al obtener reservas' },
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
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
