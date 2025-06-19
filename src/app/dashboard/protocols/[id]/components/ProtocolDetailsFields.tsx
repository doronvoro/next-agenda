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
}

export const ProtocolDetailsFields: React.FC<ProtocolDetailsFieldsProps> = ({ protocol, formatDate }) => (
  <div className="grid grid-cols-2 gap-4">
    <Field label="Protocol Number" value={protocol.number} />
    <Field label="Due Date" value={formatDate(protocol.due_date)} />
    <Field label="Created At" value={formatDate(protocol.created_at)} />
    <Field label="Last Updated" value={formatDate(protocol.updated_at)} />
    <Field
      label="Committee"
      value={
        <div className="flex items-center gap-2">
          <span>{protocol.committee?.name || "Not assigned"}</span>
        </div>
      }
    />
  </div>
); 