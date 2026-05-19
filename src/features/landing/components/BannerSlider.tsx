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
    fetchBanners();
    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, [updateDeviceType]);

  const fetchBanners = async () => {
    try {
      const data = await adminService.getActiveBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (isHovering || banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isHovering, banners.length]);

  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <div 
      className="group relative w-full h-[280px] max-lg:h-[220px] max-sm:h-[180px] overflow-hidden bg-[#f8f9fa] my-4 mb-8 max-sm:my-0 rounded-lg max-sm:rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-sm:shadow-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div 
        className="flex w-full h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const imageUrl = banner[`image${deviceType}` as keyof Banner] as string;
          
          return (
            <div 
              key={banner._id} 
              className="min-w-full h-full relative flex items-center justify-center"
            >
              <img 
                src={imageUrl} 
                alt="Promotion Banner" 
                className={`w-full h-full object-cover transition-transform duration-[1500ms] ease-out ${index === currentSlide ? 'scale-105' : ''}`} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent max-sm:bg-gradient-to-t max-sm:from-black/40 max-sm:to-transparent flex items-end justify-end p-6 max-sm:p-4 z-[2]">
                <div className="w-full max-w-[1200px] mx-auto px-8 max-sm:px-0">
                  <div className={`transition-all duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    {banner.link && (
                      <Link to={banner.link} className="inline-block py-2.5 px-[18px] max-sm:py-1.5 max-sm:px-[12px] bg-black text-white text-sm max-sm:text-[11px] font-semibold rounded-lg max-sm:rounded-md border border-black hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg hover:scale-105 transition-all duration-300">
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button className="absolute left-5 max-sm:hidden top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md border-none w-[50px] h-[50px] rounded-full flex items-center justify-center text-white cursor-pointer z-10 transition-all duration-300 hover:bg-white/40 hover:scale-110 opacity-0 group-hover:opacity-100" onClick={prevSlide}>
            <ChevronLeft size={30} />
          </button>
          <button className="absolute right-5 max-sm:hidden top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md border-none w-[50px] h-[50px] rounded-full flex items-center justify-center text-white cursor-pointer z-10 transition-all duration-300 hover:bg-white/40 hover:scale-110 opacity-0 group-hover:opacity-100" onClick={nextSlide}>
            <ChevronRight size={30} />
          </button>

          <div className="absolute bottom-3 max-sm:bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
            {banners.map((_, index) => (
              <div
                key={index}
                className={`h-2.5 rounded-full cursor-pointer transition-all duration-300 ${index === currentSlide ? 'w-6 rounded-[10px] bg-white' : 'w-2.5 bg-white/30'}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerSlider;
