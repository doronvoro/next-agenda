import React from "react";

interface Company {
  name?: string | null;
  number?: string | null;
  address?: string | null;
}

interface Committee {
  id: string;
  name: string;
}

interface ProtocolMember {
  id: string;
  name: string | null;
  type: number;
  status: number;
}

interface AgendaItem {
  id: string;
  title: string;
  topic_content?: string | null;
  decision_content?: string | null;
  display_order?: number | null;
}

interface Protocol {
  number: number | string;
  due_date: string;
  committee: Committee | null;
  members: ProtocolMember[];
  agenda_items: AgendaItem[];
  company?: Company;
}

export const AIProtocolPreview: React.FC<{ protocol: Protocol | null }> = ({ protocol }) => {
  if (!protocol) {
    return (
      <div className="p-6 text-muted-foreground text-center">No protocol data yet.</div>
    );
  }
  const { company, committee, number, due_date, members = [], agenda_items = [] } = protocol;
  const present = members.filter(m => m.status === 2);
  const absent = members.filter(m => m.status !== 2);
  const formatName = (m: ProtocolMember) => m.name + (m.type === 2 ? ' (external)' : '');
  return (
    <div className="p-6 bg-white border rounded-xl shadow min-h-[90vh] max-w-xl mx-auto text-black">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-extrabold mb-1">{company?.name || ''}</h1>
        {company?.number && <div className="text-lg mb-1">ח.פ{company.number}</div>}
        {company?.address && <div className="text-base mb-1">{company.address}</div>}
        <div className="text-xl font-semibold mb-1">
          פרוטוקול {committee?.name || ''} מספר {number}
        </div>
      </div>
      <div className="text-right">
        <div className="flex flex-row-reverse mb-8">
          <div className="text-right space-y-1">
            <div>תאריך הישיבה {due_date}</div>
            <div>מספר חברי הישיבה {members.length}</div>
            <div className="flex flex-row-reverse items-baseline"><span className="inline-block w-24 font-semibold shrink-0 text-right">הוזמנו:</span> {members.map(formatName).join(", ")}</div>
            <div className="flex flex-row-reverse items-baseline"><span className="inline-block w-24 font-semibold shrink-0 text-right">נחכו:</span> {present.map(formatName).join(", ")}</div>
            <div className="flex flex-row-reverse items-baseline"><span className="inline-block w-24 font-semibold shrink-0 text-right">נעדרו:</span> {absent.map(formatName).join(", ")}</div>
          </div>
        </div>
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">סדר יום</h2>
          {agenda_items.length === 0 ? (
            <div className="text-muted-foreground">לא נמצאו נושאים</div>
          ) : (
            <ol className="space-y-2 list-decimal list-inside">
              {agenda_items
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((item) => (
                  <li key={item.id} className="ml-2">{item.title}</li>
                ))}
            </ol>
          )}
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">דיון והחלטות</h2>
          {agenda_items.length === 0 ? (
            <div className="text-muted-foreground">לא נמצאו נושאים</div>
          ) : (
            <ol className="space-y-6 list-decimal list-inside">
              {agenda_items
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((item) => (
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