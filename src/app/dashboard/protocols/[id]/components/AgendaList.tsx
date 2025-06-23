import React from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SortableAgendaItem from "./SortableAgendaItem";
import type { AgendaItem, NewAgendaItem } from "../types";
import type { Database } from "@/types/supabase";

interface AgendaListProps {
  agendaItems: AgendaItem[];
  newAgendaItem: NewAgendaItem;
  setNewAgendaItem: (item: NewAgendaItem) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleCreateAgendaItem: (title: string) => void;
  handleCreateFromFutureTopic: (topicId: string) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleOpenAgendaItemDialog: (item: AgendaItem) => void;
  futureTopics: Database["public"]["Tables"]["future_topics"]["Row"][];
  loadingFutureTopics: boolean;
}

const AgendaList: React.FC<AgendaListProps> = ({
  agendaItems,
  newAgendaItem,
  setNewAgendaItem,
  handleKeyDown,
  handleBlur,
  handleCreateAgendaItem,
  handleCreateFromFutureTopic,
  handleDragEnd,
  handleOpenAgendaItemDialog,
  futureTopics,
  loadingFutureTopics,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("");

  const handleTopicSelection = (topicId: string) => {
    setSelectedTopicId(topicId);
    handleCreateFromFutureTopic(topicId);
    // Reset the select after a short delay
    setTimeout(() => setSelectedTopicId(""), 100);
  };

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
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setNewAgendaItem({ title: "", isEditing: true })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Agenda Item
              </Button>
              {futureTopics.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select 
                    value={selectedTopicId} 
                    onValueChange={handleTopicSelection} 
                    disabled={loadingFutureTopics}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={loadingFutureTopics ? "Loading topics..." : "Add from Future Topic"} />
                    </SelectTrigger>
                    <SelectContent>
                      {futureTopics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{topic.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {topic.content ? topic.content.substring(0, 50) + (topic.content.length > 50 ? "..." : "") : "No content"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default AgendaList; 