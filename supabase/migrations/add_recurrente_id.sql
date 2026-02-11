-- Migración: Agregar soporte para citas recurrentes
-- Fecha: 2026-02-11

-- Agregar columna recurrente_id para vincular citas recurrentes
ALTER TABLE reservas
ADD COLUMN IF NOT EXISTS recurrente_id TEXT;

-- Crear índice para búsquedas por recurrente_id
CREATE INDEX IF NOT EXISTS idx_reservas_recurrente_id
ON reservas(recurrente_id)
WHERE recurrente_id IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN reservas.recurrente_id IS 'ID único que vincula las reservas recurrentes del mismo grupo';
