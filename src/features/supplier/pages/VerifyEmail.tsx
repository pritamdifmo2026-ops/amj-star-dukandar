import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import supplierService from '../services/supplier.service';
import styles from './VerifyEmail.module.css';

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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          {status === 'loading' && <Loader2 className={styles.spinner} size={48} />}
          {status === 'success' && <CheckCircle className={styles.successIcon} size={48} />}
          {status === 'error' && <XCircle className={styles.errorIcon} size={48} />}
        </div>

        <h1>
          {status === 'loading' && 'Verifying Your Email...'}
          {status === 'success' && 'Email Verified Successfully!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p>
          {status === 'loading' && 'Please wait while we secure your account details.'}
          {status === 'success' && 'Your email address has been updated. You can now use your new email for all AMJStar communications.'}
          {status === 'error' && (message || 'We could not verify your email at this time.')}
        </p>

        {status !== 'loading' && (
          <div className={styles.actions}>
            <Button onClick={() => navigate('/supplier/dashboard?tab=settings')} className={styles.btn}>
              {status === 'success' ? 'Go to Dashboard' : 'Back to Settings'} <ArrowRight size={18} />
            </Button>
          </div>
        )}

        <div className={styles.footer}>
          <ShieldCheck size={14} />
          <span>Secure verification by AMJStar</span>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
