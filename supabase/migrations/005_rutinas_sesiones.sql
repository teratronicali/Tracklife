-- 005: rutinas planeadas + sesiones de entrenamiento interactivas
-- Permite armar una rutina con ejercicios/series/reps objetivo de antemano,
-- y luego "iniciarla" para ir marcando cada serie en el momento (como un
-- entrenador de gimnasio tipo app), con descanso entre series.

create table if not exists rutinas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

alter table rutinas enable row level security;

create policy "rutinas_all_own" on rutinas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create table if not exists rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  rutina_id uuid not null references rutinas(id) on delete cascade,
  ejercicio_id uuid not null references ejercicios(id) on delete cascade,
  orden integer not null default 0,
  series_objetivo integer not null default 3,
  reps_objetivo text not null default '10',
  peso_objetivo numeric,
  descanso_seg integer not null default 90
);

alter table rutina_ejercicios enable row level security;

create policy "rutina_ejercicios_all_own" on rutina_ejercicios
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create table if not exists sesiones_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  rutina_id uuid references rutinas(id) on delete set null,
  nombre text not null default 'Entrenamiento',
  fecha date not null default current_date,
  iniciada_en timestamptz not null default now(),
  finalizada_en timestamptz
);

alter table sesiones_entrenamiento enable row level security;

create policy "sesiones_entrenamiento_all_own" on sesiones_entrenamiento
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- entrenamiento_registros pasa a poder representar una serie individual
-- dentro de una sesion (numero_serie, rir) en lugar de solo un lote agregado.
alter table entrenamiento_registros add column if not exists sesion_id uuid references sesiones_entrenamiento(id) on delete set null;
alter table entrenamiento_registros add column if not exists rir smallint;
alter table entrenamiento_registros add column if not exists numero_serie integer not null default 1;

create index if not exists idx_rutina_ejercicios_rutina on rutina_ejercicios (rutina_id, orden);
create index if not exists idx_entrenamiento_registros_sesion on entrenamiento_registros (sesion_id);
