import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendReservationEmails, formatearFechaEmail } from '@/lib/email';

function horaAMinutos(hora: string): number {
  const parts = hora.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
}

function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarTelefono(telefono: string): boolean {
  const limpio = telefono.replace(/[\s\-]/g, '');
  return /^[6-9]\d{8}$/.test(limpio) || /^\+34[6-9]\d{8}$/.test(limpio) || /^34[6-9]\d{8}$/.test(limpio);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const servicioId = body.servicio_id || body.servicioId;
    const barberoId = body.barbero_id || body.barberoId;
    const fecha = body.fecha;
    const hora = body.hora;
    const clienteNombre = body.cliente_nombre || body.clienteNombre;
    const clienteEmail = body.cliente_email || body.clienteEmail;
    const clienteTelefono = body.cliente_telefono || body.clienteTelefono;
    const notas = body.notas;

    if (!servicioId || !barberoId || !fecha || !hora) {
      return NextResponse.json({ error: 'Faltan datos de la reserva' }, { status: 400 });
    }

    if (!clienteNombre || clienteNombre.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    if (!clienteEmail || !validarEmail(clienteEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (!clienteTelefono || !validarTelefono(clienteTelefono)) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: servicio, error: servicioError } = await supabase
      .from('servicios')
      .select('id, nombre, duracion_minutos, precio')
      .eq('id', servicioId)
      .single();

    if (servicioError || !servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const { data: barbero, error: barberoError } = await supabase
      .from('barberos')
      .select('id, nombre')
      .eq('id', barberoId)
      .single();

    if (barberoError || !barbero) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });
    }

    const horaInicioMinutos = horaAMinutos(hora);
    const horaFin = minutosAHora(horaInicioMinutos + servicio.duracion_minutos);

    // Verificar disponibilidad
    const { data: reservasExistentes } = await supabase
      .from('reservas')
      .select('hora_inicio, hora_fin')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelada","no_asistio")');

    if (reservasExistentes) {
      for (const reserva of reservasExistentes) {
        const reservaInicio = horaAMinutos(reserva.hora_inicio.toString().slice(0, 5));
        const reservaFin = horaAMinutos(reserva.hora_fin.toString().slice(0, 5));
        if (horaInicioMinutos < reservaFin && (horaInicioMinutos + servicio.duracion_minutos) > reservaInicio) {
          return NextResponse.json({ error: 'Horario no disponible' }, { status: 409 });
        }
      }
    }

    const telefonoLimpio = clienteTelefono.replace(/[\s\-]/g, '');

    // Buscar o crear cliente
    let clienteId = null;
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .or(`telefono.eq.${telefonoLimpio},email.eq.${clienteEmail}`)
      .maybeSingle();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
      await supabase.from('clientes').update({
        nombre: clienteNombre.trim(),
        email: clienteEmail.trim(),
        telefono: telefonoLimpio,
      }).eq('id', clienteId);
    } else {
      const { data: nuevoCliente } = await supabase
        .from('clientes')
        .insert({ nombre: clienteNombre.trim(), email: clienteEmail.trim(), telefono: telefonoLimpio })
        .select('id')
        .single();
      if (nuevoCliente) clienteId = nuevoCliente.id;
    }

    // Crear reserva
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
      console.error('Error creando reserva:', reservaError);
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 });
    }

    // Obtener configuración para emails
    const { data: configRows } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['nombre_barberia', 'direccion', 'telefono', 'email']);

    const config: Record<string, string> = {};
    configRows?.forEach(row => { config[row.clave] = row.valor; });

    // Enviar emails (async, no bloqueante)
    sendReservationEmails({
      clienteNombre: clienteNombre.trim(),
      clienteEmail: clienteEmail.trim(),
      servicioNombre: servicio.nombre,
      servicioPrecio: servicio.precio,
      barberoNombre: barbero.nombre,
      fecha: formatearFechaEmail(fecha),
      hora: hora,
      nombreBarberia: config.nombre_barberia || 'Studio 1994 by Dago',
      direccion: config.direccion,
      telefono: config.telefono,
    }, config.email).catch(err => console.error('Error enviando emails:', err));

    return NextResponse.json({ success: true, data: reserva });
  } catch (error) {
    console.error('Error en reservas POST:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const barberoId = searchParams.get('barbero_id');
    const estado = searchParams.get('estado');

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from('reservas')
      .select('*, barbero:barberos(id, nombre, color), servicio:servicios(id, nombre)')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (fecha) query = query.eq('fecha', fecha);
    if (barberoId) query = query.eq('barbero_id', barberoId);
    if (estado) query = query.eq('estado', estado);

    const { data: reservas, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: reservas });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
