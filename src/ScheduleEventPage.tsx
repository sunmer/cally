// components/ScheduleEvent.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Settings from './Settings';
import ReactMarkdown from 'react-markdown';
import { ScheduleEvent } from './types';
import { useScheduleContext } from './ScheduleContext';

const ScheduleEventPage: React.FC = () => {
  const { uuid, id } = useParams<{ uuid: string; id: string }>();

  if (!uuid || !id) {
    return <div>Missing or invalid event parameters</div>;
  }

  const eventId = parseInt(id, 10);
  const { updateEvent } = useScheduleContext();

  // Two loaders: one for loading the event, one for generating additional content
  const [loadingContent, setLoadingContent] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [event, setEvent] = useState<ScheduleEvent | null>(null);

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
      setLoadingContent(true);
      let fetchedEvent = null;
      let requiresAdditionalContent = false;
      try {
        const response = await fetch(`${Settings.API_URL}/events?uuid=${uuid}&id=${eventId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch event');

        const data = await response.json();
        fetchedEvent = data.event;
        requiresAdditionalContent = data.requiresAdditionalContent;
        setEvent(fetchedEvent);
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoadingContent(false);
      }

      // If the event requires additional generated content
      if (requiresAdditionalContent && fetchedEvent) {
        setGeneratingContent(true);
        try {
          const suggestionResponse = await fetch(`${Settings.API_URL}/suggest?type=generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fetchedEvent),
          });

          if (!suggestionResponse.ok) throw new Error('Failed to generate content');

          const suggestionData = await suggestionResponse.json();
          const messageContent = suggestionData?.choices?.[0]?.message?.content || 'No content received.';

          try {
            const parsed: { content: string; questions: string[] } = JSON.parse(messageContent);
            // Update local state with generated content.
            setEvent(prev => prev ? { ...prev, content: parsed.content, questions: parsed.questions } : null);

            // Also update the event in the backend.
            updateEvent(uuid, eventId, { content: parsed.content, questions: parsed.questions })
              .then(updated => {
                setEvent(updated);
              })
              .catch(err => console.error("Error updating event in backend:", err));
          } catch (err) {
            console.warn('Could not parse messageContent as JSON:', err);
          }
        } catch (err) {
          console.error("Error generating content:", err);
        } finally {
          setGeneratingContent(false);
        }
      }
    };

    fetchEvent();
  }, [uuid, eventId, updateEvent]);

  return (
    <div className="relative overflow-hidden">
      <div className="max-w-[60rem] min-h-[40rem] mx-auto px-4 sm:px-6 lg:px-8 text-left mb-12">
        <div className="flex flex-col bg-white shadow-sm rounded-xl pointer-events-auto">
          <div className="flex justify-between bg-red-500 rounded-t-xl text-white items-center py-3 px-4 border-b border-gray-200">
            <h3 className="font-bold text-white">
              {event?.title || "Loading content"} {event && `- ${formattedDate}`}
            </h3>
          </div>
          <div className="px-4 py-6">
            {loadingContent ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading content...
              </div>
            ) : generatingContent ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Generating content for {event?.title}...
              </div>
            ) : (
              <div className="prose overflow-y-scroll prose-gray max-w-none text-gray-800">
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

export default ScheduleEventPage;
