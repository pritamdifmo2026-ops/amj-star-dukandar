import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import {
  SupplierTier,
  OnboardingStatus,
  setSupplierProfile,
  updateOnboardingProgress
} from '@/store/slices/supplier.slice';
import supplierService from '../services/supplier.service';
import Button from '@/shared/components/ui/Button';
import { Check, ArrowRight, Building2, ShieldCheck, CreditCard, LayoutDashboard, Edit2, ShieldAlert, Handshake } from 'lucide-react';
import authService from '@/features/auth/services/auth.service';
import Modal from '@/shared/components/ui/Modal';
import styles from './Onboarding.module.css';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.supplier);
  const user = useAppSelector(state => state.auth.user);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedTier, setSelectedTier] = useState<SupplierTier>(SupplierTier.FREE);
  const [kycDetails, setKycDetails] = useState({ address: '', gstin: '', pan: '' });

  // Phone Change/OTP states
  const [isPhoneEditable, setIsPhoneEditable] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [otpLoading, setOtpLoading] = useState(false);

  // Sync phone if user data loads later
  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user, phone]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await supplierService.getProfile();
        if (data.supplier) {
          dispatch(setSupplierProfile(data.supplier));
          setBusinessName(data.supplier.businessName || '');
          setPhone(data.supplier.phone || '');
          setSelectedTier(data.supplier.tier || SupplierTier.FREE);

          // If verified and active, go straight to dashboard
          if (data.supplier.isActive && data.supplier.verifiedByAdmin) {
            navigate('/supplier/dashboard');
            return;
          }

          // Determine starting step based on progress
          if (data.supplier.onboardingStatus === OnboardingStatus.COMPLETED) {
            setCurrentStep(5);
          } else if (data.supplier.tier) {
            setCurrentStep(4);
          } else if (data.supplier.businessName) {
            setCurrentStep(3);
          }
        }
      } catch (err) {
        console.log('No existing supplier profile found');
      }
    };
    fetchProfile();
  }, [dispatch]);

  const handleNext = async () => {
    setLoading(true);
    try {
      if (currentStep === 2) {
        const data = await supplierService.onboard({ businessName, phone });
        dispatch(setSupplierProfile(data.supplier));
      } else if (currentStep === 3) {
        const data = await supplierService.selectTier(selectedTier);
        dispatch(setSupplierProfile(data.supplier));
      } else if (currentStep === 4) {
        const data = await supplierService.submitKYC(kycDetails);
        dispatch(setSupplierProfile(data.supplier));
      }
      setCurrentStep(prev => prev + 1);
    } catch (err) {
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.iconCircle}><Building2 size={48} /></div>
            <h1>Welcome to AMJ Star Supplier Network</h1>
            <p>Start your journey to reach thousands of bulk buyers across India. Our onboarding process is quick and secure.</p>
            <Button onClick={() => setCurrentStep(2)} size="lg" className={styles.fullWidth}>
              Start Onboarding <ArrowRight size={20} />
            </Button>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h1>Business Information</h1>
            <p>Tell us about your company.</p>
            <div className={styles.formGroup}>
              <label>Business / Company Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. AMJ Textiles Pvt Ltd"
              />
            </div>
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label>Contact Phone</label>
                {!isPhoneEditable && (
                  <button
                    className={styles.changeBtn}
                    onClick={() => {
                      setIsPhoneEditable(true);
                      setIsPhoneVerified(false);
                    }}
                  >
                    Change?
                  </button>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isPhoneEditable}
                  className={isPhoneVerified ? styles.inputVerified : ''}
                />
                {isPhoneVerified && <Check className={styles.verifiedIcon} size={20} />}
                {isPhoneEditable && !isOtpSent && (
                  <button
                    className={styles.verifySleekBtn}
                    onClick={async () => {
                      setOtpLoading(true);
                      try {
                        await authService.sendOtp({ phone });
                        setIsOtpSent(true);
                      } catch (err) {
                        alert('Failed to send OTP');
                      } finally {
                        setOtpLoading(false);
                      }
                    }}
                    disabled={otpLoading || phone.length < 10}
                  >
                    {otpLoading ? '...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>

            {isOtpSent && !isPhoneVerified && (
              <div className={`${styles.formGroup} ${styles.otpAnimation}`}>
                <label>Enter OTP</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                  <button
                    className={styles.verifySleekBtn}
                    onClick={async () => {
                      if (otp === '123456') { // Mock verification
                        setIsPhoneVerified(true);
                        setIsPhoneEditable(false);
                        setIsOtpSent(false);
                      } else {
                        alert('Invalid OTP');
                      }
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={!businessName || !isPhoneVerified || loading}
              size="lg"
              className={styles.fullWidth}
            >
              {loading ? 'Saving...' : 'Next: Select Tier'}
            </Button>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <h1>Choose Your Tier</h1>
            <p>Select a plan that fits your business scale.</p>
            <div className={styles.tierGrid}>
              {[
                { id: SupplierTier.FREE, label: 'Free', limit: '5,000 Products', price: '₹0/mo' },
                { id: SupplierTier.GOLD, label: 'Gold', limit: '5,000 Products + Visibility', price: '₹999/mo' },
                { id: SupplierTier.DIAMOND, label: 'Diamond', limit: '10,000 Products + Premium', price: '₹2,499/mo' },
                { id: SupplierTier.PLATINUM, label: 'Platinum', limit: 'Unlimited Products', price: '₹4,999/mo' },
              ].map(tier => (
                <div
                  key={tier.id}
                  className={`${styles.tierCard} ${selectedTier === tier.id ? styles.selectedTier : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <h3>{tier.label}</h3>
                  <p className={styles.tierLimit}>{tier.limit}</p>
                  <p className={styles.tierPrice}>{tier.price}</p>
                  {selectedTier === tier.id && <div className={styles.checkBadge}><Check size={14} /></div>}
                </div>
              ))}
            </div>
            <Button onClick={handleNext} disabled={loading} size="lg" className={styles.fullWidth}>
              {loading ? 'Saving...' : 'Next: KYC Details'}
            </Button>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent}>
            <h1>KYC Verification</h1>
            <p>Help us verify your business for buyer trust.</p>
            <div className={styles.formGroup}>
              <label>Business Address</label>
              <textarea
                value={kycDetails.address}
                onChange={(e) => setKycDetails({ ...kycDetails, address: e.target.value })}
                placeholder="Full registered address"
              />
            </div>
            <div className={styles.formGroup}>
              <label>GSTIN (Optional for now)</label>
              <input
                type="text"
                value={kycDetails.gstin}
                onChange={(e) => setKycDetails({ ...kycDetails, gstin: e.target.value })}
                placeholder="27XXXXX..."
              />
            </div>
            <Button onClick={handleNext} disabled={!kycDetails.address || loading} size="lg" className={styles.fullWidth}>
              {loading ? 'Submitting...' : 'Complete Onboarding'}
            </Button>
          </div>
        );
      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={styles.iconCircleSuccess}><ShieldCheck size={48} /></div>
            <h1>Onboarding Complete!</h1>
            <p className={styles.successText}>
              Your application is now under review. As part of our high-trust B2B process,
              <strong> you will receive a verification call within 24 hours </strong>
              to confirm your details and schedule a visit to your business location.
            </p>

            <div className={styles.initiativeBox}>
              <div className={styles.initiativeHeader}>
                <Handshake size={18} />
                <span>Development Initiative</span>
              </div>
              <p>Are you a Women Entrepreneur? We would love to connect and discuss growth & support for your business!</p>
            </div>

            <div className={styles.statusBox}>
              <p>Current Status: <strong>{profile?.kycStatus || 'PENDING'}</strong></p>
              <p className={styles.subStatus}>Next step: Formal Cold Call (within 24h)</p>
            </div>

            <Button
              onClick={() => setShowLogoutModal(true)}
              variant="outline"
              size="lg"
              className={styles.fullWidth}
            >
              Sign Out
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const steps = [
    { n: 1, label: 'Start', icon: ArrowRight },
    { n: 2, label: 'Info', icon: Building2 },
    { n: 3, label: 'Tier', icon: CreditCard },
    { n: 4, label: 'KYC', icon: ShieldCheck },
    { n: 5, label: 'Done', icon: LayoutDashboard },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.stepperContainer}>
        <div className={styles.stepper}>
          {steps.map(step => (
            <div
              key={step.n}
              className={`${styles.step} ${currentStep >= step.n ? styles.stepActive : ''}`}
            >
              <div className={styles.stepIcon}>
                {currentStep > step.n ? <Check size={16} /> : <step.icon size={16} />}
              </div>
              <span>{step.label}</span>
              {step.n < 5 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>
      </div>

      <main className={styles.main}>
        {renderStepContent()}
      </main>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              dispatch(logout());
              navigate('/');
            }}>Sign Out</Button>
          </>
        }
      >
        Are you sure you want to sign out? Your onboarding progress is saved.
      </Modal>
    </div>
  );
};

export default Onboarding;
