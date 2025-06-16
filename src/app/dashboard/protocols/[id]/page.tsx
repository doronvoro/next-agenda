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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Protocol = Database["public"]["Tables"]["protocols"]["Row"] & {
  committee: Database["public"]["Tables"]["committees"]["Row"] | null;
};

type AgendaItem = {
  id: string;
  protocol_id: string | null;
  title: string;
  topic_content: string | null;
  decision_content: string | null;
  display_order: number | null;
  created_at: string;
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
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch protocol
        const { data: protocolData, error: protocolError } = await supabase
          .from("protocols")
          .select(`
            *,
            committee:committees!committee_id(*)
          `)
          .eq("id", params.id)
          .single();

        if (protocolError) {
          console.error("Error fetching protocol:", protocolError);
          setError(protocolError.message);
          return;
        }

        setProtocol(protocolData);

        // Fetch agenda items
        const { data: agendaItemsData, error: agendaItemsError } = await supabase
          .from("agenda_items")
          .select("*")
          .eq("protocol_id", params.id)
          .order("display_order", { ascending: true });

        if (agendaItemsError) {
          console.error("Error fetching agenda items:", agendaItemsError);
          setError(agendaItemsError.message);
          return;
        }

        setAgendaItems(agendaItemsData || []);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-6">
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

                  <Separator />

                  <div className="grid gap-4">
                    <h3 className="text-lg font-medium">Agenda</h3>
                    {agendaItems.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        No agenda items found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {agendaItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {item.display_order ? `${item.display_order}.` : '•'}
                            </span>
                            <span>{item.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid gap-6">
                    <h3 className="text-lg font-medium">Agenda Items Details</h3>
                    {agendaItems.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        No agenda items found
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {agendaItems.map((item) => (
                          <div key={item.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-medium">
                                {item.display_order ? `${item.display_order}.` : '•'} {item.title}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">
                                Topic Content
                              </label>
                              <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                {item.topic_content || "No topic content"}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">
                                Decision Content
                              </label>
                              <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                {item.decision_content || "No decision content"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="members" className="mt-6">
                <div className="text-center text-muted-foreground py-8">
                  Committee members will be displayed here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 