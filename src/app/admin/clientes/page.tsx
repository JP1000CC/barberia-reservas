'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Loader2, Users, Phone, Mail, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatearFechaLegible } from '@/lib/utils';
import type { Cliente } from '@/types';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      if (data.success) {
        setClientes(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.telefono?.includes(busqueda) ||
    cliente.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500">Historial de clientes de tu barbería</p>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Clientes</p>
                <p className="text-2xl font-bold">{clientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Visitas</p>
                <p className="text-2xl font-bold">
                  {clientes.reduce((sum, c) => sum + (c.total_visitas || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Clientes Frecuentes</p>
                <p className="text-2xl font-bold">
                  {clientes.filter(c => (c.total_visitas || 0) >= 3).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Clientes
            <span className="ml-2 text-gray-400 font-normal">
              ({clientesFiltrados.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Contacto</th>
                    <th className="pb-3 font-medium">Visitas</th>
                    <th className="pb-3 font-medium">Última visita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{cliente.nombre}</p>
                            {cliente.notas && (
                              <p className="text-xs text-gray-500">{cliente.notas}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          {cliente.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {cliente.telefono}
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              {cliente.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            (cliente.total_visitas || 0) >= 5 ? 'success' :
                            (cliente.total_visitas || 0) >= 3 ? 'info' :
                            'default'
                          }
                        >
                          {cliente.total_visitas || 0} visitas
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {cliente.ultima_visita
                          ? formatearFechaLegible(cliente.ultima_visita)
                          : 'Sin visitas'}
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
