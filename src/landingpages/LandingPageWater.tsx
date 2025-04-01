import React, { useState, useEffect } from 'react';
import { Loader2, CalendarHeart, Users } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from '../AuthContext';
import { useScheduleContext } from '../ScheduleContext';
import IconGoogleCalendar from "../assets/icon-google-calendar.svg?react";
import IconIcalCalendar from "../assets/icon-ical-calendar.svg?react";
import IconOutlookCalendar from "../assets/icon-outlook-calendar.svg?react";
import IconWater from "../assets/icon-water.svg?react";
import SuggestedSchedule from '../components/SuggestedSchedule';
import MySchedules from '../components/MySchedules';


function LandingPageWater() {
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
        <span className="text-2xl font-bold md:text-3xl text-gray-800">Your goals, instantly scheduled</span>
        <p className="mt-4 md:text-lg text-gray-600 dark:text-neutral-400">
          Calera uses AI to turn personal goals into schedules aligned with your personal calendar
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
                    placeholder="e.g. 'Drink water 2x each morning for 4 days'"
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
                <h2 className="relative text-xl font-bold md:text-3xl text-gray-800 mb-6 inline-block">
                  Ideas for hydration challenges
                  <span title="99+ followers across all challenges" className="absolute cursor-pointer top-0 start-[calc(100%-2rem)] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-teal-500 text-white">
                    99+
                    <Users className="w-4 h-4 shrink-0" />
                  </span>
                </h2>
                <br />
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('Drink water 4x daily for 7 days')}
                >
                  <IconWater />
                  Hydration Challenge: Drink Water 4x Daily For 7 Days
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('Drink water 4x daily for 3 days')}
                >
                  <IconWater />
                  Hydration Challenge: Drink Water 4x Daily For 3 Days
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('Drink water 4x daily for 7 days')}
                >
                  <IconWater />
                  Classic 4x Daily Hydration for 7 days
                </a>
                <a
                  className="mr-2 mb-4 cursor-pointer inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-sm border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white"
                  onClick={() => setQuery('Hydration Before Caffeine 8am for 7 Days')}
                >
                  <IconWater />
                  Hydration Before Caffeine (7 Days)
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

export default LandingPageWater;
