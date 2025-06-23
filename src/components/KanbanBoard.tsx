"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay as DragOverlayType,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import {
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Calendar, User } from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string | null;
  due_date?: string | null;
  agenda_item_id: string;
  created_at: string;
  updated_at: string;
}

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskCreate?: (defaultStatus: TaskStatus) => void;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
  }
};

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "MMM dd") : "Invalid date";
};

const TaskCard = ({ task }: { task: Task }) => {
  return (
    <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </div>
              )}
              {task.assigned_to && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assigned_to}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SortableTaskCard = ({ task }: { task: Task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
};

const KanbanColumn = ({ 
  column, 
  onTaskCreate 
}: { 
  column: KanbanColumn;
  onTaskCreate?: (defaultStatus: TaskStatus) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full min-w-[300px] transition-colors",
        isOver && "bg-muted/50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {column.tasks.length}
            </Badge>
          </div>
          {onTaskCreate && (
            <Button variant="ghost" size="sm" onClick={() => onTaskCreate(column.id)} className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {column.tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </CardContent>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskUpdate,
  onTaskCreate,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Organize tasks into columns
  const columns: KanbanColumn[] = [
    {
      id: 'pending',
      title: 'To Do',
      color: 'bg-gray-100',
      tasks: tasks.filter(task => task.status === 'pending'),
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: 'bg-blue-100',
      tasks: tasks.filter(task => task.status === 'in_progress'),
    },
    {
      id: 'completed',
      title: 'Done',
      color: 'bg-green-100',
      tasks: tasks.filter(task => task.status === 'completed'),
    },
    {
      id: 'overdue',
      title: 'Overdue',
      color: 'bg-red-100',
      tasks: tasks.filter(task => task.status === 'overdue'),
    },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) {
      setActiveTask(null);
      return;
    }

    // Update the task status
    try {
      await onTaskUpdate(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }

    setActiveTask(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Handle drag over events for visual feedback
  };

  return (
    <div className="h-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 min-h-[600px]">
          {columns.map((column) => (
            <Card key={column.id} className="flex flex-col h-full min-w-[300px]">
              <SortableContext
                items={column.tasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn 
                  column={column} 
                  onTaskCreate={onTaskCreate}
                />
              </SortableContext>
            </Card>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}; 