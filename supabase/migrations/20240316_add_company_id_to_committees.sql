-- Add company_id to committees table
ALTER TABLE public.committees
ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update RLS policies to include company_id
ALTER POLICY "Allow authenticated users to insert committees"
ON public.committees
USING (true)
WITH CHECK (true);

ALTER POLICY "Allow authenticated users to update committees"
ON public.committees
USING (true)
WITH CHECK (true); 