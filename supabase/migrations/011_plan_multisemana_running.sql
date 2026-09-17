-- 011: soporte para planes de VARIAS semanas con contenido distinto cada
-- semana (periodizacion: base -> build -> peak -> taper), necesario para un
-- plan de running de verdad (cuenta regresiva a una carrera, progresion del
-- fondo largo, etc) en vez de una sola plantilla semanal que se repite igual
-- para siempre.

ALTER TABLE plan_dias ADD COLUMN IF NOT EXISTS semana integer NOT NULL DEFAULT 1;

ALTER TABLE plan_dias DROP CONSTRAINT IF EXISTS plan_dias_plan_id_dia_semana_key;
ALTER TABLE plan_dias ADD CONSTRAINT plan_dias_plan_id_semana_dia_semana_key UNIQUE (plan_id, semana, dia_semana);

-- duracion_semanas NULL = plan continuo (se repite la semana 1 para siempre,
-- como antes). Con numero = plan periodizado de N semanas (running con
-- objetivo). fecha_inicio ancla que fecha real es la "semana 1". fecha_objetivo
-- es la fecha de la carrera si el plan se armo contando hacia atras desde ahi.
ALTER TABLE planes_entrenamiento ADD COLUMN IF NOT EXISTS duracion_semanas integer;
ALTER TABLE planes_entrenamiento ADD COLUMN IF NOT EXISTS fecha_inicio date NOT NULL DEFAULT current_date;
ALTER TABLE planes_entrenamiento ADD COLUMN IF NOT EXISTS fecha_objetivo date;

CREATE INDEX IF NOT EXISTS idx_plan_dias_plan_semana ON plan_dias (plan_id, semana);
