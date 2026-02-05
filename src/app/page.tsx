import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ReservaForm } from '@/components/forms/reserva-form';
import { Scissors } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Scissors className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {config.nombre_barberia || 'Mi Barbería'}
              </h1>
              <p className="text-gray-500 text-sm">
                {config.direccion || 'Reserva tu cita'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
            <h2 className="text-xl font-semibold text-white">
              Reserva tu cita
            </h2>
            <p className="text-primary-100 mt-1">
              Selecciona el servicio, barbero y horario de tu preferencia
            </p>
          </div>

          <div className="p-6">
            <ReservaForm
              barberos={barberos}
              servicios={servicios}
              intervaloMinutos={parseInt(config.intervalo_minutos || '30')}
            />
          </div>
        </div>

        {/* Info de contacto */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>¿Necesitas ayuda? Contáctanos:</p>
          <p className="font-medium text-gray-700">
            {config.telefono || ''} • {config.email || ''}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} {config.nombre_barberia || 'Mi Barbería'}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
