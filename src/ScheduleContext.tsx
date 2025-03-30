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
  createSchedule: (query: string) => Promise<void>;
  addToCalendar: (schedule: Schedule) => Promise<void>;
  downloadICS: (schedule: Schedule) => Promise<void>;
  fetchSchedules: () => Promise<void>;
  updateEvent: (
    uuid: string,
    id: number,
    updatedEvent: Partial<ScheduleEvent>
  ) => Promise<ScheduleEvent>;
  addLoading: boolean;
  downloadLoading: boolean;
};

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Create a schedule based on a query string.
  // In your ScheduleContext.tsx

const createSchedule = async (query: string) => {
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
    let processedEventTitles = new Set<string>();
    
    const processBuffer = () => {
      // First, try to extract title and requiresAdditionalContent
      const titleMatch = buffer.match(/"title"\s*:\s*"([^"]+)"/);
      const requiresMatch = buffer.match(/"requiresAdditionalContent"\s*:\s*(true|false)/);
      
      if (titleMatch && requiresMatch) {
        setSchedule(prevSchedule => {
          if (!prevSchedule) return prevSchedule;
          
          return {
            ...prevSchedule,
            title: titleMatch[1],
            requiresAdditionalContent: requiresMatch[1] === 'true'
          };
        });
      }

      // Now look for events in the form {"id":1,...}
      const eventRegex = /{[^{}]*"title"[^{}]*"start"[^{}]*"end"[^{}]*}/g;
      const eventMatches = [...buffer.matchAll(eventRegex)];
      
      if (eventMatches.length > 0) {
        console.log(`Found ${eventMatches.length} potential events in this chunk`);
        
        for (const match of eventMatches) {
          try {
            const eventJson = match[0];
            const eventObj = JSON.parse(eventJson);

            // Validate it's an event object
            if (eventObj.title && eventObj.start && eventObj.end) {
              console.log("Found valid event:", eventObj.title);
              
              // Check if we've already processed this event
              if (!processedEventTitles.has(eventObj.title)) {
                processedEventTitles.add(eventObj.title);
                
                // Force a render by updating outside of the batch
                setTimeout(() => {
                  setSchedule(prevSchedule => {
                    if (!prevSchedule) return prevSchedule;
                    
                    console.log("Adding event to schedule:", eventObj.title);
                    return {
                      ...prevSchedule,
                      events: [...(prevSchedule.events || []), eventObj]
                    };
                  });
                }, 0);
              }
            }
          } catch (e) {
            console.error("Error parsing event:", e);
          }
        }
      }
      
      // Remove complete event objects we've already processed to avoid duplicates
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
        console.log("Stream complete");
        // Process any remaining data
        processBuffer();
        break;
      }
      
      // Add new chunk to buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // Process the current buffer
      processBuffer();
    }
    
  } catch (err: any) {
    console.error("Error in createSchedule:", err);
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
  const addToCalendar = async (schedule: Schedule) => {
    if (!schedule) return;
    setAddLoading(true);
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
      setAddLoading(false);
    }
  };

  // Generate and download an ICS file.
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

      // Optionally, save schedule to your DB.
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
        createSchedule,
        addToCalendar,
        downloadICS,
        fetchSchedules,
        updateEvent,
        addLoading,
        downloadLoading,
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