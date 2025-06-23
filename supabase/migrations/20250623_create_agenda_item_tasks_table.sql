-- Create the agenda_item_tasks table
CREATE TABLE IF NOT EXISTS public.agenda_item_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agenda_item_id UUID NOT NULL REFERENCES public.agenda_items(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.agenda_item_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select
CREATE POLICY "Allow authenticated users to select agenda_item_tasks"
ON public.agenda_item_tasks
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert agenda_item_tasks"
ON public.agenda_item_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated users to update agenda_item_tasks"
ON public.agenda_item_tasks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated users to delete agenda_item_tasks"
ON public.agenda_item_tasks
FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
-- Only create indexes that will be frequently used to avoid write performance overhead
CREATE INDEX IF NOT EXISTS idx_agenda_item_tasks_agenda_item_id ON public.agenda_item_tasks(agenda_item_id); 