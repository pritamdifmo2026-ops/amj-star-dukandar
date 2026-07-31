import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import resellerService from '../services/reseller.service';
import { setResellerProfile } from '@/features/reseller/store/reseller.slice';
import { Navigate } from 'react-router-dom';

interface ResellerGuardProps {
  children: React.ReactNode;
}

const ResellerGuard: React.FC<ResellerGuardProps> = ({ children }) => {
  const { profile } = useAppSelector(state => state.reseller);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(!profile);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (!profile) {
          const data = await resellerService.getProfile();
          if (data) {
            dispatch(setResellerProfile(data));
            if (data.status !== 'APPROVED') {
              setNeedsOnboarding(true);
            }
          } else {
            setNeedsOnboarding(true);
          }
        } else if (profile.status !== 'APPROVED') {
          setNeedsOnboarding(true);
        }
      } catch (err) {
        // If error (e.g. no profile yet), send them to onboarding
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [profile, dispatch]);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        background: '#f8fafc'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #e2e8f0', 
          borderTopColor: '#0f172a', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontWeight: 500 }}>Verifying account status...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/reseller/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ResellerGuard;
