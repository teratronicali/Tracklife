-- TrackLife — bono de XP real por racha de 7 dias
-- Ejecutar en el SQL Editor de Supabase despues de 001, 002 y 003.
--
-- El bono de "racha_7" (500 XP) ya estaba definido en el codigo del cliente
-- (lib/gamification.ts) pero nunca se otorgaba: recalcular_racha() solo
-- actualizaba el contador, no sumaba XP. Esta version SI otorga 500 XP
-- automaticamente cada vez que la racha cruza un nuevo multiplo de 7 dias
-- (7, 14, 21...), una sola vez por umbral (no se reotorga si la funcion
-- se llama de nuevo sin que la racha haya avanzado).

CREATE OR REPLACE FUNCTION recalcular_racha()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_racha integer := 0;
  v_racha_anterior integer;
  v_fecha date := current_date;
  v_existe boolean;
  v_hoy boolean;
BEGIN
  SELECT racha_actual INTO v_racha_anterior FROM perfiles WHERE id = auth.uid();

  SELECT EXISTS(SELECT 1 FROM habito_registros WHERE usuario_id = auth.uid() AND fecha = current_date) INTO v_hoy;
  IF NOT v_hoy THEN
    v_fecha := current_date - 1;
  END IF;

  LOOP
    SELECT EXISTS(SELECT 1 FROM habito_registros WHERE usuario_id = auth.uid() AND fecha = v_fecha) INTO v_existe;
    EXIT WHEN NOT v_existe;
    v_racha := v_racha + 1;
    v_fecha := v_fecha - 1;
  END LOOP;

  UPDATE perfiles
  SET racha_actual = v_racha,
      mejor_racha = GREATEST(mejor_racha, v_racha)
  WHERE id = auth.uid();

  IF v_racha > COALESCE(v_racha_anterior, 0) AND v_racha % 7 = 0 THEN
    PERFORM add_xp(500, 'racha_bonus', v_racha || ' dias seguidos');
  END IF;
END;
$$;
