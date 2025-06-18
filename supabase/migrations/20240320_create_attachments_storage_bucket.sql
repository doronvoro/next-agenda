-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Policy for authenticated users to view files
CREATE POLICY "Allow authenticated users to view attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

-- Policy for authenticated users to update files
CREATE POLICY "Allow authenticated users to update attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Policy for authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments'); 