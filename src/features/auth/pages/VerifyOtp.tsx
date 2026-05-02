import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import styles from '../components/Auth.module.css';

const VerifyOtp: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const storedPhone = localStorage.getItem('temp_phone');
    if (!storedPhone) {
      navigate('/login');
    } else {
      setPhone(storedPhone);
    }
  }, [navigate]);

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
      
      localStorage.removeItem('temp_phone');
      const mode = localStorage.getItem('auth_mode');
      
      // Update Redux state
      const user = response.user;
      dispatch(setCredentials({ user }));
      
      // Redirect based on role or if role is missing
      if (!user.role) {
        if (mode === 'buyer') {
          // Auto-assign buyer role
          const roleResponse = await authService.selectRole({ role: 'buyer' });
          dispatch(setCredentials({ user: roleResponse.user }));
          localStorage.removeItem('auth_mode');
          navigate('/profile');
        } else {
          navigate(mode ? `/select-role?mode=${mode}` : '/select-role');
          if (mode) localStorage.removeItem('auth_mode');
        }
      } else if (user.role === 'supplier') {
        navigate(ROUTES.SUPPLIER_DASHBOARD);
      } else if (user.role === 'reseller') {
        navigate(ROUTES.RESELLER_DASHBOARD);
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
    <>
      <h1 className={styles.title}>Verify OTP</h1>
      <p className={styles.subtitle}>Enter the 6-digit code sent to {phone}</p>
      
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
        
        <button 
          type="button" 
          className={styles.linkButton} 
          onClick={() => navigate('/login')}
        >
          Change Phone Number
        </button>
      </form>
    </>
  );
};

export default VerifyOtp;
