-- Create the committees table
CREATE TABLE IF NOT EXISTS public.committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select
CREATE POLICY "Allow authenticated users to select committees"
ON public.committees
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert committees"
ON public.committees
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated users to update committees"
ON public.committees
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated users to delete committees"
ON public.committees
FOR DELETE
TO authenticated
USING (true);

-- Add committee_id to protocols table
ALTER TABLE public.protocols
ADD COLUMN committee_id UUID REFERENCES public.committees(id); 