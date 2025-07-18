import React from "react";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface AgendaItem {
  id: string;
  title: string;
  display_order?: number | null;
}

interface ProtocolQuickNavProps {
  showStickyNav: boolean;
  agendaItems: AgendaItem[];
  activeSection: string;
  setActiveSection: (section: string) => void;
  activeAgendaItem: string | null;
  setActiveAgendaItem: (id: string | null) => void;
  scrollToSection: (sectionId: string) => void;
  scrollToAgendaItem: (itemId: string) => void;
}

export const ProtocolQuickNav: React.FC<ProtocolQuickNavProps> = ({
  showStickyNav,
  agendaItems,
  activeSection,
  setActiveSection,
  activeAgendaItem,
  setActiveAgendaItem,
  scrollToSection,
  scrollToAgendaItem,
}) => {
  if (!showStickyNav) return null;
  return (
    <div className="sticky top-[72px] z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm animate-in slide-in-from-top-2 duration-300">
      <div className="px-8 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-muted-foreground">ניווט מהיר:</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveSection("protocol-details");
                scrollToSection("protocol-details");
              }}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary px-3 py-1 rounded-md",
                activeSection === "protocol-details"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              פרטי פרוטוקול
            </button>
            <button
              onClick={() => {
                setActiveSection("agenda-list");
                setActiveAgendaItem(null);
                scrollToSection("agenda-list");
              }}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary px-3 py-1 rounded-md",
                activeSection === "agenda-list" && !activeAgendaItem
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              סדר יום
            </button>
            {/* Agenda item numbers navigation */}
            {agendaItems.length > 0 && (
              <div className="flex items-center gap-1 ml-4">
                {agendaItems
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                  .map((item, idx) => {
                    const firstTwoWords = item.title.split(" ").slice(0, 2).join(" ");
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveAgendaItem(item.id);
                          setActiveSection("agenda-list");
                          scrollToAgendaItem(item.id);
                        }}
                        className={cn(
                          "text-sm font-medium transition-colors hover:text-primary px-3 py-1 rounded-md flex items-center gap-1 w-auto max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap",
                          activeSection === "agenda-list" && activeAgendaItem === item.id
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                        title={item.title}
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold border border-border mr-1">
                          {item.display_order || idx + 1}
                        </span>
                        <span className="truncate">{firstTwoWords}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 