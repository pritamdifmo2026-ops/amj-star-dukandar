import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import adminService from '@/features/admin/services/admin.service';
import styles from './BannerSlider.module.css';

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
      className={styles.sliderContainer}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div 
        className={styles.slider}
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const imageUrl = banner[`image${deviceType}` as keyof Banner] as string;
          
          return (
            <div 
              key={banner._id} 
              className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            >
              <img 
                src={imageUrl} 
                alt="Promotion Banner" 
                className={styles.image} 
              />
              <div className={styles.overlay}>
                <div className={styles.contentContainer}>
                  <div className={styles.content}>
                    {/* Title and Subtitle removed as requested */}
                    {banner.link && (
                      <Link to={banner.link} className={styles.button}>
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
          <button className={`${styles.arrow} ${styles.prev}`} onClick={prevSlide}>
            <ChevronLeft size={30} />
          </button>
          <button className={`${styles.arrow} ${styles.next}`} onClick={nextSlide}>
            <ChevronRight size={30} />
          </button>

          <div className={styles.indicators}>
            {banners.map((_, index) => (
              <div
                key={index}
                className={`${styles.indicator} ${index === currentSlide ? styles.activeIndicator : ''}`}
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
