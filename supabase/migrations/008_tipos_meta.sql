-- 008: una meta puede ser de cualquier area de la vida, no solo
-- financiera o "personal" generica.
ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_tipo_check;
ALTER TABLE metas ADD CONSTRAINT metas_tipo_check
  CHECK (tipo IN ('financiera', 'deportiva', 'familiar', 'salud', 'profesional', 'personal'));
