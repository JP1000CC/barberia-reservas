import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ReservaForm } from '@/components/forms/reserva-form';

async function getInitialData() {
  const supabase = createServerSupabaseClient();

  const [
    { data: barberos },
    { data: servicios },
    { data: configuracion }
  ] = await Promise.all([
    supabase.from('barberos').select('*').eq('activo', true).order('nombre'),
    supabase.from('servicios').select('*').eq('activo', true).order('orden'),
    supabase.from('configuracion').select('*'),
  ]);

  const config = configuracion?.reduce((acc, item) => {
    acc[item.clave] = item.valor;
    return acc;
  }, {} as Record<string, string>) || {};

  return { barberos: barberos || [], servicios: servicios || [], config };
}

export default async function HomePage() {
  const { barberos, servicios, config } = await getInitialData();

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
      {/* Header con degradado */}
      <header className="header-gradient text-white py-8 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-1">
          {config.nombre_barberia || 'Mi Barbería'}
        </h1>
        <p className="opacity-90 text-sm">
          Reserva tu cita en línea
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <ReservaForm
          barberos={barberos}
          servicios={servicios}
          config={config}
          intervaloMinutos={parseInt(config.intervalo_minutos || '30')}
        />
      </main>

      {/* Footer */}
      <footer className="footer-section py-5 text-center text-gray-500 text-sm">
        <p className="font-medium text-gray-700">
          {config.nombre_barberia || 'Mi Barbería'}
        </p>
        <p>
          {config.direccion || ''} {config.telefono ? `| ${config.telefono}` : ''}
        </p>
      </footer>
    </div>
  );
}
