import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, Pencil, Trash2, X, Check, Edit3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n/client";
import { useTranslations } from "next-intl";
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
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const isRTL = currentLocale === 'he';
  const t = useTranslations("dashboard.protocols.agendaItemDialog");
  const mainT = useTranslations("dashboard.main.sections");

  return (
    <div className="space-y-8">
      {agendaItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{mainT("noAgendaItemsYet")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {agendaItems
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((item) => (
              <div key={item.id} className="group">
                {editingAgendaItem?.id === item.id ? (
                  <form onSubmit={handleUpdateAgendaItem} className="space-y-6">
                    <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1">
                        <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
                            className={`text-lg font-semibold border-0 border-b-2 border-border focus:border-primary focus:ring-0 px-0 py-1 rounded-none bg-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                          />
                        </div>
                      </div>
                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isRTL ? 'mr-4' : 'ml-4'}`}>
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
                          {t("topicContent")}
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
                          placeholder={t("enterTopicContent")}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`decision-${item.id}`} className="text-sm font-medium text-foreground">
                          {t("decisionContent")}
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
                          placeholder={t("enterDecisionContent")}
                        />
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="border border-border rounded-lg p-6 hover:border-border/60 transition-colors">
                    <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex items-center justify-center w-8 h-8 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                          {item.display_order || '•'}
                        </div>
                        <h3 className={`text-lg font-semibold text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                          {item.title}
                        </h3>
                      </div>
                      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'flex-row-reverse' : ''}`}>
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
                        <div className="text-sm font-medium text-foreground">{t("topicContent")}</div>
                        <div className="min-h-[80px] w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground">
                          {item.topic_content ? (
                            <div className="whitespace-pre-wrap">{item.topic_content}</div>
                          ) : (
                            <div className="text-muted-foreground italic">{t("noTopicContent")}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">{t("decisionContent")}</div>
                        <div className="min-h-[80px] w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground">
                          {item.decision_content ? (
                            <div className="whitespace-pre-wrap">{item.decision_content}</div>
                          ) : (
                            <div className="text-muted-foreground italic">{t("noDecisionContent")}</div>
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