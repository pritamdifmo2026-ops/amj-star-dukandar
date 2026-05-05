import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import supplierService from '../services/supplier.service';
import { setSupplierProfile } from '@/store/slices/supplier.slice';

interface SupplierGuardProps {
  children: React.ReactNode;
}

const SupplierGuard: React.FC<SupplierGuardProps> = ({ children }) => {
  const { profile } = useAppSelector(state => state.supplier);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    const checkStatus = async () => {
      if (!profile) {
        try {
          const data = await supplierService.getProfile();
          if (data.supplier) {
            dispatch(setSupplierProfile(data.supplier));
          }
        } catch (err) {
          // Allow access to dashboard directly even if not approved
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
    return <div style={{ padding: '40px', textAlign: 'center' }}>Verifying account status...</div>;
  }

  // Allow access to dashboard directly even if not verified
  // Verification status can be handled via banners inside the dashboard
  return <>{children}</>;

  return <>{children}</>;
};

export default SupplierGuard;
