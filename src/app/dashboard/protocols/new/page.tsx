"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ProtocolCreateForm from "../../protocol-calendar/ProtocolCreateForm";
import { Label } from "@/components/ui/label";

export default function NewProtocolPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);

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
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date ? date.toISOString().substring(0, 10) : ""}
                  onChange={e => setDate(e.target.value ? new Date(e.target.value) : null)}
                  className="border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
            <ProtocolCreateForm
              initialDate={date ? date.toISOString() : undefined}
              onSuccess={id => router.push(`/dashboard/protocols/${id}`)}
              onCancel={() => router.push("/dashboard/protocols")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 