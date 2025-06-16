"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";

type Protocol = Database["public"]["Tables"]["protocols"]["Row"] & {
  committee: Database["public"]["Tables"]["committees"]["Row"] | null;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "PPP") : "Invalid date";
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
    <div className="text-lg">{value}</div>
  </div>
);

export default function ProtocolPage() {
  const params = useParams();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProtocol = async () => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from("protocols")
          .select(`
            *,
            committee:committees!committee_id(*)
          `)
          .eq("id", params.id)
          .single();

        if (error) {
          console.error("Error fetching protocol:", error);
          setError(error.message);
          return;
        }

        setProtocol(data);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProtocol();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading protocol...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Protocol not found</div>
      </div>
    );
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Protocol #{protocol.number}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-4">
                <Field label="Protocol ID" value={protocol.id} />
                <Field label="Protocol Number" value={protocol.number} />
                <Field label="Due Date" value={formatDate(protocol.due_date)} />
                <Field 
                  label="Committee" 
                  value={
                    <div className="flex items-center gap-2">
                      <span>{protocol.committee?.name || "Not assigned"}</span>
                      {protocol.committee && (
                        <span className="text-sm text-muted-foreground">
                          (ID: {protocol.committee.id})
                        </span>
                      )}
                    </div>
                  } 
                />
              </div>

              <Separator />

              <div className="grid gap-4">
                <h3 className="text-sm font-medium text-muted-foreground">Timestamps</h3>
                <div className="grid gap-4">
                  <Field label="Created At" value={formatDate(protocol.created_at)} />
                  <Field label="Last Updated" value={formatDate(protocol.updated_at)} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 