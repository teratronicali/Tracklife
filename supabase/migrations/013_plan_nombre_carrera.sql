-- 013: nombre de la carrera objetivo (ej. "Media Maraton de Medellin"),
-- para mostrarlo en el banner del plan en vez de solo la fecha.
ALTER TABLE planes_entrenamiento ADD COLUMN IF NOT EXISTS nombre_carrera text;
