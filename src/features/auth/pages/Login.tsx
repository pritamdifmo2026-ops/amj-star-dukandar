import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import authService from '../services/auth.service';
import styles from '../components/Auth.module.css';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.sendOtp({ phone });
      localStorage.setItem('temp_phone', phone);
      if (mode) localStorage.setItem('auth_mode', mode);
      navigate('/verify-otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.backWrapper}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} /> Back to Home
        </Link>
      </div>
      <h1 className={styles.title}>
        {mode === 'seller' ? 'Join AMJStar as Partner' : 
         mode === 'buyer' ? 'Join AMJStar as Buyer' :
         mode === 'register' ? 'Register on AMJ' : 'Login to AMJ'}
      </h1>
      <p className={styles.subtitle}>Enter your phone number to receive an OTP</p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Phone Number</label>
          <input
            type="tel"
            className={styles.input}
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            maxLength={10}
            required
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
    </>
  );
};

export default Login;
