import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import styles from '../components/Auth.module.css';

const VerifyOtp: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  
  const phone = searchParams.get('phone') || '';
  const mode = searchParams.get('mode') || 'buyer';

  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      await authService.sendOtp({ phone });
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.verifyOtp({ phone, otp });
      const user = response.user;

      // Update Redux state
      dispatch(setCredentials({ user }));
      
      // Auto-assign role if they chose seller/reseller during login but don't have one
      if (user.role === 'buyer' && (mode === 'seller' || mode === 'reseller')) {
        const assignedRole = mode === 'seller' ? 'supplier' : 'reseller';
        const roleResponse = await authService.selectRole({ role: assignedRole });
        dispatch(setCredentials({ user: roleResponse.user }));
        
        if (assignedRole === 'supplier') {
          navigate('/supplier/onboarding');
        } else {
          navigate(ROUTES.RESELLER_DASHBOARD);
        }
        return;
      }

      // Redirect based on existing role
      if (user.role === 'supplier') {
        navigate('/supplier/onboarding');
      } else if (user.role === 'reseller') {
        navigate(ROUTES.RESELLER_DASHBOARD);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Verify OTP</h1>
      <p className={styles.subtitle}>
        Enter the 6-digit code sent to <br/>
        <strong>{phone}</strong>
      </p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>OTP Code</label>
          <input
            type="text"
            className={styles.input}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            required
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button 
          type="submit" 
          className={styles.button} 
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className={styles.resendWrapper}>
          {timer > 0 ? (
            <p className={styles.timerText}>Resend OTP in <strong>{timer}s</strong></p>
          ) : (
            <button 
              type="button" 
              className={styles.linkButton} 
              onClick={handleResend}
              disabled={loading}
            >
              Resend OTP
            </button>
          )}
        </div>
        
        <button 
          type="button" 
          className={styles.linkButton} 
          onClick={() => navigate('/login')}
          style={{ marginTop: '0.5rem' }}
        >
          Change Details
        </button>
      </form>
    </div>
  );
};

export default VerifyOtp;
