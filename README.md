# TrackLife

App de productividad gamificada: habitos, finanzas, entrenamiento (+ dieta), metas y tareas,
todo con un sistema de XP, niveles, rachas y un leaderboard global. Es una **PWA instalable**:
desde el navegador (movil o escritorio) se agrega a la pantalla de inicio como una app nativa.

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

- **Landing page** (`/`) — pagina publica de marketing: features, precio y FAQ. Accesible sin
  iniciar sesion; si ya tienes cuenta, te redirige directo al dashboard.
- **Dashboard** — resumen de XP, nivel, racha y accesos rapidos a cada modulo.
- **Habitos** — checklist diario, cuadricula semanal, heatmap de 84 dias, rachas.
- **Finanzas** — ingresos/gastos, evolucion de saldo, gastos por categoria.
- **Entrenamiento** — tres pestanas:
  - **Plan**: elige un **plan de entrenamiento predeterminado** (12 plantillas: fuerza,
    hipertrofia, perdida de peso o resistencia/running, cada uno en principiante/intermedio/
    experto) que arma automaticamente tus rutinas y las acomoda en un **calendario semanal**
    (Lunes a Domingo), o crea un plan **personalizado**: le pones nombre/objetivo/nivel y, en
    la misma pantalla, asignas tus propias rutinas (ya creadas en "Entrenamientos") a los dias
    que quieras. Desde ahi mismo inicias el entrenamiento del dia con un click.
    El calendario se **reajusta solo**: si termina un dia programado sin registrar nada, la
    proxima vez que abras la app te pregunta que paso ("Si entrene, se me olvido registrarlo"
    o "No pude entrenar"). Si no pudiste, ese dia queda marcado **incumplido** y el sistema
    busca automaticamente el proximo dia de descanso libre de esa misma semana para mover ahi
    el entrenamiento perdido (**compensacion**) — sin tener que rehacer el plan a mano. Tambien
    puedes avisar de una vez con "No voy a entrenar hoy" sin esperar al dia siguiente.
    Hay una tercera opcion, **Running**, que genera un plan de carrera periodizado de verdad:
    elige nivel (incluye **nunca he corrido**, con progresion caminar/correr antes del trote
    continuo) y objetivo (5K, 10K, 21K, maraton o "general" sin distancia fija); si le pones la
    **fecha de la carrera**, el plan dura exactamente las semanas que faltan, y si no, usa una
    duracion recomendada segun nivel/distancia. El plan se organiza en fases **base → build →
    peak → taper** con el fondo largo subiendo progresivamente (con semanas de descarga cada 4
    semanas), series/tempo en fase de calidad, **fortalecimiento 2x/semana** (economia de
    carrera + prevencion de lesiones por sobreuso) y **pliometria 1x/semana** desde build solo
    para nivel intermedio/avanzado — siempre respetando al menos un dia de descanso completo.
    Tambien puedes ponerle **nombre a tu carrera** (ej. "Media Maraton de Medellin"): aparece
    en el banner del plan junto a la cuenta regresiva. El calendario muestra "Semana X de Y".
    Antes de generarlo puedes hacer un **test inicial de ritmo** (corre una distancia conocida
    y anota tu tiempo): con eso se calculan tus zonas de ritmo (facil, umbral/tempo, series y
    ritmo objetivo de carrera segun la formula de Riegel) y cada sesion del plan queda con un
    **ritmo especifico en min/km**, no solo distancia/duracion — se ve tanto en el calendario
    como dentro de la sesion activa al entrenar. El calendario tiene **vista de semana o de
    mes completo** (con navegacion hacia adelante/atras) para ver que entrenos vienen, y
    cualquier dia (de hoy en adelante) se puede **editar o mover**: click en "Editar / mover"
    (o en el dia, en vista de mes) abre un panel para dejarlo en descanso, asignarle cualquiera
    de tus rutinas, armar una sesion de carrera a la medida (nombre, distancia, duracion, ritmo
    y notas) o **intercambiarlo** con cualquier otro dia visible en el calendario.
  - **Entrenamientos**: arma **rutinas** de gimnasio (ejercicios + series/reps/peso/descanso
    objetivo) o de **cardio/deporte** (cualquier actividad — running, ciclismo, natacion,
    escalada, lo que sea, con distancia/duracion objetivo) e iniciala para una **sesion
    interactiva**: vas marcando cada serie (peso, reps, RIR) o actividad (distancia, duracion)
    con timer de descanso automatico, navegacion entre ejercicios y opcion de swap — parecido
    a apps como Symmetry/Hevy. Los ejercicios se pueden crear **sin ningun limite de nombre o
    grupo muscular** desde cualquier parte del flujo (armando una rutina, cambiando de ejercicio
    a mitad de sesion, o desde el registro rapido), y cada uno puede llevar un **link de
    tecnica** (video) opcional que se ve o se agrega sin salir de la sesion. Cuando el link es
    de YouTube, su **miniatura real** se muestra junto al ejercicio (en la sesion y al elegirlo)
    para guiarse de un vistazo; si no tiene video, se ve un icono generico en su lugar. Tambien
    registro rapido de series sueltas, volumen semanal y distribucion por grupo muscular.
  - **Dieta**: macros (proteina/carbo/grasa) y kcal del dia.

  Arriba de las tres pestanas hay una **frase motivacional** (mentalidad de disciplina tipo
  Goggins/Arnold/Peterson — algunas reales, otras propias en el mismo espiritu) que cambia
  cada dia, con boton para pedir otra cuando quieras.
- **Metas** — de cualquier area (financiera, deportiva, familiar, salud, profesional o
  personal), con imagen, aportes y barra de progreso.
- **Tareas** — kanban (Pendiente / En progreso / Hecho) con etiquetas y subtareas.
- **Leaderboard** — ranking global por XP con podio top 3.
- **Recompensas** — desbloqueos por nivel.
- **Onboarding** — cuestionario obligatorio al primer ingreso: habitos a adoptar, deporte(s)
  practicado(s) (crea ejercicios/rutinas por deporte automaticamente), enfoque financiero y
  una primera meta opcional. Se puede volver a hacer desde **Ajustes**.
- **Ajustes** — resumen de personalizacion + integracion con **Strava** (importa entrenamientos
  automaticamente: running, ciclismo, natacion, etc.).
- **Precio / Plan** — plan gratis con limites (3 habitos, 2 metas, 5 tareas) y **Acceso Vitalicio**
  (pago unico via Stripe) que los quita para siempre. Los limites se aplican al crear cada recurso.
- **Asistente de IA** — boton flotante (visible en toda la app) con un chat: le escribes en
  lenguaje natural ("gaste 85 en el restaurante", "hice press banca 80kg, 10 reps", "mañana
  llamar a Carlos") y registra el gasto/ingreso, entrenamiento, tarea, meta o habito por ti,
  usando la herramienta correcta segun lo que dijiste — nunca toca la base de datos directo,
  solo a traves de mutaciones controladas (ver `lib/asistente-tools.ts` y
  `lib/asistente-ejecutar.ts`). Tambien responde preguntas de progreso ("como voy este mes?").
  Corre con Claude (Anthropic) del lado del servidor (`app/api/asistente/route.ts`) — requiere
  `ANTHROPIC_API_KEY` en el `.env.local` (ver abajo); sin esa key el boton avisa que falta
  configurarla en vez de fallar en silencio.

## Gamificacion

TrackLife trata la vida real como un videojuego: **cada accion en cada modulo otorga XP**.

| Accion | XP | Etiqueta |
|---|---|---|
| Completar un habito | segun el habito (config. al crearlo) | Disciplina |
| Registrar una transaccion (Finanzas) | 10 | Riqueza |
| Registrar una comida (Dieta) | 10 | Nutricion |
| Registrar un set de entrenamiento | 40 | Fuerza |
| Completar una tarea | segun la tarea (config. al crearla) | Enfoque |
| Completar una meta | 1000 | Vision |
| Racha de habitos: cada 7 dias seguidos | 500 (bono automatico) | Racha |

El XP se otorga via la funcion de Supabase `add_xp` (SECURITY DEFINER, recalcula el nivel de
forma atomica) y el bono de racha se dispara solo desde `recalcular_racha()` — ver
`supabase/migrations/004_racha_bonus.sql`. En el cliente, `lib/xp-client.ts` centraliza el
otorgamiento: muestra el toast de "+XP" y, si el usuario sube de nivel (o de **rango**), lanza
un segundo toast de celebracion.

Los **niveles** siguen una curva triangular (el nivel N requiere N×200 XP acumulados desde el
nivel N — cada nivel es mas caro que el anterior) y se agrupan en **rangos** cada vez mas dificiles
de alcanzar, pensados para retar al usuario a largo plazo:

`Novato → Aprendiz → Disciplinado → Guerrero → Cazador de Metas → Estratega → Elite → Campeon → Macho Alfa → Titan → Maestro → Leyenda → Inmortal`

Todo esto vive en `lib/gamification.ts` (tabla de XP, rangos, formula de nivel) y
`lib/xp-client.ts` (helper `otorgarXP` usado por todos los modulos).

## PWA (app instalable)

TrackLife funciona como Progressive Web App: `app/manifest.ts` (se sirve en `/manifest.webmanifest`)
declara nombre, iconos (`public/icons/`, generados en varios tamaños + una variante maskable) y modo
`standalone`, y `public/sw.js` es el service worker que la hace instalable. Como la app es dinamica y
con datos de sesion (Supabase), el service worker **no cachea paginas autenticadas** — siempre pide la
red primero para que los datos esten frescos, y solo si no hay conexion cae a `/offline` (la unica
ruta que el service worker deja pre-cacheada). Los assets estaticos (iconos/imagenes) si son
cache-first para cargar al instante. Se registra desde `components/RegistrarServiceWorker.tsx`, montado
en `app/layout.tsx`. El middleware (`middleware.ts`) deja pasar `sw.js`, `manifest.webmanifest` y
`/offline` sin pasar por el chequeo de sesion, para que funcionen tanto logueado como no.

## Puesta en marcha

1. Crea un proyecto nuevo en [Supabase](https://supabase.com).
2. En el SQL Editor de ese proyecto, ejecuta en orden el contenido de
   `supabase/migrations/001_init.sql`, `002_onboarding_strava.sql`, `003_planes_pagos.sql`,
   `004_racha_bonus.sql`, `005_rutinas_sesiones.sql`, `006_planes_entrenamiento.sql`,
   `007_plan_dia_estados.sql`, `008_tipos_meta.sql`, `009_ejercicio_video.sql`,
   `010_grupos_musculares.sql`, `011_plan_multisemana_running.sql`,
   `012_plan_ritmos_edicion.sql` y `013_plan_nombre_carrera.sql`
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

### Activar cobros con Stripe (opcional)

El precio del Acceso Vitalicio esta en `lib/planes.ts` (`PRECIO.unit_amount`, en centavos —
ajustalo a lo que quieras cobrar) y `PRECIO.display` (el texto que se muestra en la UI).

1. Crea una cuenta en <https://dashboard.stripe.com> y copia tu **Secret key** (Developers → API keys).
2. Crea un webhook (Developers → Webhooks → Add endpoint) apuntando a
   `https://TU_DOMINIO/api/stripe/webhook`, escuchando el evento `checkout.session.completed`,
   y copia su **Signing secret**.
3. En Supabase, ve a Settings → API y copia la key **service_role** (secreta, nunca la publiques).
4. Agrega las tres a tu `.env.local`:
   ```
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
5. Reinicia el servidor. El boton "Comprar Acceso Vitalicio" en `/precio` ya podra procesar pagos
   reales; el webhook activa `plan = 'vitalicio'` en el perfil del usuario automaticamente.

### Activar el Asistente de IA (opcional)

1. Crea una API key en <https://console.anthropic.com/settings/keys>.
2. Agregala a tu `.env.local`:
   ```
   ANTHROPIC_API_KEY=...
   ```
3. Reinicia el servidor. El boton flotante del asistente ya podra registrar cosas por ti.

Usa el modelo `claude-opus-5` por defecto (el mas capaz). Como esta tarea es principalmente
extraccion de datos simple (sacar monto/categoria/fecha de una frase), si el costo por uso te
importa mas que la precision maxima, puedes cambiar `MODELO` en `app/api/asistente/route.ts` a
`claude-sonnet-5` o `claude-haiku-4-5` (mucho mas barato) — para este tipo de tarea estructurada
la diferencia de calidad suele ser minima.

En desarrollo local, Stripe no puede llegarte el webhook directamente — usa
[`stripe listen --forward-to localhost:3000/api/stripe/webhook`](https://docs.stripe.com/stripe-cli)
con el Stripe CLI para probarlo.

## Estructura

```
app/
  page.tsx             landing publica
  (app)/               rutas autenticadas (sidebar + modulos, incluye /precio)
  api/strava/          OAuth + sincronizacion de actividades
  api/stripe/          checkout + webhook de pagos
  login, signup, onboarding   auth y personalizacion inicial
components/            vistas por modulo (client components)
lib/
  supabase/            clientes de Supabase (browser/server/admin)
  gamification.ts      XP, niveles y rangos
  onboarding.ts        habitos/deportes sugeridos, mapeo de tipos de Strava
  strava.ts            helpers de OAuth y fetch de actividades
  planes.ts             precio, limites del plan gratis
  stripe.ts             cliente de Stripe
  types.ts              tipos compartidos
supabase/migrations/   esquema SQL
```
