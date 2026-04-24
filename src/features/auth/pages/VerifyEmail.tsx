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
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in URL.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        // Update Redux state if the user is already logged in on this browser
        if (isAuthenticated) {
          dispatch(setCredentials({
            user: response.user
          }));
        }
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err?.response?.data?.message || 'Verification failed. Token may be expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
        {status === 'loading' && (
          <>
            <Loader size="lg" />
            <h2 style={{ marginTop: '20px', color: 'var(--text-h)' }}>Verifying Email...</h2>
            <p style={{ color: 'var(--text-muted)' }}>Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <ShieldCheck size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Your email address has been successfully verified.</p>
            <Button onClick={() => navigate('/profile')} style={{ width: '100%' }}>Return to Profile</Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{errorMsg}</p>
            <Button onClick={() => navigate(ROUTES.HOME)} variant="outline" style={{ width: '100%' }}>Go Home</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
