-- Migration v14: checklist nos kanban_cards (quadro livre)

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]';
