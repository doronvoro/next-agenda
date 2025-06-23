-- Insert default tasks for all existing agenda items that don't have tasks yet
-- This script will create a default task for each agenda item that doesn't already have one

INSERT INTO public.agenda_item_tasks (
    agenda_item_id,
    title,
    description,
    status,
    priority,
    assigned_to,
    due_date,
    created_at,
    updated_at
)
SELECT 
    ai.id as agenda_item_id,
    'Follow up on: ' || ai.title as title,
    'Default task for agenda item: ' || ai.title as description,
    'pending' as status,
    'medium' as priority,
    NULL as assigned_to,
    NULL as due_date,
    NOW() as created_at,
    NOW() as updated_at
FROM public.agenda_items ai
LEFT JOIN public.agenda_item_tasks ait ON ai.id = ait.agenda_item_id
WHERE ait.id IS NULL; -- Only insert for agenda items that don't have tasks yet

-- Log the number of tasks created
DO $$
DECLARE
    tasks_created INTEGER;
BEGIN
    GET DIAGNOSTICS tasks_created = ROW_COUNT;
    RAISE NOTICE 'Created % default tasks for existing agenda items', tasks_created;
END $$; 