import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import styles from './ResellerOnboardingLayout.module.css';

interface Step {
  n: number;
  label: string;
  desc: string;
}

interface ResellerOnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  steps: Step[];
}

const ResellerOnboardingLayout: React.FC<ResellerOnboardingLayoutProps> = ({ children, currentStep, steps }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className={styles.onboardingPage}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link to="/" className={styles.brand}>
            <img src="/favicon.jpeg" alt="AMJStar Logo" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />
            AMJStar
          </Link>
          <div className={styles.stepper}>
            {steps.map(step => {
              const isActive = currentStep === step.n;
              const isCompleted = currentStep > step.n;
              return (
                <div key={step.n} className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}>
                  <div className={styles.stepIndicator}>
                    {isCompleted ? <Check size={16} /> : step.n}
                  </div>
                  <div className={styles.stepText}>
                    <div className={styles.stepLabel}>{step.label}</div>
                    <div className={styles.stepDesc}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.sidebarBottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default ResellerOnboardingLayout;
