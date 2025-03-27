import { useState } from 'react';
import { toast } from 'react-toastify';
import Settings from '../Settings';
import { Schedule } from '../types';

// Utility functions for ICS generation
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

const generateICS = (schedule: Schedule): string => {
  let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Calera//EN\r\n";
  schedule.events.forEach((event, index) => {
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

export const useCalendar = () => {
  const [addLoading, setAddLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const addToCalendar = async (schedule: Schedule) => {
    if (!schedule) return;
    setAddLoading(true);
    try {
      const calendarAddResponse = await fetch(`${Settings.API_URL}/google?type=calendar-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
        credentials: 'include'
      });
      if (!calendarAddResponse.ok) throw new Error('Failed to add events to calendar');
      
      // Save the schedule in your DB
      await fetch(`${Settings.API_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedule)
      });
      toast(`${schedule.title} was successfully added to your calendar!`);
    } catch (err: any) {
      console.error("Error adding events to calendar:", err);
      throw err;
    } finally {
      setAddLoading(false);
    }
  };

  const downloadICS = async (schedule: Schedule) => {
    if (!schedule) return;
    setDownloadLoading(true);
    try {
      const icsString = generateICS(schedule);
      const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${schedule.title.replace(/\s+/g, "_")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Save schedule to your DB (if needed)
      await fetch(`${Settings.API_URL}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(schedule),
      });
      toast(`${schedule.title} was successfully downloaded`);
    } catch (err: any) {
      console.error("Error downloading ICS:", err);
      throw err;
    } finally {
      setDownloadLoading(false);
    }
  };

  return { addToCalendar, downloadICS, addLoading, downloadLoading };
};
