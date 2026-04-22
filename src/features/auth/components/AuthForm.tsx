import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';
import { useLogin } from '../hooks/useLogin';
import styles from './AuthForm.module.css';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.heading}>Sign In</h2>
      <p className={styles.sub}>Welcome back to AMJ Star Dukandar</p>

      <div className={styles.fields}>
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          fullWidth
          required
        />
        <Input
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button type="button" onClick={() => setShowPass((p) => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          fullWidth
          required
        />
      </div>

      <Button type="submit" fullWidth loading={isPending}>
        Sign In
      </Button>

      <p className={styles.switch}>
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className={styles.link}>
          Register
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
