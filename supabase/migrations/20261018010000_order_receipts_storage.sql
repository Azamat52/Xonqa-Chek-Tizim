-- Private storage for uploaded payment receipts. Only the server-side service role accesses files.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-receipts', 'order-receipts', false, 9437184, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 9437184,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf'];

-- No anon/authenticated policies are added: receipt uploads and signed URLs are issued by the Edge Function
-- using SUPABASE_SERVICE_ROLE_KEY, so private receipts are not publicly browsable.
