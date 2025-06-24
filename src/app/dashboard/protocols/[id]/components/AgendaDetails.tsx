import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, Pencil, Trash2, X, Check } from "lucide-react";
import type { EditingAgendaItem, AgendaItem } from "../types";

interface AgendaDetailsProps {
  agendaItems: AgendaItem[];
  editingAgendaItem: EditingAgendaItem | null;
  handleEditAgendaItem: (item: AgendaItem) => void;
  handleCancelEditAgendaItem: () => void;
  handleUpdateAgendaItem: (e: React.FormEvent) => void;
  setEditingAgendaItem: React.Dispatch<React.SetStateAction<EditingAgendaItem | null>>;
  handleOpenAgendaItemDialog: (item: AgendaItem) => void;
  setDeletingAgendaItemId: (id: string) => void;
  initialLoading: boolean;
}

const AgendaDetails: React.FC<AgendaDetailsProps> = ({
  agendaItems,
  editingAgendaItem,
  handleEditAgendaItem,
  handleCancelEditAgendaItem,
  handleUpdateAgendaItem,
  setEditingAgendaItem,
  handleOpenAgendaItemDialog,
  setDeletingAgendaItemId,
  initialLoading,
}) => {
  return (
    <div className="grid gap-6">
      {agendaItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">
          No agenda items found
        </div>
      ) : (
        <div className="space-y-8">
          {agendaItems
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((item) => (
              <div key={item.id} className="space-y-4">
                {editingAgendaItem?.id === item.id ? (
                  <form onSubmit={handleUpdateAgendaItem} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
                        {item.display_order ? `${item.display_order}.` : '•'} {item.title}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEditAgendaItem}
                          disabled={initialLoading}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="submit" 
                          variant="ghost"
                          size="icon"
                          disabled={initialLoading}
                          className="h-8 w-8"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`title-${item.id}`}>Title</Label>
                      <Input
                        id={`title-${item.id}`}
                        value={editingAgendaItem.title}
                        onChange={(e) =>
                          setEditingAgendaItem({
                            ...editingAgendaItem,
                            title: e.target.value,
                          })
                        }
                        placeholder="Enter agenda item title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`topic-${item.id}`}>Topic Content</Label>
                      <textarea
                        id={`topic-${item.id}`}
                        value={editingAgendaItem.topic_content}
                        onChange={(e) =>
                          setEditingAgendaItem({
                            ...editingAgendaItem,
                            topic_content: e.target.value,
                          })
                        }
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right"
                        placeholder="Enter topic content"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`decision-${item.id}`}>Decision Content</Label>
                      <textarea
                        id={`decision-${item.id}`}
                        value={editingAgendaItem.decision_content}
                        onChange={(e) =>
                          setEditingAgendaItem({
                            ...editingAgendaItem,
                            decision_content: e.target.value,
                          })
                        }
                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right"
                        placeholder="Enter decision content"
                      />
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
                        {item.display_order ? `${item.display_order}.` : '•'} {item.title}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAgendaItemDialog(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgendaItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingAgendaItemId(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Topic Content
                      </label>
                      <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right">
                        {item.topic_content || "No topic content"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Decision Content
                      </label>
                      <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right">
                        {item.decision_content || "No decision content"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AgendaDetails; 