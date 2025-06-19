import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
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
      className="flex items-center gap-2"
    >
      <button
        className="cursor-grab touch-none p-1 hover:bg-accent rounded-md"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-muted-foreground">
        {item.display_order ? `${item.display_order}.` : '•'}
      </span>
      <span 
        className={onViewClick ? "cursor-pointer hover:text-primary hover:underline" : ""}
        onClick={onViewClick ? () => onViewClick(item) : undefined}
      >
        {item.title}
      </span>
    </div>
  );
};

export default SortableAgendaItem; 