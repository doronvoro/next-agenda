import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AgendaItem, EditingAgendaItem } from "../../types";
import { Mic, MicOff } from "lucide-react";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";

interface AgendaItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAgendaItem: AgendaItem | null;
  isPopupEditing: boolean;
  popupEditingAgendaItem: EditingAgendaItem | null;
  setPopupEditingAgendaItem: React.Dispatch<React.SetStateAction<EditingAgendaItem | null>>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onImproveText: (field: 'topic_content' | 'decision_content', text: string) => void;
  onAcceptImproved: (field: 'topic_content' | 'decision_content') => void;
  onRevertImproved: (field: 'topic_content' | 'decision_content') => void;
  isImprovingTopic: boolean;
  isImprovingDecision: boolean;
  topicImproved: string | null;
  topicOriginal: string | null;
  decisionImproved: string | null;
  decisionOriginal: string | null;
}

export function AgendaItemDialog({
  open,
  onOpenChange,
  selectedAgendaItem,
  isPopupEditing,
  popupEditingAgendaItem,
  setPopupEditingAgendaItem,
  onStartEdit,
  onCancelEdit,
  onClose,
  onSubmit,
  onImproveText,
  onAcceptImproved,
  onRevertImproved,
  isImprovingTopic,
  isImprovingDecision,
  topicImproved,
  topicOriginal,
  decisionImproved,
  decisionOriginal,
}: AgendaItemDialogProps) {
  const {
    listening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    setTranscript,
  } = useSpeechToText();
  const [dictatingField, setDictatingField] = React.useState<null | 'topic_content' | 'decision_content'>(null);

  React.useEffect(() => {
    if (!dictatingField || !transcript) return;
    setPopupEditingAgendaItem(prev =>
      prev ? { ...prev, [dictatingField]: prev[dictatingField] ? prev[dictatingField] + ' ' + transcript : transcript } : null
    );
    setTranscript("");
  }, [transcript, dictatingField, setPopupEditingAgendaItem, setTranscript]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] overflow-y-auto p-8 shadow-2xl border border-border rounded-2xl bg-background">
        <DialogHeader>
          <DialogTitle>
            {selectedAgendaItem && (
              <span>
                {selectedAgendaItem.display_order ? `${selectedAgendaItem.display_order}.` : '•'} {selectedAgendaItem.title}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            <span className="text-base text-muted-foreground">View and edit agenda item details</span>
          </DialogDescription>
        </DialogHeader>

        {selectedAgendaItem && (
          <div className="space-y-8">
            {isPopupEditing ? (
              <div className="bg-muted border border-border rounded-xl p-8 shadow-sm">
                <form onSubmit={onSubmit} className="space-y-8">
                  <h3 className="text-xl font-semibold mb-4 text-primary">Edit Agenda Item</h3>
                  <div className="space-y-2">
                    <Label htmlFor="popup-title">Title</Label>
                    <Input
                      id="popup-title"
                      className="rounded-lg px-4 py-3 text-base"
                      value={popupEditingAgendaItem?.title || ""}
                      onChange={(e) =>
                        setPopupEditingAgendaItem(prev =>
                          prev ? { ...prev, title: e.target.value } : null
                        )
                      }
                      placeholder="Enter agenda item title"
                      required
                    /> 
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="popup-topic">Topic Content</Label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        id="popup-topic"
                        value={popupEditingAgendaItem?.topic_content || ""}
                        onChange={(e) =>
                          setPopupEditingAgendaItem(prev =>
                            prev ? { ...prev, topic_content: e.target.value } : null
                          )
                        }
                        className="min-h-[180px] w-full rounded-lg border border-input bg-background px-4 py-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right text-base"
                        placeholder="Enter topic content"
                        disabled={!!topicImproved}
                      />
                      {isSupported && (
                        <Button
                          type="button"
                          variant={dictatingField === 'topic_content' && listening ? "secondary" : "outline"}
                          className="h-auto px-2 py-2 text-base flex items-center"
                          onClick={() => {
                            if (dictatingField === 'topic_content' && listening) {
                              stopListening();
                              setDictatingField(null);
                            } else {
                              setDictatingField('topic_content');
                              startListening();
                            }
                          }}
                          aria-label={dictatingField === 'topic_content' && listening ? "Stop voice input" : "Start voice input"}
                          disabled={!!topicImproved}
                        >
                          {dictatingField === 'topic_content' && listening ? <MicOff className="text-red-500" /> : <Mic />}
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => onImproveText('topic_content', popupEditingAgendaItem?.topic_content || "")}
                        disabled={isImprovingTopic || !!topicImproved}
                        variant="outline"
                        className="h-auto px-4 py-2 text-base"
                      >
                        {isImprovingTopic ? "Improving..." : "Improve it"}
                      </Button>
                    </div>
                    {topicImproved && (
                      <div className="mt-4 p-4 border-2 border-primary/30 rounded-xl bg-muted">
                        <div className="font-bold mb-2 text-primary">Compare Versions</div>
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">Original</div>
                            <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{topicOriginal}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">Improved Suggestion</div>
                            <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{topicImproved}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button size="lg" className="px-6" onClick={() => onAcceptImproved('topic_content')}>Accept</Button>
                          <Button size="lg" variant="outline" className="px-6" onClick={() => onRevertImproved('topic_content')}>Revert</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="popup-decision">Decision Content</Label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        id="popup-decision"
                        value={popupEditingAgendaItem?.decision_content || ""}
                        onChange={(e) =>
                          setPopupEditingAgendaItem(prev =>
                            prev ? { ...prev, decision_content: e.target.value } : null
                          )
                        }
                        className="min-h-[180px] w-full rounded-lg border border-input bg-background px-4 py-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right text-base"
                        placeholder="Enter decision content"
                        disabled={!!decisionImproved}
                      />
                      {isSupported && (
                        <Button
                          type="button"
                          variant={dictatingField === 'decision_content' && listening ? "secondary" : "outline"}
                          className="h-auto px-2 py-2 text-base flex items-center"
                          onClick={() => {
                            if (dictatingField === 'decision_content' && listening) {
                              stopListening();
                              setDictatingField(null);
                            } else {
                              setDictatingField('decision_content');
                              startListening();
                            }
                          }}
                          aria-label={dictatingField === 'decision_content' && listening ? "Stop voice input" : "Start voice input"}
                          disabled={!!decisionImproved}
                        >
                          {dictatingField === 'decision_content' && listening ? <MicOff className="text-red-500" /> : <Mic />}
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => onImproveText('decision_content', popupEditingAgendaItem?.decision_content || "")}
                        disabled={isImprovingDecision || !!decisionImproved}
                        variant="outline"
                        className="h-auto px-4 py-2 text-base"
                      >
                        {isImprovingDecision ? "Improving..." : "Improve it"}
                      </Button>
                    </div>
                    {decisionImproved && (
                      <div className="mt-4 p-4 border-2 border-primary/30 rounded-xl bg-muted">
                        <div className="font-bold mb-2 text-primary">Compare Versions</div>
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">Original</div>
                            <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{decisionOriginal}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">Improved Suggestion</div>
                            <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{decisionImproved}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button size="lg" className="px-6" onClick={() => onAcceptImproved('decision_content')}>Accept</Button>
                          <Button size="lg" variant="outline" className="px-6" onClick={() => onRevertImproved('decision_content')}>Revert</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Topic Content
                  </label>
                  <div className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right">
                    {selectedAgendaItem.topic_content || "No topic content"}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Decision Content
                  </label>
                  <div className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right">
                    {selectedAgendaItem.decision_content || "No decision content"}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={onStartEdit}
                  >
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 