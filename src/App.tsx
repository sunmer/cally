import React, { useState, useEffect } from 'react';
import { Rocket, Calendar, Loader2 } from "lucide-react";
import Settings from './Settings';
import Footer from './Footer';

interface CalendarEvent {
  title?: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string } | string;
  end: { dateTime?: string; date?: string } | string;
}

interface AuthCheckResponse {
  authenticated: boolean;
}

interface AuthUrlResponse {
  authUrl: string;
}

interface SuggestResponse {
  choices: {
    message: { content: string };
  }[];
}

interface CalendarAddResponse {
  success: boolean;
  events: any[];
}

function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      const generatedEvents: CalendarEvent[] = JSON.parse(data.choices[0].message.content);
      setEvents(generatedEvents);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async () => {
    if (!events.length) return;
    setLoading(true);
    try {
      const res = await fetch(`${Settings.API_URL}?type=google/calendar-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to add events to calendar');
      const result: CalendarAddResponse = await res.json();
      console.log(result);
      alert('Events successfully added to your calendar!');
    } catch (err: any) {
      setError(err.message);
      console.error("Error adding events to calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${Settings.API_URL}/create-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sub: 'foobar',
          events: [{ name: 'test event' }],
          title: 'test event'
        })
      });
      if (!res.ok) throw new Error('Failed to save events');
      const result = await res.json();
      console.log(result);
      alert('Events saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue: string | { dateTime?: string; date?: string }): string => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleString();
    }
    if (dateValue.dateTime) return new Date(dateValue.dateTime).toLocaleString();
    if (dateValue.date) return new Date(dateValue.date).toLocaleString();
    return 'Invalid date';
  };

  const renderEvents = () => {
    if (!isAuthenticated || !events.length) return null;
    return (
      <>
        <div className="mt-8 bg-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Generated Calendar Events</h2>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="bg-neutral-700 p-4 rounded-md">
                <h3 className="text-white font-medium">{event.title || event.summary}</h3>
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
            onClick={addToCalendar}
            disabled={loading}
            className="mt-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg text-gray-800 shadow-sm hover:bg-green-200 bg-green-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Add to My Calendar
          </button>
        </div>
        <div className="mt-8 bg-neutral-800 rounded-lg p-6">
          <button
            onClick={handleSaveEvents}
            disabled={loading}
            className="mt-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg text-gray-800 shadow-sm hover:bg-green-200 bg-green-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Events"}
          </button>
        </div>
      </>
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
            {!isAuthenticated ? (
              <div className="inline-flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAuth}
                  disabled={loading}
                  className="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg text-gray-800 shadow-sm hover:bg-teal-200 bg-teal-100 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Connect Google Calendar
                </button>
              </div>
            ) : (
              <>
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
                {error && (
                  <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                {renderEvents()}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default App;
