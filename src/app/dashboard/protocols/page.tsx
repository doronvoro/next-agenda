"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

type Protocol = Database["public"]["Tables"]["protocols"]["Row"] & {
  committee: Database["public"]["Tables"]["committees"]["Row"] | null;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
};

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from("protocols")
          .select(`
            *,
            committee:committees!committee_id(*)
          `)
          .order("due_date", { ascending: false });

        if (error) {
          console.error("Error fetching protocols:", error);
          setError(error.message);
          return;
        }

        setProtocols(data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading protocols...</div>
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Protocols</h1>
        <div className="text-sm text-muted-foreground">
          Total: {protocols.length} protocols
        </div>
      </div>

      {protocols.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No protocols found
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Due Date</TableHead>
                <TableHead>Committee Name</TableHead>
                <TableHead>Protocol #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {protocols.map((protocol) => (
                <TableRow key={protocol.id}>
                  <TableCell>{formatDate(protocol.due_date)}</TableCell>
                  <TableCell>{protocol.committee?.name || "N/A"}</TableCell>
                  <TableCell className="font-medium">
                    <Link 
                      href={`/dashboard/protocols/${protocol.id}`}
                      className="text-primary hover:underline"
                    >
                      #{protocol.number}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 