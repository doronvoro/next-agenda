import React from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Sparkles, X, Check, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
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
  handleEditAgendaItemTitle?: (itemId: string, newTitle: string) => Promise<void>;
  handleDeleteAgendaItem?: (itemId: string) => void;
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
  handleEditAgendaItemTitle,
  handleDeleteAgendaItem,
  futureTopics,
  loadingFutureTopics,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleTopicSelection = (topicId: string) => {
    setSelectedTopicId(topicId);
    handleCreateFromFutureTopic(topicId);
    // Reset the select after a short delay
    setTimeout(() => setSelectedTopicId(""), 100);
  };

  const handleCancelEdit = () => {
    setNewAgendaItem({ title: "", isEditing: false });
  };

  const handleSaveItem = async () => {
    if (!newAgendaItem.title.trim()) return;
    setIsCreating(true);
    try {
      await handleCreateAgendaItem(newAgendaItem.title);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveItem();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
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
        <div className="divide-y divide-border/50">
          {agendaItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground text-sm mb-2">No agenda items yet</div>
              <div className="text-muted-foreground/70 text-xs">Start by adding your first agenda item</div>
            </div>
          ) : (
            agendaItems.map((item) => (
              <SortableAgendaItem
                key={item.id}
                item={item}
                onViewClick={handleOpenAgendaItemDialog}
                onEditTitle={handleEditAgendaItemTitle}
                onDelete={handleDeleteAgendaItem}
              />
            ))
          )}
          
          {newAgendaItem.isEditing ? (
            <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 dark:bg-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-medium">
                  {agendaItems.length + 1}
                </div>
                <div className="flex-1">
                  <Input
                    value={newAgendaItem.title}
                    onChange={(e) => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                    onKeyDown={handleInputKeyDown}
                    onBlur={handleBlur}
                    placeholder="Type agenda item title and press Enter to save"
                    autoFocus
                    className="border-0 border-b-2 border-blue-300 focus:border-blue-500 focus:ring-0 px-0 py-1 rounded-none bg-transparent"
                    disabled={isCreating}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          onClick={handleSaveItem}
                          disabled={!newAgendaItem.title.trim() || isCreating}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Save agenda item (Enter)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelEdit}
                          disabled={isCreating}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel (Esc)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {isCreating && (
                <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 mt-2 ml-9">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  Creating agenda item...
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/20"
                          onClick={() => setNewAgendaItem({ title: "", isEditing: true })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add a new agenda item</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {futureTopics.length > 0 && (
                    <>
                      <div className="text-muted-foreground text-sm">or</div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Select 
                                value={selectedTopicId} 
                                onValueChange={handleTopicSelection} 
                                disabled={loadingFutureTopics}
                              >
                                <SelectTrigger className="h-8 px-3 w-auto min-w-[200px] border-blue-200 text-blue-600 hover:bg-blue-500/10 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-500/20">
                                  <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                                  <SelectValue placeholder={loadingFutureTopics ? "Loading..." : "From Future Topic"} />
                                  <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    {futureTopics.length}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent className="max-w-md">
                                  <div className="p-2 text-xs text-muted-foreground border-b mb-2">
                                    Available future topics
                                  </div>
                                  {futureTopics.map((topic) => (
                                    <SelectItem key={topic.id} value={topic.id} className="py-3">
                                      <div className="flex flex-col gap-1">
                                        <span className="font-medium text-sm">{topic.title}</span>
                                        {topic.content && (
                                          <span className="text-xs text-muted-foreground line-clamp-2">
                                            {topic.content}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Create agenda item from existing future topic</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default AgendaList; 