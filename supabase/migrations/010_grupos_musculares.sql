-- 010: mas grupos musculares disponibles (antes solo 8 categorias muy
-- amplias), para poder catalogar cualquier tipo de ejercicio con precision.
ALTER TABLE ejercicios DROP CONSTRAINT IF EXISTS ejercicios_grupo_muscular_check;
ALTER TABLE ejercicios ADD CONSTRAINT ejercicios_grupo_muscular_check
  CHECK (grupo_muscular IN (
    'pecho', 'espalda', 'hombros', 'triceps', 'biceps', 'antebrazos',
    'piernas', 'gluteos', 'gemelos', 'core', 'cardio', 'general'
  ));
