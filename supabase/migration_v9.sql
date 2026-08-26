-- Migration v9: image_url em offer_creatives + bucket de storage

-- Coluna de imagem (nullable)
ALTER TABLE public.offer_creatives
  ADD COLUMN IF NOT EXISTS image_url text,
  ALTER COLUMN drive_url DROP NOT NULL;

-- Bucket para imagens de criativos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creatives',
  'creatives',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: usuários autenticados podem fazer upload e leitura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'creatives bucket auth'
  ) THEN
    EXECUTE 'CREATE POLICY "creatives bucket auth" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''creatives'') WITH CHECK (bucket_id = ''creatives'')';
  END IF;
END $$;
