/*
# Create problem-pdfs storage bucket

1. Storage
- Create a public bucket named `problem-pdfs` to store PDF problem statements.
- Public bucket so anyone (including anonymous viewers) can read PDFs via the public URL.
2. Security
- Insert/Update/Delete: restricted to authenticated users (admins upload PDFs).
- Select: public (anon + authenticated) since the bucket is public and PDFs are meant to be viewable by all visitors.
- Policies are scoped on storage.objects.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('problem-pdfs', 'problem-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- SELECT: anyone can read PDFs (public bucket)
DROP POLICY IF EXISTS "Public can read problem PDFs" ON storage.objects;
CREATE POLICY "Public can read problem PDFs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'problem-pdfs');

-- INSERT: authenticated users can upload
DROP POLICY IF EXISTS "Auth can upload problem PDFs" ON storage.objects;
CREATE POLICY "Auth can upload problem PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'problem-pdfs');

-- UPDATE: authenticated users can replace
DROP POLICY IF EXISTS "Auth can update problem PDFs" ON storage.objects;
CREATE POLICY "Auth can update problem PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'problem-pdfs')
WITH CHECK (bucket_id = 'problem-pdfs');

-- DELETE: authenticated users can remove
DROP POLICY IF EXISTS "Auth can delete problem PDFs" ON storage.objects;
CREATE POLICY "Auth can delete problem PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'problem-pdfs');
