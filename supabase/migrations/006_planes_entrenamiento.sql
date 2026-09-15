-- 006: planes de entrenamiento con calendario semanal + plantillas
-- predeterminadas por objetivo/nivel (fuerza, hipertrofia, perdida de peso,
-- resistencia/running), tanto para gimnasio como para cardio/deporte.

-- rutinas: ahora distinguen tipo (gym vs cardio) y llevan metadata de
-- objetivo/nivel para poder filtrarlas y para las plantillas predeterminadas.
ALTER TABLE rutinas ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'gym' CHECK (tipo IN ('gym', 'cardio'));
ALTER TABLE rutinas ADD COLUMN IF NOT EXISTS objetivo text;
ALTER TABLE rutinas ADD COLUMN IF NOT EXISTS nivel text CHECK (nivel IN ('principiante', 'intermedio', 'experto'));

-- rutina_ejercicios: campos objetivo para pasos de cardio (correr, ciclismo, etc),
-- que no se miden en series/reps/peso sino en distancia/duracion.
ALTER TABLE rutina_ejercicios ADD COLUMN IF NOT EXISTS tipo_actividad text;
ALTER TABLE rutina_ejercicios ADD COLUMN IF NOT EXISTS distancia_objetivo_km numeric;
ALTER TABLE rutina_ejercicios ADD COLUMN IF NOT EXISTS duracion_objetivo_min integer;
ALTER TABLE rutina_ejercicios ADD COLUMN IF NOT EXISTS notas_cardio text;

-- planes_entrenamiento: agrupan rutinas (gym y/o cardio) en un calendario
-- semanal. Solo un plan activo a la vez por usuario (se controla en la app).
CREATE TABLE IF NOT EXISTS planes_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  nombre text not null,
  objetivo text not null,
  nivel text not null check (nivel in ('principiante', 'intermedio', 'experto')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table planes_entrenamiento enable row level security;

create policy "planes_entrenamiento_all_own" on planes_entrenamiento
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- plan_dias: un slot por dia de la semana (0=lunes .. 6=domingo). rutina_id
-- nulo + descanso=true significa dia de descanso.
CREATE TABLE IF NOT EXISTS plan_dias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  plan_id uuid not null references planes_entrenamiento(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  rutina_id uuid references rutinas(id) on delete set null,
  descanso boolean not null default false,
  unique (plan_id, dia_semana)
);

alter table plan_dias enable row level security;

create policy "plan_dias_all_own" on plan_dias
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create index if not exists idx_plan_dias_plan on plan_dias (plan_id);
create index if not exists idx_planes_entrenamiento_usuario_activo on planes_entrenamiento (usuario_id, activo);
