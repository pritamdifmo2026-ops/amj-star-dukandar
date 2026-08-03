import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { Mail, Lock, Phone } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useLogin } from '../hooks/useLogin';
import { ROUTES } from '@/shared/constants/routes';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

const Login: React.FC = () => {
  
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'buyer');

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setIdentifier('');
    setPassword('');
    setShowForgotPassword(false);
    setError('');
  }, [mode, loginMethod]);

  const { mutate: login, isPending: loading } = useLogin();

  const { isAuthenticated, user } = useAppSelector(s => s.auth);

  if (isAuthenticated && user) {
    const roleRedirect: Record<string, string> = {
      supplier: '/supplier/dashboard',
      reseller: '/reseller/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/admin/dashboard',
      buyer: '/',
    };
    return <Navigate to={roleRedirect[user.role] ?? '/'} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier) {
      setError(`Please enter your ${loginMethod === 'email' ? 'email' : 'phone number'}`);
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    login({ identifier, password }, {
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    });
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">Welcome Back</h2>
        <p className="text-[15px] text-slate-500 mt-1.5 m-0">Enter your credentials to securely login.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-[8px] bg-red-50 text-red-600 text-[13.5px] font-medium border border-red-100 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 mb-2">
          <span className="mt-0.5">⚠️</span>
          <div>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {loginMethod === 'email' ? (
          <Input
            label="Email"
            type="email"
            placeholder="Email address"
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setError(''); }}
            leftIcon={<Mail size={16} />}
            fullWidth
            required
            disabled={loading}
            autoComplete="username"
          />
        ) : (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Your phone number"
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setError(''); }}
            leftIcon={<Phone size={16} />}
            fullWidth
            required
            disabled={loading}
            autoComplete="username"
          />
        )}

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            leftIcon={<Lock size={16} />}
            fullWidth
            required
            disabled={loading}
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-primary font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <div className="mt-2">
          <Button type="submit" fullWidth loading={loading}>
            Login
          </Button>
        </div>
      </form>

      <div className="mt-4 pt-5 border-t border-slate-100 flex flex-col gap-3 text-center">
        <p className="text-[14px] text-slate-500 m-0">
          Don't have an account?{' '}
          <Link to={`${ROUTES.REGISTER}?mode=${mode}`} className="text-primary font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        <p className="text-[14px] text-slate-500 m-0">
          {loginMethod === 'email' ? (
            <span>
              Prefer to use your phone?{' '}
              <button type="button" onClick={() => setLoginMethod('phone')} className="text-primary font-medium hover:underline bg-transparent border-none cursor-pointer p-0">
                Login with Number
              </button>
            </span>
          ) : (
            <span>
              Prefer to use your email?{' '}
              <button type="button" onClick={() => setLoginMethod('email')} className="text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer p-0 transition-colors">
                Login with Email
              </button>
            </span>
          )}
        </p>
      </div>

    </div>
  );
};

export default Login;
