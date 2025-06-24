import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, Pencil, Trash2, X, Check, Edit3 } from "lucide-react";
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
    <div className="space-y-8">
      {agendaItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-2">No agenda items yet</div>
          <div className="text-muted-foreground/70 text-sm">Add agenda items to see their details here</div>
        </div>
      ) : (
        <div className="space-y-8">
          {agendaItems
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((item) => (
              <div key={item.id} className="group">
                {editingAgendaItem?.id === item.id ? (
                  <form onSubmit={handleUpdateAgendaItem} className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                            {item.display_order || '•'}
                          </div>
                          <Input
                            value={editingAgendaItem.title}
                            onChange={(e) =>
                              setEditingAgendaItem({
                                ...editingAgendaItem,
                                title: e.target.value,
                              })
                            }
                            placeholder="Enter agenda item title"
                            required
                            className="text-lg font-semibold border-0 border-b-2 border-border focus:border-primary focus:ring-0 px-0 py-1 rounded-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEditAgendaItem}
                          disabled={initialLoading}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="submit" 
                          variant="ghost"
                          size="sm"
                          disabled={initialLoading}
                          className="h-8 w-8 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pl-11">
                      <div className="space-y-2">
                        <Label htmlFor={`topic-${item.id}`} className="text-sm font-medium text-foreground">
                          Topic Content
                        </Label>
                        <textarea
                          id={`topic-${item.id}`}
                          value={editingAgendaItem.topic_content}
                          onChange={(e) =>
                            setEditingAgendaItem({
                              ...editingAgendaItem,
                              topic_content: e.target.value,
                            })
                          }
                          className="min-h-[120px] w-full rounded-lg border border-border bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                          placeholder="Enter topic content..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`decision-${item.id}`} className="text-sm font-medium text-foreground">
                          Decision Content
                        </Label>
                        <textarea
                          id={`decision-${item.id}`}
                          value={editingAgendaItem.decision_content}
                          onChange={(e) =>
                            setEditingAgendaItem({
                              ...editingAgendaItem,
                              decision_content: e.target.value,
                            })
                          }
                          className="min-h-[120px] w-full rounded-lg border border-border bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                          placeholder="Enter decision content..."
                        />
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="border border-border rounded-lg p-6 hover:border-border/60 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                          {item.display_order || '•'}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAgendaItemDialog(item)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgendaItem(item)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingAgendaItemId(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pl-11">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">Topic Content</div>
                        <div className="min-h-[80px] w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground">
                          {item.topic_content ? (
                            <div className="whitespace-pre-wrap">{item.topic_content}</div>
                          ) : (
                            <div className="text-muted-foreground italic">No topic content</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">Decision Content</div>
                        <div className="min-h-[80px] w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground">
                          {item.decision_content ? (
                            <div className="whitespace-pre-wrap">{item.decision_content}</div>
                          ) : (
                            <div className="text-muted-foreground italic">No decision content</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AgendaDetails; 