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
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { updateTask, type TaskWithDetails } from "../../protocols/[id]/supabaseApi";
import { useToast } from "@/components/ui/use-toast";
import type { TaskStatus } from "@/components/KanbanBoard";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithDetails | null;
  onTaskUpdated: (taskId: string, updates: any) => void;
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
          title: "משימה עודכנה",
          description: "משימה עודכנה בהצלחה.",
        });
        onTaskUpdated(task.id, updateData);
        onOpenChange(false);
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "לא ניתן לעדכן את המשימה. אנא נסה שוב.",
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
      <DialogContent className="sm:max-w-[500px]" dir="rtl" style={{ textAlign: 'right' }}>
        <DialogHeader className="text-right">
          <DialogTitle className="text-right">ערוך משימה</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="הזן כותרת משימה"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="הזן תיאור משימה"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="in_progress">בביצוע</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                  <SelectItem value="overdue">באיחור</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">עדיפות</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">מוקצה ל</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                placeholder="הזן שם אחראי"
              />
            </div>

            <div className="space-y-2">
              <Label>תאריך יעד</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-end text-right font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.due_date ? (
                      format(formData.due_date, "PPP", { locale: he })
                    ) : (
                      "בחר תאריך יעד"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Task Info Display */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">מידע על המשימה</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>נושא סדר יום:</strong> {task.agenda_item.title}</p>
              <p><strong>פרוטוקול:</strong> #{task.protocol?.number} - {task.protocol?.committee?.name}</p>
              <p><strong>נוצר:</strong> {format(new Date(task.created_at), "PPP", { locale: he })}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-reverse space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מעדכן...
                </>
              ) : (
                "עדכן משימה"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 