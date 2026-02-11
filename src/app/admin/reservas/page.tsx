'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Check, X, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatearPrecio, formatearFechaLegible, ESTADOS_RESERVA } from '@/lib/utils';
import type { Reserva } from '@/types';

export default function ReservasPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'dia' | 'semana'>('dia');

  useEffect(() => {
    cargarReservas();
  }, [fecha, vista]);

  async function cargarReservas() {
    setLoading(true);
    try {
      let url = `/api/reservas?fecha=${fecha}`;

      if (vista === 'semana') {
        const inicio = new Date(fecha);
        const fin = new Date(fecha);
        fin.setDate(fin.getDate() + 7);
        url = `/api/reservas?fechaInicio=${inicio.toISOString().split('T')[0]}&fechaFin=${fin.toISOString().split('T')[0]}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data)) {
        setReservas(data);
      } else if (data.error) {
        toast.error(data.error);
        setReservas([]);
      } else {
        setReservas([]);
      }
    } catch (error) {
      toast.error('Error al cargar reservas');
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Reserva marcada como ${nuevoEstado}`);
        cargarReservas();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al actualizar');
    }
  }

  function cambiarFecha(dias: number) {
    const nueva = new Date(fecha);
    nueva.setDate(nueva.getDate() + dias);
    setFecha(nueva.toISOString().split('T')[0]);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-sm text-gray-500">Gestiona las citas de tu barbería</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={vista === 'dia' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setVista('dia')}
          >
            Día
          </Button>
          <Button
            variant={vista === 'semana' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setVista('semana')}
          >
            Semana
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => cambiarFecha(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="border-0 text-base sm:text-lg font-medium text-gray-900 focus:outline-none bg-transparent w-36 sm:w-auto"
                />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
                {formatearFechaLegible(fecha)}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={() => cambiarFecha(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">
            {vista === 'dia' ? 'Citas del día' : 'Citas de la semana'}
            <span className="ml-2 text-gray-400 font-normal">
              ({reservas.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : reservas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay reservas para esta fecha</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-3">
                {reservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="bg-gray-50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{reserva.cliente_nombre}</p>
                        <a
                          href={`tel:${reserva.cliente_telefono}`}
                          className="text-sm text-indigo-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {reserva.cliente_telefono}
                        </a>
                      </div>
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
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {vista === 'semana' && (
                        <div>
                          <span className="text-gray-500">Fecha:</span>
                          <p className="font-medium">{reserva.fecha}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Hora:</span>
                        <p className="font-medium">{reserva.hora_inicio?.slice(0, 5)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Servicio:</span>
                        <p className="font-medium">{reserva.servicio_nombre}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Barbero:</span>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: (reserva.barbero as any)?.color }}
                          />
                          <p className="font-medium">{(reserva.barbero as any)?.nombre}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Precio:</span>
                        <p className="font-semibold text-indigo-600">{formatearPrecio(reserva.servicio_precio)}</p>
                      </div>
                    </div>

                    {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => cambiarEstado(reserva.id, 'completada')}
                          className="flex-1 py-2 px-3 rounded-lg bg-green-100 text-green-700 font-medium text-sm hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Completar
                        </button>
                        <button
                          onClick={() => cambiarEstado(reserva.id, 'cancelada')}
                          className="flex-1 py-2 px-3 rounded-lg bg-red-100 text-red-700 font-medium text-sm hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      {vista === 'semana' && <th className="pb-3 font-medium">Fecha</th>}
                      <th className="pb-3 font-medium">Hora</th>
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">Teléfono</th>
                      <th className="pb-3 font-medium">Servicio</th>
                      <th className="pb-3 font-medium">Barbero</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Precio</th>
                      <th className="pb-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reservas.map((reserva) => (
                      <tr key={reserva.id} className="hover:bg-gray-50">
                        {vista === 'semana' && (
                          <td className="py-3 text-sm">{reserva.fecha}</td>
                        )}
                        <td className="py-3">
                          <span className="font-medium">
                            {reserva.hora_inicio?.slice(0, 5)}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-gray-900">
                          {reserva.cliente_nombre}
                        </td>
                        <td className="py-3 text-gray-500">
                          {reserva.cliente_telefono}
                        </td>
                        <td className="py-3">{reserva.servicio_nombre}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: (reserva.barbero as any)?.color }}
                            />
                            {(reserva.barbero as any)?.nombre}
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
                        <td className="py-3">
                          {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => cambiarEstado(reserva.id, 'completada')}
                                className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                title="Marcar como completada"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cambiarEstado(reserva.id, 'cancelada')}
                                className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
