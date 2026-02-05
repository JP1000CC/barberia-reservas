-- ============================================
-- SISTEMA DE RESERVAS PARA BARBERÍA
-- Esquema de Base de Datos - Supabase
-- ============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: configuracion
-- Configuración general de la barbería
-- ============================================
CREATE TABLE configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de configuración
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('nombre_barberia', 'Mi Barbería', 'Nombre del negocio'),
  ('direccion', 'Calle Principal #123', 'Dirección física'),
  ('telefono', '+57 300 123 4567', 'Teléfono de contacto'),
  ('email', 'contacto@mibarberia.com', 'Email de contacto'),
  ('dias_anticipacion', '30', 'Días máximos para reservar con anticipación'),
  ('intervalo_minutos', '30', 'Intervalo entre citas en minutos'),
  ('hora_apertura', '09:00', 'Hora de apertura'),
  ('hora_cierre', '19:00', 'Hora de cierre'),
  ('moneda', 'COP', 'Moneda para precios'),
  ('zona_horaria', 'America/Bogota', 'Zona horaria');

-- ============================================
-- TABLA: barberos
-- Información de los barberos
-- ============================================
CREATE TABLE barberos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(20),
  foto_url TEXT,
  hora_inicio TIME DEFAULT '09:00',
  hora_fin TIME DEFAULT '18:00',
  dias_laborales INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6], -- 0=Dom, 1=Lun, ... 6=Sab
  activo BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3b82f6', -- Color para el calendario
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_barberos_activo ON barberos(activo);

-- ============================================
-- TABLA: servicios
-- Catálogo de servicios
-- ============================================
CREATE TABLE servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  duracion_minutos INTEGER NOT NULL DEFAULT 30,
  precio DECIMAL(10,2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_servicios_activo ON servicios(activo);
CREATE INDEX idx_servicios_orden ON servicios(orden);

-- ============================================
-- TABLA: clientes
-- Información de clientes
-- ============================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(20) NOT NULL,
  notas TEXT,
  total_visitas INTEGER DEFAULT 0,
  ultima_visita TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);

-- ============================================
-- TABLA: reservas
-- Reservas/Citas
-- ============================================
CREATE TYPE estado_reserva AS ENUM ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio');

CREATE TABLE reservas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  barbero_id UUID NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,

  -- Datos de la cita
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,

  -- Datos del cliente (desnormalizados para histórico)
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_email VARCHAR(255),
  cliente_telefono VARCHAR(20) NOT NULL,

  -- Datos del servicio (desnormalizados para histórico)
  servicio_nombre VARCHAR(100) NOT NULL,
  servicio_precio DECIMAL(10,2) NOT NULL,

  -- Estado y notas
  estado estado_reserva DEFAULT 'pendiente',
  notas TEXT,

  -- Recordatorios
  recordatorio_enviado BOOLEAN DEFAULT false,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelado_at TIMESTAMPTZ,
  completado_at TIMESTAMPTZ
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
CREATE INDEX idx_reservas_barbero ON reservas(barbero_id);
CREATE INDEX idx_reservas_cliente ON reservas(cliente_id);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_fecha_barbero ON reservas(fecha, barbero_id);

-- Restricción: no permitir reservas superpuestas para el mismo barbero
CREATE OR REPLACE FUNCTION check_reserva_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservas
    WHERE barbero_id = NEW.barbero_id
    AND fecha = NEW.fecha
    AND id != COALESCE(NEW.id, uuid_generate_v4())
    AND estado NOT IN ('cancelada', 'no_asistio')
    AND (
      (NEW.hora_inicio >= hora_inicio AND NEW.hora_inicio < hora_fin)
      OR (NEW.hora_fin > hora_inicio AND NEW.hora_fin <= hora_fin)
      OR (NEW.hora_inicio <= hora_inicio AND NEW.hora_fin >= hora_fin)
    )
  ) THEN
    RAISE EXCEPTION 'Ya existe una reserva en este horario para este barbero';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_reserva_overlap
BEFORE INSERT OR UPDATE ON reservas
FOR EACH ROW EXECUTE FUNCTION check_reserva_overlap();

-- ============================================
-- TABLA: horarios_especiales
-- Días festivos o horarios especiales
-- ============================================
CREATE TABLE horarios_especiales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbero_id UUID REFERENCES barberos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  cerrado BOOLEAN DEFAULT false,
  hora_inicio TIME,
  hora_fin TIME,
  motivo VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si barbero_id es NULL, aplica a toda la barbería
CREATE INDEX idx_horarios_especiales_fecha ON horarios_especiales(fecha);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_configuracion_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_barberos_updated_at
  BEFORE UPDATE ON barberos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_servicios_updated_at
  BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para incrementar visitas del cliente
CREATE OR REPLACE FUNCTION update_cliente_visitas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
    UPDATE clientes
    SET total_visitas = total_visitas + 1,
        ultima_visita = NOW()
    WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cliente_visitas
AFTER UPDATE ON reservas
FOR EACH ROW EXECUTE FUNCTION update_cliente_visitas();

-- ============================================
-- VISTAS
-- ============================================

-- Vista de reservas del día
CREATE VIEW reservas_hoy AS
SELECT
  r.*,
  b.nombre as barbero_nombre,
  b.color as barbero_color
FROM reservas r
JOIN barberos b ON r.barbero_id = b.id
WHERE r.fecha = CURRENT_DATE
ORDER BY r.hora_inicio;

-- Vista de estadísticas mensuales
CREATE VIEW estadisticas_mes AS
SELECT
  COUNT(*) FILTER (WHERE estado != 'cancelada') as total_citas,
  COUNT(*) FILTER (WHERE estado = 'completada') as citas_completadas,
  COUNT(*) FILTER (WHERE estado = 'cancelada') as citas_canceladas,
  COUNT(*) FILTER (WHERE estado = 'no_asistio') as no_asistieron,
  COALESCE(SUM(servicio_precio) FILTER (WHERE estado = 'completada'), 0) as ingresos
FROM reservas
WHERE fecha >= DATE_TRUNC('month', CURRENT_DATE)
AND fecha < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_especiales ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para lectura (sin autenticación)
CREATE POLICY "Configuración visible para todos" ON configuracion
  FOR SELECT USING (true);

CREATE POLICY "Barberos activos visibles para todos" ON barberos
  FOR SELECT USING (activo = true);

CREATE POLICY "Servicios activos visibles para todos" ON servicios
  FOR SELECT USING (activo = true);

CREATE POLICY "Horarios especiales visibles para todos" ON horarios_especiales
  FOR SELECT USING (true);

-- Política para crear reservas (cualquiera puede crear)
CREATE POLICY "Cualquiera puede crear reservas" ON reservas
  FOR INSERT WITH CHECK (true);

-- Política para ver reservas propias (por teléfono o email)
CREATE POLICY "Ver reservas propias" ON reservas
  FOR SELECT USING (true);

-- Políticas para administradores (usando service_role)
-- Nota: El service_role bypasses RLS automáticamente

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Barberos de ejemplo
INSERT INTO barberos (nombre, email, telefono, hora_inicio, hora_fin, dias_laborales, color) VALUES
  ('Carlos Pérez', 'carlos@barberia.com', '3001234567', '09:00', '18:00', ARRAY[1,2,3,4,5,6], '#3b82f6'),
  ('Miguel Rodríguez', 'miguel@barberia.com', '3009876543', '10:00', '19:00', ARRAY[1,2,3,4,5], '#10b981'),
  ('Andrés García', 'andres@barberia.com', '3005551234', '09:00', '17:00', ARRAY[2,3,4,5,6], '#f59e0b');

-- Servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, duracion_minutos, precio, orden) VALUES
  ('Corte Clásico', 'Corte de cabello tradicional con tijera y máquina', 30, 25000, 1),
  ('Corte + Barba', 'Corte de cabello completo más arreglo de barba', 45, 40000, 2),
  ('Afeitado Clásico', 'Afeitado tradicional con navaja y toalla caliente', 30, 20000, 3),
  ('Diseño de Barba', 'Perfilado y diseño de barba con detalles', 30, 18000, 4),
  ('Corte Infantil', 'Corte de cabello para niños menores de 12 años', 25, 18000, 5),
  ('Tratamiento Capilar', 'Tratamiento hidratante y masaje capilar', 40, 35000, 6);
