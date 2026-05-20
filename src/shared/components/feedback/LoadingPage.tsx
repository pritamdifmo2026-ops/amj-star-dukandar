import React, { useState, useEffect } from 'react';
import marketplaceImg from '@/assets/images/loading/marketplace.png';
import verifiedImg from '@/assets/images/loading/verified.png';
import logisticsImg from '@/assets/images/loading/logistics.png';

const slides = [
  {
    image: marketplaceImg,
    title: 'Aapka Business, Humaara Platform!',
    subtitle: 'Connecting you to thousands of verified wholesalers across India.',
  },
  {
    image: verifiedImg,
    title: '100% Verified Suppliers',
    subtitle: 'Quality products from trusted manufacturers for your business growth.',
  },
  {
    image: logisticsImg,
    title: 'Pan-India Logistics',
    subtitle: 'Reliable delivery and real-time tracking for all your bulk orders.',
  },
];

const LoadingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-50 to-sky-100 flex flex-col items-center justify-center z-[9999] overflow-hidden px-5 py-10 font-sans">
      {/* Slider */}
      <div className="w-full max-w-[800px] h-[480px] relative mb-10 flex flex-col items-center max-sm:h-[380px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={[
              'absolute inset-0 flex flex-col items-center text-center pointer-events-none',
              'transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
              index === currentSlide
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 translate-y-5',
            ].join(' ')}
          >
            <div
              className={[
                'w-80 h-60 mb-8 rounded-[6px] overflow-hidden bg-cream shadow-[0_20px_40px_rgba(2,132,199,0.1)]',
                'flex items-center justify-center border-4 border-white',
                index === currentSlide ? 'animate-pulse-scale' : '',
                'max-sm:w-[220px] max-sm:h-[165px] max-sm:mb-6',
              ].join(' ')}
            >
              <img src={slide.image} alt={slide.title} className="w-full h-full object-contain" />
            </div>

            <div className="relative bg-slate-900 px-8 py-4 rounded-[60px_60px_60px_4px] mb-5 inline-block shadow-[0_10px_25px_rgba(0,0,0,0.2)] animate-float max-sm:px-6 max-sm:py-3">
              <h2 className="text-2xl text-white m-0 font-extrabold tracking-tight max-sm:text-lg">{slide.title}</h2>
            </div>

            <p className="text-lg text-slate-500 max-w-[460px] leading-relaxed max-sm:text-sm max-sm:max-w-[280px]">
              {slide.subtitle}
            </p>
          </div>
        ))}

        {/* Indicators */}
        <div className="absolute bottom-0 flex gap-2.5">
          {slides.map((_, index) => (
            <div
              key={index}
              className={[
                'h-2.5 rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                index === currentSlide ? 'w-[30px] rounded-[5px] bg-sky-600' : 'w-2.5 bg-slate-300',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-8 mt-5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-4 border-sky-600/10 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-widest">Loading AMJSTAR...</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[22px] font-black text-sky-600 tracking-tight">AMJSTAR</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">India ka Apna B2B Bazaar</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
