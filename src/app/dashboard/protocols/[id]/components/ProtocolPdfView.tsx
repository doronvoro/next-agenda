import React from "react";
import type { Protocol, AgendaItem, ProtocolMember, ProtocolAttachment, ProtocolMessage } from "../types";
import { ProtocolDetailsFields } from "./ProtocolDetailsFields";

interface ProtocolPdfViewProps {
  protocol: Protocol;
  agendaItems: AgendaItem[];
  protocolMembers: ProtocolMember[];
  protocolAttachments: ProtocolAttachment[];
  protocolMessages: ProtocolMessage[];
  formatDate: (dateString: string) => string;
  company?: { name?: string | null; number?: string | null; address?: string | null };
}

const PdfSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold border-b pb-2 mb-4 print:mt-8">{title}</h2>
    {children}
  </section>
);

const ProtocolPdfView: React.FC<ProtocolPdfViewProps> = ({
  protocol,
  agendaItems,
  protocolMembers,
  protocolAttachments,
  protocolMessages,
  formatDate,
  company,
}) => {
  // Group members
  const invited = protocolMembers;
  const present = protocolMembers.filter(m => m.status === 2);
  const absent = protocolMembers.filter(m => m.status !== 2);
  const formatName = (m: ProtocolMember) => m.name + (m.type === 2 ? ' (external)' : '');

  return (
    <div className="p-12 bg-white text-black print:p-0 print:bg-white print:text-black min-h-[90vh]">
      {/* Header 1: Centered */}
      <div className="text-center mb-2">
        <h1 className="text-4xl font-extrabold mb-1">{company?.name || ''}</h1>
        {company?.number && <div className="text-lg mb-1">ח.פ{company.number}</div>}
        {company?.address && <div className="text-base mb-1">{company.address}</div>}
        <div className="text-xl font-semibold mb-1">
          פרוטוקול {protocol.committee?.name || ''} מספר {protocol.number}
        </div>
      </div>
      {/* Main content: right-aligned */}
      <div className="text-right">
        {/* Header 2: Right-aligned */}
        <div className="flex flex-row-reverse mb-8">
          <div className="text-right space-y-1">
            <div>תאריך הישיבה {formatDate(protocol.due_date)}</div>
            <div>מספר חברי הישיבה {protocolMembers.length}</div>
            <div className="flex flex-row-reverse items-baseline"><span className="inline-block w-24 font-semibold shrink-0 text-right">הוזמנו:</span> {invited.map(formatName).join(", ")}</div>
            <div className="flex flex-row-reverse items-baseline"><span className="inline-block w-24 font-semibold shrink-0 text-right">נחכו:</span> {present.map(formatName).join(", ")}</div>
            <div className="flex flex-row-reverse items-baseline"><span className="inline-block w-24 font-semibold shrink-0 text-right">נעדרו:</span> {absent.map(formatName).join(", ")}</div>
          </div>
        </div>
        {/* Agenda */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">סדר יום</h2>
          {agendaItems.length === 0 ? (
            <div className="text-muted-foreground">לא נמצאו נושאים</div>
          ) : (
            <ol className="space-y-2 list-decimal list-inside">
              {agendaItems
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((item, idx) => (
                  <li key={item.id} className="ml-2">{item.title}</li>
                ))}
            </ol>
          )}
        </section>
        {/* Agenda Details */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">דיון והחלטות</h2>
          {agendaItems.length === 0 ? (
            <div className="text-muted-foreground">לא נמצאו נושאים</div>
          ) : (
            <ol className="space-y-6 list-decimal list-inside">
              {agendaItems
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((item, idx) => (
                  <li key={item.id} className="ml-2">
                    <div className="font-semibold mb-1">{item.title}</div>
                    <div className="ml-4 mb-1 text-sm"><span className="font-medium">נושא:</span> {item.topic_content || "-"}</div>
                    <div className="ml-4 text-sm"><span className="font-medium">החלטה:</span> {item.decision_content || "-"}</div>
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProtocolPdfView; 