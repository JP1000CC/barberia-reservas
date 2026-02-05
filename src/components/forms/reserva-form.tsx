'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, User, Mail, Phone, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatearPrecio, formatearFechaLegible, formatearFecha, capitalizarNombre } from '@/lib/utils';
import type { Barbero, Servicio, SlotHorario } from '@/types';

interface ReservaFormProps {
  barberos: Barbero[];
  servicios: Servicio[];
  intervaloMinutos: number;
}

type Step = 'servicio' | 'barbero' | 'fecha' | 'hora' | 'datos' | 'confirmacion';

export function ReservaForm({ barberos, servicios, intervaloMinutos }: ReservaFormProps) {
  const [step, setStep] = useState<Step>('servicio');
  const [loading, setLoading] = useState(false);

  // Selecciones
  const [servicioId, setServicioId] = useState<string>('');
  const [barberoId, setBarberoId] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [hora, setHora] = useState<string>('');

  // Datos del cliente
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Horarios disponibles
  const [horariosDisponibles, setHorariosDisponibles] = useState<SlotHorario[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // Reserva confirmada
  const [reservaConfirmada, setReservaConfirmada] = useState<any>(null);

  // Obtener objetos seleccionados
  const servicioSeleccionado = servicios.find(s => s.id === servicioId);
  const barberoSeleccionado = barberos.find(b => b.id === barberoId);

  // Generar fechas disponibles (próximos 30 días)
  const fechasDisponibles = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return formatearFecha(d);
  });

  // Cargar horarios cuando cambia fecha o barbero
  useEffect(() => {
    if (fecha && barberoId && servicioId) {
      cargarHorarios();
    }
  }, [fecha, barberoId, servicioId]);

  async function cargarHorarios() {
    setLoadingHorarios(true);
    try {
      const res = await fetch(`/api/disponibilidad?fecha=${fecha}&barberoId=${barberoId}&servicioId=${servicioId}`);
      const data = await res.json();

      if (data.success) {
        setHorariosDisponibles(data.data);
      } else {
        toast.error('Error al cargar horarios');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoadingHorarios(false);
    }
  }

  async function crearReserva() {
    setLoading(true);
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicioId,
          barberoId,
          fecha,
          hora,
          clienteNombre: capitalizarNombre(nombre),
          clienteEmail: email,
          clienteTelefono: telefono,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setReservaConfirmada(data.data);
        setStep('confirmacion');
        toast.success('¡Reserva confirmada!');
      } else {
        toast.error(data.error || 'Error al crear reserva');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  function avanzar() {
    const steps: Step[] = ['servicio', 'barbero', 'fecha', 'hora', 'datos'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  }

  function retroceder() {
    const steps: Step[] = ['servicio', 'barbero', 'fecha', 'hora', 'datos'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  }

  // Renderizar paso actual
  function renderStep() {
    switch (step) {
      case 'servicio':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">¿Qué servicio necesitas?</h3>
            <div className="grid gap-3">
              {servicios.map((servicio) => (
                <button
                  key={servicio.id}
                  onClick={() => {
                    setServicioId(servicio.id);
                    avanzar();
                  }}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                    servicioId === servicio.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900">{servicio.nombre}</p>
                    <p className="text-sm text-gray-500">{servicio.duracion_minutos} min</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">
                      {formatearPrecio(servicio.precio)}
                    </p>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'barbero':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Elige tu barbero</h3>
            <div className="grid gap-3">
              {barberos.map((barbero) => (
                <button
                  key={barbero.id}
                  onClick={() => {
                    setBarberoId(barbero.id);
                    avanzar();
                  }}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                    barberoId === barbero.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                    style={{ backgroundColor: barbero.color }}
                  >
                    {barbero.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{barbero.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {barbero.hora_inicio.slice(0, 5)} - {barbero.hora_fin.slice(0, 5)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        );

      case 'fecha':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Selecciona la fecha</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {fechasDisponibles.map((f) => {
                const fechaObj = new Date(f + 'T00:00:00');
                const diaSemana = fechaObj.getDay();
                const barbero = barberos.find(b => b.id === barberoId);
                const trabaja = barbero?.dias_laborales?.includes(diaSemana);

                if (!trabaja) return null;

                return (
                  <button
                    key={f}
                    onClick={() => {
                      setFecha(f);
                      setHora('');
                      avanzar();
                    }}
                    className={cn(
                      'p-3 rounded-lg border-2 text-center transition-all',
                      fecha === f
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <p className="text-xs text-gray-500 capitalize">
                      {fechaObj.toLocaleDateString('es', { weekday: 'short' })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {fechaObj.getDate()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fechaObj.toLocaleDateString('es', { month: 'short' })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'hora':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Horarios para {formatearFechaLegible(fecha)}
            </h3>
            {loadingHorarios ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : horariosDisponibles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay horarios disponibles para esta fecha</p>
              </div>
            ) : (
              <div className="time-slots-grid">
                {horariosDisponibles.map((slot) => (
                  <button
                    key={slot.hora}
                    onClick={() => {
                      if (slot.disponible) {
                        setHora(slot.hora);
                        avanzar();
                      }
                    }}
                    disabled={!slot.disponible}
                    className={cn(
                      'p-3 rounded-lg border-2 text-center transition-all',
                      !slot.disponible && 'opacity-50 cursor-not-allowed bg-gray-100',
                      hora === slot.hora
                        ? 'border-primary-500 bg-primary-50'
                        : slot.disponible
                          ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                          : 'border-gray-200'
                    )}
                  >
                    <p className="font-medium">{slot.hora}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'datos':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Tus datos</h3>

            {/* Resumen de selección */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Servicio:</span>
                    <span className="font-medium">{servicioSeleccionado?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Barbero:</span>
                    <span className="font-medium">{barberoSeleccionado?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha:</span>
                    <span className="font-medium">{formatearFechaLegible(fecha)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hora:</span>
                    <span className="font-medium">{hora}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-semibold text-primary-600">
                      {formatearPrecio(servicioSeleccionado?.precio || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de datos */}
            <div className="space-y-4">
              <Input
                label="Nombre completo"
                placeholder="Ej: Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="Ej: juan@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Teléfono"
                type="tel"
                placeholder="Ej: 300 123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </div>

            <Button
              onClick={crearReserva}
              loading={loading}
              disabled={!nombre || !email || !telefono}
              className="w-full"
              size="lg"
            >
              Confirmar Reserva
            </Button>
          </div>
        );

      case 'confirmacion':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Reserva Confirmada!
            </h3>
            <p className="text-gray-500 mb-6">
              Hemos enviado los detalles a tu correo electrónico
            </p>

            <Card className="bg-gray-50 text-left">
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{formatearFechaLegible(fecha)} a las {hora}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <span>Barbero: {barberoSeleccionado?.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-gray-400" />
                    <span>{servicioSeleccionado?.nombre}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={() => {
                setStep('servicio');
                setServicioId('');
                setBarberoId('');
                setFecha('');
                setHora('');
                setNombre('');
                setEmail('');
                setTelefono('');
                setReservaConfirmada(null);
              }}
              className="mt-6"
            >
              Hacer otra reserva
            </Button>
          </div>
        );
    }
  }

  // Indicador de progreso
  const steps: { key: Step; label: string }[] = [
    { key: 'servicio', label: 'Servicio' },
    { key: 'barbero', label: 'Barbero' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'hora', label: 'Hora' },
    { key: 'datos', label: 'Datos' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {step !== 'confirmacion' && (
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i < currentStepIndex
                    ? 'bg-primary-600 text-white'
                    : i === currentStepIndex
                      ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                      : 'bg-gray-100 text-gray-400'
                )}
              >
                {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-1 mx-1',
                    i < currentStepIndex ? 'bg-primary-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      {renderStep()}

      {/* Navigation buttons */}
      {step !== 'confirmacion' && step !== 'servicio' && (
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={retroceder}>
            Atrás
          </Button>
        </div>
      )}
    </div>
  );
}

// Agregar el import que faltaba
import { Scissors } from 'lucide-react';
