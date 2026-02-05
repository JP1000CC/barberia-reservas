import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parse, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear fecha
export function formatearFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return format(d, 'yyyy-MM-dd');
}

// Formatear fecha legible
export function formatearFechaLegible(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha;
  return format(d, "EEEE, d 'de' MMMM", { locale: es });
}

// Formatear hora
export function formatearHora(hora: string): string {
  return hora.slice(0, 5); // "09:00:00" -> "09:00"
}

// Formatear precio
export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio);
}

// Convertir hora string a minutos
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// Convertir minutos a hora string
export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Obtener nombre del día
export function obtenerNombreDia(fecha: Date): string {
  return format(fecha, 'EEEE', { locale: es });
}

// Obtener número del día (0=Dom, 1=Lun, ...)
export function obtenerNumeroDia(fecha: Date): number {
  return fecha.getDay();
}

// Generar slots de horarios disponibles
export function generarSlotsHorarios(
  horaInicio: string,
  horaFin: string,
  duracion: number,
  intervalo: number = 30,
  reservasExistentes: { hora_inicio: string; hora_fin: string; estado: string }[] = [],
  fecha: string = ''
): { hora: string; horaFin: string; disponible: boolean }[] {
  const slots: { hora: string; horaFin: string; disponible: boolean }[] = [];
  const inicioMinutos = horaAMinutos(horaInicio);
  const finMinutos = horaAMinutos(horaFin);

  // Si es hoy, no mostrar horas pasadas
  const ahora = new Date();
  const esHoy = fecha === formatearFecha(ahora);
  const minutosActuales = esHoy ? ahora.getHours() * 60 + ahora.getMinutes() + 30 : 0;

  for (let minutos = inicioMinutos; minutos + duracion <= finMinutos; minutos += intervalo) {
    // Saltar horas pasadas si es hoy
    if (esHoy && minutos < minutosActuales) {
      continue;
    }

    const horaSlot = minutosAHora(minutos);
    const horaFinSlot = minutosAHora(minutos + duracion);

    // Verificar si hay solapamiento con reservas existentes
    let disponible = true;
    for (const reserva of reservasExistentes) {
      if (reserva.estado === 'cancelada' || reserva.estado === 'no_asistio') continue;

      const reservaInicio = horaAMinutos(reserva.hora_inicio);
      const reservaFin = horaAMinutos(reserva.hora_fin);

      // Verificar solapamiento
      if (minutos < reservaFin && (minutos + duracion) > reservaInicio) {
        disponible = false;
        break;
      }
    }

    slots.push({
      hora: horaSlot,
      horaFin: horaFinSlot,
      disponible,
    });
  }

  return slots;
}

// Validar email
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validar teléfono colombiano
export function validarTelefono(telefono: string): boolean {
  const limpio = telefono.replace(/[\s\-\(\)]/g, '');
  return /^(\+57)?3\d{9}$/.test(limpio);
}

// Formatear teléfono
export function formatearTelefono(telefono: string): string {
  const limpio = telefono.replace(/\D/g, '');
  if (limpio.length === 10) {
    return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}`;
  }
  return telefono;
}

// Capitalizar nombre
export function capitalizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

// Días de la semana
export const DIAS_SEMANA = [
  { valor: 0, nombre: 'Domingo', abrev: 'Dom' },
  { valor: 1, nombre: 'Lunes', abrev: 'Lun' },
  { valor: 2, nombre: 'Martes', abrev: 'Mar' },
  { valor: 3, nombre: 'Miércoles', abrev: 'Mié' },
  { valor: 4, nombre: 'Jueves', abrev: 'Jue' },
  { valor: 5, nombre: 'Viernes', abrev: 'Vie' },
  { valor: 6, nombre: 'Sábado', abrev: 'Sáb' },
];

// Estados de reserva con colores
export const ESTADOS_RESERVA = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
  completada: { label: 'Completada', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  no_asistio: { label: 'No asistió', color: 'bg-gray-100 text-gray-800' },
};
