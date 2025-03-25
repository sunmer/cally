import React, { useState } from 'react';
import { CalendarCheck, Loader2 } from "lucide-react";
import { CalendarEventItem, CalendarSchedule } from './types';
import ScheduleItem from './components/ModalScheduleEvent';

type SuggestedScheduleProps = {
  schedule: CalendarSchedule | null;
  addToCalendarLoading: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  addToCalendar: () => void;
  handleAuth: () => void;
};

const SuggestedSchedule: React.FC<SuggestedScheduleProps> = ({
  schedule,
  addToCalendarLoading,
  authLoading,
  isAuthenticated,
  addToCalendar,
  handleAuth,
}) => {
  if (!schedule || schedule.events.length === 0) return null;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  const openModalWithEvent = (
    e: React.MouseEvent<HTMLAnchorElement>,
    clickedEvent: CalendarEventItem
  ) => {
    e.preventDefault();
    setSelectedEvent(clickedEvent);
    setModalOpen(true);
  };

  return (
    <div className="mt-8 bg-white rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        <h2 className="text-xl font-medium text-black sm:text-center">{schedule.title}</h2>
        <button
          onClick={() => {
            if (!isAuthenticated) {
              localStorage.setItem("pendingSchedule", JSON.stringify(schedule));
              handleAuth();
            } else {
              addToCalendar();
            }
          }}
          disabled={addToCalendarLoading || authLoading}
          className="w-full md:w-auto mt-2 md:mt-0 py-3 px-4 inline-flex items-center justify-center text-sm font-medium rounded-lg text-gray-800 shadow-[0px_1px_1px_#a1e0b2] bg-green-200 hover:bg-green-300 disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            {addToCalendarLoading ? (
              <>
                Adding to your calendar
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : authLoading ? (
              <>
                Authenticating
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                Add to my calendar
                <CalendarCheck className="w-5 h-5" />
              </>
            )}
          </div>
        </button>
      </div>
      <ul className="mt-4 space-y-4 schedule">
        {schedule.events.map((event, index) => {
          const eventDate = new Date(event.start);
          const month = eventDate.toLocaleString('default', { month: 'short' });
          const day = eventDate.getDate();
          const startTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={index} className="mb-4">
              <div className="flex max-h-48 flex-col w-full bg-white rounded shadow-lg border">
                <a
                  className={`flex flex-col w-full md:flex-row ${schedule.requiresAdditionalContent ? 'cursor-pointer' : ''}`}
                  onClick={(e) => schedule.requiresAdditionalContent ? openModalWithEvent(e, event) : e.preventDefault() }
                >
                  <div className="flex bg-red-500 flex-row justify-start p-4 font-bold leading-none text-gray-800 uppercase bg-gray-400 rounded-t md:rounded-t-none md:rounded-tl md:rounded-bl md:flex-col md:items-center md:justify-center md:w-1/4">
                    <div className="md:text-2xl text-white mr-2 md:mr-0">{month}</div>
                    <div className="md:text-5xl text-white mr-2 md:mr-0">{day}</div>
                    <div className="md:text-xl text-white">{startTime} - {endTime}</div>
                  </div>
                  <div className="p-4 font-normal text-gray-800 md:w-3/4">
                    <h1 className="mb-2 text-xl md:text-3xl font-bold leading-none tracking-tight text-gray-800">
                      {event.title}
                    </h1>
                    <p className="text-gray-600 truncate">{event.description}</p>
                  </div>
                </a>
              </div>
            </div>
          );
        })}
      </ul>

      <ScheduleItem
        isOpened={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default SuggestedSchedule;
