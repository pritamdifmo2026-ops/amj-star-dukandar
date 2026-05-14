import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, XCircle } from 'lucide-react';
import authService from '../services/auth.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import Loader from '@/shared/components/feedback/Loader';
import Button from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('No verification token found in URL.'); return; }
    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        if (isAuthenticated) dispatch(setCredentials({ user: response.user }));
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err?.response?.data?.message || 'Verification failed. Token may be expired.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
      <div className="bg-white p-10 rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] text-center max-w-[400px] w-[90%]">
        {status === 'loading' && (
          <>
            <Loader size="lg" />
            <h2 className="mt-5 text-heading">Verifying Email...</h2>
            <p className="text-muted">Please wait while we verify your email address.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <ShieldCheck size={64} color="#10b981" className="mx-auto mb-4" />
            <h2 className="text-heading mb-2">Email Verified!</h2>
            <p className="text-muted mb-2">Your email address has been successfully verified.</p>
            <p className="text-muted text-[0.9rem]">You can now close this window and return to your dashboard.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={64} color="#ef4444" className="mx-auto mb-4" />
            <h2 className="text-heading mb-2">Verification Failed</h2>
            <p className="text-muted mb-6">{errorMsg}</p>
            <Button onClick={() => navigate(ROUTES.HOME)} variant="outline" fullWidth>Go Home</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
