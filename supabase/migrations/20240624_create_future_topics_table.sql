-- Create the future_topics table
CREATE TABLE IF NOT EXISTS public.future_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    related_agenda_item_id UUID REFERENCES public.agenda_items(id) ON DELETE SET NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.future_topics ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select
CREATE POLICY "Allow authenticated users to select future_topics"
ON public.future_topics
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert future_topics"
ON public.future_topics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update future_topics
CREATE POLICY "Allow authenticated users to update future_topics"
ON public.future_topics
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete future_topics
CREATE POLICY "Allow authenticated users to delete future_topics"
ON public.future_topics
FOR DELETE
TO authenticated
USING (true); 