import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, Edit3, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgendaItem } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SortableAgendaItemProps {
  item: AgendaItem;
  onViewClick?: (item: AgendaItem) => void;
  onEditTitle?: (itemId: string, newTitle: string) => Promise<void>;
  onDelete?: (itemId: string) => void;
}

const SortableAgendaItem: React.FC<SortableAgendaItemProps> = ({ 
  item, 
  onViewClick, 
  onEditTitle,
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleStartEdit = () => {
    setEditTitle(item.title);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!onEditTitle || !editTitle.trim() || editTitle === item.title) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onEditTitle(item.id, editTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating title:', error);
      setEditTitle(item.title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors"
      >
        <button
          className="cursor-grab touch-none p-1 hover:bg-muted rounded-md transition-colors opacity-0 group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-center justify-center w-6 h-6 bg-muted text-muted-foreground rounded-full text-xs font-medium flex-shrink-0">
          {item.display_order || '•'}
        </div>
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              autoFocus
              className="flex-1 h-8 text-sm border-0 border-b-2 border-primary focus:border-primary focus:ring-0 px-0 py-1 rounded-none bg-transparent"
              disabled={isSaving}
            />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || !editTitle.trim()}
                className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <span 
            className="flex-1 text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={onViewClick ? () => onViewClick(item) : undefined}
          >
            {item.title}
          </span>
        )}
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && onViewClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewClick(item)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {!isEditing && onEditTitle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          {!isEditing && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="h-8 w-8 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right rtl">מחק סעיף מסדר היום</AlertDialogTitle>
            <AlertDialogDescription>
              {`האם אתה בטוח שברצונך למחוק את "${item.title}"? פעולה זו אינה ניתנת לביטול.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SortableAgendaItem; 