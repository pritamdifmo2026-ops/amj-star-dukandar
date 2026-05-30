import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export interface IfscBankInfo {
  bank: string;
  branch: string;
  city: string;
  state: string;
}

interface IfscVerificationResult {
  verifying: boolean;
  bankInfo: IfscBankInfo | null;
  ifscError: string;
}

export function useIfscVerification(ifscCode: string): IfscVerificationResult {
  const [verifying, setVerifying] = useState(false);
  const [bankInfo, setBankInfo] = useState<IfscBankInfo | null>(null);
  const [ifscError, setIfscError] = useState('');

  const debouncedIfsc = useDebounce(ifscCode, 500);

  useEffect(() => {
    setBankInfo(null);
    setIfscError('');

    if (debouncedIfsc.length !== 11 || !IFSC_RE.test(debouncedIfsc)) return;

    let cancelled = false;
    setVerifying(true);

    fetch(`https://ifsc.razorpay.com/${debouncedIfsc}`)
      .then(res => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then((data: any) => {
        if (cancelled) return;
        setBankInfo({
          bank: data.BANK || '',
          branch: data.BRANCH || '',
          city: data.CITY || '',
          state: data.STATE || '',
        });
        setIfscError('');
      })
      .catch(() => {
        if (cancelled) return;
        setIfscError('IFSC not found in RBI directory — please double-check the code');
        setBankInfo(null);
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => { cancelled = true; };
  }, [debouncedIfsc]);

  return { verifying, bankInfo, ifscError };
}
