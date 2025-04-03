import { Users } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

const Gallery = ({setQuery}) => {

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="space-y-2">
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('Read 15 Mins Daily For A Week')}
        >
          <span
            data-tooltip-id="tooltip-1"
            data-tooltip-content="48 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            48
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-1" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            Read 15 Mins Daily For A Week
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('Start Meditating: A 7 Day Journey')}
        >
          <span
            data-tooltip-id="tooltip-2"
            data-tooltip-content="45 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            45
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-2" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1471520201477-47a62a269a87?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            Start Meditating: A 7 Day Journey
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() =>
            setQuery('Hydration Challenge: Drink Water 4x Daily For 7 Days')
          }
        >
          <span
            data-tooltip-id="tooltip-3"
            data-tooltip-content="99+ people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            99+
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-3" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d2F0ZXIlMjBnbGFzc3xlbnwwfHwwfHx8MA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            Hydration Challenge: Drink Water 4x Daily For 7 Days
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() =>
            setQuery('AI Fundamentals: Learn Prompting In 3 Days')
          }
        >
          <span
            data-tooltip-id="tooltip-4"
            data-tooltip-content="62 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            62
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-4" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1636690513351-0af1763f6237?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            AI Fundamentals: Learn Prompting In 3 Days
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() =>
            setQuery('Learning To Journal: A 7 Day Challenge')
          }
        >
          <span
            data-tooltip-id="tooltip-5"
            data-tooltip-content="18 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            18
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-5" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2873&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            Learning To Journal: A 7 Day Challenge
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() =>
            setQuery('Daily Posture Reminders For A Week')
          }
        >
          <span
            data-tooltip-id="tooltip-6"
            data-tooltip-content="174 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            174
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-6" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1539815208687-a0f05e15d601?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            Daily Posture Reminders For A Week
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('7-Day No Junk Food Challenge')}
        >
          <span
            data-tooltip-id="tooltip-7"
            data-tooltip-content="219 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            219
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-7" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1611915365928-565c527a0590?q=80&w=2825&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            7-Day No Junk Food Challenge
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('2 Weeks of Morning Yoga')}
        >
          <span
            data-tooltip-id="tooltip-8"
            data-tooltip-content="60 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            60
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-8" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1554067559-269708c83fb6?q=80&w=2788&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            2 Weeks of Morning Yoga
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() =>
            setQuery('Digital Detox 2 Hours Daily For A Week')
          }
        >
          <span
            data-tooltip-id="tooltip-9"
            data-tooltip-content="210 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            210
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-9" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            Digital Detox 2 Hours Daily For A Week
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('7-Day Push-Up Progression')}
        >
          <span
            data-tooltip-id="tooltip-10"
            data-tooltip-content="87 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            87
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-10" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1626552914894-9ee320d3611c?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            7-Day Push-Up Progression
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('7-Day Daily Walk Challenge')}
        >
          <span
            data-tooltip-id="tooltip-11"
            data-tooltip-content="43 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            43
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-11" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1517342151243-c5c3f3de7c85?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            7-Day Daily Walk Challenge
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('14-Day Mindful Eating')}
        >
          <span
            data-tooltip-id="tooltip-12"
            data-tooltip-content="76 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            76
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-12" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            14-Day Mindful Eating
          </div>
        </div>
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => setQuery('10-Day Early Riser')}
        >
          <span
            data-tooltip-id="tooltip-13"
            data-tooltip-content="189 people following"
            className="absolute cursor-pointer z-10 top-[20px] right-[20px] inline-flex items-center gap-1 py-1 px-2 min-w-[60px] rounded-full text-xs font-medium transform -translate-y-1/2 translate-x-2 bg-black bg-opacity-50 text-white"
          >
            189
            <Users className="w-4 h-4 shrink-0" />
            <Tooltip id="tooltip-13" />
          </span>
          <img
            className="w-full h-auto object-cover transition duration-300 ease-in-out transform hover:scale-110"
            src="https://images.unsplash.com/photo-1547560488-bae538ffad63?q=80&w=2837&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Gallery Masonry Image"
          />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,transparent_50%,#2d2d2d)]"></div>
          <div className="absolute bottom-[10px] left-0 right-0 text-center text-white z-10 px-4 pointer-events-none">
            10-Day Early Riser
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
