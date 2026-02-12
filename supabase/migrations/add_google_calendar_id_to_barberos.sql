-- Migración: Agregar google_calendar_id a la tabla barberos
-- Fecha: 2026-02-12
-- Descripción: Permite que cada barbero tenga su propio calendario de Google

-- Agregar columna google_calendar_id a barberos
ALTER TABLE barberos
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;

-- Comentario para documentación
COMMENT ON COLUMN barberos.google_calendar_id IS 'ID del calendario de Google específico para este barbero';

-- Ejemplo de IDs de calendario (para referencia):
-- Studio 1994 - Dago: [el ID del calendario de Dago]
-- Studio 1994 - Wilson: [el ID del calendario de Wilson]
