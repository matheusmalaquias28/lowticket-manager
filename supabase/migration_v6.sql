-- Migration v6: Acervo (biblioteca de informações)

CREATE TABLE IF NOT EXISTS public.acervo_cards (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text not null default '',
  links      jsonb not null default '[]',
  color      text not null default '#7C3AED',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.acervo_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'acervo_cards' AND policyname = 'auth manage acervo_cards'
  ) THEN
    EXECUTE 'CREATE POLICY "auth manage acervo_cards" ON public.acervo_cards FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS acervo_cards_position_idx ON public.acervo_cards (position);
