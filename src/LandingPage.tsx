import React, { useState, useEffect } from 'react';
import Slider from "react-slick";
import { toast } from 'react-toastify';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { CalendarHeart, Loader2 } from "lucide-react";
import Settings from './Settings';
import { useAuth } from './AuthContext';
import IconBook from "./assets/icon-book.svg?react";
import IconMeditate from "./assets/icon-meditate.svg?react";
import IconWater from "./assets/icon-water.svg?react";
import IconPrompt from "./assets/icon-prompt.svg?react";
import IconFoodPrep from "./assets/icon-foodprep.svg?react";
import SuggestedSchedule from './SuggestedSchedule';
import { Schedule } from './types';


type AuthUrlResponse = {
  authUrl: string;
};

type SuggestResponse = {
  choices: {
    message: { content: string };
  }[];
};

function LandingPage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Separate loading states for different actions
  const [createScheduleLoading, setCreateScheduleLoading] = useState(false);
  const [addToCalendarLoading, setAddToCalendarLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Tab toggling and schedules fetching
  const [activeTab, setActiveTab] = useState<'create' | 'myschedules'>('create');
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Use the AuthContext instead of local isAuthenticated state
  const { isAuthenticated } = useAuth();

  // Slider settings for React Slick
  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768, // mobile and below
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: true,
          centerMode: false, // Don't use centerMode, we'll use CSS instead
        },
      },
    ],
    className: "slider-spacing"
  };
  // Check for a pending schedule after OAuth redirect
  useEffect(() => {
    if (isAuthenticated && !schedule) {
      const storedSchedule = localStorage.getItem("pendingSchedule");
      if (storedSchedule) {
        const scheduleFromStorage = JSON.parse(storedSchedule);
        setSchedule(scheduleFromStorage);

        addToCalendar(scheduleFromStorage);

        localStorage.removeItem("pendingSchedule");
      }
    }
  }, [isAuthenticated]);

  // When My Schedules tab is active, fetch schedules from API
  useEffect(() => {
    if (activeTab === 'myschedules') {
      const fetchEvents = async () => {
        setSchedulesLoading(true);
        setSchedulesError(null);
        try {
          const response = await fetch(`${Settings.API_URL}/schedules`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          if (!response.ok) throw new Error('Failed to fetch events');
          const data = await response.json();
          setMySchedules(data);
        } catch (err: any) {
          setSchedulesError(err.message);
        } finally {
          setSchedulesLoading(false);
        }
      };

      fetchEvents();
    }
  }, [activeTab]);

  // Redirects for authentication
  const handleAuth = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch(`${Settings.API_URL}/google?type=auth`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok)
        throw new Error('Failed to get auth URL');

      const data: AuthUrlResponse = await res.json();
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError(err.message);
      console.error("Authentication error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 6) return;

    setCreateScheduleLoading(true);
    setError(null);
    try {
      const res = await fetch(`${Settings.API_URL}/suggest?type=suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });
      if (!res.ok) throw new Error('Failed to get events');

      const data: SuggestResponse = await res.json();
      const scheduleData: Schedule = JSON.parse(data.choices[0].message.content);

      setSchedule(scheduleData);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setCreateScheduleLoading(false);
    }
  };

  const addToCalendar = async (currentSchedule = schedule) => {
    if (!currentSchedule) return;

    setAddToCalendarLoading(true);
    try {
      // Continue with calendar add
      const calendarAddResponse = await fetch(`${Settings.API_URL}/google?type=calendar-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSchedule),
        credentials: 'include'
      });

      if (!calendarAddResponse.ok)
        throw new Error('Failed to add events to calendar');

      //Create events in Calera DB
      await fetch(`${Settings.API_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(currentSchedule)
      });

      toast(`${currentSchedule.title} was successfully added to your calendar!`)
    } catch (err) {
      setError(err.message);
      console.error("Error adding events to calendar:", err);
    } finally {
      setAddToCalendarLoading(false);
    }
  };


  return (

    <div className="max-w-5xl mx-auto px-4 xl:px-0 pb-24 z-10">

      <div className="flex flex-col px-0 sm:px-8 py-8 mb-8">
        <h1 className="font-semibold text-black text-5xl md:text-6xl">
          <span className="font-bold block">Calera</span>
        </h1>
        <span className="text-4xl text-black">Your goals, instantly scheduled</span>
        <p className="mt-5 text-neutral-500 md:text-lg underline decoration-lime-500 decoration-3">
          Calera uses AI to turn personal goals into schedules aligned with your calendar
        </p>
      </div>
      <>

        <nav
          className="relative z-0 flex border border-b-0 rounded-t-lg overflow-hidden"
          aria-label="Tabs"
          role="tablist"
          aria-orientation="horizontal"
        >
          <button
            type="button"
            className={`flex-1 bg-white py-4 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium text-center overflow-hidden hover:bg-gray-50 focus:z-10 focus:outline-hidden focus:text-blue-600 ${activeTab === 'create' ? '' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('create')}
          >
            Create a schedule
          </button>
          <button
            type="button"
            className={`flex-1 bg-white py-4 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium text-center overflow-hidden hover:bg-gray-50 focus:z-10 focus:outline-hidden focus:text-blue-600 ${activeTab === 'myschedules' ? '' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('myschedules')}
          >
            My schedules
          </button>
        </nav>
        <div className="flex flex-col bg-white shadow-md justify-start md:justify-center rounded-b-lg border overflow-x-scroll px-4 py-8 sm:px-8">
          {activeTab === 'create' && (
            <div>
              <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'A 3-week course to learn Spanish basics'"
                    className="flex-1 px-4 py-3 text-black rounded-lg border border-neutral-300 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={createScheduleLoading || query.length < 6}
                    className="sm:max-w-[240px] py-3 px-4 flex justify-center items-center text-m font-medium rounded-lg border border-transparent text-gray-800 shadow-[0px_1px_1px_#0f3078] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {createScheduleLoading ? (
                        <>
                          Creating schedule
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        </>
                      ) : (
                        <>
                          Create schedule
                          <CalendarHeart className="w-5 h-5 ml-auto" />
                        </>
                      )}
                    </div>
                  </button>

                </div>
              </form>
              {error && (
                <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="my-12">
                <h2 className="text-gray-600 font-semibold text-2xl md:leading-tight mb-4">Ideas for goals</h2>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-s font-medium bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500"
                  onClick={() => setQuery('Read 15 mins every day for 7 days')}
                >
                  <IconBook className="" />
                  Read 15 mins every day for a week
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-s font-medium bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500"
                  onClick={() => setQuery('Learn to meditate in 14 days')}
                >
                  <IconMeditate className="" />
                  Start meditating: a 14-day journey
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-s font-medium bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500"
                  onClick={() => setQuery('4-week meal prep challenge with a simple, beginner-friendly recipe for each Sunday')}
                >
                  <IconFoodPrep className="" />
                  4-week Sunday meal prep challenge
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-s font-medium bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500"
                  onClick={() => setQuery('Drink water 4x daily for 7 days')}
                >
                  <IconWater className="" />
                  Hydration challenge: drink water 4x daily for 7 days
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-s font-medium bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500"
                  onClick={() => setQuery('AI fundamentals: Learn AI prompting in 7 days')}
                >
                  <IconPrompt className="" />
                  AI fundamentals: Learn AI prompting in 7 days
                </a>
              </div>

              <SuggestedSchedule 
                schedule={schedule} 
                addToCalendarLoading={addToCalendarLoading} 
                authLoading={authLoading} 
                isAuthenticated={isAuthenticated}
                addToCalendar={addToCalendar}
                handleAuth={handleAuth}
              />
            </div>
          )}
          {activeTab === 'myschedules' && (
            <div>
              <div className="mt-8">
                {schedulesLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : schedulesError ? (
                  <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg">{schedulesError}</div>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {mySchedules.map((sch, idx) => (
                      <li key={idx}>
                        <h3 className="text-xl font-medium text-black mb-2">{sch.title}</h3>
                        {sch.events && sch.events.length > 0 && (
                          <div className="mb-12">
                            <Slider {...sliderSettings}>
                              {sch.events.map((event, index) => {
                                const eventDate = new Date(event.start);
                                const month = eventDate.toLocaleString('default', { month: 'short' });
                                const day = eventDate.getDate();
                                const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                return (
                                  <div key={index}>
                                    <div className="flex max-h-48 flex-col w-full bg-white rounded shadow-lg border">
                                      <div className="flex flex-col w-full md:flex-row">
                                        <div className="flex bg-red-500 flex-row justify-start p-4 font-bold leading-none text-gray-800 uppercase bg-gray-400 rounded-t md:rounded-none md:rounded-tl md:rounded-bl md:flex-col md:items-center md:justify-center md:w-1/4">
                                          <div className="md:text-2xl text-white mr-2 md:mr-0">{month}</div>
                                          <div className="md:text-5xl text-white mr-2 md:mr-0">{day}</div>
                                          <div className="md:text-xl text-white">{startTime} - {endTime}</div>
                                        </div>
                                        <div className="p-4 font-normal text-gray-800 md:w-3/4">
                                          <h1 className="mb-2 text-xl md:text-3xl font-bold leading-none tracking-tight text-gray-800">
                                            {event.title}
                                          </h1>
                                          <p className="text-gray-600">{event.description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </Slider>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </>

    </div>

  );
}

export default LandingPage;