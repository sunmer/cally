import React, { createContext, useContext, useState } from 'react';
import Settings from './Settings';
import { Schedule } from './types';
import { toast } from 'react-toastify';

type ScheduleContextType = {
  schedule: Schedule | null;
  mySchedules: Schedule[];
  loading: boolean;
  error: string | null;
  createSchedule: (query: string) => Promise<void>;
  addToCalendar: (schedule: Schedule) => Promise<void>;
  downloadICS: (schedule: Schedule) => Promise<void>;
  fetchSchedules: () => Promise<void>;
  addLoading: boolean;
  downloadLoading: boolean;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ 
  children: React.ReactNode; 
}> = ({ children }) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const createSchedule = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${Settings.API_URL}/suggest?type=suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });
      if (!res.ok) throw new Error('Failed to get events');
      const data = await res.json();
      const scheduleData: Schedule = JSON.parse(data.choices[0].message.content);
      setSchedule(scheduleData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateToICS = (dateString: string): string => {
    const date = new Date(dateString);
    const pad = (num: number) => (num < 10 ? "0" + num : num);
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  };

  const generateICS = (sch: Schedule): string => {
    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Calera//EN\r\n";
    sch.events.forEach((event, index) => {
      const uid = event.id || `${index}-${new Date().getTime()}@calera.app`;
      const dtstamp = formatDateToICS(new Date().toISOString());
      const dtstart = formatDateToICS(event.start);
      const dtend = formatDateToICS(event.end);
      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `UID:${uid}\r\n`;
      icsContent += `DTSTAMP:${dtstamp}\r\n`;
      icsContent += `DTSTART:${dtstart}\r\n`;
      icsContent += `DTEND:${dtend}\r\n`;
      icsContent += `SUMMARY:${event.title}\r\n`;
      if (event.description) {
        icsContent += `DESCRIPTION:${event.description}\r\n`;
      }
      icsContent += "END:VEVENT\r\n";
    });
    icsContent += "END:VCALENDAR";
    return icsContent;
  };

  const addToCalendar = async (schedule: Schedule) => {
    if (!schedule) return;

    setAddLoading(true);
    
    try {
      // Save the schedule in your DB
      const createScheduleResponse = await fetch(`${Settings.API_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedule)
      });

      if (!createScheduleResponse.ok) throw new Error('Failed to save schedule');

      const createScheduleResponseJSON = await createScheduleResponse.json();

      schedule.uuid = createScheduleResponseJSON.uuid;

      const addScheduleToGoogleCalendarResponse = await fetch(`${Settings.API_URL}/google?type=add-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
        credentials: 'include'
      });
      
      if (!addScheduleToGoogleCalendarResponse.ok) throw new Error('Failed to add events to calendar');

      toast(`${schedule.title} was successfully added to your calendar!`);
    } catch (err: any) {
      console.error("Error adding events to calendar:", err);
      throw err;
    } finally {
      setAddLoading(false);
    }
  };

  const downloadICS = async (sch: Schedule) => {
    if (!sch) return;
    setDownloadLoading(true);
    try {
      const icsString = generateICS(sch);
      const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sch.title.replace(/\s+/g, "_")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Save schedule to your DB (if needed)
      await fetch(`${Settings.API_URL}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sch),
      });
    } catch (err: any) {
      console.error("Error downloading ICS:", err);
      throw err;
    } finally {
      setDownloadLoading(false);
    }
  };

  // New function to fetch schedules (moved from the previous useEffect)
  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${Settings.API_URL}/schedules`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setMySchedules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScheduleContext.Provider value={{
      schedule,
      mySchedules,
      loading,
      error,
      createSchedule,
      addToCalendar,
      downloadICS,
      fetchSchedules,
      addLoading,
      downloadLoading
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useScheduleContext must be used within a ScheduleProvider");
  }
  return context;
};
