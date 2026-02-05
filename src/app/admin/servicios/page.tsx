'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Loader2, Scissors, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatearPrecio } from '@/lib/utils';
import type { Servicio } from '@/types';

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracion, setDuracion] = useState(30);
  const [precio, setPrecio] = useState(0);

  useEffect(() => {
    cargarServicios();
  }, []);

  async function cargarServicios() {
    try {
      const res = await fetch('/api/servicios');
      const data = await res.json();
      if (data.success) {
        setServicios(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }

  function abrirModal(servicio?: Servicio) {
    if (servicio) {
      setEditando(servicio);
      setNombre(servicio.nombre);
      setDescripcion(servicio.descripcion || '');
      setDuracion(servicio.duracion_minutos);
      setPrecio(servicio.precio);
    } else {
      setEditando(null);
      setNombre('');
      setDescripcion('');
      setDuracion(30);
      setPrecio(0);
    }
    setModalOpen(true);
  }

  async function guardar() {
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (duracion < 5) {
      toast.error('La duración mínima es 5 minutos');
      return;
    }

    if (precio < 0) {
      toast.error('El precio no puede ser negativo');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        duracion_minutos: duracion,
        precio,
        activo: true,
      };

      const res = await fetch(
        editando ? `/api/servicios/${editando.id}` : '/api/servicios',
        {
          method: editando ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(editando ? 'Servicio actualizado' : 'Servicio creado');
        setModalOpen(false);
        cargarServicios();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(servicio: Servicio) {
    try {
      const res = await fetch(`/api/servicios/${servicio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !servicio.activo }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(servicio.activo ? 'Servicio desactivado' : 'Servicio activado');
        cargarServicios();
      }
    } catch (error) {
      toast.error('Error al actualizar');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-500">Gestiona el catálogo de servicios</p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Servicio
        </Button>
      </div>

      {/* Lista de Servicios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : servicios.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Scissors className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay servicios registrados</p>
          </div>
        ) : (
          servicios.map((servicio) => (
            <Card key={servicio.id} className={!servicio.activo ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{servicio.nombre}</h3>
                    <Badge variant={servicio.activo ? 'success' : 'error'} className="mt-1">
                      {servicio.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">
                      {formatearPrecio(servicio.precio)}
                    </p>
                  </div>
                </div>

                {servicio.descripcion && (
                  <p className="text-sm text-gray-500 mb-3">{servicio.descripcion}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {servicio.duracion_minutos} min
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => abrirModal(servicio)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={servicio.activo ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleActivo(servicio)}
                  >
                    {servicio.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Servicio' : 'Nuevo Servicio'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Corte Clásico"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del servicio..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duración (minutos) *"
              type="number"
              value={duracion}
              onChange={(e) => setDuracion(parseInt(e.target.value) || 0)}
              min={5}
              step={5}
            />
            <Input
              label="Precio *"
              type="number"
              value={precio}
              onChange={(e) => setPrecio(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={guardar}
              loading={guardando}
            >
              {editando ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
