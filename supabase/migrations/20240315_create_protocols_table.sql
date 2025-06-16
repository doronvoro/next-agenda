-- Create the protocols table
CREATE TABLE IF NOT EXISTS public.protocols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to create the protocols table
CREATE OR REPLACE FUNCTION create_protocols_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create the table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.protocols (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        number INTEGER NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add RLS policies
    ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

    -- Create policy for authenticated users to select
    CREATE POLICY "Allow authenticated users to select protocols"
    ON public.protocols
    FOR SELECT
    TO authenticated
    USING (true);

    -- Create policy for authenticated users to insert
    CREATE POLICY "Allow authenticated users to insert protocols"
    ON public.protocols
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    -- Create policy for authenticated users to update
    CREATE POLICY "Allow authenticated users to update protocols"
    ON public.protocols
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- Create policy for authenticated users to delete
    CREATE POLICY "Allow authenticated users to delete protocols"
    ON public.protocols
    FOR DELETE
    TO authenticated
    USING (true);
END;
$$; 