import React, { useState } from 'react';
import { 
  Phone, Mail, Store, Zap, 
  ShieldCheck, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import Button from '@/shared/components/ui/Button';
import toast from 'react-hot-toast';
import styles from './ResellerSettings.module.css';

import authService from '@/features/auth/services/auth.service';
import resellerService from '@/features/reseller/services/reseller.service';

const ResellerSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { profile } = useAppSelector(state => state.reseller);
  
  const [storeName, setStoreName] = useState(profile?.storeName || 'My Store');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [phone, setPhone] = useState(user?.phone || profile?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [updatingField, setUpdatingField] = useState<'phone' | 'email' | null>(null);

  // Sync state if profile loads later
  React.useEffect(() => {
    if (profile?.storeName) setStoreName(profile.storeName);
    if (profile?.email || user?.email) setEmail(user?.email || profile?.email || '');
    if (profile?.phone || user?.phone) setPhone(user?.phone || profile?.phone || '');
  }, [profile, user]);

  const plans = [
    { name: 'Starter', price: 'Free', adds: '200 product adds', id: 'STARTER' },
    { name: 'Basic', price: '₹999', adds: '999 product adds', id: 'BASIC' },
    { name: 'Standard', price: '₹1,000', adds: '1,000 product adds', id: 'STANDARD' },
    { name: 'Premium', price: '₹5,000', adds: '5,000 product adds + SIC benefits', id: 'PREMIUM' }
  ];

  const currentPlanId = profile?.subscriptionPlan?.toUpperCase() || 'STARTER';
  const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];
  const nextPlan = plans[plans.indexOf(currentPlan) + 1] || null;

  const handleUpdateStoreName = async () => {
    try {
      setIsUpdating(true);
      await resellerService.updateProfile({ storeName });
      toast.success('Store name updated!');
    } catch (err) {
      toast.error('Failed to update store name');
    } finally {
      setIsUpdating(false);
    }
  };

  const startPhoneUpdate = async () => {
    if (phone === user?.phone) {
      toast.error('Please enter a different phone number');
      return;
    }
    try {
      await authService.sendOtp({ phone });
      setUpdatingField('phone');
      setShowOtpField(true);
      toast.success('OTP sent to your new phone number');
    } catch (err) {
      toast.error('Failed to send OTP');
    }
  };

  const startEmailUpdate = async () => {
    if (email !== (user?.email || profile?.email)) {
      // First update email in reseller profile (which also syncs with User account)
      try {
        await resellerService.updateProfile({ email });
        toast.success('Email updated, sending verification link...');
      } catch (err) {
        toast.error('Failed to update email');
        return;
      }
    }
    
    try {
      await authService.sendVerificationEmail();
      toast.success(`Verification link sent to ${email}`);
    } catch (err) {
      toast.error('Failed to send verification link');
    }
  };

  const verifyOtp = async () => {
    if (otp.length === 6) {
      try {
        const response = await authService.verifyPhoneUpdate({ phone, otp });
        // Update Redux with new user info (and new token in cookie)
        dispatch(setCredentials({ user: response.user }));
        
        // Also update reseller profile to sync with new phone
        await resellerService.updateProfile({ phone });
        
        toast.success('Phone number verified and updated!');
        setShowOtpField(false);
        setUpdatingField(null);
        setOtp('');
      } catch (err) {
        toast.error('Invalid OTP. Please try again.');
      }
    } else {
      toast.error('Please enter a 6-digit OTP');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Account Settings</h2>
        <p>Manage your reseller profile, contact information, and subscription plan.</p>
      </header>

      <div className={styles.sections}>
        {/* Storefront Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Store size={20} />
            <h3>Storefront Information</h3>
          </div>
          <div className={styles.fieldGroup}>
            <label>Store Name</label>
            <div className={styles.inputWithAction}>
              <input 
                type="text" 
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)}
              />
              <Button onClick={handleUpdateStoreName} loading={isUpdating}>Update</Button>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <ShieldCheck size={20} />
            <h3>Contact & Security</h3>
          </div>
          
          <div className={styles.fieldGroup}>
            <label>Phone Number</label>
            <div className={styles.inputWithAction}>
              <div className={styles.inputContainer}>
                <Phone size={16} className={styles.inputIcon} />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={startPhoneUpdate}>Change Phone</Button>
            </div>
            {user?.isPhoneVerified && phone === user?.phone && (
              <span className={styles.verifiedBadge}><CheckCircle size={12}/> Verified</span>
            )}

            {showOtpField && updatingField === 'phone' && (
              <div className={styles.otpSection}>
                <div className={styles.otpHeader}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <span>Enter Verification Code</span>
                </div>
                <div className={styles.otpInputGroup}>
                  <input 
                    type="text" 
                    maxLength={6} 
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <Button onClick={verifyOtp}>Verify & Save</Button>
                  <Button variant="ghost" onClick={() => {
                    setShowOtpField(false);
                    setPhone(user?.phone || '');
                  }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label>Email Address</label>
            <div className={styles.inputWithAction}>
              <div className={styles.inputContainer}>
                <Mail size={16} className={styles.inputIcon} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={startEmailUpdate}>Verify Mail</Button>
            </div>
            {(user?.isEmailVerified || profile?.isEmailVerified) && email === (user?.email || profile?.email) && (
              <span className={styles.verifiedBadge}><CheckCircle size={12}/> Verified</span>
            )}
          </div>
        </section>

        {/* Subscription Plan */}
        <section className={`${styles.section} ${styles.planSection}`}>
          <div className={styles.sectionHeader}>
            <Zap size={20} />
            <h3>Subscription Plan</h3>
          </div>
          <div className={styles.planCard}>
            <div className={styles.planInfo}>
              <h4>Current Plan: <span className={styles.planName}>{currentPlan.name}</span></h4>
              <p>You are on the {currentPlan.name} plan ({currentPlan.adds}).</p>
            </div>
            {nextPlan && (
              <Button className={styles.upgradeBtn}>
                Upgrade to {nextPlan.name} <Zap size={16} />
              </Button>
            )}
          </div>
          <div className={styles.allPlans}>
            <p className={styles.subTitle}>Available Plans:</p>
            <div className={styles.plansGrid}>
              {plans.map(p => (
                <div key={p.id} className={`${styles.planSmallCard} ${p.id === currentPlanId ? styles.activePlan : ''}`}>
                  <strong>{p.name}</strong>
                  <span>{p.price}</span>
                  <small>{p.adds}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResellerSettings;
