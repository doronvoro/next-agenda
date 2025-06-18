-- Create the protocol_attachments table
CREATE TABLE IF NOT EXISTS public.protocol_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    storage_object_id UUID REFERENCES storage.objects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.protocol_attachments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select
CREATE POLICY "Allow authenticated users to select protocol_attachments"
ON public.protocol_attachments
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert protocol_attachments"
ON public.protocol_attachments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated users to update protocol_attachments"
ON public.protocol_attachments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated users to delete protocol_attachments"
ON public.protocol_attachments
FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_protocol_attachments_protocol_id ON public.protocol_attachments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_attachments_uploaded_by ON public.protocol_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_protocol_attachments_created_at ON public.protocol_attachments(created_at); 