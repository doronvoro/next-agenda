import React from "react";
import type { Protocol, AgendaItem, ProtocolMember, ProtocolAttachment, ProtocolMessage } from "../types";
import { ProtocolDetailsFields } from "./ProtocolDetailsFields";
import { Separator } from "@/components/ui/separator";

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
    <div className="p-12 bg-card text-foreground print:p-0 print:bg-white print:text-black min-h-[90vh]" dir="rtl">
      {/* Protocol Details Section */}
      <section className="mb-8">
        <div className="bg-muted/50 rounded-lg p-6 mb-6">
          <ProtocolDetailsFields protocol={protocol} formatDate={formatDate} company={company} />
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex flex-row items-center mb-2">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-5a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-lg font-semibold text-foreground">נכחו:</span>
              </div>
              <span className="text-foreground mr-4">{present.map(formatName).join(", ")}</span>
            </div>
            {absent.length > 0 && (
              <div className="flex flex-row items-center">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-5a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-lg font-semibold text-foreground">נעדרו:</span>
                </div>
                <span className="text-foreground mr-4">{absent.map(formatName).join(" , ")}</span>
              </div>
            )}
          </div>
        </div>
      </section>
      <Separator className="mb-8" />
      {/* Agenda Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">סדר יום</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          {agendaItems.length === 0 ? (
            <div className="text-muted-foreground">לא נמצאו נושאים</div>
          ) : (
            <ul className="space-y-2">
              {agendaItems
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((item, idx) => (
                  <li key={item.id} className="ml-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-lg font-bold text-primary border border-border">{idx + 1}</span>
                    <span>{item.title}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
      <Separator className="mb-8" />
      {/* Agenda Details Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">דיון והחלטות</h2>
          <div className="text-sm text-muted-foreground">
            {agendaItems.length} נושא
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          {agendaItems.length === 0 ? (
            <div className="text-muted-foreground">לא נמצאו נושאים</div>
          ) : (
            <ul className="space-y-6">
              {agendaItems
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((item, idx) => (
                  <li key={item.id} className="ml-2 flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-lg font-bold text-primary border border-border mt-1">{idx + 1}</span>
                    <div>
                      <div className="font-semibold mb-1">{item.title}</div>
                      <div className="ml-4 mb-1 text-sm"><span className="font-medium">נושא:</span> {item.topic_content || "-"}</div>
                      <div className="ml-4 text-sm"><span className="font-medium">החלטה:</span> {item.decision_content || "-"}</div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProtocolPdfView; 