-- Migration v8: links nos kanban_cards + criativos de oferta

-- Adiciona coluna links em kanban_cards (se ainda não existir)
ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS links jsonb not null default '[]';
