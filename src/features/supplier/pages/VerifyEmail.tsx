import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import supplierService from '../services/supplier.service';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasStarted = React.useRef(false);

  useEffect(() => {
    const verify = async () => {
      if (!token || hasStarted.current) return;
      hasStarted.current = true;
      try {
        await supplierService.verifyEmailChange(token);
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };
    verify();
  }, [token]);

  const titles = { loading: 'Verifying Your Email...', success: 'Email Verified Successfully!', error: 'Verification Failed' };
  const descs = {
    loading: 'Please wait while we secure your account details.',
    success: 'Your email address has been updated. You can now use your new email for all AMJSTAR communications.',
    error: message || 'We could not verify your email at this time.',
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-12 max-w-[480px] w-[90%] text-center">
        <div className="flex justify-center mb-6">
          {status === 'loading' && <Loader2 size={48} className="animate-spin text-primary" />}
          {status === 'success' && <CheckCircle size={48} className="text-[#10b981]" />}
          {status === 'error' && <XCircle size={48} className="text-error" />}
        </div>
        <h1 className="text-2xl font-bold text-heading mb-3">{titles[status]}</h1>
        <p className="text-body mb-8">{descs[status]}</p>
        {status !== 'loading' && (
          <Button onClick={() => navigate('/supplier/dashboard?tab=settings')} className="inline-flex items-center gap-2">
            {status === 'success' ? 'Go to Dashboard' : 'Back to Settings'} <ArrowRight size={18} />
          </Button>
        )}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-muted">
          <ShieldCheck size={14} />
          <span>Secure verification by AMJSTAR</span>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
