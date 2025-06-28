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
import { Checkbox } from "@/components/ui/checkbox";
import type { ProtocolMember } from "../../types";
import { useTranslations } from "next-intl";

interface RecipientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolMembers: ProtocolMember[];
  selectedRecipients: string[];
  onRecipientToggle: (memberId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RecipientsDialog({
  open,
  onOpenChange,
  protocolMembers,
  selectedRecipients,
  onRecipientToggle,
  onSelectAll,
  onClearAll,
  onCancel,
  onConfirm,
}: RecipientsDialogProps) {
  const t = useTranslations("dashboard.protocols.recipientsDialog");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedRecipients.length} {t("ofSelected")} {protocolMembers.length} {t("selected")}
            </span>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectAll}
              >
                {t("selectAll")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearAll}
              >
                {t("clearAll")}
              </Button>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {protocolMembers.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                {t("noProtocolMembersFound")}
              </div>
            ) : (
              protocolMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`recipient-${member.id}`}
                    checked={selectedRecipients.includes(member.id)}
                    onCheckedChange={() => onRecipientToggle(member.id)}
                  />
                  <Label
                    htmlFor={`recipient-${member.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {member.name || `${t("member")} ${member.id}`}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
          >
            {t("confirmSelection")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 