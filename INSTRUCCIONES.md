# 🏪 Sistema de Reservas para Barbería

Sistema profesional de reservas construido con **Next.js 14** + **Supabase** + **Tailwind CSS**.

## 📋 Características

- ✅ Página pública para que los clientes reserven citas
- ✅ Panel de administración completo
- ✅ Sistema de horarios disponibles en tiempo real
- ✅ Gestión de barberos, servicios y clientes
- ✅ Estadísticas y dashboard
- ✅ Base de datos PostgreSQL con Supabase
- ✅ Diseño responsive y moderno
- ✅ Despliegue gratuito en Vercel

---

## 🚀 GUÍA DE INSTALACIÓN PASO A PASO

### PASO 1: Crear cuenta en Supabase (Base de Datos)

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"** y crea una cuenta (puedes usar GitHub)
3. Crea un nuevo proyecto:
   - **Name**: `barberia-reservas`
   - **Database Password**: Genera una contraseña segura (¡guárdala!)
   - **Region**: Selecciona la más cercana a Colombia (ej: `South America (São Paulo)`)
4. Espera ~2 minutos mientras se crea el proyecto

### PASO 2: Configurar la Base de Datos

1. En tu proyecto de Supabase, ve a **SQL Editor** (menú izquierdo)
2. Haz clic en **"New Query"**
3. Copia TODO el contenido del archivo `supabase/schema.sql` y pégalo
4. Haz clic en **"Run"** (o presiona Ctrl+Enter)
5. Deberías ver "Success. No rows returned" - ¡Eso es correcto!

### PASO 3: Obtener las credenciales de Supabase

1. Ve a **Project Settings** (ícono de engranaje abajo a la izquierda)
2. Ve a **API** en el menú
3. Copia estos valores (los necesitarás después):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ ¡Nunca lo compartas!)

### PASO 4: Preparar el proyecto en tu computadora

**Opción A: Si tienes Git instalado**
```bash
# Clonar el repositorio (o descomprimir el ZIP)
cd barberia-nextjs

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env.local
```

**Opción B: Sin Git**
1. Descarga y descomprime la carpeta `barberia-nextjs`
2. Abre una terminal en esa carpeta
3. Ejecuta: `npm install`
4. Copia el archivo `.env.example` y renómbralo a `.env.local`

### PASO 5: Configurar variables de entorno

Edita el archivo `.env.local` con tus credenciales de Supabase:

```env
# Supabase - Pega tus credenciales aquí
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Configuración de la app
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Mi Barbería
NEXT_PUBLIC_TIMEZONE=America/Bogota
```

### PASO 6: Probar localmente

```bash
npm run dev
```

Abre en tu navegador:
- **Página de reservas**: http://localhost:3000
- **Panel admin**: http://localhost:3000/admin

---

## 🌐 DESPLIEGUE EN VERCEL (HOSTING GRATUITO)

### PASO 1: Crear cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"** (puedes usar tu cuenta de GitHub)

### PASO 2: Subir tu proyecto a GitHub

1. Ve a [https://github.com](https://github.com) y crea un repositorio nuevo
2. Sube los archivos de tu proyecto:

```bash
git init
git add .
git commit -m "Sistema de reservas barbería"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/barberia-reservas.git
git push -u origin main
```

### PASO 3: Desplegar en Vercel

1. En Vercel, haz clic en **"New Project"**
2. Importa tu repositorio de GitHub
3. **IMPORTANTE**: Antes de hacer deploy, configura las variables de entorno:
   - Haz clic en **"Environment Variables"**
   - Agrega cada variable de tu `.env.local`:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key |
| `NEXT_PUBLIC_APP_NAME` | Mi Barbería |
| `NEXT_PUBLIC_TIMEZONE` | America/Bogota |

4. Haz clic en **"Deploy"**
5. Espera ~2 minutos y tendrás tu URL pública: `https://tu-proyecto.vercel.app`

### PASO 4: Actualizar la URL en Supabase (Importante)

1. Ve a tu proyecto en Supabase → **Authentication** → **URL Configuration**
2. En **Site URL**, pon tu URL de Vercel: `https://tu-proyecto.vercel.app`
3. En **Redirect URLs**, agrega: `https://tu-proyecto.vercel.app/**`

---

## 📱 URLS DE TU APLICACIÓN

Una vez desplegado, tendrás:

| Página | URL |
|--------|-----|
| Reservas (clientes) | `https://tu-proyecto.vercel.app` |
| Panel Admin | `https://tu-proyecto.vercel.app/admin` |

---

## 🔧 PERSONALIZACIÓN

### Cambiar nombre y datos de la barbería

1. Ve a Supabase → **Table Editor** → **configuracion**
2. Edita los valores de:
   - `nombre_barberia`
   - `direccion`
   - `telefono`
   - `email`

### Agregar barberos

1. Ve a Supabase → **Table Editor** → **barberos**
2. Haz clic en **"Insert row"**
3. Llena los datos del barbero

### Agregar servicios

1. Ve a Supabase → **Table Editor** → **servicios**
2. Haz clic en **"Insert row"**
3. Llena: nombre, descripción, duración (minutos), precio

---

## 🛡️ SEGURIDAD (Importante)

- ⚠️ **NUNCA** compartas tu `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Las variables de entorno en Vercel están encriptadas
- ✅ Row Level Security (RLS) está habilitado en Supabase
- ✅ Las operaciones administrativas requieren el service role

---

## 💰 COSTOS

| Servicio | Plan Gratuito |
|----------|---------------|
| **Supabase** | 500MB base de datos, 2GB transferencia, 50K usuarios |
| **Vercel** | 100GB transferencia, dominio .vercel.app incluido |

Para un negocio pequeño, el plan gratuito es más que suficiente.

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa que las variables de entorno estén bien configuradas
2. Revisa los logs en Vercel → tu proyecto → **Logs**
3. Revisa los logs en Supabase → **Logs** → **Edge Functions**

---

## 🎨 PRÓXIMAS MEJORAS SUGERIDAS

- [ ] Autenticación para el panel admin
- [ ] Notificaciones por email (usando Resend)
- [ ] Notificaciones por WhatsApp
- [ ] Integración con Google Calendar
- [ ] Reportes y gráficas avanzadas
- [ ] App móvil con React Native

---

¡Listo! Tu sistema de reservas profesional está funcionando. 🎉
