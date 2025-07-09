import React from "react";
import type { Protocol } from "../types";
import { Calendar, Users, Hash, ExternalLink } from "lucide-react";

const Field = ({ label, value, icon, className }: { label: string; value: React.ReactNode; icon?: React.ReactNode; className?: string }) => (
  <div className={`flex items-start gap-3 ${className || ''}`}>
    {icon && (
      <div className="flex items-center justify-center w-5 h-5 text-muted-foreground mt-0.5">
        {icon}
      </div>
    )}
    <div className="flex-1">
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-base text-foreground">{value}</div>
    </div>
  </div>
);

interface ProtocolDetailsFieldsProps {
  protocol: Protocol;
  formatDate: (dateString: string) => string;
  company?: { name?: string | null; number?: string | null; address?: string | null };
  protocolMembers?: { status: number }[];
}

export const ProtocolDetailsFields: React.FC<ProtocolDetailsFieldsProps> = ({ protocol, formatDate, company, protocolMembers }) => {
  const total = protocolMembers ? protocolMembers.length : 0;
  const present = protocolMembers ? protocolMembers.filter(m => m.status === 2).length : 0;
  const absent = protocolMembers ? protocolMembers.filter(m => m.status !== 2).length : 0;
  return (
    <div className="space-y-6">
      {company && (
        <div className="text-center pb-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">{company.name || ''}</h1>
          {company.number && (
            <div className="text-sm text-muted-foreground mb-1">ח.פ {company.number}</div>
          )}
          {company.address && (
            <div className="text-sm text-muted-foreground mb-3">{company.address}</div>
          )}
          <div className="text-lg font-semibold text-foreground">
            פרוטוקול {protocol.committee?.name || ''} מספר {protocol.number}
          </div>
        </div>
      )}
      
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl w-full justify-items-center" dir="rtl">
          <Field 
            label="תאריך ישיבה" 
            value={formatDate(protocol.due_date)}
            icon={<Calendar className="h-4 w-4" />}
          />
          <Field 
            label="מספר פרוטוקול" 
            value={`#${protocol.number}`}
            icon={<Hash className="h-4 w-4" />}
          />
          <Field 
            label="וועד הנהלה" 
            value={protocol.committee?.name || 'Not specified'}
            icon={<Users className="h-4 w-4" />}
          />
          <Field
            label="חברים"
            value={
              <span className="truncate block max-w-[150px]" title={`סה"כ: ${total}, נוכחים: ${present}, נעדרים: ${absent}`}>
                {`סה"כ: ${total}, נוכחים: ${present}, נעדרים: ${absent}`}
              </span>
            }
            icon={<Users className="h-4 w-4" />}
            className="justify-end text-right"
          />
        </div>
      </div>
    </div>
  ); 
} 