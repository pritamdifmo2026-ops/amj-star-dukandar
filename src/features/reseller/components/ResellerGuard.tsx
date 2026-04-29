import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import resellerService from '../services/reseller.service';
import { setResellerProfile } from '@/store/slices/reseller.slice';
import { ROUTES } from '@/shared/constants/routes';

interface ResellerGuardProps {
  children: React.ReactNode;
}

const ResellerGuard: React.FC<ResellerGuardProps> = ({ children }) => {
  const { profile } = useAppSelector(state => state.reseller);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    const checkStatus = async () => {
      if (!profile) {
        try {
          const data = await resellerService.getProfile();
          if (data) {
            dispatch(setResellerProfile(data));
          }
        } catch (err) {
          console.error('Failed to fetch reseller profile');
        } finally {
          setLoading(false);
        }
      } else {
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

  // If no profile yet or not approved, force onboarding/pending view
  if (!profile || profile.status !== 'APPROVED') {
    return <Navigate to={ROUTES.RESELLER_ONBOARDING} replace />;
  }

  return <>{children}</>;
};

export default ResellerGuard;
