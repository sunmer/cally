import React, { useState, useEffect } from 'react';
import { Loader2, CalendarHeart } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from './AuthContext';
import { useScheduleContext } from './ScheduleContext';
import IconGoogleCalendar from "./assets/icon-google-calendar.svg?react";
import IconIcalCalendar from "./assets/icon-ical-calendar.svg?react";
import IconOutlookCalendar from "./assets/icon-outlook-calendar.svg?react";
import IconJournal from "./assets/icon-journal.svg?react";
import IconBook from "./assets/icon-book.svg?react";
import IconYoga from "./assets/icon-yoga.svg?react";
import IconDigitalDetox from "./assets/icon-digital-detox.svg?react";
import IconMorning from "./assets/icon-morning.svg?react";
import IconMoney from "./assets/icon-money.svg?react";
import IconGratitude from "./assets/icon-gratitude.svg?react";
import IconTraining from "./assets/icon-training.svg?react";
import IconWalking from "./assets/icon-walking.svg?react";
import IconLanguage from "./assets/icon-language.svg?react";
import IconFood from "./assets/icon-food.svg?react";
import IconMeditate from "./assets/icon-meditate.svg?react";
import IconWater from "./assets/icon-water.svg?react";
import IconPrompt from "./assets/icon-prompt.svg?react";
import SuggestedSchedule from './components/SuggestedSchedule';
import MySchedules from './components/MySchedules';


function LandingPage() {
  const { isAuthenticated, login, loading: isAuthenticationLoading } = useAuth();
  const { suggestSchedule, fetchSchedules } = useScheduleContext();
  const [query, setQuery] = useState('');
  const [createScheduleLoading, setCreateScheduleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'myschedules'>('create');

  // When the active tab is "myschedules", fetch the schedules
  useEffect(() => {
    if (isAuthenticationLoading) {
      return;
    }

    if (activeTab === 'myschedules') {
      if (isAuthenticated)
        fetchSchedules();
      else
        login();
    }
  }, [activeTab, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 6) return;
    setCreateScheduleLoading(true);
    try {
      await suggestSchedule(query);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCreateScheduleLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 xl:px-0 pb-24 z-10 relative">
      <div className="flex flex-col px-0 sm:px-8 py-8 mb-8">
        <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl lg:leading-tight bg-clip-text bg-gradient-to-r from-green-500 to-cyan-500 text-transparent">
          <span className="font-bold block">Calera</span>
        </h1>
        <span className="text-2xl font-bold md:text-3xl text-gray-800">
          Better habits, scheduled around your life
        </span>
        <p className="mt-4 md:text-lg text-gray-600 dark:text-neutral-400">
          Generate any habit or goal with AI, and have it auto-scheduled into your calendar
        </p>
        <div className="sm:flex auto-cols-max items-center gap-3 md:gap-6 mt-6">
          <span className="block text-xs font-semibold uppercase mb-3 sm:mb-0 dark:text-white">
            Compatible with:
          </span>
          <dl className="flex auto-cols-max items-center gap-3 md:gap-6">
            <dt className="sr-only">Compatible with calendars:</dt>
            <dd className="flex items-center gap-x-2 text-xs font-semibold uppercase dark:text-white" title="Google Calendar">
              <IconGoogleCalendar className="w-5 h-5" />
            </dd>
            <dd className="flex items-center gap-x-2 text-xs font-semibold uppercase dark:text-white" title="Microsoft Outlook">
              <IconOutlookCalendar className="w-6 h-6" />
            </dd>
            <dd className="flex items-center gap-x-2 text-xs font-semibold uppercase dark:text-white" title="Apple iCal">
              <IconIcalCalendar className="w-6 h-6" />
            </dd>
          </dl>
        </div>
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
            className={`flex-1 py-4 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium text-center overflow-hidden hover:bg-gray-50 focus:z-10 focus:outline-hidden ${activeTab === 'create' ? 'bg-white' : 'bg-gray-100'}`}
            onClick={() => setActiveTab('create')}
          >
            Create a schedule
          </button>
          <button
            type="button"
            className={`flex-1 py-4 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium text-center overflow-hidden hover:bg-gray-50 focus:z-10 focus:outline-hidden ${activeTab === 'myschedules' ? 'bg-white' : 'bg-gray-100'}`}
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
                    placeholder="e.g. 'Give me a 7 day course in basic Spanish'"
                    className="flex-1 px-4 py-3 text-black rounded-lg border border-neutral-300 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center gap-x-3 text-center bg-teal-500 hover:bg-teal-600 focus:outline-none border border-transparent text-white text-sm font-medium rounded-full py-3 px-4 disabled:opacity-50"
                    disabled={createScheduleLoading || query.length < 6}
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
              <div className="my-12">
                <h2 className="text-xl font-bold md:text-3xl text-gray-800 mb-4">Ideas for habits & goals</h2>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('Read 15 mins every day for 7 days')}
                >
                  <IconBook />
                  Read 15 Mins Every Day For A Week
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('Learn to meditate in 14 days')}
                >
                  <IconMeditate />
                  Start Meditating: A 14-day Journey
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('4-week meal prep challenge with a simple, beginner-friendly recipe for each Sunday')}
                >
                  <IconBook />
                  4-Week Sunday Meal Prep Challenge
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('Drink water 4x daily for 7 days')}
                >
                  <IconWater />
                  Hydration Challenge: Drink Water 4x Daily For 7 Days
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('AI fundamentals: Learn AI prompting in 3 days')}
                >
                  <IconPrompt />
                  AI Fundamentals: Learn AI Prompting In 3 Days
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('10-Day Journaling Challenge: Spend 5 minutes each day reflecting on a prompt or gratitude list')
                  }
                >
                  <IconJournal />
                  10-Day Journaling Challenge
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('14-Day Morning Yoga Routine: Start every day with a short, energizing yoga flow')
                  }
                >
                  <IconYoga />
                  14-Day Morning Yoga Routine
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('7-Day Digital Detox: Limit social media or screen time to 30 minutes daily')
                  }
                >
                  <IconDigitalDetox />
                  7-Day Digital Detox
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('14-Day Gratitude Practice: Write down 3 things you’re grateful for each morning')
                  }
                >
                  <IconGratitude />
                  14-Day Gratitude Practice
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('7-Day Push-Up Progression: Add a few more push-ups each day to build strength')
                  }
                >
                  <IconTraining />
                  7-Day Push-Up Progression
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('7-Day Daily Walk Challenge: Walk for 20 minutes each day')
                  }
                >
                  <IconWalking />
                  7-Day Daily Walk Challenge
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('14-Day Mindful Eating: Slow down and savor each meal while practicing portion control')
                  }
                >
                  <IconFood />
                  14-Day Mindful Eating
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('10-Day Early Riser: Wake up 30 minutes earlier to enjoy a calm and productive morning')
                  }
                >
                  <IconMorning />
                  10-Day Early Riser
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('14-Day Budget & Expense Tracking: Record every purchase to build better spending habits')
                  }
                >
                  <IconMoney />
                  14-Day Budget & Expense Tracking
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('7-Day Posture Improvement: Do quick posture checks and exercises throughout your day')
                  }
                >
                  <IconWalking />
                  7-Day Posture Improvement
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() =>
                    setQuery('Learn basic Spanish in 7 days')
                  }
                >
                  <IconLanguage />
                  Learn basic Spanish in 7 days
                </a>
                
              </div>
              <SuggestedSchedule />
            </div>
          )}
          {activeTab === 'myschedules' && <MySchedules />}
        </div>
      </>
    </div>
  );
}

export default LandingPage;