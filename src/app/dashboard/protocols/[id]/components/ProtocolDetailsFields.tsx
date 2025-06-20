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
  company?: { name?: string | null; number?: string | null; address?: string | null };
}

export const ProtocolDetailsFields: React.FC<ProtocolDetailsFieldsProps> = ({ protocol, formatDate, company }) => (
  <div className="grid grid-cols-2 gap-4">
    {company && (
      <div className="col-span-2">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold mb-1">{company.name || ''}</h1>
          {company.number && <div className="text-lg mb-1">ח.פ{company.number}</div>}
          {company.address && <div className="text-base mb-1">{company.address}</div>}
          <div className="text-xl font-semibold mb-1">
            פרוטוקול {protocol.committee?.name || ''} מספר {protocol.number}
          </div>
        </div>
      </div>
    )}
    <div className="col-span-2 flex items-center justify-between text-left">
      <div>Date Due {formatDate(protocol.due_date)}</div>
      <a
        href="https://zoom.us"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Open zoom meeting
      </a>
    </div>
  </div>
); 