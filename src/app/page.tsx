import { createServerSupabaseClient } from '@/lib/supabase/server';
import ReservaForm from '@/components/forms/reserva-form';

export const dynamic = 'force-dynamic';

async function getConfiguracion() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('configuracion')
    .select('*')
    .single();
  return data;
}

async function getServicios() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('servicios')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  return data || [];
}

async function getBarberos() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('barberos')
    .select('*')
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

  const defaultConfig = {
    nombre_barberia: 'Mi Barbería',
    moneda: 'EUR',
    duracion_slot: 30,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="header-gradient">
        <h1>{config?.nombre_barberia || defaultConfig.nombre_barberia}</h1>
        <p>Reserva tu cita en línea</p>
      </header>

      <ReservaForm
        servicios={servicios}
        barberos={barberos}
        config={config || defaultConfig}
      />
    </main>
  );
}
