'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Calendar, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

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
}

interface ReservaFormProps {
  servicios: Servicio[];
  barberos: Barbero[];
  config: Config;
}

type Step = 'servicio' | 'barbero' | 'fechaHora' | 'datos' | 'confirmar';

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
  const [clienteData, setClienteData] = useState({
    nombre: '',
    email: '',
    telefono: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);

  // Generate next 14 days
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = generateDates();

  // Fetch available slots when date and barbero change
  useEffect(() => {
    if (selectedDate && selectedBarbero && selectedServicio) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedBarbero, selectedServicio]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedBarbero || !selectedServicio) return;

    setLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/disponibilidad?fecha=${dateStr}&barbero_id=${selectedBarbero.id}&duracion=${selectedServicio.duracion}`
      );
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDate = (date: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
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

  // Validación de teléfono español más flexible
  const validatePhone = (phone: string): boolean => {
    // Eliminar espacios y guiones
    const cleanPhone = phone.replace(/[\s\-]/g, '');

    // Teléfono español: 9 dígitos, puede empezar con 6, 7, 8 o 9
    // 6xx y 7xx = móviles
    // 8xx y 9xx = fijos y servicios especiales
    const spanishPhoneRegex = /^[6-9]\d{8}$/;

    // También aceptar formato internacional con +34
    const internationalRegex = /^\+34[6-9]\d{8}$/;

    // También aceptar números con prefijo 34 sin +
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
        }),
      });

      if (response.ok) {
        setReservaExitosa(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (reservaExitosa) {
    return (
      <div className="success-container">
        <div className="success-icon">
          <CheckCircle size={64} color="#10b981" />
        </div>
        <h2 className="success-title">¡Reserva Confirmada!</h2>
        <p className="success-message">
          Hemos enviado un correo de confirmación a {clienteData.email}
        </p>
        <div className="success-details">
          <p><strong>Servicio:</strong> {selectedServicio?.nombre}</p>
          <p><strong>Barbero:</strong> {selectedBarbero?.nombre}</p>
          <p><strong>Fecha:</strong> {selectedDate && formatFullDate(selectedDate)}</p>
          <p><strong>Hora:</strong> {selectedTime}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          Nueva Reserva
        </button>
      </div>
    );
  }

  return (
    <div className="reservation-form">
      {/* Progress Steps */}
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

      {/* Step Content */}
      <div className="step-content">
        {/* Step 1: Seleccionar Servicio */}
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
              <button
                className="btn-primary"
                disabled={!selectedServicio}
                onClick={goToNextStep}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Seleccionar Barbero */}
        {currentStep === 'barbero' && (
          <div className="step-panel">
            <h2 className="step-title">Selecciona un barbero</h2>
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
            <div className="step-actions">
              <button className="btn-secondary" onClick={goToPreviousStep}>
                <ArrowLeft size={16} /> Atrás
              </button>
              <button
                className="btn-primary"
                disabled={!selectedBarbero}
                onClick={goToNextStep}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Seleccionar Fecha y Hora */}
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
                {loadingSlots ? (
                  <div className="loading-slots">Cargando horarios...</div>
                ) : availableSlots.length > 0 ? (
                  <div className="time-slots-grid">
                    {availableSlots.map((slot) => (
                      <div
                        key={slot}
                        className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </div>
                    ))}
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
              <button
                className="btn-primary"
                disabled={!selectedDate || !selectedTime}
                onClick={goToNextStep}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Datos del Cliente */}
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

        {/* Step 5: Confirmar */}
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
                <div className="summary-row total">
                  <span className="summary-label">Total</span>
                  <span className="summary-value price">{selectedServicio && formatPrice(selectedServicio.precio)}</span>
                </div>
              </div>
            </div>

            <div className="client-summary">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input
                  type="text"
                  className="form-input"
                  value={clienteData.nombre}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  value={clienteData.email}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={clienteData.telefono}
                  readOnly
                />
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
                {submitting ? 'Procesando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
