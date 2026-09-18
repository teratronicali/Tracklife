-- 012: ritmo objetivo por sesion + resultado del test inicial de running.
--
-- Para que un plan de running le diga al usuario a que ritmo (min/km) correr
-- cada sesion (no solo distancia/duracion), se guarda el resultado de un
-- pequeno test de ritmo (distancia + tiempo de una carrera reciente o time
-- trial) en el plan, y el ritmo objetivo calculado para esa sesion en cada
-- rutina_ejercicios de tipo cardio.

ALTER TABLE rutina_ejercicios ADD COLUMN IF NOT EXISTS ritmo_objetivo text;

ALTER TABLE planes_entrenamiento ADD COLUMN IF NOT EXISTS test_distancia_km numeric;
ALTER TABLE planes_entrenamiento ADD COLUMN IF NOT EXISTS test_tiempo_seg integer;
