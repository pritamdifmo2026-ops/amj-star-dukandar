import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Store, ShoppingBag } from 'lucide-react';
import authService from '../services/auth.service';

import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import type { UserRole } from '../types';

const SelectRole: React.FC = () => {
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If we're here, the user should already have a session cookie from verify-otp
  }, []);

  const handleRoleSelect = async (role: UserRole) => {
    setLoading(role);
    setError('');

    try {
      const response = await authService.selectRole({ role });
      localStorage.removeItem('temp_phone');

      dispatch(setCredentials({
        user: response.user
      }));

      if (role === 'supplier') navigate('/supplier/onboarding');
      else if (role === 'reseller') navigate('/reseller/onboarding');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set role. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)] text-[var(--color-body)] font-sans">
      <header className="text-center py-[30px] px-2.5 min-[900px]:py-10 min-[900px]:px-5 bg-[var(--color-bg)]">
        <h1 className="text-[1.8rem] min-[900px]:text-[2.2rem] font-bold text-[var(--color-heading)] mb-2 tracking-tight">Choose Your Path</h1>
        <p className="text-[0.9rem] min-[900px]:text-[1rem] text-[var(--color-body)] max-w-[600px] mx-auto mb-5 min-[900px]:mb-3">
          Join thousands of businesses on AMJStar. Select the role that best describes how you'll use our platform.
        </p>
        {error && <div className="text-center text-red-600 bg-red-50 p-3 mx-auto my-4 rounded-lg max-w-[400px] border border-red-300">{error}</div>}
      </header>

      <div className="flex gap-2 min-[900px]:gap-4 w-full max-w-[1200px] mx-auto mb-auto px-2.5 min-[900px]:px-5">
        {/* Buyer Pane */}
        {mode !== 'seller' && (
          <div className="flex-1 flex flex-col justify-start items-center py-5 px-1.5 min-[900px]:py-6 min-[900px]:px-5 text-center transition-all duration-200 border border-[var(--color-border)] rounded-n rounded-[10px] min-[900px]:rounded-md bg-[var(--color-bg)] hover:border-emerald-600 hover:bg-slate-50 hover:-translate-y-1">
            <span className="inline-block py-1 px-1.5 min-[900px]:py-1.5 min-[900px]:px-3 rounded-full text-[0.5rem] min-[900px]:text-[0.75rem] font-bold uppercase tracking-wider mb-3 min-[900px]:mb-4 whitespace-nowrap bg-emerald-50 text-emerald-800">For Retailers</span>
            <div className="mb-2.5 min-[900px]:mb-4 p-2 min-[900px]:p-4 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center">
              <ShoppingBag className="!w-6 !h-6 min-[900px]:!w-9 min-[900px]:!h-9" color="#0B7F5A" />
            </div>
            <h2 className="text-base min-[900px]:text-2xl font-bold text-[var(--color-heading)] mb-3">Buyer</h2>
            <p className="hidden min-[900px]:block text-[0.95rem] text-[var(--color-body)] leading-relaxed mb-6 max-w-[320px]">
              Source high-quality products in bulk at wholesale prices directly from verified manufacturers.
            </p>
            <button
              className={`mt-auto py-1.5 px-0.5 min-[900px]:py-2.5 min-[900px]:px-4 text-[0.6rem] min-[900px]:text-[0.95rem] font-semibold rounded-md min-[900px]:rounded-lg cursor-pointer transition-all duration-200 w-full max-w-full min-[900px]:max-w-[220px] border-none min-h-[40px] min-[900px]:min-h-[48px] flex items-center justify-center leading-tight whitespace-nowrap bg-emerald-800 text-white hover:bg-emerald-700 hover:opacity-90 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => handleRoleSelect('buyer')}
              disabled={!!loading}
            >
              {loading === 'buyer' ? 'Setting up...' : 'Join as Buyer'}
            </button>
          </div>
        )}

        {/* Supplier Pane */}
        <div className="flex-1 flex flex-col justify-start items-center py-5 px-1.5 min-[900px]:py-6 min-[900px]:px-5 text-center transition-all duration-200 border border-[var(--color-border)] rounded-n rounded-[10px] min-[900px]:rounded-md bg-[var(--color-bg)] hover:border-blue-600 hover:bg-slate-50 hover:-translate-y-1">
          <span className="inline-block py-1 px-1.5 min-[900px]:py-1.5 min-[900px]:px-3 rounded-full text-[0.5rem] min-[900px]:text-[0.75rem] font-bold uppercase tracking-wider mb-3 min-[900px]:mb-4 whitespace-nowrap bg-blue-50 text-blue-800">For Manufacturers</span>
          <div className="mb-2.5 min-[900px]:mb-4 p-2 min-[900px]:p-4 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center">
            <Store className="!w-6 !h-6 min-[900px]:!w-9 min-[900px]:!h-9" color="#1A3C5E" />
          </div>
          <h2 className="text-base min-[900px]:text-2xl font-bold text-[var(--color-heading)] mb-3">Supplier</h2>
          <p className="hidden min-[900px]:block text-[0.95rem] text-[var(--color-body)] leading-relaxed mb-6 max-w-[320px]">
            List your catalog, reach thousands of retailers across India, and grow your B2B sales effortlessly.
          </p>
          <button
            className={`mt-auto py-1.5 px-0.5 min-[900px]:py-2.5 min-[900px]:px-4 text-[0.6rem] min-[900px]:text-[0.95rem] font-semibold rounded-md min-[900px]:rounded-lg cursor-pointer transition-all duration-200 w-full max-w-full min-[900px]:max-w-[220px] border-none min-h-[40px] min-[900px]:min-h-[48px] flex items-center justify-center leading-tight whitespace-nowrap bg-blue-900 text-white hover:bg-blue-600 hover:opacity-90 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => handleRoleSelect('supplier')}
            disabled={!!loading}
          >
            {loading === 'supplier' ? 'Setting up...' : 'Join as Supplier'}
          </button>
        </div>

        {/* Reseller Pane */}
        <div className="flex-1 flex flex-col justify-start items-center py-5 px-1.5 min-[900px]:py-6 min-[900px]:px-5 text-center transition-all duration-200 border border-[var(--color-border)] rounded-n rounded-[10px] min-[900px]:rounded-md bg-[var(--color-bg)] hover:border-orange-600 hover:bg-slate-50 hover:-translate-y-1">
          <span className="inline-block py-1 px-1.5 min-[900px]:py-1.5 min-[900px]:px-3 rounded-full text-[0.5rem] min-[900px]:text-[0.75rem] font-bold uppercase tracking-wider mb-3 min-[900px]:mb-4 whitespace-nowrap bg-orange-50 text-orange-800">For Entrepreneurs</span>
          <div className="mb-2.5 min-[900px]:mb-4 p-2 min-[900px]:p-4 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center">
            <User className="!w-6 !h-6 min-[900px]:!w-9 min-[900px]:!h-9" color="#D94F00" />
          </div>
          <h2 className="text-base min-[900px]:text-2xl font-bold text-[var(--color-heading)] mb-3">Reseller</h2>
          <p className="hidden min-[900px]:block text-[0.95rem] text-[var(--color-body)] leading-relaxed mb-6 max-w-[320px]">
            Start your own business with zero investment. Share products with your network and earn margins.
          </p>
          <button
            type="button"
            className={`mt-auto py-1.5 px-0.5 min-[900px]:py-2.5 min-[900px]:px-4 text-[0.6rem] min-[900px]:text-[0.95rem] font-semibold rounded-md min-[900px]:rounded-lg cursor-pointer transition-all duration-200 w-full max-w-full min-[900px]:max-w-[220px] border-none min-h-[40px] min-[900px]:min-h-[48px] flex items-center justify-center leading-tight whitespace-nowrap bg-orange-700 text-white hover:bg-orange-600 hover:opacity-90 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => handleRoleSelect('reseller')}
            disabled={!!loading}
          >
            {loading === 'reseller' ? 'Setting up...' : 'Join as Reseller'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
