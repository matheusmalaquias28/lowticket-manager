-- Migration v7: Criativos por oferta

CREATE TABLE IF NOT EXISTS public.offer_creatives (
  id         uuid primary key default gen_random_uuid(),
  offer_id   uuid not null references public.offers(id) on delete cascade,
  name       text not null,
  drive_url  text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.offer_creatives ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'offer_creatives' AND policyname = 'auth manage offer_creatives'
  ) THEN
    EXECUTE 'CREATE POLICY "auth manage offer_creatives" ON public.offer_creatives FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS offer_creatives_offer_id_idx ON public.offer_creatives (offer_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_offer_creatives_updated_at ON public.offer_creatives;
CREATE TRIGGER update_offer_creatives_updated_at
  BEFORE UPDATE ON public.offer_creatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
