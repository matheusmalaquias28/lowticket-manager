-- Migration v12: radar de ofertas

CREATE TABLE IF NOT EXISTS public.radar_keywords (
  id         uuid primary key default gen_random_uuid(),
  word       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

ALTER TABLE public.radar_keywords ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'radar_keywords' AND policyname = 'auth manage radar_keywords'
  ) THEN
    EXECUTE 'CREATE POLICY "auth manage radar_keywords" ON public.radar_keywords FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.radar_ofertas (
  id               uuid primary key default gen_random_uuid(),
  keyword_used     text not null,
  advertiser       text,
  domain           text not null,
  active_ads_count integer,
  days_running     integer,
  niche            text,
  price            numeric,
  ad_link          text,
  page_link        text,
  angle            text,
  score            integer not null,
  justification    text,
  status           text not null default 'novo' check (status in ('novo', 'analisando', 'aprovado', 'descartado')),
  created_at       timestamptz not null default now(),
  CONSTRAINT radar_ofertas_domain_unique UNIQUE (domain)
);

ALTER TABLE public.radar_ofertas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'radar_ofertas' AND policyname = 'auth manage radar_ofertas'
  ) THEN
    EXECUTE 'CREATE POLICY "auth manage radar_ofertas" ON public.radar_ofertas FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS radar_ofertas_created_at_idx ON public.radar_ofertas (created_at DESC);
CREATE INDEX IF NOT EXISTS radar_ofertas_status_idx     ON public.radar_ofertas (status);
CREATE INDEX IF NOT EXISTS radar_ofertas_score_idx      ON public.radar_ofertas (score DESC);

-- Seed keywords padrão
INSERT INTO public.radar_keywords (word) VALUES
  ('apenas R$ 47'),
  ('apenas R$ 67'),
  ('apenas R$ 97'),
  ('de R$ 197 por R$ 67'),
  ('acesso vitalício'),
  ('curso completo passo a passo'),
  ('método comprovado'),
  ('garantia de 7 dias')
ON CONFLICT DO NOTHING;
