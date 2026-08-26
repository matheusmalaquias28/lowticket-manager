-- Migration v10: tag em offer_creatives

ALTER TABLE public.offer_creatives
  ADD COLUMN IF NOT EXISTS tag text
    CHECK (tag IN ('untested', 'active', 'validated', 'roi_supreme'));
