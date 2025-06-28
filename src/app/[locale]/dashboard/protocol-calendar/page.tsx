"use client";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState } from "react";
import { fetchAllProtocolsWithDueDatesAndMessageSent } from "../protocols/[id]/supabaseApi";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ProtocolCreateForm from "./ProtocolCreateForm";

export default function ProtocolCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    const fetchProtocols = async () => {
      setLoading(true);
      try {
        const protocols = await fetchAllProtocolsWithDueDatesAndMessageSent();
        const mappedEvents: any[] = [];
        (protocols || []).forEach((protocol: any) => {
          mappedEvents.push({
            id: protocol.id,
            title: `#${protocol.number}${protocol.committee?.name ? ` - ${protocol.committee.name}` : ""}`,
            start: protocol.due_date,
            allDay: true,
            url: `/dashboard/protocols/${protocol.id}`,
          });
          if (protocol.sent_time) {
            mappedEvents.push({
              id: `${protocol.id}-sent`,
              title: `Protocol #${protocol.number} sent`,
              start: protocol.sent_time,
              allDay: false,
              url: `/dashboard/protocols/${protocol.id}`,
              color: '#22c55e', // green for sent
            });
          }
        });
        setEvents(mappedEvents);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchProtocols();
  }, [refreshFlag]);

  const handleDateSelect = (info: any) => {
    setSelectedDate(info.startStr);
    setModalOpen(true);
  };

  const handleProtocolCreated = async () => {
    setModalOpen(false);
    setSelectedDate(null);
    setLoading(true);
    setRefreshFlag(f => f + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Calendar</h1>
          {/* Example action button */}
          {/* <button className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark transition">Add Event</button> */}
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading events...</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              editable={true}
              selectable={true}
              events={events}
              height="auto"
              select={handleDateSelect}
            />
          )}
        </div>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogTitle>Create New Protocol</DialogTitle>
          <ProtocolCreateForm 
            initialDate={selectedDate}
            onSuccess={handleProtocolCreated}
            onCancel={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        .dark .fc {
          background-color: #18181b !important;
          color: #e5e7eb !important;
        }
        .dark .fc .fc-toolbar-title {
          color: #e5e7eb !important;
        }
        .dark .fc .fc-button {
          background: #27272a !important;
          color: #e5e7eb !important;
          border: none;
        }
        .dark .fc .fc-button-active, .dark .fc .fc-button-primary:not(:disabled):active {
          background: #3f3f46 !important;
        }
        .dark .fc .fc-daygrid-day, .dark .fc .fc-timegrid-slot {
          background: #18181b !important;
        }
        .dark .fc .fc-day-today {
          background: #27272a !important;
        }
        .dark .fc .fc-daygrid-day-number {
          color: #e5e7eb !important;
        }
        .dark .fc .fc-col-header-cell,
        .dark .fc .fc-col-header-cell-cushion {
          background: #18181b !important;
          color: #e5e7eb !important;
        }
        .dark .fc .fc-scrollgrid {
          background: #18181b !important;
        }
      `}</style>
    </div>
  );
} 