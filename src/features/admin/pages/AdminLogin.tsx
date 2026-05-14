import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import authService from '@/features/auth/services/auth.service';
import Button from '@/shared/components/ui/Button';
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
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-10 w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-[#eff6ff] rounded-[14px] flex items-center justify-center text-[#0284c7] mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">AMJ Admin Portal</h1>
          <p className="text-sm text-[#64748b] m-0">Secure login for platform administrators</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm px-4 py-3 rounded-[8px]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">Email Address</label>
            <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 focus-within:border-[#0284c7] bg-white transition-colors">
              <Mail size={18} className="text-[#94a3b8] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
                className="flex-1 border-none outline-none text-sm text-[#1e293b] bg-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">Password</label>
            <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 focus-within:border-[#0284c7] bg-white transition-colors">
              <Lock size={18} className="text-[#94a3b8] shrink-0" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex-1 border-none outline-none text-sm text-[#1e293b] bg-transparent"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
            Access Dashboard
          </Button>
        </form>

        <p className="text-xs text-[#94a3b8] text-center mt-6 m-0">© 2026 AMJ Marketplace. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AdminLogin;
