-- Agregar columna para rastrear si se envió recordatorio
ALTER TABLE reservas
ADD COLUMN IF NOT EXISTS recordatorio_enviado BOOLEAN DEFAULT FALSE;

-- Crear índice para optimizar búsqueda de recordatorios pendientes
CREATE INDEX IF NOT EXISTS idx_reservas_recordatorio
ON reservas(fecha, estado, recordatorio_enviado)
WHERE estado != 'cancelada' AND recordatorio_enviado = FALSE;
