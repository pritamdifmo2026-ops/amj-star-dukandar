import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import supplierService from '../services/supplier.service';
import { setSupplierProfile, OnboardingStatus } from '@/features/supplier/store/supplier.slice';
import { Navigate } from 'react-router-dom';

interface SupplierGuardProps {
  children: React.ReactNode;
}

const SupplierGuard: React.FC<SupplierGuardProps> = ({ children }) => {
  const { profile } = useAppSelector(state => state.supplier);
  const dispatch = useAppDispatch();
  const profileIncomplete = profile ? profile.onboardingStatus !== OnboardingStatus.COMPLETED : false;
  const [loading, setLoading] = useState(!profile);
  const [needsOnboarding, setNeedsOnboarding] = useState(profileIncomplete);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (!profile) {
          const data = await supplierService.getProfile();
          if (data.supplier) {
            dispatch(setSupplierProfile(data.supplier));
            if (data.supplier.onboardingStatus !== OnboardingStatus.COMPLETED) {
              setNeedsOnboarding(true);
            }
          } else {
            setNeedsOnboarding(true);
          }
        } else if (profile.onboardingStatus !== OnboardingStatus.COMPLETED) {
          setNeedsOnboarding(true);
        }
      } catch (err) {
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [profile, dispatch]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Verifying account status...</div>;
  }

  if (needsOnboarding) {
    return <Navigate to="/supplier/onboarding" replace />;
  }

  return <>{children}</>;
};

export default SupplierGuard;
