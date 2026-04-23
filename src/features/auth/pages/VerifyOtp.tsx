import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { setToken } from '@/shared/utils/auth';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
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
      
      if (response.isNewUser) {
        localStorage.setItem('temp_token', response.token);
        navigate('/select-role');
      } else {
        setToken(response.token);
        localStorage.removeItem('temp_phone');
        
        // Update Redux state
        const role = response.user?.role || 'buyer';
        dispatch(setCredentials({ 
          token: response.token, 
          user: { id: 'temp-id', name: 'User', email: '', role, phone } 
        }));
        
        // Redirect based on role
        if (role === 'supplier') navigate('/supplier/dashboard');
        else if (role === 'reseller') navigate('/reseller/dashboard');
        else navigate('/');
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
          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginTop: '10px' }}
        >
          Change Phone Number
        </button>
      </form>
    </>
  );
};

export default VerifyOtp;
