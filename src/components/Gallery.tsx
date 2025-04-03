import { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { useScheduleContext } from '../ScheduleContext';

const scheduleTemplates = [
  {
    scheduleText: 'Read 15 Mins Daily For A Week',
    tooltipId: 'tooltip-1',
    followerCount: '48',
    imageUrl:
      'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: 'Start Meditating: A 7 Day Journey',
    tooltipId: 'tooltip-2',
    peopleCount: '45',
    imageUrl:
      'https://images.unsplash.com/photo-1471520201477-47a62a269a87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: 'Hydration Challenge: Drink Water 4x Daily For 7 Days',
    tooltipId: 'tooltip-3',
    peopleCount: '99+',
    imageUrl:
      'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: 'AI Fundamentals: Learn Prompting In 3 Days',
    tooltipId: 'tooltip-4',
    peopleCount: '62',
    imageUrl:
      'https://images.unsplash.com/photo-1636690513351-0af1763f6237?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: 'Learning To Journal: A 7 Day Challenge',
    tooltipId: 'tooltip-5',
    peopleCount: '18',
    imageUrl:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2873&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: 'Daily Posture Reminders For A Week',
    tooltipId: 'tooltip-6',
    peopleCount: '174',
    imageUrl:
      'https://images.unsplash.com/photo-1539815208687-a0f05e15d601?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: '7-Day No Junk Food Challenge',
    tooltipId: 'tooltip-7',
    peopleCount: '219',
    imageUrl:
      'https://images.unsplash.com/photo-1611915365928-565c527a0590?q=80&w=2825&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: '2 Weeks of Morning Yoga',
    tooltipId: 'tooltip-8',
    peopleCount: '60',
    imageUrl:
      'https://images.unsplash.com/photo-1554067559-269708c83fb6?q=80&w=2788&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: 'Digital Detox 2 Hours Daily For A Week',
    tooltipId: 'tooltip-9',
    peopleCount: '210',
    imageUrl:
      'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: '7-Day Push-Up Progression',
    tooltipId: 'tooltip-10',
    peopleCount: '87',
    imageUrl:
      'https://images.unsplash.com/photo-1626552914894-9ee320d3611c?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: '7-Day Daily Walk Challenge',
    tooltipId: 'tooltip-11',
    peopleCount: '43',
    imageUrl:
      'https://images.unsplash.com/photo-1517342151243-c5c3f3de7c85?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: '14-Day Mindful Eating',
    tooltipId: 'tooltip-12',
    peopleCount: '76',
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
  {
    scheduleText: '10-Day Early Riser',
    tooltipId: 'tooltip-13',
    peopleCount: '189',
    imageUrl:
      'https://images.unsplash.com/photo-1547560488-bae538ffad63?q=80&w=2837&auto=format&fit=crop&ixlib=rb-4.0.3',
    altText: 'Gallery Masonry Image',
  },
];

const ScheduleTemplate = ({ item, index, onClick, isLoading }) => (
  <div
    className="relative cursor-pointer overflow-hidden"
    onClick={() => onClick(index, item.scheduleText)}
  >
    {isLoading && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-20">
        <>
          <span className="text-white">Creating schedule</span>
          <Loader2 className="text-white w-6 h-6 animate-spin mx-auto" />
        </>
      </div>
    )}
    <span
      data-tooltip-id={item.tooltipId}
      data-tooltip-content={`${item.peopleCount} people following`}
      className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
    >
      {item.peopleCount}
      <Users className="w-4 h-4 shrink-0" />
      <Tooltip id={item.tooltipId} />
    </span>
    <img
      className="w-full h-full object-cover transition duration-300 ease-in-out transform hover:scale-110"
      src={item.imageUrl}
      alt={item.altText}
    />
    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
    <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
      {item.scheduleText}
    </div>
  </div>
);

const Gallery = ({ suggestScheduleAndSubmit }) => {
  const { loading: scheduleLoading } = useScheduleContext();
  const [activeScheduleIndex, setActiveScheduleIndex] = useState(null);

  const handleClick = (index, scheduleText) => {
    if(scheduleLoading)
      return false;

    setActiveScheduleIndex(index);
    suggestScheduleAndSubmit(scheduleText);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {scheduleTemplates.map((item, index) => (
        <ScheduleTemplate
          key={index}
          item={item}
          index={index}
          onClick={handleClick}
          isLoading={scheduleLoading && activeScheduleIndex === index}
        />
      ))}
    </div>
  );
};

export default Gallery;
