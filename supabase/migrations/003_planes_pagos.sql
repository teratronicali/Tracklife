-- TrackLife — plan de pago (Acceso Vitalicio) e historial de compras
-- Ejecutar en el SQL Editor de Supabase despues de 001_init.sql y 002_onboarding_strava.sql

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'gratis'
  CHECK (plan IN ('gratis', 'vitalicio'));
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS plan_actualizado_en timestamptz;

CREATE TABLE IF NOT EXISTS compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE,
  monto numeric NOT NULL,
  moneda text NOT NULL DEFAULT 'usd',
  estado text NOT NULL DEFAULT 'completada',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

-- Solo lectura de las propias compras. No hay policy de insert/update/delete para
-- usuarios normales: esos escriben unicamente via el webhook de Stripe, que usa
-- la service_role key y por lo tanto ignora RLS por completo.
CREATE POLICY "compras_select_own" ON compras
  FOR SELECT USING (usuario_id = auth.uid());
