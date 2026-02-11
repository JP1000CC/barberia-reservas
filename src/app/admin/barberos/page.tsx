'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Loader2, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { DIAS_SEMANA } from '@/lib/utils';
import type { Barbero } from '@/types';

export default function BarberosPage() {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Barbero | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [horaFin, setHoraFin] = useState('14:00');
  // Horario partido (segundo turno)
  const [horarioPartido, setHorarioPartido] = useState(false);
  const [horaInicio2, setHoraInicio2] = useState('15:00');
  const [horaFin2, setHoraFin2] = useState('20:00');
  const [diasLaborales, setDiasLaborales] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    cargarBarberos();
  }, []);

  async function cargarBarberos() {
    try {
      const res = await fetch('/api/barberos');
      const data = await res.json();
      if (data.success) {
        setBarberos(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar barberos');
    } finally {
      setLoading(false);
    }
  }

  function abrirModal(barbero?: Barbero) {
    if (barbero) {
      setEditando(barbero);
      setNombre(barbero.nombre);
      setEmail(barbero.email || '');
      setTelefono(barbero.telefono || '');
      setHoraInicio(barbero.hora_inicio?.slice(0, 5) || '10:00');
      setHoraFin(barbero.hora_fin?.slice(0, 5) || '14:00');
      // Horario partido
      const tieneHorarioPartido = !!(barbero.hora_inicio_2 && barbero.hora_fin_2);
      setHorarioPartido(tieneHorarioPartido);
      setHoraInicio2(barbero.hora_inicio_2?.slice(0, 5) || '15:00');
      setHoraFin2(barbero.hora_fin_2?.slice(0, 5) || '20:00');
      setDiasLaborales(barbero.dias_laborales || [1, 2, 3, 4, 5, 6]);
      setColor(barbero.color || '#3b82f6');
    } else {
      setEditando(null);
      setNombre('');
      setEmail('');
      setTelefono('');
      setHoraInicio('10:00');
      setHoraFin('14:00');
      setHorarioPartido(true); // Por defecto activado
      setHoraInicio2('15:00');
      setHoraFin2('20:00');
      setDiasLaborales([1, 2, 3, 4, 5, 6]);
      setColor('#3b82f6');
    }
    setModalOpen(true);
  }

  function toggleDia(dia: number) {
    if (diasLaborales.includes(dia)) {
      setDiasLaborales(diasLaborales.filter(d => d !== dia));
    } else {
      setDiasLaborales([...diasLaborales, dia].sort());
    }
  }

  async function guardar() {
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    // Validar horarios
    if (horarioPartido) {
      const inicio1 = parseInt(horaInicio.replace(':', ''));
      const fin1 = parseInt(horaFin.replace(':', ''));
      const inicio2 = parseInt(horaInicio2.replace(':', ''));
      const fin2 = parseInt(horaFin2.replace(':', ''));

      if (fin1 >= inicio2) {
        toast.error('El primer turno debe terminar antes de que empiece el segundo');
        return;
      }

      if (inicio1 >= fin1 || inicio2 >= fin2) {
        toast.error('La hora de inicio debe ser menor que la hora de fin');
        return;
      }
    }

    setGuardando(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        email: email || null,
        telefono: telefono || null,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        // Horario partido - enviar null si no está habilitado
        hora_inicio_2: horarioPartido ? horaInicio2 : null,
        hora_fin_2: horarioPartido ? horaFin2 : null,
        dias_laborales: diasLaborales,
        color,
        activo: true,
      };

      const res = await fetch(
        editando ? `/api/barberos/${editando.id}` : '/api/barberos',
        {
          method: editando ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(editando ? 'Barbero actualizado' : 'Barbero creado');
        setModalOpen(false);
        cargarBarberos();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(barbero: Barbero) {
    try {
      const res = await fetch(`/api/barberos/${barbero.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !barbero.activo }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(barbero.activo ? 'Barbero desactivado' : 'Barbero activado');
        cargarBarberos();
      }
    } catch (error) {
      toast.error('Error al actualizar');
    }
  }

  // Formatear horario para mostrar
  function formatearHorario(barbero: Barbero): string {
    const turno1 = `${barbero.hora_inicio?.slice(0, 5)} - ${barbero.hora_fin?.slice(0, 5)}`;
    if (barbero.hora_inicio_2 && barbero.hora_fin_2) {
      const turno2 = `${barbero.hora_inicio_2.slice(0, 5)} - ${barbero.hora_fin_2.slice(0, 5)}`;
      return `${turno1} y ${turno2}`;
    }
    return turno1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Barberos</h1>
          <p className="text-sm text-gray-500">Gestiona el equipo de tu barbería</p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Barbero
        </Button>
      </div>

      {/* Lista de Barberos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : barberos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay barberos registrados</p>
          </div>
        ) : (
          barberos.map((barbero) => (
            <Card key={barbero.id} className={!barbero.activo ? 'opacity-60' : ''}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0"
                    style={{ backgroundColor: barbero.color }}
                  >
                    {barbero.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{barbero.nombre}</h3>
                      <Badge variant={barbero.activo ? 'success' : 'error'}>
                        {barbero.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="truncate">{formatearHorario(barbero)}</span>
                    </div>
                    {barbero.hora_inicio_2 && (
                      <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                        Horario partido
                      </span>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {DIAS_SEMANA.map((dia) => (
                        <span
                          key={dia.valor}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            barbero.dias_laborales?.includes(dia.valor)
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {dia.abrev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => abrirModal(barbero)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={barbero.activo ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleActivo(barbero)}
                  >
                    {barbero.activo ? 'Desactivar' : 'Activar'}
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
        title={editando ? 'Editar Barbero' : 'Nuevo Barbero'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del barbero"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
          />

          <Input
            label="Teléfono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="300 123 4567"
          />

          {/* Primer turno */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {horarioPartido ? 'Primer turno (mañana)' : 'Horario'}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hora inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
              <Input
                label="Hora fin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle horario partido */}
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Horario partido</p>
              <p className="text-sm text-gray-500">Activar segundo turno (ej: tarde)</p>
            </div>
            <button
              type="button"
              onClick={() => setHorarioPartido(!horarioPartido)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                horarioPartido ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  horarioPartido ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Segundo turno (si está habilitado) */}
          {horarioPartido && (
            <div className="bg-indigo-50/50 rounded-lg p-4 space-y-3 border border-indigo-100">
              <h4 className="font-medium text-indigo-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Segundo turno (tarde)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Hora inicio"
                  type="time"
                  value={horaInicio2}
                  onChange={(e) => setHoraInicio2(e.target.value)}
                />
                <Input
                  label="Hora fin"
                  type="time"
                  value={horaFin2}
                  onChange={(e) => setHoraFin2(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">
                Ejemplo: 10:00-14:00 (mañana) y 15:00-20:00 (tarde)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días laborales
            </label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.valor}
                  type="button"
                  onClick={() => toggleDia(dia.valor)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    diasLaborales.includes(dia.valor)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dia.nombre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-500">{color}</span>
            </div>
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
