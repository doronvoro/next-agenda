-- Add default_address column to organizations table
ALTER TABLE public.organizations
ADD COLUMN default_address TEXT NULL;

-- Update RLS policies to include default_address
ALTER POLICY "Allow authenticated users to insert organizations"
ON public.organizations
USING (true)
WITH CHECK (true);

ALTER POLICY "Allow authenticated users to update organizations"
ON public.organizations
USING (true)
WITH CHECK (true); 