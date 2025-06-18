-- Create the committees_members table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.committees_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(committee_id, name)
);

-- Add RLS policies
ALTER TABLE public.committees_members ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select
CREATE POLICY "Allow authenticated users to select committees_members"
ON public.committees_members
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert committees_members"
ON public.committees_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated users to update committees_members"
ON public.committees_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated users to delete committees_members"
ON public.committees_members
FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_committees_members_committee_id ON public.committees_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_committees_members_name ON public.committees_members(name); 