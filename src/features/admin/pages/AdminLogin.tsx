import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/features/auth/store/auth.slice';
import authService from '@/features/auth/services/auth.service';
import {
  Lock, Mail, Eye, EyeOff, Globe, ChevronDown,
  Package, ShoppingCart, Users, BarChart2
} from 'lucide-react';
import logo from '@/assets/logoo.png';
import bannerImg from '@/assets/login_banner.png';

const features = [
  { icon: Package,      label: 'Manage Products & Inventory' },
  { icon: ShoppingCart, label: 'Track Orders & Payments'     },
  { icon: Users,        label: 'Monitor Vendors & Buyers'    },
  { icon: BarChart2,    label: 'Grow Your Business'          },
];

const AdminLogin: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address'); return; }
    if (password.length < 6)            { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await authService.adminLogin(email, password);
      dispatch(setCredentials(response));
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="flex w-full max-w-[880px] min-h-[540px] bg-white rounded-xl shadow-none lg:shadow-2xl overflow-hidden">
        
        {/* Left Side */}
        <div 
          className="hidden lg:flex flex-col justify-center p-10 w-1/2 relative bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(210, 75, 20, 0.92) 0%, rgba(135, 35, 5, 0.95) 100%), url(${bannerImg})`,
          }}
        >
          {/* Logo Section */}
          <div className="absolute top-8 left-8 flex flex-col items-start gap-1">
            <img src={logo} alt="AMJSTAR" className="h-10 rounded-full" />
            <div className="bg-black/60 rounded px-2 py-0.5 mt-1">
              <span className="text-[7px] font-bold text-white tracking-[0.1em] uppercase">Wholesale Marketplace</span>
            </div>
          </div>

          <div className="text-white mt-10">
            <h1 className="text-3xl font-bold mb-3 leading-tight">Welcome Back,<br />Admin!</h1>
            <p className="text-white/90 text-sm leading-relaxed mb-8 max-w-sm">
              Manage your wholesale business,<br />vendors, orders and customers<br />all in one place.
            </p>

            <div className="flex flex-col gap-4">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex flex-col relative px-8 py-8">
          
          {/* Language selector */}
          <div className="absolute top-6 right-6">
            <button className="flex items-center gap-1.5 border border-gray-200 rounded-md px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Globe size={14} className="text-gray-500" />
              English
              <ChevronDown size={14} className="text-gray-500 ml-1" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-[320px] mx-auto w-full">
            <div className="text-center mb-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Admin Login</h2>
              <p className="text-gray-500 text-sm">Sign in to your admin account</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Email Address</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-[#E4572E] focus-within:ring-1 focus-within:ring-[#E4572E] bg-white transition-all">
                  <Mail size={18} className="text-gray-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 border-none outline-none text-sm text-gray-900 bg-transparent placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">Password</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-[#E4572E] focus-within:ring-1 focus-within:ring-[#E4572E] bg-white transition-all">
                  <Lock size={18} className="text-gray-400 shrink-0" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="flex-1 border-none outline-none text-sm text-gray-900 bg-transparent placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#E4572E] focus:ring-[#E4572E] focus:ring-offset-0 cursor-pointer"
                    style={{ accentColor: '#E4572E' }}
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-3 bg-[#E4572E] hover:bg-[#d04a25] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          <p className="text-[13px] text-gray-400 text-center mt-auto mb-4">
            © {new Date().getFullYear()} AMJSTAR. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
