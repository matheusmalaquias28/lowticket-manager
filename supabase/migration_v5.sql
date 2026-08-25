-- Migration v5: kanban livre (colunas e cards personalizados)

CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default '#7C3AED',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references public.kanban_columns(id) on delete cascade,
  title       text not null,
  description text,
  label_ids   jsonb not null default '[]',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth manage kanban_columns" ON public.kanban_columns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth manage kanban_cards"   ON public.kanban_cards   FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS kanban_cards_column_idx ON public.kanban_cards (column_id);

-- Garante que app_settings existe (criada na migration_v2, mas adicionamos aqui por segurança)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'auth manage app_settings'
  ) THEN
    EXECUTE 'CREATE POLICY "auth manage app_settings" ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Etiquetas: armazenadas em app_settings com key='kanban_labels'
INSERT INTO public.app_settings (key, value)
VALUES ('kanban_labels', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;
