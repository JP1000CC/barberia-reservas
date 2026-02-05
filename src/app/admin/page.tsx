import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Clock } from 'lucide-react';
import { formatearPrecio, formatearFechaLegible, ESTADOS_RESERVA } from '@/lib/utils';
import Link from 'next/link';

async function getStats() {
  const supabase = createServerSupabaseClient();
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const inicioMesStr = inicioMes.toISOString().split('T')[0];

  // Citas de hoy
  const { count: citasHoy } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('fecha', hoy)
    .not('estado', 'in', '("cancelada","no_asistio")');

  // Citas pendientes hoy
  const { count: citasPendientes } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('fecha', hoy)
    .eq('estado', 'pendiente');

  // Citas del mes
  const { count: citasMes } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .gte('fecha', inicioMesStr)
    .not('estado', 'in', '("cancelada","no_asistio")');

  // Ingresos del mes
  const { data: ingresosMesData } = await supabase
    .from('reservas')
    .select('servicio_precio')
    .gte('fecha', inicioMesStr)
    .eq('estado', 'completada');

  const ingresosMes = ingresosMesData?.reduce((sum, r) => sum + (r.servicio_precio || 0), 0) || 0;

  // Reservas de hoy
  const { data: reservasHoy } = await supabase
    .from('reservas')
    .select(`
      *,
      barbero:barberos(nombre, color)
    `)
    .eq('fecha', hoy)
    .not('estado', 'in', '("cancelada","no_asistio")')
    .order('hora_inicio');

  return {
    citasHoy: citasHoy || 0,
    citasPendientes: citasPendientes || 0,
    citasMes: citasMes || 0,
    ingresosMes,
    reservasHoy: reservasHoy || [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const hoy = new Date();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{formatearFechaLegible(hoy)}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Citas Hoy</p>
                <p className="text-3xl font-bold text-gray-900">{stats.citasHoy}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes Hoy</p>
                <p className="text-3xl font-bold text-gray-900">{stats.citasPendientes}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Citas del Mes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.citasMes}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-500 to-primary-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-100">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-white">
                  {formatearPrecio(stats.ingresosMes)}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Citas de hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Citas de Hoy</CardTitle>
          <Link
            href="/admin/reservas"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todas →
          </Link>
        </CardHeader>
        <CardContent>
          {stats.reservasHoy.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay citas programadas para hoy</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Hora</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Servicio</th>
                    <th className="pb-3 font-medium">Barbero</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.reservasHoy.map((reserva: any) => (
                    <tr key={reserva.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <span className="font-medium">
                          {reserva.hora_inicio?.slice(0, 5)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {reserva.cliente_nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reserva.cliente_telefono}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">{reserva.servicio_nombre}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: reserva.barbero?.color }}
                          />
                          {reserva.barbero?.nombre}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            reserva.estado === 'completada' ? 'success' :
                            reserva.estado === 'pendiente' ? 'warning' :
                            reserva.estado === 'confirmada' ? 'info' :
                            'error'
                          }
                        >
                          {ESTADOS_RESERVA[reserva.estado as keyof typeof ESTADOS_RESERVA]?.label || reserva.estado}
                        </Badge>
                      </td>
                      <td className="py-3 font-medium">
                        {formatearPrecio(reserva.servicio_precio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
