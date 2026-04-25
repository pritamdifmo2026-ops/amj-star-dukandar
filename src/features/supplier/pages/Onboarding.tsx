import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import {
  SupplierTier,
  OnboardingStatus,
  setSupplierProfile
} from '@/store/slices/supplier.slice';
import supplierService from '../services/supplier.service';
import Button from '@/shared/components/ui/Button';
import { Check, ShieldCheck } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import styles from './Onboarding.module.css';

const INDIA_STATES: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Agra", "Varanasi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"]
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.supplier);
  const user = useAppSelector(state => state.auth.user);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Form states
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState(user?.phone || '');

  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');

  const [about, setAbout] = useState('');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('');
  const [selectedTier, setSelectedTier] = useState<SupplierTier>(SupplierTier.FREE);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Phone Change/OTP states
  const [isPhoneVerified] = useState(true);

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
          
          if (data.supplier.isActive && data.supplier.verifiedByAdmin) {
            navigate('/supplier/dashboard');
            return;
          }

          if (data.supplier.businessName) setBusinessName(data.supplier.businessName);
          if (data.supplier.phone) setPhone(data.supplier.phone);
          if (data.supplier.tier) setSelectedTier(data.supplier.tier);

          const bd = data.supplier.businessDetails;
          if (bd) {
            if (bd.ownerName) setOwnerName(bd.ownerName);
            if (bd.email) setEmail(bd.email);
            if (bd.address) setAddress(bd.address);
            if (bd.pinCode) setPinCode(bd.pinCode);
            if (bd.state) setState(bd.state);
            if (bd.city) setCity(bd.city);
            if (bd.gstin) setGstin(bd.gstin);
            if (bd.about) setAbout(bd.about);
            if (bd.yearOfEstablishment) setYearOfEstablishment(bd.yearOfEstablishment);
          }

          if (data.supplier.onboardingStatus === OnboardingStatus.COMPLETED) {
            setCurrentStep(5);
          } else if (data.supplier.tier) {
            setCurrentStep(4);
          } else if (data.supplier.businessName) {
            setCurrentStep(2);
          }
        }
      } catch (err) {
        console.log('No profile found, starting fresh');
      }
    };
    fetchProfile();
  }, [dispatch, navigate]);

  const capitalize = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase());

  const handleCapitalizeChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(capitalize(e.target.value));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateBasicInfo = () => {
    const newErrs: Record<string, string> = {};
    if (!ownerName.trim()) newErrs.ownerName = "Owner name is required";
    if (!businessName.trim()) newErrs.businessName = "Business name is required";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) newErrs.email = "Valid email is required";
    if (!isPhoneVerified) newErrs.phone = "Phone must be verified";
    if (countryCode === '+91' && !/^\d{10}$/.test(phone)) newErrs.phone = "Enter a valid 10-digit number";
    
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateBusinessDetails = () => {
    const newErrs: Record<string, string> = {};
    if (!address.trim() || address.length < 5) newErrs.address = "Detailed address is required";
    if (!pinCode.trim() || pinCode.length < 6) newErrs.pinCode = "Valid PIN is required";
    if (!state) newErrs.state = "State is required";
    if (!city) newErrs.city = "City is required";
    
    if (gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      newErrs.gstin = "Invalid GSTIN format";
    }
    
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateProfileCompletion = () => {
    return true; 
  };

  const submitStep = async () => {
    setLoading(true);
    try {
      if (currentStep === 1) {
        if (!validateBasicInfo()) return;
        const data = await supplierService.onboard({ businessName, phone });
        dispatch(setSupplierProfile(data.supplier));
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!validateBusinessDetails()) return;
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (!validateProfileCompletion()) return;
        const tierData = await supplierService.selectTier(selectedTier);
        dispatch(setSupplierProfile(tierData.supplier));
        
        const kycData = await supplierService.submitKYC({
          ownerName, email, address, pinCode, state, city, gstin, about, yearOfEstablishment
        });
        dispatch(setSupplierProfile(kycData.supplier));
        setCurrentStep(5);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.formContainer}>
            <div className={styles.stepContent}>
              <h1>Basic Information</h1>
              <p>Tell us who you are so we can set up your supplier account.</p>
              
              <div className={styles.formGroup}>
                <label>Owner / Representative Name <span className={styles.required}>*</span></label>
                <input
                  name="ownerName"
                  className={`${styles.input} ${errors.ownerName ? styles.inputError : ''}`}
                  value={ownerName}
                  onChange={handleCapitalizeChange(setOwnerName)}
                  placeholder="e.g. Rahul Sharma"
                />
                {errors.ownerName && <span className={styles.errorText}>{errors.ownerName}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Company / Business Name <span className={styles.required}>*</span></label>
                <input
                  name="businessName"
                  className={`${styles.input} ${errors.businessName ? styles.inputError : ''}`}
                  value={businessName}
                  onChange={handleCapitalizeChange(setBusinessName)}
                  placeholder="e.g. AMJ Textiles Pvt Ltd"
                />
                {errors.businessName && <span className={styles.errorText}>{errors.businessName}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Email Address <span className={styles.required}>*</span></label>
                <input
                  name="email"
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  value={email}
                  onChange={handleChange(setEmail)}
                  placeholder="name@company.com"
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Contact Phone <span className={styles.required}>*</span></label>
                <div className={`${styles.phoneGroup} ${errors.phone ? styles.inputError : ''}`}>
                  <select 
                    className={`${styles.input} ${styles.countryCode}`}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    name="phone"
                    type="tel"
                    className={`${styles.input} ${styles.phoneInput}`}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    disabled={isPhoneVerified}
                    maxLength={15}
                  />
                </div>
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>

              <div className={styles.buttonGroup}>
                <Button onClick={submitStep} disabled={loading} size="lg" className={styles.fullWidth}>
                  {loading ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.formContainer}>
            <div className={styles.stepContent}>
              <h1>Business Details</h1>
              <p>Where is your business registered?</p>

              <div className={styles.formGroup}>
                <label>Registered Address <span className={styles.required}>*</span></label>
                <textarea
                  name="address"
                  className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                  value={address}
                  onChange={handleCapitalizeChange(setAddress)}
                  placeholder="Building, Street, Area"
                />
                {errors.address && <span className={styles.errorText}>{errors.address}</span>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>PIN Code <span className={styles.required}>*</span></label>
                  <input
                    name="pinCode"
                    className={`${styles.input} ${errors.pinCode ? styles.inputError : ''}`}
                    value={pinCode}
                    onChange={(e) => {
                      setPinCode(e.target.value.replace(/\D/g, ''));
                      setErrors(prev => ({ ...prev, pinCode: '' }));
                    }}
                    maxLength={6}
                    placeholder="e.g. 400001"
                  />
                  {errors.pinCode && <span className={styles.errorText}>{errors.pinCode}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>State <span className={styles.required}>*</span></label>
                  <select
                    name="state"
                    className={`${styles.input} ${errors.state ? styles.inputError : ''}`}
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setCity('');
                      setErrors(prev => ({ ...prev, state: '' }));
                    }}
                  >
                    <option value="">Select State</option>
                    {Object.keys(INDIA_STATES).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <span className={styles.errorText}>{errors.state}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>City <span className={styles.required}>*</span></label>
                  <select
                    name="city"
                    className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                    value={city}
                    onChange={handleChange(setCity)}
                    disabled={!state}
                  >
                    <option value="">Select City</option>
                    {state && INDIA_STATES[state]?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.city && <span className={styles.errorText}>{errors.city}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>GSTIN (Optional)</label>
                  <input
                    name="gstin"
                    className={`${styles.input} ${errors.gstin ? styles.inputError : ''}`}
                    value={gstin}
                    onChange={(e) => {
                      setGstin(e.target.value.toUpperCase());
                      setErrors(prev => ({ ...prev, gstin: '' }));
                    }}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                  {errors.gstin && <span className={styles.errorText}>{errors.gstin}</span>}
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <Button onClick={() => setCurrentStep(1)} variant="outline" size="lg">Back</Button>
                <Button onClick={submitStep} disabled={loading} size="lg" className={styles.fullWidth}>
                  {loading ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.formContainer}>
            <div className={styles.stepContent}>
              <h1>Profile & Tier</h1>
              <p>Add some flair to your profile and choose a selling plan.</p>

              <div className={styles.formGroup}>
                <label>About Company (Optional)</label>
                <textarea
                  className={styles.input}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="What makes your products special?"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Year of Establishment (Optional)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={yearOfEstablishment}
                  onChange={(e) => setYearOfEstablishment(e.target.value)}
                  placeholder="e.g. 2010"
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '30px' }}>
                <label>Select Plan <span className={styles.required}>*</span></label>
                <div className={styles.tierGrid}>
                  {[
                    { id: SupplierTier.FREE, label: 'Free Tier', limit: 'Up to 5,000 Products', price: '₹0' },
                    { id: SupplierTier.GOLD, label: 'Gold Plan', limit: 'Priority Placement', price: '₹999/mo' },
                  ].map(tier => (
                    <div
                      key={tier.id}
                      className={`${styles.tierCard} ${selectedTier === tier.id ? styles.selectedTier : ''}`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      <div className={styles.tierInfo}>
                        <h3>{tier.label}</h3>
                        <span className={styles.tierLimit}>{tier.limit}</span>
                      </div>
                      <div className={styles.tierPrice}>{tier.price}</div>
                      {selectedTier === tier.id && <div className={styles.checkBadge}><Check size={14} /></div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <Button onClick={() => setCurrentStep(2)} variant="outline" size="lg">Back</Button>
                <Button onClick={submitStep} disabled={loading} size="lg" className={styles.fullWidth}>
                  {loading ? 'Submitting...' : 'Submit Profile'}
                </Button>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className={styles.formContainer} style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div className={styles.stepContent}>
              <div className={styles.iconCircleSuccess}><ShieldCheck size={48} /></div>
              <h1 style={{ textAlign: 'center' }}>Application Submitted!</h1>
              <p className={styles.successText}>
                Your application is now under review. As part of our high-trust B2B process,
                <strong> you will receive a verification call within 24 hours </strong>
                to confirm your details.
              </p>
              
              <div className={styles.statusBox}>
                <p>Status: <strong>{profile?.kycStatus || 'PENDING'}</strong></p>
                <p className={styles.subStatus}>Next step: Formal Cold Call (within 24h)</p>
              </div>

              <Button
                onClick={() => navigate('/')}
                size="lg"
                className={styles.fullWidth}
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const steps = [
    { n: 1, label: 'Basic Info', desc: 'Name & Email' },
    { n: 2, label: 'Business', desc: 'Address & GST' },
    { n: 3, label: 'Profile', desc: 'About & Plan' }
  ];

  if (currentStep === 5) {
    return (
      <div className={styles.page}>
        <div className={styles.main} style={{ padding: '60px 20px' }}>
          {renderStepContent()}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <Link to="/" className={styles.sidebarBrand}>AMJStar Dukandar</Link>
        <div className={styles.stepper}>
          {steps.map(step => {
            const isActive = currentStep === step.n;
            const isCompleted = currentStep > step.n;
            return (
              <div key={step.n} className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}>
                <div className={styles.stepIcon}>
                  {isCompleted ? <Check size={16} /> : step.n}
                </div>
                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>{step.label}</span>
                  <span className={styles.stepDesc}>{step.desc}</span>
                </div>
              </div>
            );
          })}
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
