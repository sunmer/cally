// components/ScheduleEvent.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Settings from './Settings';
import ReactMarkdown from 'react-markdown';

export type ScheduleEventData = {
  id: number;
  title: string;
  description: string;
  content: string;
  questions: string[];
  start: string;
  end: string;
};

const ScheduleEvent: React.FC = () => {
  const { uuid, id } = useParams<{ uuid: string; id: string }>();

  if (!uuid || !id) {
    return <div>Missing or invalid event parameters</div>;
  }
  const eventId = parseInt(id, 10);

  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<ScheduleEventData | null>(null);

  // Format date similar to ModalScheduleEvent
  let formattedDate = "";
  if (event) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const month = eventStart.toLocaleString('default', { month: 'short' });
    const day = eventStart.getDate();
    const startTime = eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = eventEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    formattedDate = `${month} ${day}, ${startTime} - ${endTime}`;
  }

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${Settings.API_URL}/events/${uuid}/${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch event');
        const data: ScheduleEventData = await res.json();
        setEvent(data);
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [uuid, eventId]);

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="max-w-[85rem] min-h-[40rem] mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="flex flex-col bg-white shadow-sm rounded-xl pointer-events-auto">
          <div className="flex justify-between bg-red-500 rounded-t-xl text-white items-center py-3 px-4 border-b border-gray-200">
            <h3 className="font-bold text-white">
              {event?.title || "Loading..."} {event && `- ${formattedDate}`}
            </h3>
          </div>
          <div className="px-4 py-6">
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading event...
              </div>
            ) : (
              <div className="prose overflow-y-auto max-h-96 prose-gray max-w-none text-gray-800">
                {event ? (
                  <ReactMarkdown>{event.content}</ReactMarkdown>
                ) : (
                  <p>No event found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEvent;
