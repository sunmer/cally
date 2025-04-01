import React, { useState } from 'react';
import Slider from "react-slick";
import { Loader2, Trash2 } from "lucide-react";
import { useScheduleContext } from '../ScheduleContext';
import { useNavigate } from 'react-router-dom';
import Settings from '../Settings';
import { toast } from 'react-toastify';
import { formatEventDateRange } from '../util';

const MySchedules = () => {
  const { mySchedules, loading, setMySchedules } = useScheduleContext();
  // Instead of a boolean, track the uuid of the schedule being deleted
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);

  const navigate = useNavigate();

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: true,
          centerMode: false,
        },
      },
    ],
    className: "slider-spacing"
  };

  const handleEventClick = (e: React.MouseEvent, schedule: any, event: any) => {
    if (schedule.requiresAdditionalContent) {
      e.preventDefault();
      navigate(`/events/${schedule.uuid}/${event.id}`);
      window.scrollTo(0, 0);
    } else {
      e.preventDefault();
      return false;
    }
  };

  const handleDeleteSchedule = async (schedule: any) => {
    try {
      // Set the deleting schedule id so only its button shows the loader
      setDeletingScheduleId(schedule.uuid);
      toast(`Deleting ${schedule.title} from your Google Calendar`);
      
      const dbResponse = await fetch(`${Settings.API_URL}/schedules`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uuid: schedule.uuid }),
      });

      if (!dbResponse.ok) {
        throw new Error('Failed to delete schedule from database');
      }

      const googleResponse = await fetch(`${Settings.API_URL}/google?type=delete-schedule`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uuid: schedule.uuid }),
      });

      if (!googleResponse.ok) {
        throw new Error('Failed to delete schedule from Google Calendar');
      }

      // Update state to remove the deleted schedule
      setMySchedules(mySchedules.filter((s: any) => s.uuid !== schedule.uuid));
      toast(`${schedule.title} was deleted from your Google Calendar`);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule. Please try again.");
    } finally {
      setDeletingScheduleId(null);
    }
  };

  return (
    <div>
      <div className="mt-8">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        <ul className="mt-4 space-y-4">
          {mySchedules.map((schedule, idx) => (
            <li key={idx}>
              <h3 className="text-xl font-medium text-black mb-2">
                <div className="flex items-center gap-2">
                  {schedule.title}
                  <button 
                    disabled={deletingScheduleId === schedule.uuid} 
                    onClick={() => handleDeleteSchedule(schedule)} 
                    title="Remove this schedule from your Google calendar"
                  >
                    {deletingScheduleId === schedule.uuid ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-500" />
                    )}
                  </button>
                </div>
              </h3>
              {schedule.events && schedule.events.length > 0 && (
                <div className="mb-12">
                  <Slider {...sliderSettings}>
                    {schedule.events.map((event, index) => {
                      const eventDate = formatEventDateRange(event)
                      return (
                        <div key={index}>
                          <a
                            href="#"
                            onClick={(e) => handleEventClick(e, schedule, event)}
                            className={`flex flex-col w-full md:flex-row ${schedule.requiresAdditionalContent ? 'cursor-pointer' : ''}`}
                          >
                            <div className="flex max-h-48 flex-col w-full bg-white rounded shadow-lg border">
                              <div className="flex flex-col w-full md:flex-row">
                                <div className="flex bg-red-500 flex-row justify-start p-4 font-bold leading-none text-gray-800 uppercase md:flex-col md:items-center md:justify-center md:w-1/4">
                                  <div className="md:text-2xl text-white mr-2">{eventDate.month}</div>
                                  <div className="md:text-5xl text-white mr-2">{eventDate.day}</div>
                                  <div className="md:text-xl text-white">
                                    {eventDate.startTime} - {eventDate.endTime}
                                  </div>
                                </div>
                                <div className="p-4 font-normal text-gray-800 md:w-3/4">
                                  <h1 className="mb-2 text-xl md:text-3xl font-bold leading-none tracking-tight text-gray-800">
                                    {event.title}
                                  </h1>
                                  <p className="text-gray-600">{event.description}</p>
                                </div>
                              </div>
                            </div>
                          </a>
                        </div>
                      );
                    })}
                  </Slider>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MySchedules;
