-- Migration v11: activity_logs

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  title       text not null,
  actor_name  text,
  entity_type text,
  entity_id   text,
  created_at  timestamptz not null default now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_logs' AND policyname = 'auth manage activity_logs'
  ) THEN
    EXECUTE 'CREATE POLICY "auth manage activity_logs" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs (created_at DESC);
