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

  async function guardar() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500">Ajustes generales de tu barbería</p>
        </div>
        <Button onClick={guardar} loading={guardando}>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* Información del Negocio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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

          <div className="grid grid-cols-2 gap-4">
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
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Configuración de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora de Apertura"
              type="time"
              value={config.hora_apertura || '09:00'}
              onChange={(e) => actualizarCampo('hora_apertura', e.target.value)}
            />

            <Input
              label="Hora de Cierre"
              type="time"
              value={config.hora_cierre || '19:00'}
              onChange={(e) => actualizarCampo('hora_cierre', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

      {/* Moneda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Otros Ajustes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
      <div className="sticky bottom-4 md:hidden">
        <Button onClick={guardar} loading={guardando} className="w-full shadow-lg">
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
