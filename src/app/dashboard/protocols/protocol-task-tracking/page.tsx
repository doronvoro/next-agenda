"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KanbanBoard, Task } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface Protocol {
  id: string;
  number: number;
  due_date: string;
}

export default function ProtocolTaskTrackingPage() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get('protocolId');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (protocolId) {
      fetchProtocol();
      fetchTasks();
    }
  }, [protocolId]);

  const fetchProtocol = async () => {
    if (!protocolId) return;
    
    try {
      const supabase = createClient();
      const { data: protocolData, error: protocolError } = await supabase
        .from('protocols')
        .select('id, number, due_date')
        .eq('id', protocolId)
        .single();

      if (protocolError) {
        console.error("Error fetching protocol:", protocolError);
        return;
      }

      setProtocol(protocolData);
    } catch (err) {
      console.error("Error fetching protocol:", err);
    }
  };

  const fetchTasks = async () => {
    if (!protocolId) return;
    
    try {
      setLoading(true);
      const supabase = createClient();
      
      // First, let's get all agenda items for this protocol
      const { data: agendaItems, error: agendaError } = await supabase
        .from('agenda_items')
        .select('id, title')
        .eq('protocol_id', protocolId);
      
      if (agendaError) {
        console.error("Error fetching agenda items:", agendaError);
        setError(agendaError.message);
        return;
      }
      
      if (!agendaItems || agendaItems.length === 0) {
        setTasks([]);
        return;
      }
      
      // Get agenda item IDs
      const agendaItemIds = agendaItems.map(item => item.id);
      
      // Fetch tasks for these agenda items
      const { data: tasksData, error: tasksError } = await supabase
        .from('agenda_item_tasks')
        .select('*')
        .in('agenda_item_id', agendaItemIds)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        setError(tasksError.message);
        return;
      }

      // Transform the data to match our Task interface
      const transformedTasks: Task[] = (tasksData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        due_date: task.due_date,
        agenda_item_id: task.agenda_item_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));

      setTasks(transformedTasks);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const supabase = createClient();
      
      const updateData: any = { ...updates };
      if (updates.status || updates.priority || updates.title || updates.description) {
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('agenda_item_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));

      toast({
        title: "Task Updated",
        description: "Task has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task. Please try again.",
      });
      throw error;
    }
  };

  const handleCreateTask = () => {
    // TODO: Implement task creation modal/form
    toast({
      title: "Coming Soon",
      description: "Task creation will be available soon.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/protocols">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Protocols
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {protocol ? `Protocol #${protocol.number} Board` : 'Task Board'}
            </h1>
          </div>
        </div>
        <Button onClick={handleCreateTask} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="h-[calc(100vh-200px)]">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No tasks found</p>
              <p>Get started by creating your first task.</p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleCreateTask}
          />
        )}
      </div>
    </div>
  );
} 