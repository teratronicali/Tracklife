-- 007: seguimiento real (por fecha) del cumplimiento del plan de entrenamiento,
-- con reajuste automatico cuando un dia se incumple.
--
-- plan_dias es la PLANTILLA semanal (que rutina toca cada dia de la semana,
-- se repite siempre). plan_dia_estados es el REGISTRO real de que paso cada
-- fecha concreta: si se cumplio, se incumplio, o si fue una compensacion de
-- un dia incumplido anterior (movida a un dia de descanso disponible esa
-- misma semana).
CREATE TABLE IF NOT EXISTS plan_dia_estados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES planes_entrenamiento(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  rutina_id uuid REFERENCES rutinas(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'cumplido', 'incumplido', 'compensado')),
  origen_fecha date,
  sesion_id uuid REFERENCES sesiones_entrenamiento(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, fecha)
);

ALTER TABLE plan_dia_estados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_dia_estados_all_own" ON plan_dia_estados
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_plan_dia_estados_plan_fecha ON plan_dia_estados (plan_id, fecha);
