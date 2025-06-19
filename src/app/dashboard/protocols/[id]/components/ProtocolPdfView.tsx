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
  company?: { name?: string | null; number?: string | null };
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
    <div className="p-8 bg-white text-black print:p-0 print:bg-white print:text-black">
      <h1 className="text-3xl font-bold mb-2 text-center">{company?.name || `Protocol #${protocol.number}`}</h1>
      {company?.number && (
        <div className="text-center text-lg text-muted-foreground mb-2">Company Number: {company.number}</div>
      )}
      <div className="text-center mb-6">
        <div className="text-lg font-semibold">Protocol #{protocol.number}</div>
        <div className="text-base">Committee: {protocol.committee?.name || "Not assigned"}</div>
        <div className="text-base">Due Date: {formatDate(protocol.due_date)}</div>
      </div>
      <ProtocolDetailsFields protocol={protocol} formatDate={formatDate} company={company} />

      <PdfSection title="Agenda">
        {agendaItems.length === 0 ? (
          <div className="text-muted-foreground">No agenda items found</div>
        ) : (
          <ol className="space-y-4 list-decimal list-inside">
            {agendaItems
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((item) => (
                <li key={item.id}>
                  <div className="font-semibold">{item.title}</div>
                  <div className="ml-4">
                    <div className="text-sm"><span className="font-medium">Topic:</span> {item.topic_content || "-"}</div>
                    <div className="text-sm"><span className="font-medium">Decision:</span> {item.decision_content || "-"}</div>
                  </div>
                </li>
              ))}
          </ol>
        )}
      </PdfSection>

      <PdfSection title="Members">
        {protocolMembers.length === 0 ? (
          <div className="text-muted-foreground">No members found</div>
        ) : (
          <div className="space-y-2">
            <div><span className="font-semibold">Invited:</span> {invited.map(formatName).join(", ")}</div>
            <div><span className="font-semibold">Present:</span> {present.map(formatName).join(", ")}</div>
            <div><span className="font-semibold">Absent:</span> {absent.map(formatName).join(", ")}</div>
          </div>
        )}
      </PdfSection>

      <PdfSection title="Attachments">
        {protocolAttachments.length === 0 ? (
          <div className="text-muted-foreground">No attachments found</div>
        ) : (
          <table className="w-full border print:text-xs">
            <thead>
              <tr>
                <th className="border px-2 py-1">File Name</th>
                <th className="border px-2 py-1">Size</th>
                <th className="border px-2 py-1">Type</th>
                <th className="border px-2 py-1">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {protocolAttachments.map((a) => (
                <tr key={a.id}>
                  <td className="border px-2 py-1">{a.file_name}</td>
                  <td className="border px-2 py-1">{(a.file_size / 1024 / 1024).toFixed(2)} MB</td>
                  <td className="border px-2 py-1">{a.mime_type}</td>
                  <td className="border px-2 py-1">{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PdfSection>

      <PdfSection title="Messages">
        {protocolMessages.length === 0 ? (
          <div className="text-muted-foreground">No messages found</div>
        ) : (
          <ul className="space-y-2">
            {protocolMessages.map((msg) => (
              <li key={msg.id} className="border-b pb-2">
                <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                <div className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </PdfSection>
    </div>
  );
};

export default ProtocolPdfView; 