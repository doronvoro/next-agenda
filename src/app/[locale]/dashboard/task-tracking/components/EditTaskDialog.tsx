"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { updateTask, type TaskWithDetails } from "../../protocols/[id]/supabaseApi";
import { useToast } from "@/components/ui/use-toast";
import type { TaskStatus } from "@/components/KanbanBoard";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithDetails | null;
  onTaskUpdated: () => void;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdated
}: EditTaskDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as TaskStatus,
    priority: "medium" as 'low' | 'medium' | 'high',
    assigned_to: "",
    due_date: undefined as Date | undefined,
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to || "",
        due_date: task.due_date ? new Date(task.due_date) : undefined,
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setLoading(true);
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
      };

      const success = await updateTask(task.id, updateData);
      
      if (success) {
        toast({
          title: "Task Updated",
          description: "Task has been updated successfully.",
        });
        onTaskUpdated();
        onOpenChange(false);
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Done</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Input
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="Enter assignee name"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(formData.due_date, "PPP")
                  ) : (
                    "Select due date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Task Info Display */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">Task Information</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Agenda Item:</strong> {task.agenda_item.title}</p>
              <p><strong>Protocol:</strong> #{task.protocol?.number} - {task.protocol?.committee?.name}</p>
              <p><strong>Created:</strong> {format(new Date(task.created_at), "PPP")}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 