import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import authService from '@/features/auth/services/auth.service';
import Button from '@/shared/components/ui/Button';
import styles from './AdminLogin.module.css';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // We need to add adminLogin to authService on frontend too
      const response = await authService.adminLogin(email, password);
      dispatch(setCredentials(response));
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <ShieldCheck size={32} />
          </div>
          <h1>AMJ Admin Portal</h1>
          <p>Secure login for platform administrators</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            loading={loading}
            className={styles.submitBtn}
          >
            Access Dashboard
          </Button>
        </form>

        <div className={styles.footer}>
          <p>© 2026 AMJ Marketplace. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
