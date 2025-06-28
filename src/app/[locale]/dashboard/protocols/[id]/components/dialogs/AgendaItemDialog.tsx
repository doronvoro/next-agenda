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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard.protocols.agendaItemDialog");
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
      <DialogContent className="max-w-3xl w-full max-h-[95vh] overflow-y-auto p-8 shadow-2xl border border-border rounded-2xl bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            {selectedAgendaItem && (
              <span>
                {selectedAgendaItem.display_order ? `${selectedAgendaItem.display_order}.` : '•'} {selectedAgendaItem.title}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            <span className="text-base text-muted-foreground">{t("viewAndEdit")}</span>
          </DialogDescription>
        </DialogHeader>

        {selectedAgendaItem && (
          <div className="space-y-8">
            <div className="bg-muted border border-border rounded-xl p-8 shadow-sm">
              <form onSubmit={onSubmit} className="space-y-8">
                <h3 className="text-xl font-semibold mb-4 text-primary">{t("editAgendaItem")}</h3>
                <div className="space-y-2">
                  <Label htmlFor="popup-title">{t("title")}</Label>
                  <Input
                    id="popup-title"
                    className="rounded-lg px-4 py-3 text-base"
                    value={popupEditingAgendaItem?.title || ""}
                    onChange={(e) =>
                      setPopupEditingAgendaItem(prev =>
                        prev ? { ...prev, title: e.target.value } : null
                      )
                    }
                    placeholder={t("enterTitle")}
                    required
                  /> 
                </div>
                <div className="space-y-2">
                  <Label htmlFor="popup-topic">{t("topicContent")}</Label>
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
                    placeholder={t("enterTopicContent")}
                    ariaLabel={t("topicContent")}
                  />
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Info className="w-3 h-3" />
                    <span>{t("topicInfo")}</span>
                  </div>
                  {topicImproved && (
                    <div className="mt-4 p-4 border-2 border-primary/30 rounded-xl bg-muted">
                      <div className="font-bold mb-2 text-primary">{t("compareVersions")}</div>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">{t("original")}</div>
                          <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{topicOriginal}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">{t("improvedSuggestion")}</div>
                          <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{topicImproved}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 justify-end">
                        <Button size="lg" className="px-6" onClick={() => onAcceptImproved('topic_content')}>{t("accept")}</Button>
                        <Button size="lg" variant="outline" className="px-6" onClick={() => onRevertImproved('topic_content')}>{t("revert")}</Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="popup-decision">{t("decisionContent")}</Label>
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
                    placeholder={t("enterDecisionContent")}
                    ariaLabel={t("decisionContent")}
                  />
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Info className="w-3 h-3" />
                    <span>{t("decisionInfo")}</span>
                  </div>
                  {decisionImproved && (
                    <div className="mt-4 p-4 border-2 border-primary/30 rounded-xl bg-muted">
                      <div className="font-bold mb-2 text-primary">{t("compareVersions")}</div>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">{t("original")}</div>
                          <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{decisionOriginal}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">{t("improvedSuggestion")}</div>
                          <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{decisionImproved}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 justify-end">
                        <Button size="lg" className="px-6" onClick={() => onAcceptImproved('decision_content')}>{t("accept")}</Button>
                        <Button size="lg" variant="outline" className="px-6" onClick={() => onRevertImproved('decision_content')}>{t("revert")}</Button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-4 pt-6 border-t">
          <Button variant="ghost" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={onSubmit} disabled={!popupEditingAgendaItem?.title?.trim()}>
            {t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 