"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ProtocolCreateForm from "../../protocol-calendar/ProtocolCreateForm";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function NewProtocolPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = (id: string, number: string) => {
    setLoading(true);
    toast({ title: `Protocol #${number} created!`, description: "Redirecting to protocol page..." });
    setTimeout(() => {
      router.push(`/dashboard/protocols/${id}`);
    }, 500);
  };

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
            <ProtocolCreateForm
              initialDate={date ? date.toISOString() : undefined}
              setDate={setDate}
              date={date}
              onSuccess={handleSuccess}
              onCancel={() => router.push("/dashboard/protocols")}
            />
          </div>
        </CardContent>
      </Card>
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-lg">Redirecting to protocol...</span>
          </div>
        </div>
      )}
    </div>
  );
} 