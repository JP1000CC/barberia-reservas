import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/email';

// Verificar que la petición viene de Vercel Cron
function isValidCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Si no hay CRON_SECRET configurado, permitir en desarrollo
  if (!cronSecret) {
    console.log('ADVERTENCIA: CRON_SECRET no configurado');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  console.log('=== CRON: ENVIANDO RECORDATORIOS ===');
  console.log('Fecha/hora:', new Date().toISOString());

  // Verificar autenticación
  if (!isValidCronRequest(request)) {
    console.error('Petición no autorizada');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabaseClient();

    // Calcular fecha de mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];

    console.log('Buscando reservas para:', fechaManana);

    // Obtener reservas de mañana que no estén canceladas
    const { data: reservas, error } = await supabase
      .from('reservas')
      .select(`
        *,
        servicio:servicios(nombre, precio, duracion_minutos),
        barbero:barberos(nombre)
      `)
      .eq('fecha', fechaManana)
      .neq('estado', 'cancelada')
      .is('recordatorio_enviado', false);

    if (error) {
      console.error('Error al obtener reservas:', error);
      return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
    }

    console.log(`Encontradas ${reservas?.length || 0} reservas para mañana`);

    if (!reservas || reservas.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay reservas para mañana',
        enviados: 0
      });
    }

    // Obtener configuración del negocio
    const { data: configData } = await supabase
      .from('configuracion')
      .select('clave, valor');

    const config: Record<string, string> = {};
    configData?.forEach((item: { clave: string; valor: string }) => {
      config[item.clave] = item.valor;
    });

    // Enviar recordatorios
    const resultados = {
      enviados: 0,
      fallidos: 0,
      errores: [] as string[]
    };

    for (const reserva of reservas) {
      try {
        const emailData = {
          clienteNombre: reserva.cliente_nombre,
          clienteEmail: reserva.cliente_email,
          clienteTelefono: reserva.cliente_telefono,
          servicioNombre: reserva.servicio?.nombre || 'Servicio',
          servicioPrecio: reserva.servicio?.precio || 0,
          barberoNombre: reserva.barbero?.nombre || 'Barbero',
          fecha: reserva.fecha,
          hora: reserva.hora_inicio,
          duracionMinutos: reserva.servicio?.duracion_minutos || 30,
          ubicacion: config.direccion,
          nombreNegocio: config.nombre_barberia,
          telefonoNegocio: config.telefono
        };

        console.log(`Enviando recordatorio a: ${reserva.cliente_email}`);

        const enviado = await sendReminderEmail(emailData);

        if (enviado) {
          // Marcar como enviado
          await supabase
            .from('reservas')
            .update({ recordatorio_enviado: true })
            .eq('id', reserva.id);

          resultados.enviados++;
          console.log(`✅ Recordatorio enviado a ${reserva.cliente_nombre}`);
        } else {
          resultados.fallidos++;
          resultados.errores.push(`Fallo al enviar a ${reserva.cliente_email}`);
          console.error(`❌ Fallo al enviar a ${reserva.cliente_nombre}`);
        }
      } catch (emailError) {
        resultados.fallidos++;
        resultados.errores.push(`Error con ${reserva.cliente_email}: ${emailError}`);
        console.error(`Error enviando a ${reserva.cliente_email}:`, emailError);
      }
    }

    console.log('=== RESUMEN RECORDATORIOS ===');
    console.log(`Enviados: ${resultados.enviados}`);
    console.log(`Fallidos: ${resultados.fallidos}`);

    return NextResponse.json({
      success: true,
      fecha: fechaManana,
      total: reservas.length,
      enviados: resultados.enviados,
      fallidos: resultados.fallidos,
      errores: resultados.errores
    });

  } catch (error) {
    console.error('Error en cron de recordatorios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
