import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import adminService from '@/features/admin/services/admin.service';

interface Banner {
  _id: string;
  imageDesktop: string;
  imageTablet: string;
  imageMobile: string;
  link: string;
  status: boolean;
  order: number;
}

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deviceType, setDeviceType] = useState<'Mobile' | 'Tablet' | 'Desktop'>('Desktop');

  // Touch swipe gesture state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const updateDeviceType = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) setDeviceType('Mobile');
    else if (width < 1024) setDeviceType('Tablet');
    else setDeviceType('Desktop');
  }, []);

  useEffect(() => {
    adminService.getActiveBanners().then(data => setBanners(data)).catch(() => {}).finally(() => setLoading(false));
    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, [updateDeviceType]);

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentSlide(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (isHovering || banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isHovering, banners.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (loading || banners.length === 0) return null;

  const getImageUrl = (banner: Banner) => {
    if (deviceType === 'Mobile' && banner.imageMobile) return banner.imageMobile;
    if (deviceType === 'Tablet' && banner.imageTablet) return banner.imageTablet;
    return banner.imageDesktop || banner.imageTablet || banner.imageMobile || '';
  };

  return (
    <div
      className="relative w-full aspect-[16/6] sm:aspect-auto sm:h-[240px] lg:h-[300px] overflow-hidden my-2 sm:my-4 mb-4 sm:mb-8 rounded-none sm:rounded-[12px] group select-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex w-full h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const imageUrl = getImageUrl(banner);
          const isActive = index === currentSlide;

          return (
            <div key={banner._id} className="min-w-full h-full relative flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Promotion Banner"
                className={`w-full h-full max-sm:object-fill object-cover transition-transform duration-[1500ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}
              />
              {banner.link && (
                <Link to={banner.link} className="absolute inset-0 z-[2]" aria-label="Banner link" />
              )}
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          {/* Previous Slide Button (Mobile & Desktop) */}
          <button
            aria-label="Previous Slide"
            className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-5 bg-black/40 sm:bg-white/20 backdrop-blur-[6px] border-none w-8 h-8 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center text-white cursor-pointer z-10 transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 hover:bg-black/60 sm:hover:bg-white/40 hover:scale-110"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-5 h-5 sm:w-[30px] sm:h-[30px]" />
          </button>

          {/* Next Slide Button (Mobile & Desktop) */}
          <button
            aria-label="Next Slide"
            className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-5 bg-black/40 sm:bg-white/20 backdrop-blur-[6px] border-none w-8 h-8 sm:w-[50px] sm:h-[50px] rounded-full flex items-center justify-center text-white cursor-pointer z-10 transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 hover:bg-black/60 sm:hover:bg-white/40 hover:scale-110"
            onClick={nextSlide}
          >
            <ChevronRight className="w-5 h-5 sm:w-[30px] sm:h-[30px]" />
          </button>

          {/* Slide Dots Indicator */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
            {banners.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 sm:h-2 rounded-full cursor-pointer transition-all ${index === currentSlide ? 'bg-white w-4 sm:w-5' : 'w-1.5 sm:w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerSlider;
