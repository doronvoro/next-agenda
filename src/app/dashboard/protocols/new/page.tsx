"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Committee = {
  id: string;
  name: string;
};

export default function NewProtocolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date>();
  const [mounted, setMounted] = useState(false);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [formData, setFormData] = useState({
    number: "",
    committee_id: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCommittees(data || []);
    } catch (err) {
      console.error("Error fetching committees:", err);
      setError("Failed to load committees");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Validate required fields
      if (!formData.number || !date) {
        throw new Error("Please fill in all required fields");
      }

      // Create the protocol
      const { data: protocolData, error: protocolError } = await supabase
        .from("protocols")
        .insert([
          {
            number: formData.number,
            committee_id: formData.committee_id || null,
            due_date: date.toISOString(),
          },
        ])
        .select()
        .single();

      if (protocolError) throw protocolError;

      // If a committee is selected, fetch its members and add them to protocol_members
      if (formData.committee_id && protocolData) {
        try {
          // Fetch committee members
          const { data: committeeMembers, error: membersError } = await supabase
            .from("committees_members")
            .select("name")
            .eq("committee_id", formData.committee_id);

          if (membersError) {
            console.error("Error fetching committee members:", membersError);
            // Don't throw error here, just log it and continue
          } else if (committeeMembers && committeeMembers.length > 0) {
            // Create protocol members from committee members
            const protocolMembersData = committeeMembers.map(member => ({
              protocol_id: protocolData.id,
              name: member.name,
              type: 1, // Default type
              status: 1, // Default status
              source_type: 1, // Committee member source type
            }));

            const { error: insertMembersError } = await supabase
              .from("protocol_members")
              .insert(protocolMembersData);

            if (insertMembersError) {
              console.error("Error inserting protocol members:", insertMembersError);
              // Don't throw error here, just log it and continue
            }
          }
        } catch (err) {
          console.error("Error processing committee members:", err);
          // Don't throw error here, just log it and continue
        }
      }

      router.push(`/dashboard/protocols/${protocolData.id}`);
    } catch (err) {
      console.error("Error creating protocol:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard/protocols">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Protocols
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Protocol</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="number">Protocol Number *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder="Enter protocol number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="committee">Committee</Label>
                <Select
                  value={formData.committee_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, committee_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a committee" />
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
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/protocols">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Protocol"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 