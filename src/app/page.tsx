import { createServerSupabaseClient } from '@/lib/supabase/server';
import ReservaForm from '@/components/forms/reserva-form';

export const dynamic = 'force-dynamic';

async function getConfiguracion() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('configuracion')
    .select('clave, valor');

  // Convertir array de key-value a objeto
  const config: Record<string, string> = {};
  data?.forEach(row => {
    config[row.clave] = row.valor;
  });

  return {
    nombre_barberia: config.nombre_barberia || 'Mi Barbería',
    moneda: config.moneda || 'EUR',
    duracion_slot: parseInt(config.intervalo_minutos || '30'),
    dias_anticipacion_maxima: parseInt(config.dias_anticipacion || '14'),
  };
}

async function getServicios() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('servicios')
    .select('id, nombre, descripcion, duracion_minutos, precio, activo')
    .eq('activo', true)
    .order('orden')
    .order('nombre');

  // Mapear duracion_minutos a duracion para el formulario
  return (data || []).map(s => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    duracion: s.duracion_minutos, // Alias para compatibilidad con el form
    precio: s.precio,
    activo: s.activo,
  }));
}

async function getBarberos() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('barberos')
    .select('id, nombre, email, telefono, activo, color')
    .eq('activo', true)
    .order('nombre');
  return data || [];
}

export default async function HomePage() {
  const [config, servicios, barberos] = await Promise.all([
    getConfiguracion(),
    getServicios(),
    getBarberos(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="header-gradient">
        <h1>{config.nombre_barberia}</h1>
        <p>Reserva tu cita en línea</p>
      </header>

      <ReservaForm
        servicios={servicios}
        barberos={barberos}
        config={config}
      />
    </main>
  );
}
