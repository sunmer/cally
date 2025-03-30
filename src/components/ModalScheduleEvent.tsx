import React, { useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";
import { ScheduleEvent } from '../types';
import Settings from '../Settings';
import ReactMarkdown from 'react-markdown';

type ModalScheduleEventProps = {
  isOpened: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
};

const ModalScheduleEvent: React.FC<ModalScheduleEventProps> = ({
  isOpened,
  onClose,
  event
}) => {
  // loaderType will determine the loading state: "loading" when using pre-existing content,
  // "generating" when fetching new content, and null when done.
  const [loaderType, setLoaderType] = useState<"loading" | "generating" | null>(null);
  const [content, setContent] = useState<string | null>(null);

  // Format dates like in the <ul> example
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
    const generateContent = async () => {
      if (!event) return;
      
      // If the event already has content, use the "loading content" loader.
      if (event.content) {
        setLoaderType("loading");
        setContent(event.content);
        setTimeout(() => setLoaderType(null), 100); 
        return;
      }
      
      // Otherwise, use the "generating content" loader and fetch new content.
      setLoaderType("generating");
      setContent("");
      
      // Build a query string from event details
      const params = new URLSearchParams({
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
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
            // No questions found yet, update content
            setContent(buffer);
            extractedContent = buffer;
          }
        }
        
        // Only update the event object once at the end with both properties
        if (event) {
          event.content = extractedContent;
          if (extractedQuestions.length > 0) {
            event.questions = extractedQuestions;
          }
        }
        
        // Final state update to ensure UI shows the correct content
        setContent(extractedContent);
        
      } catch (err: any) {
        console.error("Error generating content:", err);
        setContent("An error occurred while generating content.");
      } finally {
        setTimeout(() => setLoaderType(null), 100);
      }
    };


    if (isOpened && event) {
      generateContent();
    }
  }, [isOpened, event]);

  return (
    <>
      <div className={`hs-overlay size-full fixed top-0 start-0 z-[80] pointer-events-none ${isOpened ? 'open' : 'hidden'}`}>
        <div className="hs-overlay-open:mt-7 p-4 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all lg:max-w-2xl lg:w-full m-3 lg:mx-auto">
          <div className="flex flex-col bg-white shadow-sm rounded-xl pointer-events-auto">
            <div className="flex justify-between bg-red-500 rounded-t-xl text-white items-center py-3 px-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-white">
                {event?.title} - {formattedDate}
              </h3>
              <button
                type="button"
                className="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg
                  className="shrink-0 size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-6">
              {loaderType && (
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  {loaderType === "loading" ? "Loading content..." : `Generating content for ${event?.title}`}
                </div>
              )}

              <div className="prose overflow-y-scroll max-h-96 prose-gray max-w-none text-gray-800">
                <ReactMarkdown>
                  {content || ""}
                </ReactMarkdown>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="inline-flex justify-center items-center gap-x-3 text-center bg-teal-500 hover:bg-teal-600 focus:outline-none border border-transparent text-white text-sm font-medium rounded-full py-3 px-4 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        onClick={onClose}
        className={`z-10 hs-overlay-backdrop transition duration fixed inset-0 bg-gray-900 bg-opacity-50 ${isOpened ? 'open' : 'hidden'}`}
      />
    </>
  );
};

export default ModalScheduleEvent;
