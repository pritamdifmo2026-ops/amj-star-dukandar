import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import authService from '../services/auth.service';
import styles from '../components/Auth.module.css';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'buyer';

  const validateForm = () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      await authService.sendOtp({ phone });
      navigate(`/verify-otp?phone=${phone}&mode=${mode}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
        Back to Home
      </button>

      <h1 className={styles.title}>
        {mode === 'seller' ? 'Join AMJStar as Partner' : 'Welcome to AMJStar'}
      </h1>
      <p className={styles.subtitle}>Enter your phone number to receive an OTP</p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Phone Number</label>
          <input
            type="tel"
            className={styles.input}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
              setError('');
            }}
            placeholder="Enter 10-digit mobile number"
            required
            disabled={loading}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button 
          type="submit" 
          className={styles.button} 
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
};

export default Login;
