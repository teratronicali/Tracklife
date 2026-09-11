-- TrackLife — onboarding personalizado + integracion Strava
-- Ejecutar en el SQL Editor de Supabase despues de 001_init.sql

-- ============================================================
-- PERFILES: datos de personalizacion del onboarding
-- ============================================================
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS onboarding_completado boolean NOT NULL DEFAULT false;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS deportes text[] NOT NULL DEFAULT '{}';
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS enfoque_financiero text[] NOT NULL DEFAULT '{}';
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS presupuesto_mensual numeric;

-- ============================================================
-- ENTRENAMIENTO: soporte para actividades de cardio / importadas de Strava
-- ============================================================
ALTER TABLE entrenamiento_registros ADD COLUMN IF NOT EXISTS fuente text NOT NULL DEFAULT 'manual'
  CHECK (fuente IN ('manual', 'strava'));
ALTER TABLE entrenamiento_registros ADD COLUMN IF NOT EXISTS strava_activity_id bigint;
ALTER TABLE entrenamiento_registros ADD COLUMN IF NOT EXISTS distancia_km numeric;
ALTER TABLE entrenamiento_registros ADD COLUMN IF NOT EXISTS duracion_min numeric;
ALTER TABLE entrenamiento_registros ADD COLUMN IF NOT EXISTS tipo_actividad text NOT NULL DEFAULT 'fuerza';

CREATE UNIQUE INDEX IF NOT EXISTS idx_entreno_strava_activity
  ON entrenamiento_registros (strava_activity_id) WHERE strava_activity_id IS NOT NULL;

-- ============================================================
-- INTEGRACION STRAVA
-- ============================================================
CREATE TABLE IF NOT EXISTS integraciones_strava (
  usuario_id uuid PRIMARY KEY REFERENCES perfiles(id) ON DELETE CASCADE,
  athlete_id bigint NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expira_en timestamptz NOT NULL,
  scope text,
  ultima_sincronizacion timestamptz,
  conectado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE integraciones_strava ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integraciones_strava_all_own" ON integraciones_strava
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
