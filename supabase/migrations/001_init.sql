-- TrackLife — esquema inicial
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo, vacio)

-- ============================================================
-- PERFILES
-- ============================================================
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default 'Jugador',
  avatar_url text,
  xp_total integer not null default 0,
  nivel integer not null default 1,
  racha_actual integer not null default 0,
  mejor_racha integer not null default 0,
  created_at timestamptz not null default now()
);

alter table perfiles enable row level security;

create policy "perfiles_select_all" on perfiles
  for select using (true);

create policy "perfiles_update_own" on perfiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Crea el perfil automaticamente cuando alguien se registra
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- XP / GAMIFICACION
-- ============================================================
create table if not exists xp_eventos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  tipo text not null,
  xp integer not null,
  descripcion text,
  created_at timestamptz not null default now()
);

alter table xp_eventos enable row level security;

create policy "xp_eventos_own" on xp_eventos
  for select using (usuario_id = auth.uid());

create policy "xp_eventos_insert_own" on xp_eventos
  for insert with check (usuario_id = auth.uid());

create index if not exists idx_xp_eventos_usuario on xp_eventos (usuario_id, created_at desc);

-- Suma XP al usuario autenticado, recalcula nivel y registra el evento
create or replace function add_xp(p_xp integer, p_tipo text, p_descripcion text default null)
returns perfiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil perfiles;
  v_nivel integer := 1;
  v_restante integer;
begin
  update perfiles
  set xp_total = greatest(0, xp_total + p_xp)
  where id = auth.uid()
  returning * into v_perfil;

  v_restante := v_perfil.xp_total;
  while v_restante >= v_nivel * 200 loop
    v_restante := v_restante - v_nivel * 200;
    v_nivel := v_nivel + 1;
  end loop;

  update perfiles set nivel = v_nivel where id = auth.uid() returning * into v_perfil;

  insert into xp_eventos (usuario_id, tipo, xp, descripcion)
  values (auth.uid(), p_tipo, p_xp, p_descripcion);

  return v_perfil;
end;
$$;

-- ============================================================
-- HABITOS
-- ============================================================
create table if not exists habitos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  nombre text not null,
  emoji text not null default '✅',
  momento text not null default 'manana' check (momento in ('manana', 'tarde', 'noche')),
  xp_valor integer not null default 20,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table habitos enable row level security;

create policy "habitos_all_own" on habitos
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create table if not exists habito_registros (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references habitos(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  fecha date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habito_id, fecha)
);

alter table habito_registros enable row level security;

create policy "habito_registros_all_own" on habito_registros
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create index if not exists idx_habito_registros_usuario_fecha on habito_registros (usuario_id, fecha);

-- Recalcula la racha (dias consecutivos con al menos un habito completado)
create or replace function recalcular_racha()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_racha integer := 0;
  v_fecha date := current_date;
  v_existe boolean;
  v_hoy boolean;
begin
  select exists(select 1 from habito_registros where usuario_id = auth.uid() and fecha = current_date) into v_hoy;
  if not v_hoy then
    v_fecha := current_date - 1;
  end if;

  loop
    select exists(select 1 from habito_registros where usuario_id = auth.uid() and fecha = v_fecha) into v_existe;
    exit when not v_existe;
    v_racha := v_racha + 1;
    v_fecha := v_fecha - 1;
  end loop;

  update perfiles
  set racha_actual = v_racha,
      mejor_racha = greatest(mejor_racha, v_racha)
  where id = auth.uid();
end;
$$;

-- ============================================================
-- FINANZAS
-- ============================================================
create table if not exists finanzas_transacciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  categoria text not null default 'otros',
  descripcion text,
  monto numeric not null check (monto >= 0),
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);

alter table finanzas_transacciones enable row level security;

create policy "finanzas_all_own" on finanzas_transacciones
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create index if not exists idx_finanzas_usuario_fecha on finanzas_transacciones (usuario_id, fecha desc);

-- ============================================================
-- ENTRENAMIENTO
-- ============================================================
create table if not exists ejercicios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  nombre text not null,
  grupo_muscular text not null default 'general'
    check (grupo_muscular in ('pecho', 'espalda', 'hombros', 'triceps', 'biceps', 'piernas', 'core', 'general')),
  created_at timestamptz not null default now()
);

alter table ejercicios enable row level security;

create policy "ejercicios_all_own" on ejercicios
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create table if not exists entrenamiento_registros (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  ejercicio_id uuid not null references ejercicios(id) on delete cascade,
  peso numeric not null default 0,
  reps integer not null default 0,
  series integer not null default 1,
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);

alter table entrenamiento_registros enable row level security;

create policy "entrenamiento_registros_all_own" on entrenamiento_registros
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create index if not exists idx_entreno_usuario_fecha on entrenamiento_registros (usuario_id, fecha desc);

-- ============================================================
-- NUTRICION (pestana Dieta dentro de Entrenamiento)
-- ============================================================
create table if not exists nutricion_comidas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  nombre text not null,
  proteina numeric not null default 0,
  carbohidratos numeric not null default 0,
  grasa numeric not null default 0,
  kcal numeric not null default 0,
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);

alter table nutricion_comidas enable row level security;

create policy "nutricion_comidas_all_own" on nutricion_comidas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create table if not exists nutricion_metas (
  usuario_id uuid primary key references perfiles(id) on delete cascade,
  kcal_objetivo numeric not null default 2000,
  proteina_objetivo numeric not null default 150,
  carbo_objetivo numeric not null default 200,
  grasa_objetivo numeric not null default 60
);

alter table nutricion_metas enable row level security;

create policy "nutricion_metas_all_own" on nutricion_metas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create index if not exists idx_nutricion_usuario_fecha on nutricion_comidas (usuario_id, fecha desc);

-- ============================================================
-- METAS
-- ============================================================
create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  titulo text not null,
  tipo text not null default 'personal' check (tipo in ('financiera', 'personal')),
  monto_objetivo numeric not null default 0,
  monto_actual numeric not null default 0,
  dias_objetivo integer,
  fecha_inicio date not null default current_date,
  imagen_url text,
  archivada boolean not null default false,
  created_at timestamptz not null default now()
);

alter table metas enable row level security;

create policy "metas_all_own" on metas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create table if not exists metas_aportes (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references metas(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  monto numeric not null,
  nota text,
  created_at timestamptz not null default now()
);

alter table metas_aportes enable row level security;

create policy "metas_aportes_all_own" on metas_aportes
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ============================================================
-- TAREAS (kanban)
-- ============================================================
create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'hecho')),
  etiqueta text,
  xp_valor integer not null default 30,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tareas enable row level security;

create policy "tareas_all_own" on tareas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create table if not exists tareas_subtareas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references tareas(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  titulo text not null,
  completado boolean not null default false,
  orden integer not null default 0
);

alter table tareas_subtareas enable row level security;

create policy "tareas_subtareas_all_own" on tareas_subtareas
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
