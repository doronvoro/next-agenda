import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProtocol } from "../protocols/[id]/supabaseApi";
import { createClient } from "@/lib/supabase/client";

interface ProtocolCreateFormProps {
  initialDate?: string | null;
  onSuccess: (protocolId: string) => void;
  onCancel: () => void;
}

export default function ProtocolCreateForm({ initialDate, onSuccess, onCancel }: ProtocolCreateFormProps) {
  const [protocolNumber, setProtocolNumber] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [committees, setCommittees] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onSuccess(protocol.id);
    } catch (err: any) {
      setError(err?.message || "Failed to create protocol");
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="protocol-number">Protocol Number *</Label>
        <Input
          id="protocol-number"
          value={protocolNumber}
          onChange={e => setProtocolNumber(e.target.value)}
          placeholder="Enter protocol number"
          required
        />
      </div>
      <div>
        <Label htmlFor="committee">Committee *</Label>
        <Select value={committeeId} onValueChange={setCommitteeId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a committee" />
          </SelectTrigger>
          <SelectContent>
            {committees.map((committee: any) => (
              <SelectItem key={committee.id} value={committee.id}>
                {committee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {initialDate && (
        <div>
          <Label>Date</Label>
          <Input value={initialDate.substring(0, 10)} disabled />
        </div>
      )}
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={creating}>Cancel</Button>
        <Button type="submit" disabled={creating || !committeeId}>{creating ? "Creating..." : "Create Protocol"}</Button>
      </div>
    </form>
  );
} 