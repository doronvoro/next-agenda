import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaItem } from "../types";

interface SortableAgendaItemProps {
  item: AgendaItem;
  onViewClick?: (item: AgendaItem) => void;
}

const SortableAgendaItem: React.FC<SortableAgendaItemProps> = ({ item, onViewClick }) => {
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

  return (
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
      
      <span 
        className="flex-1 text-foreground cursor-pointer hover:text-primary transition-colors"
        onClick={onViewClick ? () => onViewClick(item) : undefined}
      >
        {item.title}
      </span>
      
      {onViewClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewClick(item)}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default SortableAgendaItem; 