import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import styles from './SupplierOnboardingLayout.module.css';

interface Step {
  n: number;
  label: string;
  desc: string;
}

interface SupplierOnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  steps: Step[];
}

const SupplierOnboardingLayout: React.FC<SupplierOnboardingLayoutProps> = ({ children, currentStep, steps }) => {
  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link to="/" className={styles.sidebarBrand}>
            AMJStar Dukandar <Star size={20} className={styles.brandStar} />
          </Link>
          <div className={styles.stepper}>
            {steps.map(step => {
              const isActive = currentStep === step.n;
              const isCompleted = currentStep > step.n;
              return (
                <div key={step.n} className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}>
                  <div className={styles.stepIcon}>
                    {isCompleted ? <Check size={16} /> : step.n}
                  </div>
                  <div className={styles.stepText}>
                    <span className={styles.stepTitle}>{step.label}</span>
                    <span className={styles.stepDesc}>{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <div id="supplier-form-scroll-area" className={styles.formSection}>
          {children}
        </div>
        <div className={styles.imageSection}>
          <img
            src="https://media.istockphoto.com/id/1197932646/photo/congratulating-the-new-partners.jpg?s=612x612&w=0&k=20&c=t1hbDdPtSEEfkznvCKSJVfg1rBb-EdUqG4C8CTLmmVo="
            alt="Business Partners"
          />
        </div>
      </main>
    </div>
  );
};

export default SupplierOnboardingLayout;
