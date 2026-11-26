import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ExternalLink } from 'lucide-react';
import VideoEmbed from '@/shared/components/VideoEmbed';
import { parseVideoUrl } from '@/shared/utils/videoEmbed';

export interface ILatestUpdate {
  _id: string;
  image: string;
  videoUrl?: string;
  title: string;
  description: string;
  link?: string;
  buttonText?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LatestUpdateModalProps {
  update: ILatestUpdate | null;
  onClose: () => void;
}

export const LatestUpdateModal: React.FC<LatestUpdateModalProps> = ({ update, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!update) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [update, onClose]);

  if (!update) return null;

  const video = parseVideoUrl(update.videoUrl);

  const handleAction = (e: React.MouseEvent) => {
    if (!update.link) return;
    if (update.link.startsWith('http')) {
      // Allow default external navigation in new tab
      return;
    }
    // Internal route
    e.preventDefault();
    onClose();
    navigate(update.link);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs sm:backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      {/* Modal Dialog Window: 80% width & 80% height on desktop, fully responsive on mobile/tablet */}
      <div className="relative w-[92vw] sm:w-[85vw] lg:w-[80vw] h-[88vh] sm:h-[84vh] lg:h-[80vh] max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-slide-up">
        
        {/* Pinned Floating Close Button - always visible and accessible */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-black flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-105 border border-white/80 cursor-pointer focus:outline-none"
          title="Close (Esc)"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Unified Scrollable Container: allows scrolling anywhere with mouse wheel or visible scrollbar */}
        <div className="flex-1 w-full min-h-0 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 overscroll-contain">
          
          {/* Top Hero: video when the update has one, otherwise the banner image */}
          <div className="relative w-full h-[220px] sm:h-[260px] md:h-[280px] lg:h-[300px] shrink-0 bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-100">
            {video ? (
              <VideoEmbed url={update.videoUrl!} title={update.title} poster={update.image} />
            ) : (
              <>
                {/* Ambient blurred backdrop using admin image */}
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 select-none"
                  style={{ backgroundImage: `url(${update.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                {/* Foreground Crisp Image */}
                <img
                  src={update.image}
                  alt={update.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x450?text=AMJSTAR+Update';
                  }}
                  className="relative z-10 max-h-full max-w-full object-contain p-4 sm:p-5 drop-shadow-md select-none transition-transform duration-300"
                />
              </>
            )}
          </div>

          {/* Scrollable Content Section */}
          <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              {/* Title */}
              <h2
                id="update-modal-title"
                className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0f172a] leading-snug tracking-tight mb-4"
              >
                {update.title}
              </h2>

              {/* Subtle Divider */}
              <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent my-4" />

              {/* Description / Content */}
              <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal space-y-4">
                {update.description}
              </div>
            </div>

            {/* Action Bar / Footer */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              {update.link ? (
                <a
                  href={update.link}
                  onClick={handleAction}
                  target={update.link.startsWith('http') ? '_blank' : undefined}
                  rel={update.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-200 no-underline cursor-pointer"
                >
                  <span>{update.buttonText || 'Learn More'}</span>
                  {update.link.startsWith('http') ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
                </a>
              ) : (
                <div />
              )}

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default LatestUpdateModal;
