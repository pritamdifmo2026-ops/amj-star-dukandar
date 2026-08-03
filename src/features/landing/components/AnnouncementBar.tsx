import React from 'react';
import { useQuery } from '@tanstack/react-query';

import api from '@/api/client';

const AnnouncementBar: React.FC = () => {
  const { data: settings } = useQuery({
    queryKey: ['platformSettings'],
    queryFn: async () => {
      const res = await api.get('/settings/platform');
      return res.data.settings;
    },
    staleTime: 5 * 60 * 1000, // 5 mins cache
  });

  if (!settings?.announcementText) {
    return null;
  }

  // Split text by pipe "|" if the admin used it, otherwise it's just one item
  const segments = settings.announcementText.split('|').map((s: string) => s.trim()).filter(Boolean);

  // Repeat the segments multiple times to create a seamless infinite scroll
  const repeatedSegments = Array(10).fill(segments).flat();

  return (
    <div className="mt-4 sm:mt-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
      
      {/* We add a style tag specifically for the seamless marquee in this component */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-scroll 80s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-6 relative z-10">
        
        {/* Badge / Label */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary/20 shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-3 py-1.5 rounded-full shrink-0 z-10">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </div>
          <span className="text-primary text-xs sm:text-sm font-extrabold tracking-wide uppercase">
            Latest Update
          </span>
        </div>
        
        {/* Ticker / Marquee effect */}
        <div 
          className="flex-1 overflow-hidden relative"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
        >
          <div className="animate-ticker cursor-default flex items-center">
            {repeatedSegments.map((text, i) => (
              <React.Fragment key={i}>
                {settings.announcementImage && (
                  <img src={settings.announcementImage} alt="Update" className="h-6 object-contain mr-3 rounded" />
                )}
                <span className="text-[13px] sm:text-[15px] text-heading font-semibold tracking-wide">
                  {text}
                </span>
                <span className="mx-6 sm:mx-10 text-primary/40 select-none">|</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
