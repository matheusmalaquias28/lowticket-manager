-- =====================
-- MIGRATION V2 — custom status badges + app settings
-- Execute no Supabase SQL Editor
-- =====================

-- 1. Remove CHECK constraint em tasks.status para permitir status customizados
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 2. Tabela de configurações da workspace (key-value)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'app_settings viewable by authenticated'
  ) THEN
    CREATE POLICY "app_settings viewable by authenticated"
      ON public.app_settings FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- 3. Status padrão (inserir apenas se não existir)
INSERT INTO public.app_settings (key, value) VALUES (
  'task_statuses',
  '[
    {"id": "pending",     "label": "Pendente",     "color": "#6B7280"},
    {"id": "in_progress", "label": "Em andamento", "color": "#F59E0B"},
    {"id": "done",        "label": "Feita",         "color": "#10B981"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;
