import React, { useState, useEffect } from 'react';
import marketplaceImg from '@/assets/images/loading/marketplace.png';
import verifiedImg from '@/assets/images/loading/verified.png';
import logisticsImg from '@/assets/images/loading/logistics.png';

const slides = [
  {
    image: marketplaceImg,
    title: "Aapka Business, Humaara Platform!",
    subtitle: "Connecting you to thousands of verified wholesalers across India."
  },
  {
    image: verifiedImg,
    title: "100% Verified Suppliers",
    subtitle: "Quality products from trusted manufacturers for your business growth."
  },
  {
    image: logisticsImg,
    title: "Pan-India Logistics",
    subtitle: "Reliable delivery and real-time tracking for all your bulk orders."
  }
];

const LoadingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-50 to-sky-100 flex flex-col items-center justify-center z-[9999] font-['Inter',system-ui,sans-serif] overflow-hidden px-5 py-10">
      <div className="w-full max-w-[800px] h-[480px] max-md:h-[420px] max-sm:h-[380px] relative mb-10 flex flex-col items-center">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex flex-col items-center text-center transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none ${
              index === currentSlide
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 translate-y-5'
            }`}
          >
            <div className={`w-[320px] h-[240px] max-md:w-[280px] max-md:h-[210px] max-sm:w-[220px] max-sm:h-[165px] mb-8 max-sm:mb-6 rounded-md overflow-hidden bg-[oklch(0.99_0.01_80)] shadow-[0_20px_40px_rgba(2,132,199,0.1)] flex items-center justify-center border-4 border-white transition-transform duration-500 ${index === currentSlide ? 'animate-pulse-slow' : ''}`}>
              <img src={slide.image} alt={slide.title} className="w-full h-full object-contain" />
            </div>
            <div className="relative bg-slate-800 py-4 px-8 max-sm:py-3 max-sm:px-6 rounded-[60px_60px_60px_4px] mb-5 inline-block shadow-[0_10px_25px_rgba(0,0,0,0.2)] animate-[float_3s_ease-in-out_infinite]">
              <h2 className="text-2xl max-md:text-xl max-sm:text-lg text-white m-0 font-extrabold tracking-[-0.5px]">{slide.title}</h2>
            </div>
            <p className="text-lg max-md:text-base max-sm:text-sm text-slate-600 max-w-[460px] max-md:max-w-[380px] max-sm:max-w-[280px] leading-relaxed font-normal">{slide.subtitle}</p>
          </div>
        ))}

        <div className="absolute bottom-0 flex gap-2.5">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-[10px] rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                index === currentSlide ? 'w-[30px] rounded-[5px] bg-sky-600' : 'w-[10px] bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 mt-5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-4 border-sky-600/10 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-[1.5px]">Loading AMJStar...</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[22px] max-sm:text-lg font-black text-sky-600 tracking-[-0.5px]">AMJStar</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-[1px]">India ka Apna B2B Bazaar</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
