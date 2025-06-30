import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProtocol } from "../protocols/[id]/supabaseApi";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n/client";
import CommitteeDropdown from "@/app/[locale]/dashboard/protocols/components/CommitteeDropdown";
import { RtlProvider } from "@/context/RtlContext";

interface ProtocolCreateFormProps {
  initialDate?: string | null;
  date?: Date | null;
  setDate?: (date: Date | null) => void;
  onSuccess: (protocolId: string, number: string) => void;
  onCancel: () => void;
}

export default function ProtocolCreateForm({ initialDate, date, setDate, onSuccess, onCancel }: ProtocolCreateFormProps) {
  const [protocolNumber, setProtocolNumber] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [committees, setCommittees] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("dashboard.protocols.createForm");
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const isRTL = currentLocale === 'he';

  useEffect(() => {
    const fetchCommittees = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees")
        .select("id, name")
        .order("name");
      if (!error) setCommittees(data || []);
    };
    fetchCommittees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (!protocolNumber || !committeeId || !initialDate) {
        setError("All fields are required");
        setCreating(false);
        return;
      }
      const protocol = await createProtocol({
        number: protocolNumber,
        due_date: initialDate,
        committee_id: committeeId,
      });
      onSuccess(protocol.id, protocol.number);
    } catch (err: any) {
      setError(err?.message || "Failed to create protocol");
    } finally {
      setCreating(false);
    }
  };

  return (
    <RtlProvider isRTL={isRTL}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <div className="mb-2">
            {/* <Label htmlFor="committee" className="mb-1">{t("committee")} *</Label> */}
            <CommitteeDropdown
              committees={committees}
              selectedCommittee={committeeId}
              setSelectedCommittee={setCommitteeId}
              t={t}
            />
          </div>
        </div>
        <div>
          <div className="mb-2">
            <Label htmlFor="protocol-number" className="mb-1">{t("protocolNumber")} *</Label>
            <Input
              id="protocol-number"
              value={protocolNumber}
              onChange={e => setProtocolNumber(e.target.value)}
              placeholder={t("enterProtocolNumber")}
              required
              className="h-8 px-2 text-sm w-full"
            />
          </div>
        </div>
        {setDate && (
          <div className="mb-2">
            <Label className="mb-1">{t("dueDate")} *</Label>
            <Input
              type="date"
              value={typeof date === 'object' && date ? date.toISOString().substring(0, 10) : ""}
              onChange={e => setDate(e.target.value ? new Date(e.target.value) : null)}
              className="h-8 px-2 text-sm w-full"
              required
            />
          </div>
        )}
        {initialDate && !setDate && (
          <div className="mb-2">
            <Label className="mb-1">{t("date")}</Label>
            <Input value={initialDate.substring(0, 10)} disabled className="h-8 px-2 text-sm bg-muted" />
          </div>
        )}
        {error && <div className="text-red-500 text-xs mt-1">{t(error)}</div>}
        <div className={`flex justify-end gap-2 mt-2${isRTL ? ' flex-row-reverse' : ''}`}>
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={creating}>{t("cancel")}</Button>
          <Button type="submit" size="sm" disabled={creating || !committeeId}>{creating ? t("creating") : t("createProtocol")}</Button>
        </div>
      </form>
    </RtlProvider>
  );
} 