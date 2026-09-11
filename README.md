# TrackLife

App de productividad gamificada: habitos, finanzas, entrenamiento (+ dieta), metas y tareas,
todo con un sistema de XP, niveles, rachas y un leaderboard global.

Inspirada en el concepto de apps como StarkLab (habit tracker + neurociencia + gamificacion),
pero con identidad propia en azul/negro/blanco.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS
- Recharts (graficas)
- Lucide React (iconos)
- react-hot-toast (notificaciones)

## Modulos

- **Dashboard** — resumen de XP, nivel, racha y accesos rapidos a cada modulo.
- **Habitos** — checklist diario, cuadricula semanal, heatmap de 84 dias, rachas.
- **Finanzas** — ingresos/gastos, evolucion de saldo, gastos por categoria.
- **Entrenamiento** — registro de series por ejercicio, volumen semanal, distribucion por
  grupo muscular, y una pestana de **Dieta** con macros (proteina/carbo/grasa) y kcal.
- **Metas** — metas financieras o personales con imagen, aportes y barra de progreso.
- **Tareas** — kanban (Pendiente / En progreso / Hecho) con etiquetas y subtareas.
- **Leaderboard** — ranking global por XP con podio top 3.
- **Recompensas** — desbloqueos por nivel.
- **Onboarding** — cuestionario obligatorio al primer ingreso: habitos a adoptar, deporte(s)
  practicado(s) (crea ejercicios/rutinas por deporte automaticamente), enfoque financiero y
  una primera meta opcional. Se puede volver a hacer desde **Ajustes**.
- **Ajustes** — resumen de personalizacion + integracion con **Strava** (importa entrenamientos
  automaticamente: running, ciclismo, natacion, etc.).

## Gamificacion

Todas las acciones (completar un habito, registrar un set de entrenamiento, terminar una tarea,
completar una meta) suman XP mediante la funcion de Supabase `add_xp`, que recalcula el nivel
del usuario de forma atomica. La tabla de XP y los rangos (Novato → Leyenda) estan en
`lib/gamification.ts`.

## Puesta en marcha

1. Crea un proyecto nuevo en [Supabase](https://supabase.com).
2. En el SQL Editor de ese proyecto, ejecuta en orden el contenido de
   `supabase/migrations/001_init.sql` y luego `002_onboarding_strava.sql`
   (crea todas las tablas, RLS y funciones necesarias).
3. Copia `.env.local.example` a `.env.local` y completa con los datos de tu proyecto
   (Settings → API en el dashboard de Supabase):

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

4. Instala dependencias y corre en desarrollo:

   ```bash
   npm install
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000), crea una cuenta desde `/signup`
   (el perfil de gamificacion se crea automaticamente via trigger), completa el cuestionario
   de onboarding y empieza a ganar XP.

### Activar Strava (opcional)

1. Crea una app en <https://www.strava.com/settings/api>. Como "Authorization Callback Domain"
   pon el dominio donde corra la app (ej. `localhost` en desarrollo, o tu dominio de Vercel).
2. Copia el **Client ID** y **Client Secret** a tu `.env.local`:
   ```
   STRAVA_CLIENT_ID=...
   STRAVA_CLIENT_SECRET=...
   ```
3. Reinicia el servidor. En **Ajustes** aparecera el boton "Conectar con Strava".

## Estructura

```
app/
  (app)/             rutas autenticadas (sidebar + modulos)
  api/strava/         OAuth + sincronizacion de actividades
  login, signup, onboarding   auth y personalizacion inicial
components/           vistas por modulo (client components)
lib/
  supabase/           clientes de Supabase (browser/server)
  gamification.ts     XP, niveles y rangos
  onboarding.ts        habitos/deportes sugeridos, mapeo de tipos de Strava
  strava.ts            helpers de OAuth y fetch de actividades
  types.ts             tipos compartidos
supabase/migrations/  esquema SQL
```
