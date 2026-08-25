-- Migration v3: adiciona flag de urgência nas tarefas
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;
