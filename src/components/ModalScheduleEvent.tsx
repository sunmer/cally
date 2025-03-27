// components/ScheduleItem.tsx
import React, { useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";
import { ScheduleEvent } from '../types';
import Settings from '../Settings';
import ReactMarkdown from 'react-markdown';

type GenerateResponse = {
  content: string;
  questions: string[];
}

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
  const [loading, setLoading] = useState(false);
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

      if (event.content) {
        setContent(event.content);
        return;
      }
      
      setLoading(true);
      setContent(null);

      try {
        const res = await fetch(`${Settings.API_URL}/suggest?type=generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        if (!res.ok) throw new Error('Failed to generate content');

        const data = await res.json();
        const messageContent = data?.choices?.[0]?.message?.content || 'No content received.';

        let parsed: GenerateResponse;
        let finalContent;

        try {
          parsed = JSON.parse(messageContent);

          if (event) {
            event.content = parsed.content;
            event.questions = parsed.questions
            finalContent = parsed.content;
          }
        } catch (err) {
          console.warn('Could not parse messageContent as JSON:', err);
        }
        
        setContent(finalContent);
      } catch (err: any) {
        console.error("Error generating content:", err);
        setContent("An error occurred while generating content.");
      } finally {
        setLoading(false);
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
              <h3
                className="font-bold text-gray-800 text-white"
              >
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
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Generating event...
                </div>
              ) : (
                <div className="prose overflow-y-auto max-h-96 prose-gray max-w-none text-gray-800">
                  <ReactMarkdown>
                    {content || ""}
                  </ReactMarkdown>
                </div>
              )}
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
