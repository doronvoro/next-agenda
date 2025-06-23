const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertDefaultTasks() {
  try {
    console.log('Starting to insert default tasks for existing agenda items...');

    // First, get all agenda items
    const { data: allAgendaItems, error: fetchAllError } = await supabase
      .from('agenda_items')
      .select('id, title');

    if (fetchAllError) {
      throw fetchAllError;
    }

    // Get all agenda items that already have tasks
    const { data: agendaItemsWithTasks, error: fetchTasksError } = await supabase
      .from('agenda_item_tasks')
      .select('agenda_item_id');

    if (fetchTasksError) {
      throw fetchTasksError;
    }

    // Create a set of agenda item IDs that already have tasks
    const agendaItemIdsWithTasks = new Set(
      agendaItemsWithTasks?.map(task => task.agenda_item_id) || []
    );

    // Filter agenda items that don't have tasks
    const agendaItemsWithoutTasks = allAgendaItems?.filter(
      agendaItem => !agendaItemIdsWithTasks.has(agendaItem.id)
    ) || [];

    if (agendaItemsWithoutTasks.length === 0) {
      console.log('No agenda items found without tasks. All agenda items already have tasks.');
      return;
    }

    console.log(`Found ${agendaItemsWithoutTasks.length} agenda items without tasks.`);

    // Create default tasks for each agenda item
    const tasksToInsert = agendaItemsWithoutTasks.map(agendaItem => ({
      agenda_item_id: agendaItem.id,
      title: `Follow up on: ${agendaItem.title}`,
      description: `Default task for agenda item: ${agendaItem.title}`,
      status: 'pending',
      priority: 'medium',
      assigned_to: null,
      due_date: null,
      updated_at: new Date().toISOString(),
    }));

    // Insert the tasks
    const { data: insertedTasks, error: insertError } = await supabase
      .from('agenda_item_tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Successfully created ${insertedTasks.length} default tasks!`);
    console.log('Tasks created:');
    insertedTasks.forEach(task => {
      console.log(`  - ${task.title} (for agenda item: ${task.agenda_item_id})`);
    });

  } catch (error) {
    console.error('❌ Error inserting default tasks:', error);
    process.exit(1);
  }
}

// Run the script
insertDefaultTasks()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 