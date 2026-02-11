'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Save, Loader2, Settings, Building, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfigItem {
  clave: string;
  valor: string;
  descripcion: string;
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [horarioPartido, setHorarioPartido] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      const res = await fetch('/api/configuracion');
      const data = await res.json();
      if (data.success) {
        const configObj: Record<string, string> = {};
        data.data.forEach((item: ConfigItem) => {
          configObj[item.clave] = item.valor || '';
        });
        setConfig(configObj);

        // Detectar si tiene horario partido
        if (configObj.hora_apertura_2 && configObj.hora_cierre_2) {
          setHorarioPartido(true);
        }
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }

  function actualizarCampo(clave: string, valor: string) {
    setConfig({ ...config, [clave]: valor });
  }

  function toggleHorarioPartido() {
    const nuevoValor = !horarioPartido;
    setHorarioPartido(nuevoValor);

    if (!nuevoValor) {
      // Limpiar el segundo turno si se desactiva
      setConfig({
        ...config,
        hora_apertura_2: '',
        hora_cierre_2: ''
      });
    } else {
      // Poner valores por defecto si se activa
      setConfig({
        ...config,
        hora_apertura_2: config.hora_apertura_2 || '15:00',
        hora_cierre_2: config.hora_cierre_2 || '20:00'
      });
    }
  }

  async function guardar() {
    // Validar horarios si hay horario partido
    if (horarioPartido) {
      const cierre1 = config.hora_cierre || '14:00';
      const apertura2 = config.hora_apertura_2 || '15:00';

      if (cierre1 >= apertura2) {
        toast.error('El primer turno debe terminar antes de que empiece el segundo');
        return;
      }
    }

    setGuardando(true);
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Configuración guardada');
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Ajustes generales de tu barbería</p>
        </div>
        <Button onClick={guardar} loading={guardando} className="hidden sm:flex">
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* Información del Negocio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building className="w-5 h-5" />
            Información del Negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre de la Barbería"
            value={config.nombre_barberia || ''}
            onChange={(e) => actualizarCampo('nombre_barberia', e.target.value)}
            placeholder="Mi Barbería"
          />

          <Input
            label="Dirección"
            value={config.direccion || ''}
            onChange={(e) => actualizarCampo('direccion', e.target.value)}
            placeholder="Calle Principal #123"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={config.telefono || ''}
              onChange={(e) => actualizarCampo('telefono', e.target.value)}
              placeholder="+57 300 123 4567"
            />

            <Input
              label="Email"
              type="email"
              value={config.email || ''}
              onChange={(e) => actualizarCampo('email', e.target.value)}
              placeholder="contacto@barberia.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="w-5 h-5" />
            Horario del Local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primer turno */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {horarioPartido ? 'Primer turno (mañana)' : 'Horario de apertura'}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hora de Apertura"
                type="time"
                value={config.hora_apertura || '10:00'}
                onChange={(e) => actualizarCampo('hora_apertura', e.target.value)}
              />

              <Input
                label="Hora de Cierre"
                type="time"
                value={config.hora_cierre || '14:00'}
                onChange={(e) => actualizarCampo('hora_cierre', e.target.value)}
              />
            </div>
          </div>

          {/* Toggle horario partido */}
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Horario partido</p>
              <p className="text-sm text-gray-500">Activar segundo turno (ej: tarde)</p>
            </div>
            <button
              type="button"
              onClick={toggleHorarioPartido}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                horarioPartido ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  horarioPartido ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Segundo turno (si está habilitado) */}
          {horarioPartido && (
            <div className="bg-indigo-50/50 rounded-lg p-4 space-y-3 border border-indigo-100">
              <h4 className="font-medium text-indigo-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Segundo turno (tarde)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Hora de Apertura"
                  type="time"
                  value={config.hora_apertura_2 || '15:00'}
                  onChange={(e) => actualizarCampo('hora_apertura_2', e.target.value)}
                />

                <Input
                  label="Hora de Cierre"
                  type="time"
                  value={config.hora_cierre_2 || '20:00'}
                  onChange={(e) => actualizarCampo('hora_cierre_2', e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">
                Ejemplo: 10:00-14:00 (mañana) y 15:00-20:00 (tarde)
              </p>
            </div>
          )}

          {/* Resumen de horario */}
          {horarioPartido && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Horario configurado:</strong> {config.hora_apertura || '10:00'} - {config.hora_cierre || '14:00'}
                {' '}y{' '}
                {config.hora_apertura_2 || '15:00'} - {config.hora_cierre_2 || '20:00'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="w-5 h-5" />
            Configuración de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Días de anticipación máxima"
              type="number"
              value={config.dias_anticipacion || '30'}
              onChange={(e) => actualizarCampo('dias_anticipacion', e.target.value)}
              min={1}
              max={90}
              helperText="Máximo de días que un cliente puede reservar con anticipación"
            />

            <Input
              label="Intervalo entre citas (minutos)"
              type="number"
              value={config.intervalo_minutos || '30'}
              onChange={(e) => actualizarCampo('intervalo_minutos', e.target.value)}
              min={15}
              max={60}
              step={15}
              helperText="Intervalos de tiempo para mostrar horarios"
            />
          </div>
        </CardContent>
      </Card>

      {/* Moneda y otros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="w-5 h-5" />
            Otros Ajustes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Moneda"
              value={config.moneda || 'COP'}
              onChange={(e) => actualizarCampo('moneda', e.target.value)}
              placeholder="COP"
            />

            <Input
              label="Zona Horaria"
              value={config.zona_horaria || 'America/Bogota'}
              onChange={(e) => actualizarCampo('zona_horaria', e.target.value)}
              placeholder="America/Bogota"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar fijo en móvil */}
      <div className="sticky bottom-4 sm:hidden">
        <Button onClick={guardar} loading={guardando} className="w-full shadow-lg">
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
