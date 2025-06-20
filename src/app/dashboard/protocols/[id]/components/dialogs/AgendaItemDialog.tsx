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
import { Mic, MicOff, X as XIcon, Wand2, Info } from "lucide-react";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { VoiceMagicTextarea } from "./VoiceMagicTextarea";

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
      <DialogContent className="max-w-3xl w-full max-h-[95vh] overflow-y-auto p-8 shadow-2xl border border-border rounded-2xl bg-background relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 flex items-center gap-2 h-8 w-8 p-0"
          aria-label="Close dialog"
        >
          <XIcon className="w-4 h-4" />
        </Button>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
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
                    <VoiceMagicTextarea
                      value={popupEditingAgendaItem?.topic_content || ""}
                      onChange={e => setPopupEditingAgendaItem(prev => prev ? { ...prev, topic_content: e.target.value } : null)}
                      onImprove={() => onImproveText('topic_content', popupEditingAgendaItem?.topic_content || "")}
                      onMic={() => {
                        if (dictatingField === 'topic_content' && listening) {
                          stopListening();
                          setDictatingField(null);
                        } else {
                          setDictatingField('topic_content');
                          startListening();
                        }
                      }}
                      isImproving={isImprovingTopic}
                      isSupported={isSupported}
                      dictating={dictatingField === 'topic_content'}
                      listening={listening}
                      disabled={!!topicImproved}
                      placeholder="Enter topic content"
                      ariaLabel="Topic Content"
                    />
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Info className="w-3 h-3" />
                      <span>Enter the topic content for this agenda item. You can dictate or paste text.</span>
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
                    <VoiceMagicTextarea
                      value={popupEditingAgendaItem?.decision_content || ""}
                      onChange={e => setPopupEditingAgendaItem(prev => prev ? { ...prev, decision_content: e.target.value } : null)}
                      onImprove={() => onImproveText('decision_content', popupEditingAgendaItem?.decision_content || "")}
                      onMic={() => {
                        if (dictatingField === 'decision_content' && listening) {
                          stopListening();
                          setDictatingField(null);
                        } else {
                          setDictatingField('decision_content');
                          startListening();
                        }
                      }}
                      isImproving={isImprovingDecision}
                      isSupported={isSupported}
                      dictating={dictatingField === 'decision_content'}
                      listening={listening}
                      disabled={!!decisionImproved}
                      placeholder="Enter decision content"
                      ariaLabel="Decision Content"
                    />
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Info className="w-3 h-3" />
                      <span>Enter the decision content for this agenda item. You can dictate or paste text.</span>
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
                  <DialogFooter className="flex gap-2 justify-end mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancelEdit}
                      className="flex items-center gap-2"
                    >
                      <XIcon className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button type="submit" className="flex items-center gap-2">
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