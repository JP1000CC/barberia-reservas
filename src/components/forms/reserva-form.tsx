'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, Check, Scissors } from 'lucide-react';
import { cn, formatearPrecio, formatearFechaLegible, formatearFecha, capitalizarNombre } from '@/lib/utils';
import type { Barbero, Servicio, SlotHorario } from '@/types';

interface ReservaFormProps {
  barberos: Barbero[];
  servicios: Servicio[];
  config: Record<string, string>;
  intervaloMinutos: number;
}

type Step = 'servicio' | 'barbero' | 'fechaHora' | 'datos' | 'confirmar';

const STEPS = [
  { key: 'servicio' as Step, label: 'Servicio', num: 1 },
  { key: 'barbero' as Step, label: 'Barbero', num: 2 },
  { key: 'fechaHora' as Step, label: 'Fecha y Hora', num: 3 },
  { key: 'datos' as Step, label: 'Datos', num: 4 },
  { key: 'confirmar' as Step, label: 'Confirmar', num: 5 },
];

export function ReservaForm({ barberos, servicios, config, intervaloMinutos }: ReservaFormProps) {
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

  // Objetos seleccionados
  const servicioSeleccionado = servicios.find(s => s.id === servicioId);
  const barberoSeleccionado = barberos.find(b => b.id === barberoId);

  // Generar fechas disponibles
  const fechasDisponibles = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      fecha: formatearFecha(d),
      dia: d.toLocaleDateString('es', { weekday: 'short' }).toUpperCase(),
      numero: d.getDate(),
      mes: d.toLocaleDateString('es', { month: 'short' }),
      diaSemana: d.getDay()
    };
  });

  // Cargar horarios
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
      }
    } catch (error) {
      toast.error('Error al cargar horarios');
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
        setStep('confirmar');
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

  function irAPaso(paso: Step) {
    setStep(paso);
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  // Formato de precio (moneda según config)
  function formatPrecio(precio: number) {
    const moneda = config.moneda || 'EUR';
    if (moneda === 'EUR') {
      return `${precio} €`;
    }
    return formatearPrecio(precio);
  }

  return (
    <div className="animate-fadeIn">
      {/* Progress Steps */}
      {step !== 'confirmar' || !reservaConfirmada ? (
        <div className="bg-white py-5 px-4 shadow-sm mb-6 rounded-lg">
          <div className="flex justify-center gap-2 md:gap-4">
            {STEPS.slice(0, -1).map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  'flex flex-col items-center gap-1 transition-opacity',
                  i === currentStepIndex ? 'opacity-100' :
                  i < currentStepIndex ? 'opacity-70' : 'opacity-40'
                )}
              >
                <div
                  className={cn(
                    'step-circle',
                    i === currentStepIndex ? 'active' :
                    i < currentStepIndex ? 'completed' : 'inactive'
                  )}
                >
                  {i < currentStepIndex ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-xs text-gray-600 hidden md:block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Step Content */}
      <div className="animate-fadeIn">
        {/* Paso 1: Servicios */}
        {step === 'servicio' && (
          <section>
            <h2 className="text-xl font-semibold text-center mb-6">¿Qué servicio necesitas?</h2>
            <div className="cards-grid">
              {servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  onClick={() => {
                    setServicioId(servicio.id);
                    irAPaso('barbero');
                  }}
                  className={cn('service-card', servicioId === servicio.id && 'selected')}
                >
                  <h3 className="text-lg font-semibold mb-2">{servicio.nombre}</h3>
                  {servicio.descripcion && (
                    <p className="text-gray-500 text-sm mb-3">{servicio.descripcion}</p>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {servicio.duracion_minutos} min
                    </span>
                    <span className="price-text text-lg">{formatPrecio(servicio.precio)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Paso 2: Barberos */}
        {step === 'barbero' && (
          <section>
            <h2 className="text-xl font-semibold text-center mb-6">Elige tu barbero</h2>
            <div className="cards-grid">
              {barberos.map((barbero) => (
                <div
                  key={barbero.id}
                  onClick={() => {
                    setBarberoId(barbero.id);
                    irAPaso('fechaHora');
                  }}
                  className={cn('service-card text-center', barberoId === barbero.id && 'selected')}
                >
                  <div className="barbero-avatar">
                    {barbero.nombre.charAt(0)}
                  </div>
                  <h3 className="text-lg font-semibold">{barbero.nombre}</h3>
                  <p className="text-gray-400 text-sm">
                    {barbero.hora_inicio?.slice(0, 5)} - {barbero.hora_fin?.slice(0, 5)}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => irAPaso('servicio')}
              className="btn-gradient mt-6 opacity-70 hover:opacity-100"
              style={{ background: '#f0f0f0', color: '#555' }}
            >
              ← Atrás
            </button>
          </section>
        )}

        {/* Paso 3: Fecha y Hora */}
        {step === 'fechaHora' && (
          <section>
            <h2 className="text-xl font-semibold text-center mb-6">Selecciona fecha y hora</h2>

            {/* Fechas */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Fecha</h3>
              <div className="dates-scroll">
                {fechasDisponibles.map((f) => {
                  const trabaja = barberoSeleccionado?.dias_laborales?.includes(f.diaSemana);
                  if (!trabaja) return null;

                  return (
                    <div
                      key={f.fecha}
                      onClick={() => {
                        setFecha(f.fecha);
                        setHora('');
                      }}
                      className={cn('date-card', fecha === f.fecha && 'selected')}
                    >
                      <div className="text-xs opacity-70">{f.dia}</div>
                      <div className="text-2xl font-bold my-1">{f.numero}</div>
                      <div className="text-xs opacity-70">{f.mes}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Horarios */}
            {fecha && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Hora disponible</h3>
                {loadingHorarios ? (
                  <div className="flex justify-center py-8">
                    <div className="spinner"></div>
                  </div>
                ) : horariosDisponibles.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay horarios disponibles para esta fecha
                  </p>
                ) : (
                  <div className="time-slots-grid">
                    {horariosDisponibles.map((slot) => (
                      <div
                        key={slot.hora}
                        onClick={() => slot.disponible && setHora(slot.hora)}
                        className={cn(
                          'time-slot',
                          hora === slot.hora && 'selected',
                          !slot.disponible && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {slot.hora}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => irAPaso('barbero')}
                className="btn-gradient flex-1"
                style={{ background: '#f0f0f0', color: '#555' }}
              >
                ← Atrás
              </button>
              <button
                onClick={() => hora && irAPaso('datos')}
                disabled={!hora}
                className={cn('btn-gradient flex-1', !hora && 'opacity-50 cursor-not-allowed')}
              >
                Continuar →
              </button>
            </div>
          </section>
        )}

        {/* Paso 4: Datos del cliente */}
        {step === 'datos' && (
          <section>
            <h2 className="text-xl font-semibold text-center mb-6">Tus datos</h2>

            {/* Resumen */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="summary-header-gradient text-white p-4">
                <h3 className="font-medium">Resumen de tu cita</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Servicio</span>
                  <span className="font-medium">{servicioSeleccionado?.nombre}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Barbero</span>
                  <span className="font-medium">{barberoSeleccionado?.nombre}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium">{formatearFechaLegible(fecha)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Hora</span>
                  <span className="font-medium">{hora}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold price-text text-lg">
                    {formatPrecio(servicioSeleccionado?.precio || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#667eea]"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => irAPaso('fechaHora')}
                className="btn-gradient flex-1"
                style={{ background: '#f0f0f0', color: '#555' }}
              >
                ← Atrás
              </button>
              <button
                onClick={crearReserva}
                disabled={!nombre || !email || !telefono || loading}
                className={cn(
                  'btn-gradient flex-1',
                  (!nombre || !email || !telefono) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {loading ? 'Procesando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </section>
        )}

        {/* Paso 5: Confirmación */}
        {step === 'confirmar' && reservaConfirmada && (
          <section className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-green-600 mb-2">¡Reserva Confirmada!</h2>
            <p className="text-gray-500 mb-6">Te hemos enviado los detalles a tu correo</p>

            <div className="bg-white rounded-xl p-6 shadow-sm max-w-md mx-auto mb-6">
              <p className="text-gray-600 mb-2">{formatearFechaLegible(fecha)}</p>
              <p className="text-4xl font-bold price-text mb-4">{hora}</p>
              <p className="text-gray-600">{servicioSeleccionado?.nombre}</p>
              <p className="text-gray-500">con {barberoSeleccionado?.nombre}</p>
            </div>

            <p className="text-gray-500 text-sm mb-6">
              Recuerda llegar 5 minutos antes de tu cita
            </p>

            <button
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
              className="btn-gradient"
            >
              Hacer otra reserva
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
