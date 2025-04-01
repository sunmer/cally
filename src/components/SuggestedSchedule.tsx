import React, { useEffect, useState } from 'react';
import { Check, Download, Loader2 } from "lucide-react";
import IconGoogleCalendar from "../assets/icon-google-calendar.svg?react";
import { useScheduleContext } from '../ScheduleContext';
import { useAuth } from '../AuthContext';
import ModalScheduleItem from './ModalScheduleEvent';
import { formatEventDateRange } from '../util';
import { Schedule } from '../types';
import { toast } from 'react-toastify';

const SuggestedSchedule: React.FC = () => {
  const { schedule, addScheduleToGoogleCalendar, downloadICS } = useScheduleContext();
  const { isAuthenticated, login } = useAuth();
  const [isModalScheduleEventOpen, setIsModalScheduleEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [addToCalendarLoading, setAddToCalendarLoading] = useState(false);
  const [downloadICSLoading, setDownloadICSLoading] = useState(false);
  const [addToCalendarSuccess, setAddToCalendarSuccess] = useState(false);

  useEffect(() => {
    const addPendingSchedule = async () => {
      const storedScheduleStr = localStorage.getItem("pendingSchedule");
      if (isAuthenticated && storedScheduleStr) {
        setAddToCalendarLoading(true);
        
        try {
          const storedSchedule: Schedule = JSON.parse(storedScheduleStr);
          toast(`Adding ${storedSchedule.title} to your Google calendar...`);
          await addScheduleToGoogleCalendar(storedSchedule);
          localStorage.removeItem("pendingSchedule");
          setAddToCalendarSuccess(true);
          toast(`${storedSchedule.title} was successfully added to your calendar!`);
        } catch (err) {
          const storedSchedule = JSON.parse(storedScheduleStr);
          toast(`Failed to add ${storedSchedule.title} to your Google calendar!`);
          console.error(err);
        } finally {
          setAddToCalendarLoading(false);
        }
      }
    };

    addPendingSchedule();
  }, [isAuthenticated, addScheduleToGoogleCalendar]);

  const openModalWithEvent = (
    e: React.MouseEvent<HTMLAnchorElement>,
    clickedEvent: any
  ) => {
    e.preventDefault();
    setSelectedEvent(clickedEvent);
    setIsModalScheduleEventOpen(true);
  };

  const handleAddToCalendar = async () => {
    if (!schedule) return;
    setAddToCalendarLoading(true);

    if (!isAuthenticated) {
      localStorage.setItem("pendingSchedule", JSON.stringify(schedule));
      login();
      return;
    }
    try {
      await addScheduleToGoogleCalendar(schedule);
      setAddToCalendarSuccess(true);
      toast(`${schedule.title} was successfully added to your calendar!`);
    } catch (err) {
      toast(`Failed to add ${schedule.title} to your Google calendar!`);
      console.error(err);
    } finally {
      setAddToCalendarLoading(false);
    }
  };

  const handleDownloadICS = async () => {
    if (!schedule) return;
    if (!isAuthenticated) {
      localStorage.setItem("pendingSchedule", JSON.stringify(schedule));
      login();
      return;
    }
    setDownloadICSLoading(true);
    try {
      await downloadICS(schedule);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadICSLoading(false);
    }
  };

  // Early return after all hooks have been called
  if (!schedule || schedule.events.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        <h2 className="text-xl font-bold md:text-3xl text-gray-800">
          {schedule.title}
        </h2>

        <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0 md:ml-auto mb-4 md:mb-0">
          <button
            onClick={handleAddToCalendar}
            disabled={addToCalendarLoading || addToCalendarSuccess}
            className="inline-flex justify-center items-center gap-x-3 text-center bg-teal-500 hover:bg-teal-600 focus:outline-none border border-transparent text-white text-sm font-medium rounded-full py-3 px-4 disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              {addToCalendarLoading ? (
                <>
                  Adding to your calendar
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : addToCalendarSuccess ? (
                <>
                  Added to your calendar!
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Add to my calendar
                  <IconGoogleCalendar className="w-5 h-5" />
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleDownloadICS}
            disabled={downloadICSLoading}
            className="inline-flex justify-center items-center gap-x-3 text-center border text-gray-600 text-sm font-medium rounded-full py-3 px-4 disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              {downloadICSLoading ? (
                <>
                  Downloading ICS
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  Download as ICS
                  <Download className="w-4 h-4" />
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-4 schedule">
        {schedule.events.map((event, index) => {
          const eventDate = formatEventDateRange(event)
          return (
            <div key={index} className="mb-4">
              <div className="flex max-h-48 flex-col w-full bg-white rounded shadow-lg border animate-fade-in">
                <a
                  className={`flex flex-col w-full md:flex-row ${schedule.requiresAdditionalContent ? 'cursor-pointer' : ''}`}
                  onClick={(e) => schedule.requiresAdditionalContent ? openModalWithEvent(e, event) : e.preventDefault()}
                >
                  <div className="flex bg-red-500 flex-row justify-start p-4 font-bold leading-none text-gray-800 uppercase bg-gray-400 rounded-t md:rounded-t-none md:rounded-tl md:rounded-bl md:flex-col md:items-center md:justify-center md:w-1/4">
                    <div className="md:text-2xl text-white mr-2">{eventDate.month}</div>
                    <div className="md:text-5xl text-white mr-2">{eventDate.day}</div>
                    <div className="md:text-xl text-white">{eventDate.startTime} - {eventDate.endTime}</div>
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
      <ModalScheduleItem
        isOpened={isModalScheduleEventOpen}
        onClose={() => setIsModalScheduleEventOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default SuggestedSchedule;