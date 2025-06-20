import React from "react";
import type { Protocol } from "../types";

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
    <div className="text-lg">{value}</div>
  </div>
);

interface ProtocolDetailsFieldsProps {
  protocol: Protocol;
  formatDate: (dateString: string) => string;
  company?: { name?: string | null; number?: string | null };
}

export const ProtocolDetailsFields: React.FC<ProtocolDetailsFieldsProps> = ({ protocol, formatDate, company }) => (
  <div className="grid grid-cols-2 gap-4">
    {company && (
      <Field
        label="Company"
        value={
          <div className="flex flex-col">
            <span className="font-semibold">{company.name || "No company"}</span>
            {company.number && <span className="text-xs text-muted-foreground">Number: {company.number}</span>}
          </div>
        }
      />
    )}
    <Field
      label="Committee"
      value={<span>{protocol.committee?.name || "Not assigned"}</span>}
    />
    <Field label="Protocol Number" value={protocol.number} />
    <Field label="Due Date" value={formatDate(protocol.due_date)} />
  </div>
); 