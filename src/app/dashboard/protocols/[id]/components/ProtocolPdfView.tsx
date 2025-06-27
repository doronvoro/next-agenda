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
          <ProtocolDetailsFields protocol={protocol} formatDate={formatDate} company={company} protocolMembers={protocolMembers} />
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
            <div className="space-y-8">
              {agendaItems
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((item, idx) => (
                  <div key={item.id} className="border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                        {item.display_order || idx + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <div className="space-y-4 pl-11">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">תוכן נושא</div>
                        <div className="min-h-[80px] w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground">
                          {item.topic_content ? (
                            <div className="whitespace-pre-wrap">{item.topic_content}</div>
                          ) : (
                            <div className="text-muted-foreground italic">No topic content</div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">תוכן החלטה</div>
                        <div className="min-h-[80px] w-full rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground">
                          {item.decision_content ? (
                            <div className="whitespace-pre-wrap">{item.decision_content}</div>
                          ) : (
                            <div className="text-muted-foreground italic">אין תוכן החלטה</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProtocolPdfView; 