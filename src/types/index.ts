// ============================================
// TIPOS TYPESCRIPT
// Sistema de Reservas para Barbería
// ============================================

export type EstadoReserva = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';

export interface Configuracion {
  id: string;
  clave: string;
  valor: string | null;
  descripcion: string | null;
}

export interface Barbero {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  foto_url: string | null;
  hora_inicio: string;
  hora_fin: string;
  // Campos para horario partido (segundo turno)
  hora_inicio_2: string | null;
  hora_fin_2: string | null;
  dias_laborales: number[];
  activo: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string;
  notas: string | null;
  total_visitas: number;
  ultima_visita: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reserva {
  id: string;
  cliente_id: string | null;
  barbero_id: string;
  servicio_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_telefono: string;
  servicio_nombre: string;
  servicio_precio: number;
  estado: EstadoReserva;
  notas: string | null;
  recordatorio_enviado: boolean;
  recurrente_id: string | null; // ID para vincular citas recurrentes
  google_calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
  cancelado_at: string | null;
  completado_at: string | null;
  // Relaciones
  barbero?: Barbero;
  servicio?: Servicio;
  cliente?: Cliente;
}

export interface HorarioEspecial {
  id: string;
  barbero_id: string | null;
  fecha: string;
  cerrado: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string | null;
}

export interface SlotHorario {
  hora: string;
  horaFin: string;
  disponible: boolean;
}

export interface EstadisticasDashboard {
  citasHoy: number;
  citasPendientes: number;
  citasMes: number;
  ingresosMes: number;
}

// Tipos para formularios
export interface ReservaFormData {
  barberoId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  notas?: string;
  // Campos para citas recurrentes
  esRecurrente?: boolean;
  recurrencia?: '1_week' | '2_weeks' | '3_weeks' | '1_month';
  numCitasRecurrentes?: number;
}

export interface BarberoFormData {
  nombre: string;
  email?: string;
  telefono?: string;
  hora_inicio: string;
  hora_fin: string;
  // Campos para horario partido (segundo turno)
  hora_inicio_2?: string;
  hora_fin_2?: string;
  dias_laborales: number[];
  color: string;
}

export interface ServicioFormData {
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  precio: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
