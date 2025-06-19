import React from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import SortableAgendaItem from "./SortableAgendaItem";
import type { AgendaItem, NewAgendaItem } from "../types";

interface AgendaListProps {
  agendaItems: AgendaItem[];
  newAgendaItem: NewAgendaItem;
  setNewAgendaItem: (item: NewAgendaItem) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleCreateAgendaItem: (title: string) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleOpenAgendaItemDialog: (item: AgendaItem) => void;
}

const AgendaList: React.FC<AgendaListProps> = ({
  agendaItems,
  newAgendaItem,
  setNewAgendaItem,
  handleKeyDown,
  handleBlur,
  handleCreateAgendaItem,
  handleDragEnd,
  handleOpenAgendaItemDialog,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={agendaItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {agendaItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No agenda items found
            </div>
          ) : (
            agendaItems.map((item) => (
              <SortableAgendaItem
                key={item.id}
                item={item}
                onViewClick={handleOpenAgendaItemDialog}
              />
            ))
          )}
          {newAgendaItem.isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={newAgendaItem.title}
                onChange={(e) => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="Enter new agenda item title"
                autoFocus
                className="flex-1"
              />
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setNewAgendaItem({ title: "", isEditing: true })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Agenda Item
            </Button>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default AgendaList; 