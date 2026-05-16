import React, { useState, useEffect, useCallback } from 'react';
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

  if (loading || banners.length === 0) return null;

  return (
    <div
      className="relative w-full h-[280px] max-lg:h-[220px] max-md:h-[180px] overflow-hidden bg-[#f8f9fa] my-4 mb-8 rounded-[8px] max-md:rounded-none max-md:my-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="flex w-full h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const imageUrl = banner[`image${deviceType}` as keyof Banner] as string;
          const isActive = index === currentSlide;

          return (
            <div key={banner._id} className="min-w-full h-full relative flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Promotion Banner"
                className={`w-full h-full object-cover transition-transform duration-[1500ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}
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
          <button
            className="absolute top-1/2 -translate-y-1/2 left-5 bg-white/20 backdrop-blur-[8px] border-none w-[50px] h-[50px] rounded-full flex items-center justify-center text-white cursor-pointer z-10 transition-all opacity-0 group-hover:opacity-100 hover:bg-white/40 hover:scale-110 max-md:hidden"
            onClick={prevSlide}
          >
            <ChevronLeft size={30} />
          </button>
          <button
            className="absolute top-1/2 -translate-y-1/2 right-5 bg-white/20 backdrop-blur-[8px] border-none w-[50px] h-[50px] rounded-full flex items-center justify-center text-white cursor-pointer z-10 transition-all opacity-0 group-hover:opacity-100 hover:bg-white/40 hover:scale-110 max-md:hidden"
            onClick={nextSlide}
          >
            <ChevronRight size={30} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
            {banners.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full cursor-pointer transition-all ${index === currentSlide ? 'bg-cream w-6' : 'w-2.5 bg-white/30'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerSlider;
