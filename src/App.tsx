import React, { useState, useEffect } from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { CalendarCheck, CalendarHeart, Loader2 } from "lucide-react";
import Settings from './Settings';
import Footer from './components/Footer';
import Header from './components/Header';
import { useAuth } from './AuthContext';

type CalendarEventItem = {
  title: string;
  description: string;
  start: string;
  end: string;
};

type CalendarSchedule = {
  title: string;
  events: CalendarEventItem[];
};

type AuthUrlResponse = {
  authUrl: string;
};

type SuggestResponse = {
  choices: {
    message: { content: string };
  }[];
};

type CalendarAddResponse = {
  success: boolean;
  events: any[];
};

function App() {
  const [schedule, setSchedule] = useState<CalendarSchedule | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Tab toggling and schedules fetching
  const [activeTab, setActiveTab] = useState<'create' | 'myschedules'>('create');
  const [mySchedules, setMySchedules] = useState<CalendarSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Use the AuthContext instead of local isAuthenticated state
  const { isAuthenticated, login } = useAuth();

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

        // Add a slight delay to ensure cookies are properly set
        setTimeout(() => {
          addToCalendar(scheduleFromStorage);
        }, 500);

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
    setLocalLoading(true);
    try {
      const res = await fetch(`${Settings.API_URL}?type=google/auth`, {
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
      setLocalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 6) return;

    setLocalLoading(true);
    setError(null);
    try {
      const res = await fetch(`${Settings.API_URL}?type=google/calendar-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });
      if (!res.ok) throw new Error('Failed to get events');
      const data: SuggestResponse = await res.json();

      const scheduleData: CalendarSchedule = JSON.parse(data.choices[0].message.content);
      setSchedule(scheduleData);
      console.log(scheduleData);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const addToCalendar = async (currentSchedule = schedule) => {
    if (!currentSchedule) return;

    setLocalLoading(true);
    try {
      // First, verify auth is still valid
      const authCheckResponse = await fetch(`${Settings.API_URL}?type=google/auth-check`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!authCheckResponse.ok) {
        // If auth check fails, store pending schedule and trigger login
        localStorage.setItem("pendingSchedule", JSON.stringify(currentSchedule));
        login();
        return;
      }

      // Continue with calendar add
      const calendarAddResponse = await fetch(`${Settings.API_URL}?type=google/calendar-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSchedule),
        credentials: 'include'
      });

      if (!calendarAddResponse.ok)
        throw new Error('Failed to add events to calendar');

      const result: CalendarAddResponse = await calendarAddResponse.json();
      console.log(result);

      //Create events in Calera DB
      const createEventsResponse = await fetch(`${Settings.API_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(currentSchedule)
      });

      console.log(createEventsResponse);
      alert('Events successfully added to your calendar!');
    } catch (err) {
      setError(err.message);
      console.error("Error adding events to calendar:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const renderEvents = () => {
    if (!schedule || schedule.events.length === 0) return null;
    return (
      <div className="mt-8 bg-white rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
          <h2 className="text-xl font-medium text-black sm:text-center">{schedule.title}</h2>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                localStorage.setItem("pendingSchedule", JSON.stringify(schedule));
                handleAuth();
              } else {
                addToCalendar();
              }
            }}
            disabled={localLoading}
            className="w-full md:w-auto mt-2 md:mt-0 py-3 px-4 inline-flex items-center justify-center text-sm font-medium rounded-lg text-gray-800 shadow-[0px_1px_2px_#a1e0b2] hover:bg-green-200 bg-green-100 disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              Add to My Calendar
              {localLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarCheck className="w-5 h-5" />
              )}
            </div>
          </button>
        </div>

        <ul className="mt-4 space-y-4 schedule">
          {schedule.events.map((event, index) => {
            const eventDate = new Date(event.start);
            const month = eventDate.toLocaleString('default', { month: 'short' });
            const day = eventDate.getDate();
            const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={index} className="mb-4">
                <div className="flex max-h-48 flex-col w-full bg-white rounded shadow-lg border">
                  <div className="flex flex-col w-full md:flex-row">
                    <div className="flex bg-red-500 flex-row justify-around p-4 font-bold leading-none text-gray-800 uppercase bg-gray-400 rounded-tl rounded-bl md:flex-col md:items-center md:justify-center md:w-1/4">
                      <div className="md:text-2xl text-white">{month}</div>
                      <div className="md:text-5xl text-white">{day}</div>
                      <div className="md:text-xl text-white">{startTime} - {endTime}</div>
                    </div>
                    <div className="p-4 font-normal text-gray-800 md:w-3/4">
                      <h1 className="mb-2 text-xl md:text-3xl font-bold leading-none tracking-tight text-gray-800">
                        {event.title}
                      </h1>
                      <p className="text-gray-600 truncate">{event.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <main id="content">
      <div className="min-h-screen relative">
        <div className="absolute w-full h-full bg-gradient-to-bl from-[#ffe4e6] to-[#ccfbf1] z-[-1]"></div>
        <Header />
        <div className="max-w-5xl mx-auto px-4 xl:px-0 pb-24 z-10">

          <div className="flex flex-col px-0 sm:px-8 py-8 mb-8">
            <h1 className="font-semibold text-black text-5xl md:text-6xl">
              <span className="font-bold block">Calera</span>
            </h1>
            <span className="text-4xl text-black">Your goals, instantly scheduled</span>
            <p className="mt-5 text-neutral-500 md:text-lg underline decoration-lime-500 decoration-3">
              Calera uses AI to automatically create structured schedules for any idea, goal or habit. <br />
              Just choose what matters, and your calendar fills itself.
            </p>
          </div>
          <>

            {/* THIS IS THE CORRECT NAV HTML STRUCTURE*/}
            <nav
              className="relative z-0 flex border border-b-0 rounded-t-lg overflow-hidden"
              aria-label="Tabs"
              role="tablist"
              aria-orientation="horizontal"
            >
              <button
                type="button"
                className={`flex-1 bg-white py-4 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium text-center overflow-hidden hover:bg-gray-50 focus:z-10 focus:outline-hidden focus:text-blue-600 disabled:opacity-50 disabled:pointer-events-none ${activeTab === 'create' ? '' : '!bg-gray-200'}`}
                onClick={() => setActiveTab('create')}
              >
                Create schedule
              </button>
              <button
                type="button"
                className={`flex-1 bg-white py-4 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium text-center overflow-hidden hover:bg-gray-50 focus:z-10 focus:outline-hidden focus:text-blue-600 disabled:opacity-50 disabled:pointer-events-none ${activeTab === 'myschedules' ? '' : '!bg-gray-200'}`}
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
                        disabled={localLoading || query.length < 6}
                        className="w-full sm:max-w-[240px] py-3 px-4 inline-flex items-center gap-x-2 text-m font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 justify-between"
                      >
                        {localLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Generate schedule"
                        )}
                        <CalendarHeart className="w-5 h-5 ml-auto" />
                      </button>
                    </div>
                  </form>
                  {error && (
                    <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {renderEvents()}
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
                                            <div className="flex bg-red-500 flex-row justify-around p-4 font-bold leading-none text-gray-800 uppercase bg-gray-400 rounded-tl rounded-bl md:flex-col md:items-center md:justify-center md:w-1/4">
                                              <div className="md:text-2xl text-white">{month}</div>
                                              <div className="md:text-5xl text-white">{day}</div>
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
      </div>
      <Footer />
    </main>
  );
}

export default App;
