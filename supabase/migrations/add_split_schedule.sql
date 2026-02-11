-- Migration: Agregar soporte para horario partido (split schedule)
-- Ejemplo: 10:00-14:00 y 15:00-20:00

-- 1. Agregar campos de segundo turno a la tabla barberos
ALTER TABLE barberos
ADD COLUMN IF NOT EXISTS hora_inicio_2 TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hora_fin_2 TIME DEFAULT NULL;

-- 2. Agregar configuración global para horario partido del local
-- Insertar configuración si no existe
INSERT INTO configuracion (clave, valor) VALUES
  ('hora_apertura_2', ''),
  ('hora_cierre_2', '')
ON CONFLICT (clave) DO NOTHING;

-- 3. Comentarios explicativos
COMMENT ON COLUMN barberos.hora_inicio_2 IS 'Hora de inicio del segundo turno (horario partido)';
COMMENT ON COLUMN barberos.hora_fin_2 IS 'Hora de fin del segundo turno (horario partido)';

-- Ejemplo de uso:
-- Barbero con horario partido: 10:00-14:00 y 15:00-20:00
-- hora_inicio: 10:00
-- hora_fin: 14:00
-- hora_inicio_2: 15:00
-- hora_fin_2: 20:00

-- Si hora_inicio_2 y hora_fin_2 son NULL, el barbero tiene horario continuo
-- Si tienen valores, el barbero tiene horario partido
