'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, ArrowLeft, ArrowRight, RefreshCw, Calendar, Zap, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  activo: boolean;
}

interface Barbero {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  activo: boolean;
  color: string;
}

interface Config {
  nombre_barberia: string;
  moneda: string;
  duracion_slot: number;
  dias_anticipacion_maxima: number;
}

interface CitaDisponible {
  fecha: string;
  hora: string;
  barberoId: string;
  barberoNombre: string;
  barberoColor: string;
}

interface ReservaFormProps {
  servicios: Servicio[];
  barberos: Barbero[];
  config: Config;
}

type Step = 'servicio' | 'barbero' | 'fechaHora' | 'datos' | 'confirmar';

// Opciones de recurrencia
const RECURRENCE_OPTIONS = [
  { value: '', label: 'Solo esta vez', days: 0 },
  { value: '1_week', label: 'Cada semana', days: 7 },
  { value: '2_weeks', label: 'Cada 2 semanas', days: 14 },
  { value: '3_weeks', label: 'Cada 3 semanas', days: 21 },
  { value: '1_month', label: 'Cada mes', days: 30 },
];

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'servicio', label: 'Servicio', number: 1 },
  { key: 'barbero', label: 'Barbero', number: 2 },
  { key: 'fechaHora', label: 'Fecha y Hora', number: 3 },
  { key: 'datos', label: 'Tus Datos', number: 4 },
  { key: 'confirmar', label: 'Confirmar', number: 5 },
];

export default function ReservaForm({ servicios, barberos, config }: ReservaFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('servicio');
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<Barbero | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [horarioPartido, setHorarioPartido] = useState(false);
  const [rangosHorario, setRangosHorario] = useState<Array<{inicio: string; fin: string}>>([]);
  const [clienteData, setClienteData] = useState({
    nombre: '',
    email: '',
    telefono: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);

  // Estado para citas recurrentes
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [recurrencia, setRecurrencia] = useState('');
  const [numCitasRecurrentes, setNumCitasRecurrentes] = useState(4); // Número de citas a crear
  const [citasCreadas, setCitasCreadas] = useState<number>(0);

  // Estado para "Próxima cita disponible"
  const [modoProximaCita, setModoProximaCita] = useState(false);
  const [citasDisponibles, setCitasDisponibles] = useState<CitaDisponible[]>([]);
  const [indiceCitaActual, setIndiceCitaActual] = useState(0);
  const [loadingProximaCita, setLoadingProximaCita] = useState(false);
  const [skipProximaCita, setSkipProximaCita] = useState(0);
  const [hasMoreCitas, setHasMoreCitas] = useState(false);

  // Usar días de anticipación máxima de la configuración
  const diasAnticipacion = config.dias_anticipacion_maxima || 14;

  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < diasAnticipacion; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = generateDates();

  useEffect(() => {
    if (selectedDate && selectedBarbero && selectedServicio) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedBarbero, selectedServicio]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedBarbero || !selectedServicio) return;

    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/disponibilidad?fecha=${dateStr}&barbero_id=${selectedBarbero.id}&duracion=${selectedServicio.duracion}`
      );
      const data = await response.json();
      setAvailableSlots(data.slots || []);
      setHorarioPartido(data.horarioPartido || false);
      setRangosHorario(data.rangos || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
      setHorarioPartido(false);
      setRangosHorario([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Buscar próximas citas disponibles
  const fetchProximasCitas = async (skip: number = 0) => {
    if (!selectedServicio) return;

    setLoadingProximaCita(true);
    try {
      const response = await fetch(
        `/api/proxima-cita?duracion=${selectedServicio.duracion}&skip=${skip}`
      );
      const data = await response.json();

      if (data.citas && data.citas.length > 0) {
        setCitasDisponibles(data.citas);
        setIndiceCitaActual(0);
        setHasMoreCitas(data.hasMore || false);
        setSkipProximaCita(skip);
      }
    } catch (error) {
      console.error('Error fetching próximas citas:', error);
      setCitasDisponibles([]);
    } finally {
      setLoadingProximaCita(false);
    }
  };

  // Seleccionar una cita disponible
  const seleccionarCitaDisponible = (cita: CitaDisponible) => {
    // Buscar el barbero correspondiente
    const barbero = barberos.find(b => b.id === cita.barberoId);
    if (barbero) {
      setSelectedBarbero(barbero);
    }
    // Establecer fecha
    setSelectedDate(new Date(cita.fecha + 'T12:00:00'));
    // Establecer hora
    setSelectedTime(cita.hora);
    // Salir del modo próxima cita y avanzar
    setModoProximaCita(false);
    // Ir directamente al paso de datos
    setCurrentStep('datos');
  };

  // Navegar a la siguiente cita disponible
  const siguienteCitaDisponible = () => {
    if (indiceCitaActual < citasDisponibles.length - 1) {
      setIndiceCitaActual(indiceCitaActual + 1);
    } else if (hasMoreCitas) {
      // Cargar más citas
      fetchProximasCitas(skipProximaCita + 5);
    }
  };

  // Navegar a la cita anterior
  const anteriorCitaDisponible = () => {
    if (indiceCitaActual > 0) {
      setIndiceCitaActual(indiceCitaActual - 1);
    }
  };

  // Formatear fecha para mostrar en cita disponible
  const formatFechaCita = (fechaStr: string) => {
    const fecha = new Date(fechaStr + 'T12:00:00');
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
  };

  const formatDate = (date: Date) => {
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return {
      dayName: days[date.getDay()],
      dayNumber: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  const formatFullDate = (date: Date) => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const formatShortDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatPrice = (precio: number) => {
    return `${precio} €`;
  };

  const getCurrentStepIndex = () => STEPS.findIndex(s => s.key === currentStep);

  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].key);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].key);
    }
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    const spanishPhoneRegex = /^[6-9]\d{8}$/;
    const internationalRegex = /^\+34[6-9]\d{8}$/;
    const withPrefixRegex = /^34[6-9]\d{8}$/;
    return spanishPhoneRegex.test(cleanPhone) ||
           internationalRegex.test(cleanPhone) ||
           withPrefixRegex.test(cleanPhone);
  };

  const validateClienteData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clienteData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (clienteData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!clienteData.email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    if (!clienteData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!validatePhone(clienteData.telefono)) {
      newErrors.telefono = 'Teléfono inválido (9 dígitos, ej: 633561792)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calcular fechas de citas recurrentes
  const getRecurringDates = (): Date[] => {
    if (!selectedDate || !esRecurrente || !recurrencia) return [];

    const option = RECURRENCE_OPTIONS.find(o => o.value === recurrencia);
    if (!option || option.days === 0) return [];

    const dates: Date[] = [];
    for (let i = 1; i <= numCitasRecurrentes; i++) {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + (option.days * i));
      dates.push(newDate);
    }
    return dates;
  };

  const handleSubmit = async () => {
    if (!validateClienteData()) return;
    if (!selectedServicio || !selectedBarbero || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicio_id: selectedServicio.id,
          barbero_id: selectedBarbero.id,
          fecha: selectedDate.toISOString().split('T')[0],
          hora: selectedTime,
          cliente_nombre: clienteData.nombre.trim(),
          cliente_email: clienteData.email.trim(),
          cliente_telefono: clienteData.telefono.replace(/[\s\-]/g, ''),
          // Datos de recurrencia
          es_recurrente: esRecurrente && recurrencia !== '',
          recurrencia: recurrencia,
          num_citas_recurrentes: numCitasRecurrentes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCitasCreadas(data.totalCitasCreadas || 1);
        setReservaExitosa(true);
      } else {
        alert(data.error || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener label de recurrencia
  const getRecurrenciaLabel = () => {
    const option = RECURRENCE_OPTIONS.find(o => o.value === recurrencia);
    return option?.label || '';
  };

  if (reservaExitosa) {
    return (
      <div className="success-container">
        <div className="success-icon">
          <CheckCircle size={64} color="#10b981" />
        </div>
        <h2 className="success-title">
          {citasCreadas > 1 ? `¡${citasCreadas} Citas Confirmadas!` : '¡Reserva Confirmada!'}
        </h2>
        <p className="success-message">
          Hemos enviado un correo de confirmación a {clienteData.email}
        </p>
        <div className="success-details">
          <p><strong>Servicio:</strong> {selectedServicio?.nombre}</p>
          <p><strong>Barbero:</strong> {selectedBarbero?.nombre}</p>
          <p><strong>Primera cita:</strong> {selectedDate && formatFullDate(selectedDate)}</p>
          <p><strong>Hora:</strong> {selectedTime}</p>
          {citasCreadas > 1 && (
            <p><strong>Frecuencia:</strong> {getRecurrenciaLabel()}</p>
          )}
        </div>
        {citasCreadas > 1 && (
          <div className="recurring-summary">
            <p className="recurring-note">
              <RefreshCw size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Se han programado {citasCreadas} citas en total
            </p>
          </div>
        )}
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Nueva Reserva
        </button>
      </div>
    );
  }

  return (
    <div className="reservation-form">
      <div className="steps-container">
        {STEPS.map((step, index) => (
          <div key={step.key} className="step-item">
            <div className={`step-circle ${getCurrentStepIndex() >= index ? 'active' : ''}`}>
              {step.number}
            </div>
            <span className={`step-label ${getCurrentStepIndex() >= index ? 'active' : ''}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="step-content">
        {currentStep === 'servicio' && (
          <div className="step-panel">
            <h2 className="step-title">Selecciona un servicio</h2>
            <div className="services-grid">
              {servicios.filter(s => s.activo).map((servicio) => (
                <div
                  key={servicio.id}
                  className={`service-card ${selectedServicio?.id === servicio.id ? 'selected' : ''}`}
                  onClick={() => setSelectedServicio(servicio)}
                >
                  <h3 className="service-name">{servicio.nombre}</h3>
                  {servicio.descripcion && (
                    <p className="service-description">{servicio.descripcion}</p>
                  )}
                  <div className="service-meta">
                    <span className="duration-text">
                      <Clock size={14} />
                      {servicio.duracion} min
                    </span>
                    <span className="price-text">{formatPrice(servicio.precio)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="step-actions">
              <div></div>
              <button className="btn-primary" disabled={!selectedServicio} onClick={goToNextStep}>
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'barbero' && (
          <div className="step-panel">
            <h2 className="step-title">Selecciona un barbero</h2>

            {/* Opción: Cita más próxima */}
            {!modoProximaCita && (
              <div
                className="proxima-cita-card"
                onClick={() => {
                  setModoProximaCita(true);
                  setSelectedBarbero(null);
                  fetchProximasCitas(0);
                }}
              >
                <div className="proxima-cita-icon">
                  <Zap size={28} color="#f59e0b" />
                </div>
                <div className="proxima-cita-content">
                  <h3 className="proxima-cita-title">Cita más próxima</h3>
                  <p className="proxima-cita-desc">Te mostramos la primera cita disponible</p>
                </div>
                <ArrowRight size={20} className="proxima-cita-arrow" />
              </div>
            )}

            {/* Vista de próxima cita disponible */}
            {modoProximaCita && (
              <div className="proxima-cita-panel">
                {loadingProximaCita ? (
                  <div className="proxima-cita-loading">
                    <Loader2 size={32} className="spinning" />
                    <p>Buscando citas disponibles...</p>
                  </div>
                ) : citasDisponibles.length > 0 ? (
                  <>
                    <div className="cita-sugerida">
                      <div className="cita-sugerida-header">
                        <span className="cita-badge">
                          <Zap size={14} /> Cita disponible
                        </span>
                        <span className="cita-numero">
                          {skipProximaCita + indiceCitaActual + 1}
                        </span>
                      </div>

                      <div className="cita-sugerida-body">
                        <div className="cita-barbero">
                          <div
                            className="cita-barbero-avatar"
                            style={{ background: citasDisponibles[indiceCitaActual].barberoColor || '#3b82f6' }}
                          >
                            <User size={24} color="white" />
                          </div>
                          <span className="cita-barbero-nombre">
                            {citasDisponibles[indiceCitaActual].barberoNombre}
                          </span>
                        </div>

                        <div className="cita-datetime">
                          <div className="cita-fecha">
                            <Calendar size={18} />
                            <span>{formatFechaCita(citasDisponibles[indiceCitaActual].fecha)}</span>
                          </div>
                          <div className="cita-hora">
                            <Clock size={18} />
                            <span>{citasDisponibles[indiceCitaActual].hora}</span>
                          </div>
                        </div>
                      </div>

                      <div className="cita-sugerida-actions">
                        <button
                          className="btn-cita-nav"
                          onClick={anteriorCitaDisponible}
                          disabled={indiceCitaActual === 0 && skipProximaCita === 0}
                        >
                          <ChevronLeft size={20} />
                        </button>

                        <button
                          className="btn-seleccionar-cita"
                          onClick={() => seleccionarCitaDisponible(citasDisponibles[indiceCitaActual])}
                        >
                          Seleccionar esta cita
                        </button>

                        <button
                          className="btn-cita-nav"
                          onClick={siguienteCitaDisponible}
                          disabled={indiceCitaActual >= citasDisponibles.length - 1 && !hasMoreCitas}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>

                    <button
                      className="btn-cancelar-proxima"
                      onClick={() => {
                        setModoProximaCita(false);
                        setCitasDisponibles([]);
                      }}
                    >
                      Volver a elegir barbero
                    </button>
                  </>
                ) : (
                  <div className="proxima-cita-empty">
                    <p>No hay citas disponibles en los próximos días.</p>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setModoProximaCita(false);
                        setCitasDisponibles([]);
                      }}
                    >
                      Elegir barbero manualmente
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Lista de barberos (solo si no está en modo próxima cita) */}
            {!modoProximaCita && (
              <>
                <div className="barbers-divider">
                  <span>o elige un barbero</span>
                </div>
                <div className="barbers-grid">
                  {barberos.filter(b => b.activo).map((barbero) => (
                    <div
                      key={barbero.id}
                      className={`barber-card ${selectedBarbero?.id === barbero.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBarbero(barbero)}
                    >
                      <div className="barber-avatar" style={{ background: barbero.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <User size={32} color="white" />
                      </div>
                      <h3 className="barber-name">{barbero.nombre}</h3>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="step-actions">
              <button className="btn-secondary" onClick={goToPreviousStep}>
                <ArrowLeft size={16} /> Atrás
              </button>
              {!modoProximaCita && (
                <button className="btn-primary" disabled={!selectedBarbero} onClick={goToNextStep}>
                  Continuar <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {currentStep === 'fechaHora' && (
          <div className="step-panel">
            <h2 className="step-title">Selecciona fecha y hora</h2>

            <h3 className="subsection-title">Fecha</h3>
            <div className="dates-scroll">
              {availableDates.map((date, index) => {
                const formatted = formatDate(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <div
                    key={index}
                    className={`date-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                  >
                    <span className="date-day-name">{formatted.dayName}</span>
                    <span className="date-day-number">{formatted.dayNumber}</span>
                    <span className="date-month">{formatted.month}</span>
                  </div>
                );
              })}
            </div>

            {selectedDate && (
              <>
                <h3 className="subsection-title">Hora disponible</h3>
                {horarioPartido && rangosHorario.length > 1 && (
                  <div className="schedule-info">
                    <span className="schedule-badge">
                      Horario: {rangosHorario[0].inicio}-{rangosHorario[0].fin} y {rangosHorario[1].inicio}-{rangosHorario[1].fin}
                    </span>
                  </div>
                )}
                {loadingSlots ? (
                  <div className="loading-slots">Cargando horarios...</div>
                ) : availableSlots.length > 0 ? (
                  <div className="time-slots-grid">
                    {availableSlots.map((slot, index) => {
                      // Detectar si hay un salto de turno (más de 1 hora de diferencia)
                      const prevSlot = index > 0 ? availableSlots[index - 1] : null;
                      const showBreak = prevSlot && (() => {
                        const [prevH, prevM] = prevSlot.split(':').map(Number);
                        const [currH, currM] = slot.split(':').map(Number);
                        const prevMins = prevH * 60 + prevM;
                        const currMins = currH * 60 + currM;
                        return (currMins - prevMins) > 60; // Más de 1 hora de diferencia
                      })();

                      return (
                        <React.Fragment key={slot}>
                          {showBreak && (
                            <div className="time-slot-break">
                              <span>Descanso</span>
                            </div>
                          )}
                          <div
                            className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-slots">No hay horarios disponibles para esta fecha</div>
                )}
              </>
            )}

            <div className="step-actions">
              <button className="btn-secondary" onClick={goToPreviousStep}>
                <ArrowLeft size={16} /> Atrás
              </button>
              <button className="btn-primary" disabled={!selectedDate || !selectedTime} onClick={goToNextStep}>
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'datos' && (
          <div className="step-panel">
            <h2 className="step-title">Tus datos</h2>

            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input
                type="text"
                className={`form-input ${errors.nombre ? 'error' : ''}`}
                value={clienteData.nombre}
                onChange={(e) => {
                  setClienteData({ ...clienteData, nombre: e.target.value });
                  if (errors.nombre) setErrors({ ...errors, nombre: '' });
                }}
                placeholder="Tu nombre"
              />
              {errors.nombre && <span className="error-message">{errors.nombre}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico *</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={clienteData.email}
                onChange={(e) => {
                  setClienteData({ ...clienteData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="tu@email.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono *</label>
              <input
                type="tel"
                className={`form-input ${errors.telefono ? 'error' : ''}`}
                value={clienteData.telefono}
                onChange={(e) => {
                  setClienteData({ ...clienteData, telefono: e.target.value });
                  if (errors.telefono) setErrors({ ...errors, telefono: '' });
                }}
                placeholder="633561792"
              />
              {errors.telefono && <span className="error-message">{errors.telefono}</span>}
            </div>

            {/* Sección de Cita Recurrente */}
            <div className="recurring-section">
              <div className="recurring-toggle">
                <div className="recurring-toggle-header">
                  <RefreshCw size={20} className="recurring-icon" />
                  <div className="recurring-toggle-text">
                    <span className="recurring-toggle-title">¿Cliente recurrente?</span>
                    <span className="recurring-toggle-subtitle">Programa citas automáticas</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEsRecurrente(!esRecurrente);
                    if (!esRecurrente) {
                      setRecurrencia('1_week');
                    } else {
                      setRecurrencia('');
                    }
                  }}
                  className={`toggle-switch ${esRecurrente ? 'active' : ''}`}
                >
                  <span className="toggle-slider" />
                </button>
              </div>

              {esRecurrente && (
                <div className="recurring-options">
                  <div className="form-group">
                    <label className="form-label">¿Con qué frecuencia?</label>
                    <div className="recurrence-buttons">
                      {RECURRENCE_OPTIONS.filter(o => o.value !== '').map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`recurrence-btn ${recurrencia === option.value ? 'selected' : ''}`}
                          onClick={() => setRecurrencia(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">¿Cuántas citas adicionales?</label>
                    <div className="num-citas-selector">
                      <button
                        type="button"
                        className="num-btn"
                        onClick={() => setNumCitasRecurrentes(Math.max(1, numCitasRecurrentes - 1))}
                      >
                        -
                      </button>
                      <span className="num-display">{numCitasRecurrentes}</span>
                      <button
                        type="button"
                        className="num-btn"
                        onClick={() => setNumCitasRecurrentes(Math.min(12, numCitasRecurrentes + 1))}
                      >
                        +
                      </button>
                    </div>
                    <span className="helper-text">Total: {numCitasRecurrentes + 1} citas (esta + {numCitasRecurrentes} futuras)</span>
                  </div>

                  {/* Preview de fechas */}
                  {recurrencia && (
                    <div className="recurring-preview">
                      <p className="preview-title">
                        <Calendar size={16} /> Próximas citas programadas:
                      </p>
                      <div className="preview-dates">
                        <span className="preview-date first">
                          {selectedDate && formatShortDate(selectedDate)} (primera)
                        </span>
                        {getRecurringDates().map((date, index) => (
                          <span key={index} className="preview-date">
                            {formatShortDate(date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={goToPreviousStep}>
                <ArrowLeft size={16} /> Atrás
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (validateClienteData()) {
                    goToNextStep();
                  }
                }}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'confirmar' && (
          <div className="step-panel">
            <div className="summary-card">
              <div className="summary-header">
                <h2>Resumen de tu cita</h2>
              </div>
              <div className="summary-body">
                <div className="summary-row">
                  <span className="summary-label">Servicio</span>
                  <span className="summary-value">{selectedServicio?.nombre}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Barbero</span>
                  <span className="summary-value">{selectedBarbero?.nombre}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Fecha</span>
                  <span className="summary-value">{selectedDate && formatFullDate(selectedDate)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Hora</span>
                  <span className="summary-value">{selectedTime}</span>
                </div>
                {esRecurrente && recurrencia && (
                  <>
                    <div className="summary-row recurring">
                      <span className="summary-label">
                        <RefreshCw size={14} style={{ marginRight: '4px' }} />
                        Frecuencia
                      </span>
                      <span className="summary-value">{getRecurrenciaLabel()}</span>
                    </div>
                    <div className="summary-row recurring">
                      <span className="summary-label">Total citas</span>
                      <span className="summary-value">{numCitasRecurrentes + 1} citas</span>
                    </div>
                  </>
                )}
                <div className="summary-row total">
                  <span className="summary-label">Total</span>
                  <span className="summary-value price">
                    {selectedServicio && formatPrice(
                      esRecurrente && recurrencia
                        ? selectedServicio.precio * (numCitasRecurrentes + 1)
                        : selectedServicio.precio
                    )}
                    {esRecurrente && recurrencia && (
                      <span className="price-breakdown">
                        ({formatPrice(selectedServicio?.precio || 0)} × {numCitasRecurrentes + 1})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {esRecurrente && recurrencia && (
              <div className="recurring-confirmation">
                <p className="recurring-note">
                  <RefreshCw size={16} />
                  Se crearán {numCitasRecurrentes + 1} citas automáticamente
                </p>
                <div className="recurring-dates-list">
                  <span className="date-item first">{selectedDate && formatShortDate(selectedDate)}</span>
                  {getRecurringDates().map((date, index) => (
                    <span key={index} className="date-item">{formatShortDate(date)}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="client-summary">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input type="text" className="form-input" value={clienteData.nombre} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico *</label>
                <input type="email" className="form-input" value={clienteData.email} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono *</label>
                <input type="tel" className="form-input" value={clienteData.telefono} readOnly />
              </div>
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={goToPreviousStep}>
                <ArrowLeft size={16} /> Atrás
              </button>
              <button
                className="btn-primary btn-confirm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Procesando...' : (
                  esRecurrente && recurrencia
                    ? `Confirmar ${numCitasRecurrentes + 1} Citas`
                    : 'Confirmar Reserva'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
