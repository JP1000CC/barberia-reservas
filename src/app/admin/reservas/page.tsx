'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Check, X, Loader2 } from 'lucide-react';
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

      // El API devuelve un array directamente, no un objeto con success/data
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500">Gestiona las citas de tu barbería</p>
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
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => cambiarFecha(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border-0 text-lg font-medium text-gray-900 focus:outline-none"
              />
              <span className="text-gray-500">
                {formatearFechaLegible(fecha)}
              </span>
            </div>

            <Button variant="ghost" onClick={() => cambiarFecha(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
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
            <div className="overflow-x-auto">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
