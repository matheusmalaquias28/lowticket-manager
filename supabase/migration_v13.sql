-- Migration v13: kanban_cards — card_type, assignee, creatives

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS card_type text NOT NULL DEFAULT 'open'
    CHECK (card_type IN ('open', 'creative')),
  ADD COLUMN IF NOT EXISTS assignee text
    CHECK (assignee IN ('Matheus', 'Kauan')),
  ADD COLUMN IF NOT EXISTS creatives jsonb NOT NULL DEFAULT '[]';
