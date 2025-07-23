"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KanbanBoard, Task, TaskStatus } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { CreateTaskDialog } from "./components/CreateTaskDialog";
import {
  fetchProtocol,
  fetchAgendaItemsByProtocol,
  fetchTasksByAgendaItemIds,
  updateTask,
  createTask,
  fetchAllTasks,
  type TaskWithDetails,
} from "../[id]/supabaseApi";
import type { AgendaItem } from "../[id]/types";

interface Protocol {
  id: string;
  number: string;
  due_date: string;
}

function ProtocolTaskTrackingContent() {
  const searchParams = useSearchParams();
  const protocolId = searchParams.get('protocolId');
  const returnTo = searchParams.get('returnTo') || 'protocols'; // Default to protocols
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('pending');
  const { toast } = useToast();

  // Determine return path based on returnTo parameter
  const getReturnPath = () => {
    if (returnTo === 'protocol' && protocolId) {
      return `/dashboard/protocols/${protocolId}`;
    }
    return '/dashboard/protocols';
  };

  const getReturnText = () => {
    if (returnTo === 'protocol') {
      return 'חזרה';
    }
    return 'חזרה';
  };

  useEffect(() => {
    if (protocolId) {
      loadProtocolAndTasks();
    }
  }, [protocolId]);

  const loadProtocolAndTasks = async () => {
    setLoading(true);
    try {
      const [protocolData, agendaItemsData] = await Promise.all([
        fetchProtocol(protocolId!),
        fetchAgendaItemsByProtocol(protocolId!),
      ]);
      setProtocol(protocolData);
      setAgendaItems(agendaItemsData);
      
      if (!agendaItemsData || agendaItemsData.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // Fetch all tasks and filter by protocol
      const allTasks = await fetchAllTasks();
      const protocolTasks = allTasks.filter(task => 
        task.agenda_item.protocol_id === protocolId
      );
      setTasks(protocolTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const success = await updateTask(taskId, updates);
      if (!success) throw new Error("נכשל עדכון המשימה");
      
      // Update the task locally in state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
      ));
      
      toast({
        title: "משימה עודכנה",
        description: "המשימה עודכנה בהצלחה.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "נכשל עדכון המשימה. אנא נסה שוב.",
      });
      throw error;
    }
  };

  const handleCreateTask = (status: TaskStatus) => {
    setDefaultStatus(status);
    setIsCreateDialogOpen(true);
  };

  const handleSubmitCreateTask = async (taskData: {
    agenda_item_id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigned_to?: string | null;
    due_date?: string | null;
  }) => {
    try {
      const newTask = await createTask(taskData);
      if (!newTask) throw new Error("נכשל יצירת המשימה");
      
      // Fetch the updated task list to get the proper TaskWithDetails structure
      const allTasks = await fetchAllTasks();
      const protocolTasks = allTasks.filter(task => 
        task.agenda_item.protocol_id === protocolId
      );
      setTasks(protocolTasks);
      
      toast({
        title: "משימה נוצרה",
        description: "המשימה נוצרה בהצלחה.",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "נכשל יצירת המשימה. אנא נסה שוב.",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">טוען משימות...</div>
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
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={getReturnPath()}>
            <Button variant="ghost" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              {getReturnText()}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {protocol ? (
              <>
                לוח משימות פרוטוקול{' '}
                <Link href={`/dashboard/protocols/${protocol.id}`} className="text-blue-600 underline hover:text-blue-800">
                  #{protocol.number}
                </Link>
              </>
            ) : 'לוח משימות'}
          </h1>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="h-[calc(100vh-200px)]">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">לא נמצאו משימות</p>
              <p>התחל ביצירת המשימה הראשונה שלך.</p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleCreateTask}
            onTaskEdited={(taskId, updates) => {
              // Update the task locally in state
              setTasks(prev => prev.map(task => 
                task.id === taskId ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
              ));
            }}
          />
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleSubmitCreateTask}
        agendaItems={agendaItems}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}

export default function ProtocolTaskTrackingPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ProtocolTaskTrackingContent />
    </Suspense>
  );
} 