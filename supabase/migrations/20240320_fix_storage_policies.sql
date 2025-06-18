-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete attachments" ON storage.objects;

-- Create more permissive storage policies
CREATE POLICY "Allow authenticated users to upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

-- Also create a policy for public access to view files (since bucket is public)
CREATE POLICY "Allow public to view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments'); 