// components/ScheduleEvent.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Settings from './Settings';
import ReactMarkdown from 'react-markdown';
import { ScheduleEvent } from './types';
import { useScheduleContext } from './ScheduleContext';
import { toast } from 'react-toastify';

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
  const [content, setContent] = useState<string | null>(null);

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
      let fetchedEvent: ScheduleEvent | null = null;
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

        if(!fetchedEvent) {
          toast('Could not find event')
          return
        }

        requiresAdditionalContent = data.requiresAdditionalContent;
        setEvent(fetchedEvent);

        // If event already has content, use it
        if (fetchedEvent.content) {
          setContent(fetchedEvent.content);
          setLoadingContent(false);
          return;
        }

        // If the event requires additional generated content
        if ((requiresAdditionalContent || !fetchedEvent.content) && fetchedEvent) {
          setLoadingContent(false);
          setGeneratingContent(true);

          // Build a query string from event details, similar to ModalScheduleEvent
          const params = new URLSearchParams({
            title: fetchedEvent.title,
            description: fetchedEvent.description || '',
            start: fetchedEvent.start,
            end: fetchedEvent.end,
          });

          try {
            const res = await fetch(`${Settings.API_URL}/suggest/content?${params.toString()}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok || !res.body) throw new Error('Failed to generate content');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let extractedContent = '';
            let extractedQuestions: string[] = [];
            let foundQuestions = false;

            // Read the stream chunk-by-chunk
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                console.log("Stream complete");
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              console.log("Received chunk:", chunk.length, "bytes");
              
              // Check if we've found the questions marker
              const questionsMarkerIndex = buffer.indexOf('<<<FOLLOW-UP-QUESTIONS>>>');

              if (questionsMarkerIndex !== -1 && !foundQuestions) {
                // Extract the content part (everything before the marker)
                extractedContent = buffer.substring(0, questionsMarkerIndex).trim();
                setContent(extractedContent);
                
                // Extract questions part
                const questionsText = buffer.substring(questionsMarkerIndex + '<<<FOLLOW-UP-QUESTIONS>>>'.length);
                try {
                  // Try to parse JSON array of questions if they exist
                  const questionsMatch = questionsText.match(/\[[\s\S]*\]/);
                  if (questionsMatch) {
                    extractedQuestions = JSON.parse(questionsMatch[0]);
                  }
                } catch (err) {
                  console.error("Error parsing questions:", err);
                }
                
                foundQuestions = true;
              } else if (!foundQuestions) {
                // No questions found yet, update content with each chunk
                setContent(buffer);
                extractedContent = buffer;
              }
            }

            // Store the final complete content
            const finalContent = extractedContent;
            
            // Update the event in the backend
            if (finalContent) {
              // Don't await this - let it happen in the background
              const updatedFields: Partial<ScheduleEvent> = {
                content: finalContent
              };

              if (extractedQuestions.length > 0) {
                updatedFields.questions = extractedQuestions;
              }

              // Update the event in the backend using the context function
              updateEvent(uuid, eventId, updatedFields).then(updatedEvent => {
                setEvent(updatedEvent);
              });
            }

          } catch (err) {
            console.error("Error generating content:", err);
            setContent("An error occurred while generating content.");
          } finally {
            setGeneratingContent(false);
          }
        } else {
          setLoadingContent(false);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setLoadingContent(false);
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
              <div className="flex flex-col">
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Generating content for {event?.title}...
                </div>
                {content && (
                  <div className="prose overflow-y-scroll prose-gray max-w-none text-gray-800">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose overflow-y-scroll prose-gray max-w-none text-gray-800">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p>No content available.</p>
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