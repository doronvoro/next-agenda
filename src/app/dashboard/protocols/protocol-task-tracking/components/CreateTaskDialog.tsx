"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/components/KanbanBoard";
import type { AgendaItem } from "../../[id]/types";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: {
    agenda_item_id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigned_to?: string | null;
    due_date?: string | null;
  }) => Promise<void>;
  agendaItems: AgendaItem[];
  defaultStatus?: TaskStatus;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  agendaItems,
  defaultStatus = 'pending'
}: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    agenda_item_id: '',
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigned_to: '',
    due_date: null as Date | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agenda_item_id || !formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        agenda_item_id: formData.agenda_item_id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
      });
      
      // Reset form
      setFormData({
        agenda_item_id: '',
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'medium',
        assigned_to: '',
        due_date: null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl" style={{ textAlign: 'right' }}>
        <DialogHeader className="text-right">
          <DialogTitle className="text-right">צור משימה חדשה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agenda_item">נושא סדר יום *</Label>
            <Select
              value={formData.agenda_item_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, agenda_item_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר נושא סדר יום" />
              </SelectTrigger>
              <SelectContent>
                {agendaItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                    {formData.due_date ? format(formData.due_date, "PPP", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={formData.due_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-reverse space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.agenda_item_id || !formData.title.trim()}>
              {isSubmitting ? "יוצר..." : "צור משימה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 