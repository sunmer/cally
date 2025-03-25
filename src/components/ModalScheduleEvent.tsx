// components/ScheduleItem.tsx
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
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const generateContent = async () => {
      if (!event) return;
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

        let parsed;
        try {
          parsed = JSON.parse(messageContent);
        } catch (err) {
          console.error('Could not parse messageContent as JSON:', err);
        }

        if (parsed && parsed.response) {
          setContent(parsed.response);
        } else {
          setContent(messageContent);
        }

        console.log(messageContent)
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
          <div className="flex flex-col bg-white border shadow-sm rounded-xl pointer-events-auto">
            <div className="px-4 py-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">{event?.title}</h2>
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Generating event...
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-gray-800">
                  <ReactMarkdown >
                    {content || ""}
                  </ReactMarkdown>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="py-2 px-4 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
