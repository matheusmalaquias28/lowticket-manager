-- Migration v4: metas semanais
CREATE TABLE IF NOT EXISTS public.week_goals (
  id          uuid primary key default gen_random_uuid(),
  week_key    text not null,
  text        text not null,
  done        boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

ALTER TABLE public.week_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can manage week_goals"
  ON public.week_goals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS week_goals_week_key_idx ON public.week_goals (week_key);
