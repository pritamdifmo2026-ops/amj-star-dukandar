import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Phone, Lock, Mail } from 'lucide-react';
import { authApi } from '../services/auth.api';
import toast from 'react-hot-toast';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Identifier, 2: OTP & New Password, 3: Success
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIdentifier('');
    setError('');
  }, [resetMethod]);

  // Auto-verify OTP when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && step === 2) {
      verifyOtpInline(otp);
    } else {
      setOtpStatus('idle');
    }
  }, [otp, step]);

  const verifyOtpInline = async (currentOtp: string) => {
    setOtpStatus('verifying');
    try {
      await authApi.verifyForgotPasswordOtp({ identifier, otp: currentOtp });
      setOtpStatus('valid');
    } catch (err) {
      setOtpStatus('invalid');
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError(`Please enter your ${resetMethod === 'email' ? 'email' : 'phone number'}`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.sendForgotPasswordOtp(identifier);
      toast.success('OTP sent successfully');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpStatus !== 'valid') {
      setError('Please enter a valid OTP first');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ identifier, otp, newPassword });
      toast.success('Password reset successfully');
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 animate-in fade-in zoom-in duration-300">
        <CheckCircle2 size={64} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-heading mb-2">Password Reset Complete</h2>
        <p className="text-muted mb-8 max-w-sm">
          Your password has been successfully updated. You can now log in with your new password.
        </p>
        <Button onClick={onBack} fullWidth>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center -ml-2 mb-2">
        <button 
          type="button" 
          onClick={onBack} 
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-heading transition-colors bg-transparent border-none cursor-pointer py-1 px-2 rounded-md hover:bg-slate-100"
        >
          <ArrowLeft size={16} /> 
          <span>Back to Login</span>
        </button>
      </div>
      
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-heading m-0">Forgot Password</h2>
        <p className="text-sm text-muted mt-1 m-0">
          {step === 1 
            ? `Enter your ${resetMethod === 'email' ? 'email' : 'phone number'} to receive an OTP.` 
            : `Enter the OTP sent to ${identifier}`}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-[8px] bg-red-50 text-red-600 text-[13.5px] font-medium border border-red-100 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 mb-2">
          <span className="mt-0.5">⚠️</span>
          <div>
            <span>{error}</span>
          </div>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          {resetMethod === 'email' ? (
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
            />
          )}

          <div className="mt-2">
            <Button type="submit" fullWidth loading={loading}>
              Send OTP
            </Button>
          </div>
          
          <p className="text-sm text-muted text-center m-0 flex flex-col gap-2">
            {resetMethod === 'email' ? (
              <span>
                Prefer to use your phone?{' '}
                <button type="button" onClick={() => setResetMethod('phone')} className="text-primary font-medium hover:underline bg-transparent border-none cursor-pointer p-0">
                  Reset with Number
                </button>
              </span>
            ) : (
              <span>
                Prefer to use your email?{' '}
                <button type="button" onClick={() => setResetMethod('email')} className="text-primary font-medium hover:underline bg-transparent border-none cursor-pointer p-0">
                  Reset with Email
                </button>
              </span>
            )}
          </p>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <div className="relative">
            <Input 
              label="Enter OTP" 
              type="text" 
              placeholder="6-digit OTP"
              value={otp} 
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }} 
              maxLength={6}
              fullWidth 
              required 
              disabled={loading || otpStatus === 'verifying'}
            />
            <div className="absolute right-3 top-[32px]">
              {otpStatus === 'verifying' && <span className="text-[11px] text-blue-500 font-medium">Verifying...</span>}
              {otpStatus === 'valid' && <span className="text-[11px] text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={12}/> Verified</span>}
              {otpStatus === 'invalid' && <span className="text-[11px] text-red-500 font-medium">Invalid</span>}
            </div>
          </div>

          <Input 
            label="New Password" 
            type="password" 
            placeholder="At least 8 characters"
            value={newPassword} 
            onChange={e => { setNewPassword(e.target.value); setError(''); }} 
            leftIcon={<Lock size={16} />} 
            fullWidth 
            required 
            disabled={loading || otpStatus !== 'valid'}
          />

          <Input 
            label="Confirm Password" 
            type="password" 
            placeholder="Re-enter new password"
            value={confirmPassword} 
            onChange={e => { setConfirmPassword(e.target.value); setError(''); }} 
            leftIcon={<Lock size={16} />} 
            fullWidth 
            required 
            disabled={loading || otpStatus !== 'valid'}
          />

          <div className="mt-2">
            <Button type="submit" fullWidth loading={loading} disabled={otpStatus !== 'valid'}>
              Reset Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
