import React, { createContext, useContext, useState } from 'react';
import Settings from './Settings';
import { Schedule, ScheduleEvent } from './types';
import { toast } from 'react-toastify';

type ScheduleContextType = {
  schedule: Schedule | null;
  setSchedule: React.Dispatch<React.SetStateAction<Schedule | null>>;
  mySchedules: Schedule[];
  loading: boolean;
  error: string | null;
  suggestSchedule: (query: string) => Promise<void>;
  addScheduleToCalendar: (schedule: Schedule) => Promise<void>;
  downloadICS: (schedule: Schedule) => Promise<void>;
  fetchSchedules: () => Promise<void>;
  updateEvent: (
    uuid: string,
    id: number,
    updatedEvent: Partial<ScheduleEvent>
  ) => Promise<ScheduleEvent>;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a schedule based on a query string.
  // In your ScheduleContext.tsx

  const suggestSchedule = async (query: string) => {
    setLoading(true);
    setError(null);

    // Initialize with empty schedule structure
    setSchedule({
      title: '',
      requiresAdditionalContent: false,
      events: []
    });

    try {
      const res = await fetch(
        `${Settings.API_URL}/suggest/calendar?text=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok || !res.body) throw new Error('Failed to get events');

      // Set up stream parsing
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let processedEventIds = new Set<string>();
      let scheduleTitle = '';
      let requiresAdditionalContent = false;
      let allEvents: any[] = [];

      const processBuffer = () => {
        // Try to extract title and requiresAdditionalContent if not already found
        if (!scheduleTitle) {
          const titleMatch = buffer.match(/"title"\s*:\s*"([^"]+)"/);
          if (titleMatch) {
            scheduleTitle = titleMatch[1];
          }
        }

        if (requiresAdditionalContent === false) {
          const requiresMatch = buffer.match(/"requiresAdditionalContent"\s*:\s*(true|false)/);
          if (requiresMatch) {
            requiresAdditionalContent = requiresMatch[1] === 'true';
          }
        }

        // If we have title and requiresAdditionalContent, update the schedule
        if (scheduleTitle && requiresAdditionalContent !== undefined) {
          setSchedule(prevSchedule => {
            if (!prevSchedule) return prevSchedule;
            return {
              ...prevSchedule,
              title: scheduleTitle,
              requiresAdditionalContent
            };
          });
        }

        // Look for complete event objects
        // This regex is more strict to ensure we get complete JSON objects
        const eventRegex = /{[^{}]*"title"[^{}]*"start"[^{}]*"end"[^{}]*}/g;
        const eventMatches = [...buffer.matchAll(eventRegex)];

        let newEvents: any[] = [];

        if (eventMatches.length > 0) {
          console.log(`Found ${eventMatches.length} potential events in this chunk`);

          for (const match of eventMatches) {
            try {
              const eventJson = match[0];
              const eventObj = JSON.parse(eventJson);

              // Validate it's an event object
              if (eventObj.title && eventObj.start && eventObj.end) {
                // Create a unique identifier using all event properties
                const eventId = `${eventObj.title}-${eventObj.start}-${eventObj.end}`;

                // Check if we've already processed this event
                if (!processedEventIds.has(eventId)) {
                  processedEventIds.add(eventId);
                  console.log("Found new event:", eventObj.title);
                  newEvents.push(eventObj);
                  allEvents.push(eventObj);
                }
              }
            } catch (e) {
              console.error("Error parsing event:", e, match[0]);
            }
          }

          // Batch update with all new events
          if (newEvents.length > 0) {
            setSchedule(prevSchedule => {
              if (!prevSchedule) return prevSchedule;
              return {
                ...prevSchedule,
                events: [...allEvents]
              };
            });
          }
        }

        // Clean up buffer by removing completely processed events
        eventMatches.forEach(match => {
          const index = buffer.indexOf(match[0]);
          if (index !== -1) {
            buffer = buffer.substring(0, index) + buffer.substring(index + match[0].length);
          }
        });
      };

      // Process the stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Stream complete, final event count:", allEvents.length);
          // Process any remaining data
          processBuffer();

          // Final update to ensure all events are included
          setSchedule(prevSchedule => {
            if (!prevSchedule) return prevSchedule;
            return {
              ...prevSchedule,
              title: scheduleTitle || prevSchedule.title,
              requiresAdditionalContent: requiresAdditionalContent !== undefined ? requiresAdditionalContent : prevSchedule.requiresAdditionalContent,
              events: allEvents
            };
          });
          break;
        }

        // Add new chunk to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        console.log("Received chunk:", chunk.length, "bytes");

        // Process the current buffer
        processBuffer();
      }

    } catch (err: any) {
      console.error("Error in suggestSchedule:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to generate ICS file content.
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

  // Save the schedule and add it to the user's Google Calendar.
  const addScheduleToCalendar = async (schedule: Schedule) => {
    if (!schedule) return;

    toast(`Adding ${schedule.title} to your Google calendar...`);
    setLoading(true);

    try {
      // Save the schedule in your DB.
      const createScheduleResponse = await fetch(`${Settings.API_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedule),
      });
      if (!createScheduleResponse.ok) throw new Error('Failed to save schedule');
      const createScheduleResponseJSON = await createScheduleResponse.json();
      schedule.uuid = createScheduleResponseJSON.uuid;

      // Add schedule to Google Calendar.
      const addScheduleToGoogleCalendarResponse = await fetch(
        `${Settings.API_URL}/google?type=add-schedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedule),
          credentials: 'include',
        }
      );
      if (!addScheduleToGoogleCalendarResponse.ok) throw new Error('Failed to add events to calendar');

      toast(`${schedule.title} was successfully added to your calendar!`);
    } catch (err: any) {
      console.error("Error adding events to calendar:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate and download an ICS file.
  const downloadICS = async (schedule: Schedule) => {
    if (!schedule) return;

    setLoading(true);
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

      // Optionally, save schedule to your DB.
      await fetch(`${Settings.API_URL}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(schedule),
      });
    } catch (err: any) {
      console.error("Error downloading ICS:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all schedules for the current user.
  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${Settings.API_URL}/schedules`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // Update an event in the schedule's events array.
  const updateEvent = async (
    uuid: string,
    id: number,
    updatedEvent: Partial<ScheduleEvent>
  ): Promise<ScheduleEvent> => {
    try {
      const response = await fetch(`${Settings.API_URL}/events?uuid=${uuid}&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedEvent),
      });
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      const data = await response.json();
      const updated = data.event;

      // Update the schedule state if it exists.
      if (schedule) {
        const updatedEvents = schedule.events.map((e: ScheduleEvent) =>
          e.id === id ? updated : e
        );
        setSchedule({ ...schedule, events: updatedEvents });
      }
      return updated;
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        setSchedule,
        mySchedules,
        loading,
        error,
        suggestSchedule,
        addScheduleToCalendar: addScheduleToCalendar,
        downloadICS,
        fetchSchedules,
        updateEvent,
      }}
    >
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

export default ScheduleContext;