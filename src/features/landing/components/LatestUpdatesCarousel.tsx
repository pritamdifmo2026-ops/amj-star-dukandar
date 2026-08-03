import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Briefcase, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';


interface ILatestUpdate {
  _id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  buttonText: string;
  isActive: boolean;
}

const LatestUpdatesCarousel: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: updates, isLoading } = useQuery({
    queryKey: ['latestUpdates'],
    queryFn: async () => {
      const res = await api.get('/latest-updates');
      return res.data.data as ILatestUpdate[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        // Reset to start if at the end
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }
  };

  // Auto-scroll effect (Continuous)
  useEffect(() => {
    if (!updates || updates.length === 0) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isPaused = false;

    const scroll = () => {
      if (!isPaused) {
        container.scrollLeft += 1; // scroll speed
        
        // Loop back to start if we hit the end
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    const pause = () => isPaused = true;
    const resume = () => isPaused = false;

    container.addEventListener('mouseenter', pause);
    container.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mouseenter', pause);
      container.removeEventListener('mouseleave', resume);
    };
  }, [updates]);

  if (isLoading) {
    return <div className="py-12 bg-white text-center">Loading updates...</div>;
  }

  if (!updates || updates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white  mt-10 py-12 relative overflow-hidden">
      <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 relative z-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">

        {/* Header Section */}
        <div className="lg:w-[240px] shrink-0 ">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">Latest Updates</h2>
            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live
            </div>
          </div>
          <p className="text-primary/80 mt-2 text-sm sm:text-base font-medium">Stay updated with the latest opportunities on AMJSTAR.</p>

          <div className="hidden lg:flex gap-2 mt-8">
            <button onClick={scrollLeft} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={scrollRight} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="flex-1 w-full min-w-0 relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {updates.map((update) => (
              <div
                key={update._id}
                className="shrink-0 w-[200px] lg:w-[210px] bg-white rounded-none border-none flex flex-col overflow-hidden group transition-all duration-300"
              >
                {/* Card Header / Image */}
                <div className="h-[130px] w-full relative bg-white overflow-hidden flex items-center justify-center border-b border-slate-100 p-1">
                  <img
                    src={update.image}
                    alt={update.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm text-primary leading-tight mb-2 line-clamp-2">
                    {update.title}
                  </h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mb-4 flex-1">
                    {update.description}
                  </p>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                        <Briefcase size={12} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 font-medium">Hiring Team</p>
                        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          Verified <CheckCircle2 size={10} className="text-green-500" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSS for hide-scrollbar */}
        <style dangerouslySetInnerHTML={{
          __html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
      </div>
    </div>
  );
};

export default LatestUpdatesCarousel;
