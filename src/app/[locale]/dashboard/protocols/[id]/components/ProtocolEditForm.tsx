import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import type { Committee } from "../types";

interface ProtocolEditFormProps {
  editFormData: { number: string; committee_id: string };
  setEditFormData: React.Dispatch<React.SetStateAction<{ number: string; committee_id: string }>>;
  editDate: Date | undefined;
  setEditDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  committees: Committee[];
  initialLoading: boolean;
  updateProtocol: (id: string, data: any) => Promise<{ error: any }>;
  protocolId: string;
  onCancel: () => void;
  onUpdate: (e: React.FormEvent) => Promise<void>;
}

export const ProtocolEditForm: React.FC<ProtocolEditFormProps> = ({
  editFormData,
  setEditFormData,
  editDate,
  setEditDate,
  committees,
  initialLoading,
  updateProtocol,
  protocolId,
  onCancel,
  onUpdate,
}) => {
  const t = useTranslations("dashboard.protocols.editForm");
  const [error, setError] = useState<string | null>(null);

  const handleCancelEdit = () => {
    setError(null);
    onCancel();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (!editFormData.number.trim() || !editDate) {
        throw new Error(t("fillRequiredFields"));
      }
      if (!editFormData.committee_id) {
        setError(t("selectCommitteeError"));
        return;
      }
      
      await onUpdate(e);
    } catch (err) {
      console.error("Error updating protocol:", err);
      setError(err instanceof Error ? err.message : t("errorOccurred"));
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6 mb-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="number">{t("protocolNumber")}</Label>
          <Input
            id="number"
            type="text"
            value={editFormData.number}
            onChange={(e) =>
              setEditFormData({ ...editFormData, number: e.target.value })
            }
            placeholder={t("enterProtocolNumber")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="committee">{t("committee")}</Label>
          <Select
            value={editFormData.committee_id}
            onValueChange={(value) =>
              setEditFormData({ ...editFormData, committee_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCommittee")} />
            </SelectTrigger>
            <SelectContent>
              {committees.map((committee) => (
                <SelectItem key={committee.id} value={committee.id}>
                  {committee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("dueDate")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !editDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editDate ? format(editDate, "dd/MM/yyyy") : t("pickDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={editDate}
                onSelect={(date: Date | undefined) => setEditDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCancelEdit}
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
    </form>
  );
}; 