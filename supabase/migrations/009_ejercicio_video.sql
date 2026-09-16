-- 009: link de tecnica (video) opcional por ejercicio, para ver como se
-- hace el movimiento mientras se registra una serie.
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS video_url text;
