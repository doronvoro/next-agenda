"use client";

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function ProtocolCalendarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Calendar</h1>
          {/* Example action button */}
          {/* <button className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark transition">Add Event</button> */}
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
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
            events={[]}
            height="auto"
          />
        </div>
      </div>
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