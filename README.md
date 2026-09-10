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

## Gamificacion

Todas las acciones (completar un habito, registrar un set de entrenamiento, terminar una tarea,
completar una meta) suman XP mediante la funcion de Supabase `add_xp`, que recalcula el nivel
del usuario de forma atomica. La tabla de XP y los rangos (Novato → Leyenda) estan en
`lib/gamification.ts`.

## Puesta en marcha

1. Crea un proyecto nuevo en [Supabase](https://supabase.com).
2. En el SQL Editor de ese proyecto, ejecuta el contenido de
   `supabase/migrations/001_init.sql` (crea todas las tablas, RLS y funciones necesarias).
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
   (el perfil de gamificacion se crea automaticamente via trigger) y empieza a ganar XP.

## Estructura

```
app/
  (app)/            rutas autenticadas (sidebar + modulos)
  login, signup      auth publica
components/          vistas por modulo (client components)
lib/
  supabase/          clientes de Supabase (browser/server)
  gamification.ts    XP, niveles y rangos
  types.ts           tipos compartidos
supabase/migrations/ esquema SQL
```
