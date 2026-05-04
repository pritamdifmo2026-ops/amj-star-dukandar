import React, { useState, useEffect } from 'react';
import styles from './LoadingPage.module.css';
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
    <div className={styles.loadingPage}>
      <div className={styles.sliderContainer}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
          >
            <div className={styles.imageWrapper}>
              <img src={slide.image} alt={slide.title} />
            </div>
            <div className={styles.content}>
              <div className={styles.bubble}>
                <h2>{slide.title}</h2>
              </div>
              <p>{slide.subtitle}</p>
            </div>
          </div>
        ))}
        
        <div className={styles.indicators}>
          {slides.map((_, index) => (
            <div
              key={index}
              className={`${styles.indicator} ${index === currentSlide ? styles.indicatorActive : ''}`}
            />
          ))}
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.loaderWrapper}>
          <div className={styles.spinner} />
          <p>Loading AMJStar...</p>
        </div>
        <div className={styles.brand}>
           <span className={styles.brandText}>AMJStar</span>
           <span className={styles.brandTagline}>India ka Apna B2B Bazaar</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
