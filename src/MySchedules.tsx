import React from 'react';
import Slider from "react-slick";
import { Loader2 } from "lucide-react";
import { useScheduleContext } from './ScheduleContext';

const MySchedules = () => {
  const { mySchedules, loading: isScheduleLoading, error } = useScheduleContext();

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

  return (
    <div>
      <div className="mt-8">
        {isScheduleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : error ? (
          <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {mySchedules.map((schedule, idx) => (
              <li key={idx}>
                <h3 className="text-xl font-medium text-black mb-2">{schedule.title}</h3>
                {schedule.events && schedule.events.length > 0 && (
                  <div className="mb-12">
                    <Slider {...sliderSettings}>
                      {schedule.events.map((event, index) => {
                        const eventDate = new Date(event.start);
                        const month = eventDate.toLocaleString('default', { month: 'short' });
                        const day = eventDate.getDate();
                        const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={index}>
                            <a
                              className={`flex flex-col w-full md:flex-row ${schedule.requiresAdditionalContent ? 'cursor-pointer' : ''}`}
                              onClick={(e) => schedule.requiresAdditionalContent ? 'openModalWithEvent(e, event)' : e.preventDefault()}
                            >
                              <div className="flex max-h-48 flex-col w-full bg-white rounded shadow-lg border">
                                <div className="flex flex-col w-full md:flex-row">
                                  <div className="flex bg-red-500 flex-row justify-start p-4 font-bold leading-none text-gray-800 uppercase md:flex-col md:items-center md:justify-center md:w-1/4">
                                    <div className="md:text-2xl text-white mr-2">{month}</div>
                                    <div className="md:text-5xl text-white mr-2">{day}</div>
                                    <div className="md:text-xl text-white">
                                      {startTime} - {endTime}
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
        )}
      </div>
    </div>
  );
};

export default MySchedules;
