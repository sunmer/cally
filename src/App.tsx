import React, { useState, useEffect } from 'react';
import { Calendar, Loader2 } from "lucide-react";
import Settings from './Settings';
import Footer from './Footer';

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

type AuthCheckResponse = {
  authenticated: boolean;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // New states for tab toggling and fetching My Schedules
  const [activeTab, setActiveTab] = useState<'create' | 'myschedules'>('create');
  const [mySchedules, setMySchedules] = useState<CalendarSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Check auth status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${Settings.API_URL}?type=google/auth-check`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (res.ok) {
          const data: AuthCheckResponse = await res.json();
          setIsAuthenticated(data.authenticated);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };
    checkAuth();
  }, []);

  // If the user was redirected after OAuth, check for a pending schedule
  useEffect(() => {
    if (isAuthenticated && !schedule) {
      const storedSchedule = localStorage.getItem("pendingSchedule");
      if (storedSchedule) {
        const scheduleFromStorage = JSON.parse(storedSchedule);
        setSchedule(scheduleFromStorage);
        localStorage.removeItem("pendingSchedule");
        // Automatically add events to the calendar after authentication
        addToCalendar(scheduleFromStorage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // When My Schedules tab is active, fetch the schedules from the API
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
          if (!response.ok) {
            throw new Error('Failed to fetch events');
          }
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

  const handleAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${Settings.API_URL}?type=google/auth`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to get auth URL');
      const data: AuthUrlResponse = await res.json();
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError(err.message);
      console.error("Authentication error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 6) return;

    setLoading(true);
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
      console.log(scheduleData)
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Modified addToCalendar accepts a schedule parameter so we can reuse it after redirect.
  const addToCalendar = async (currentSchedule: CalendarSchedule | null = schedule) => {
    if (!currentSchedule) return;
    setLoading(true);
    try {
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

      const createEventsResponse = await fetch(`${Settings.API_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedule)
      });

      console.log(createEventsResponse)
      alert('Events successfully added to your calendar!');
    } catch (err: any) {
      setError(err.message);
      console.error("Error adding events to calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue: string): string => {
    return new Date(dateValue).toLocaleString();
  };

  const renderEvents = () => {
    if (!schedule || schedule.events.length === 0) return null;
    return (
      <div className="mt-8 bg-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-medium text-white mb-4">{schedule.title}</h2>
        <div className="space-y-4">
          {schedule.events.map((event, index) => (
            <div key={index} className="bg-neutral-700 p-4 rounded-md">
              <h3 className="text-white font-medium">{event.title}</h3>
              <p className="text-neutral-300 text-sm mt-1">
                {formatDate(event.start)} - {formatDate(event.end)}
              </p>
              {event.description && (
                <p className="text-neutral-400 text-sm mt-2">{event.description}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            if (!isAuthenticated) {
              // Save the schedule so it can be added automatically after OAuth
              localStorage.setItem("pendingSchedule", JSON.stringify(schedule));
              handleAuth();
            } else {
              addToCalendar();
            }
          }}
          disabled={loading}
          className="mt-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg text-gray-800 shadow-sm hover:bg-green-200 bg-green-100 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Add to My Calendar
        </button>
      </div>
    );
  };

  return (
    <main id="content">
      <div className="bg-neutral-900 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 xl:px-0 pt-24 lg:pt-32 pb-24">
          <h1 className="font-semibold text-white text-5xl md:text-6xl">
            <span className="text-[#ff0]">Cally</span>
            <br />
            AI-generated calendar learning
          </h1>
          <p className="mt-5 text-neutral-400 text-lg">
            Get any type of learning schedule added directly to your calendar
          </p>
          <div className="flex flex-col gap-y-6 mt-8">
            {/* The generation form is always visible */}
            <form onSubmit={handleSubmit} className="w-full max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 'A 3-week course to learn Spanish basics'"
                  className="flex-1 px-4 py-3 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:outline-none focus:border-teal-400"
                />
                <button
                  type="submit"
                  disabled={loading || query.length < 6}
                  className="px-6 py-3 bg-teal-100 text-gray-800 rounded-lg font-medium hover:bg-teal-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Generate"}
                </button>
              </div>
            </form>

            {/* Tab Toggler */}
            <div>
              <ul className="mt-8 text-sm font-medium text-center text-gray-500 rounded-lg shadow-sm sm:flex dark:divide-gray-700 dark:text-gray-400">
                <li className="w-full focus-within:z-10">
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`inline-block w-full p-4 rounded-s-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none ${
                      activeTab === 'create'
                        ? 'text-gray-900 bg-gray-100 border-r border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
                        : 'bg-white border-r border-gray-200 dark:border-gray-700 hover:text-gray-700 hover:bg-gray-50 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700'
                    }`}
                  >
                    Create Schedule
                  </button>
                </li>
                <li className="w-full focus-within:z-10">
                  <button
                    onClick={() => setActiveTab('myschedules')}
                    className={`inline-block w-full p-4 rounded-s-lg focus:ring-4 focus:ring-blue-300 focus:outline-none ${
                      activeTab === 'myschedules'
                        ? 'text-gray-900 bg-gray-100 border-r border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
                        : 'bg-white border-r border-gray-200 dark:border-gray-700 hover:text-gray-700 hover:bg-gray-50 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700'
                    }`}
                  >
                    My Schedules
                  </button>
                </li>
              </ul>

              {activeTab === 'create' && (
                <div className="mt-8">
                  <h2 className="text-white font-semibold text-2xl md:text-4xl md:leading-tight">Create Schedule</h2>
                  {renderEvents()}
                </div>
              )}

              {activeTab === 'myschedules' && (
                <div className="mt-8">
                  <h2 className="text-white font-semibold text-2xl md:text-4xl md:leading-tight">My Schedules</h2>
                  {schedulesLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : schedulesError ? (
                    <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg">{schedulesError}</div>
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {mySchedules.map((sch, idx) => (
                        <li key={idx} className="bg-neutral-800 p-4 rounded-lg">
                          <h3 className="text-xl font-medium text-white">{sch.title}</h3>
                          {sch.events && sch.events.length > 0 && (
                            <ul className="mt-2 space-y-2">
                              {sch.events.map((event, index) => (
                                <li key={index} className="bg-neutral-700 p-2 rounded">
                                  <p className="text-white">{event.title}</p>
                                  <p className="text-neutral-300 text-sm">
                                    {formatDate(event.start)} - {formatDate(event.end)}
                                  </p>
                                  {event.description && (
                                    <p className="text-neutral-400 text-sm">{event.description}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default App;
