import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import resellerService from '../services/reseller.service';
import ResellerOnboardingLayout from '../layout/ResellerOnboardingLayout';
import Button from '@/shared/components/ui/Button';
import { 
  User, 
  Store, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Globe, 
  CreditCard, 
  Award,
  Upload,
  Package,
  Star,
  Check,
  CheckCircle,
  XCircle,
  Handshake
} from 'lucide-react';
import styles from './ResellerOnboarding.module.css';

const STATE_CITY_MAP: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "Dwarka"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Agra", "Varanasi"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"]
};

const ResellerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [phone] = useState(user?.phone || '');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country] = useState('India');

  // Step 2: Profile
  const [storeName, setStoreName] = useState('');
  const [profileType, setProfileType] = useState<'Individual Reseller' | 'Business Reseller'>('Individual Reseller');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileImageUrl] = useState('');

  // Step 3: Selling Channels
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [primarySellingMethod, setPrimarySellingMethod] = useState<'Direct to customers' | 'To retailers/shopkeepers' | 'Both'>('Direct to customers');
  const [monthlyVolume, setMonthlyVolume] = useState<'0–50 orders' | '50–200' | '200–500' | '500+'>('0–50 orders');
  const [reach, setReach] = useState<'Local' | 'State' | 'Pan India' | 'International'>('Local');

  // Step 4: Experience
  const [experience, setExperience] = useState<'Beginner' | '1–2 years' | '3+ years'>('Beginner');
  const [soldBefore, setSoldBefore] = useState(false);

  // Step 5: Payment
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Step 6: Verification
  const [idProofUrl, setIdProofUrl] = useState('');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [agreements, setAgreements] = useState({
    terms: false,
    commission: false,
    payment: false
  });

  // Step 7: Plan
  const [subscriptionPlan, setSubscriptionPlan] = useState<'Starter' | 'Basic' | 'Standard' | 'Premium'>('Starter');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await resellerService.getProfile();
        setProfile(data);
        if (data) {
          if (data.status === 'APPROVED') {
            navigate(ROUTES.RESELLER_DASHBOARD);
            return;
          }
          
          if (data.status === 'PENDING') {
            setIsSubmitted(true);
          }

          if (data.fullName) setFullName(data.fullName);
          if (data.email) setEmail(data.email);
          if (data.address) setAddress(data.address);
          if (data.city) setCity(data.city);
          if (data.state) setState(data.state);
          if (data.storeName) setStoreName(data.storeName);
          if (data.profileType) setProfileType(data.profileType);
          if (data.profileDescription) setProfileDescription(data.profileDescription);
          if (data.platforms) setPlatforms(data.platforms);
          if (data.socialLinks) setSocialLinks(data.socialLinks);
          if (data.primarySellingMethod) setPrimarySellingMethod(data.primarySellingMethod);
          if (data.monthlyVolume) setMonthlyVolume(data.monthlyVolume);
          if (data.reach) setReach(data.reach);
          if (data.experience) setExperience(data.experience);
          if (data.soldBefore !== undefined) setSoldBefore(data.soldBefore);
          if (data.step) setCurrentStep(data.step);
          
          // Populate payment details
          if (data.accountName) setAccountName(data.accountName);
          if (data.accountNumber) setAccountNumber(data.accountNumber);
          if (data.ifscCode) setIfscCode(data.ifscCode);
          if (data.bankName) setBankName(data.bankName);
          if (data.panNumber) setPanNumber(data.panNumber);
          if (data.gstNumber) setGstNumber(data.gstNumber);
          if (data.idProofUrl) setIdProofUrl(data.idProofUrl);
          if (data.subscriptionPlan) setSubscriptionPlan(data.subscriptionPlan);
        }
      } catch (err) {
        console.log('Starting fresh onboarding');
      }
    };
    fetchProfile();
  }, [navigate]);

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      if (!fullName.trim()) errors.fullName = 'Full name is required';
      if (!email.trim()) {
        errors.email = 'Email address is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (!address.trim()) errors.address = 'Proper address is required';
      if (!state) errors.state = 'State is required';
      if (!city) errors.city = 'City is required';
    }
    
    if (step === 2) {
      if (!storeName.trim()) errors.storeName = 'Store name is required';
      if (!profileType) errors.profileType = 'Profile type is required';
      if (!profileDescription.trim()) errors.profileDescription = 'Profile description is required';
    }
    
    if (step === 3) {
      if (!primarySellingMethod) errors.primarySellingMethod = 'Primary selling method is required';
    }
    
    if (step === 4) {
      if (!monthlyVolume) errors.monthlyVolume = 'Monthly sales volume is required';
      if (!reach) errors.reach = 'Selling reach is required';
      if (!experience) errors.experience = 'Experience level is required';
    }
    
    if (step === 5) {
      if (!accountName.trim()) errors.accountName = 'Account holder name is required';
      if (!accountNumber.trim()) {
        errors.accountNumber = 'Account number is required';
      } else if (!/^\d{9,18}$/.test(accountNumber)) {
        errors.accountNumber = 'Account number must be 9–18 digits';
      }
      if (!ifscCode.trim()) {
        errors.ifscCode = 'IFSC code is required';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        errors.ifscCode = 'Invalid IFSC format (e.g. ABCD0123456)';
      }
      if (!bankName.trim()) errors.bankName = 'Bank name is required';
      
      if (panNumber && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(panNumber)) {
        errors.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
      
      if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        errors.gstNumber = 'Invalid GST format (15 characters)';
      }
    }
    
    if (step === 6) {
      if (!idProofUrl && !idProofFile) errors.idProof = 'ID proof is mandatory';
      if (!agreements.terms) errors.terms = 'You must accept the terms and conditions';
      if (!agreements.commission) errors.commission = 'You must accept the commission policy';
      if (!agreements.payment) errors.payment = 'You must accept the payment terms';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearError = (field: string) => {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const saveStepData = async (nextStep?: number) => {
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      // Handle file upload if idProofFile exists
      let finalIdProofUrl = idProofUrl;
      if (idProofFile && nextStep === 7) {
        const uploadRes = await resellerService.uploadDoc(idProofFile);
        finalIdProofUrl = uploadRes.url;
        setIdProofUrl(finalIdProofUrl);
        setIdProofFile(null); // Clear local file after successful upload
      }

      const data: any = {
        fullName,
        email,
        storeName,
        address,
        city,
        state,
        country,
        profileType,
        profileDescription,
        profileImage: profileImageUrl,
        platforms,
        socialLinks,
        primarySellingMethod,
        monthlyVolume,
        reach,
        experience,
        soldBefore,
        accountName,
        accountNumber,
        ifscCode,
        bankName,
        panNumber,
        gstNumber,
        idProofUrl: finalIdProofUrl,
        subscriptionPlan,
        step: nextStep || currentStep,
        termsAccepted: agreements.terms,
        commissionPolicyAccepted: agreements.commission,
        paymentTermsAccepted: agreements.payment
      };

      // Strip empty strings so Zod's .optional() validation doesn't fail on min() requirements
      Object.keys(data).forEach(key => {
        if (data[key] === '') {
          delete data[key];
        }
      });

      setFormErrors({});
      await resellerService.onboard(data);
      if (nextStep) {
        if (nextStep === 8 || (currentStep === 7 && !nextStep)) {
          setIsSubmitted(true);
        } else {
          setCurrentStep(nextStep);
        }
      } else if (currentStep === 7) {
        setIsSubmitted(true);
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const newErrors: Record<string, string> = {};
        err.response.data.errors.forEach((e: any) => {
          const field = e.path.split('.').pop();
          if (field) newErrors[field] = e.message;
        });
        setFormErrors(newErrors);
      } else {
        alert(err.response?.data?.message || 'Failed to save progress');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };



  const handlePlatformToggle = (platform: string) => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const steps = [
    { n: 1, label: 'Account Setup', desc: 'Basic Details' },
    { n: 2, label: 'Profile', desc: 'Storefront Identity' },
    { n: 3, label: 'Channels', desc: 'Selling Platforms' },
    { n: 4, label: 'Experience', desc: 'Sales Credibility' },
    { n: 5, label: 'Payment', desc: 'Bank Details' },
    { n: 6, label: 'Verification', desc: 'ID & Agreement' },
    { n: 7, label: 'Plans', desc: 'Choose Package' }
  ];

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.iconBox}><User size={24} /></div>
              <h2>Basic Account Setup</h2>
              <p>Let's start with your contact details.</p>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Full Name *</label>
                <input 
                  value={fullName} 
                  onChange={e => {
                    const val = e.target.value;
                    const formatted = val.replace(/\b\w/g, l => l.toUpperCase());
                    setFullName(formatted);
                    clearError('fullName');
                  }} 
                  placeholder="Enter your full name" 
                />
                {formErrors.fullName && <span className={styles.errorText}>{formErrors.fullName}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <div className={styles.verifiedInput}>
                  <input value={phone} readOnly />
                  <CheckCircle size={18} className={styles.verifiedIcon} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address *</label>
                <input 
                  value={email} 
                  onChange={e => {
                    setEmail(e.target.value);
                    clearError('email');
                  }} 
                  placeholder="email@example.com" 
                />
                {formErrors.email && <span className={styles.errorText}>{formErrors.email}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>Proper Address *</label>
                <textarea 
                  value={address} 
                  onChange={e => {
                    setAddress(e.target.value);
                    clearError('address');
                  }} 
                  placeholder="Street, Area, Building..." 
                  rows={2}
                />
                {formErrors.address && <span className={styles.errorText}>{formErrors.address}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>State *</label>
                <select 
                  value={state} 
                  onChange={e => {
                    setState(e.target.value);
                    setCity(''); // Reset city when state changes
                    clearError('state');
                  }} 
                  className={styles.input}
                >
                  <option value="">Select State</option>
                  {Object.keys(STATE_CITY_MAP).sort().map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {formErrors.state && <span className={styles.errorText}>{formErrors.state}</span>}
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>City *</label>
                  <select 
                    value={city} 
                    onChange={e => {
                      setCity(e.target.value);
                      clearError('city');
                    }} 
                    className={styles.input}
                    disabled={!state}
                  >
                    <option value="">Select City</option>
                    {state && STATE_CITY_MAP[state]?.sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {formErrors.city && <span className={styles.errorText}>{formErrors.city}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label>Country</label>
                  <input value={country} readOnly />
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <Button onClick={() => saveStepData(2)} loading={loading} className={styles.nextBtn}>
                Next Step <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
             <div className={styles.header}>
              <div className={styles.iconBox}><Store size={24} /></div>
              <h2>Reseller Profile</h2>
              <p>Your storefront identity on AMJStar.</p>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Store Name *</label>
                <input 
                  value={storeName} 
                  onChange={e => {
                    setStoreName(e.target.value);
                    clearError('storeName');
                  }} 
                  placeholder="e.g. Trendify Boutique" 
                  required 
                />
                {formErrors.storeName && <span className={styles.errorText}>{formErrors.storeName}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>Profile Type *</label>
                <div className={styles.radioGroup}>
                  {['Individual Reseller', 'Business Reseller'].map(type => (
                    <label key={type} className={`${styles.radioLabel} ${profileType === type ? styles.active : ''}`}>
                      <input 
                        type="radio" 
                        name="profileType" 
                        checked={profileType === type} 
                        onChange={() => {
                          setProfileType(type as any);
                          clearError('profileType');
                        }} 
                      />
                      {type}
                    </label>
                  ))}
                </div>
                {formErrors.profileType && <span className={styles.errorText}>{formErrors.profileType}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>Profile Description *</label>
                <textarea 
                  value={profileDescription} 
                  onChange={e => {
                    setProfileDescription(e.target.value);
                    clearError('profileDescription');
                  }} 
                  placeholder="Tell us about your reseller business..." 
                  rows={4}
                />
                {formErrors.profileDescription && <span className={styles.errorText}>{formErrors.profileDescription}</span>}
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setCurrentStep(1)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(3)} loading={loading} className={styles.nextBtn}>
                Continue <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 3:
        const PLATFORM_OPTIONS = ['WhatsApp', 'Instagram', 'Facebook', 'Offline network', 'Amazon / Flipkart/ Meesho', 'Personal Website', 'Others'];
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.iconBox}><Globe size={24} /></div>
              <h2>Selling Channels</h2>
              <p>Where do you currently sell your products?</p>
            </div>
            <div className={styles.platformGrid}>
              {PLATFORM_OPTIONS.map(p => (
                <div key={p} className={`${styles.platformCard} ${platforms.includes(p) ? styles.active : ''}`} onClick={() => handlePlatformToggle(p)}>
                  {p}
                </div>
              ))}
            </div>
            
            <div className={styles.formGrid} style={{marginTop: '24px'}}>
              <div className={styles.inputGroup}>
                <label>Primary Selling Method *</label>
                <select 
                  value={primarySellingMethod} 
                  onChange={e => {
                    setPrimarySellingMethod(e.target.value as any);
                    clearError('primarySellingMethod');
                  }}
                >
                  <option value="Direct to customers">Direct to customers</option>
                  <option value="To retailers/shopkeepers">To retailers/shopkeepers</option>
                  <option value="Both">Both</option>
                </select>
                {formErrors.primarySellingMethod && <span className={styles.errorText}>{formErrors.primarySellingMethod}</span>}
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Monthly Sales Volume *</label>
                  <select 
                    value={monthlyVolume} 
                    onChange={e => {
                      setMonthlyVolume(e.target.value as any);
                      clearError('monthlyVolume');
                    }}
                  >
                    <option value="0–50 orders">0–50 orders</option>
                    <option value="50–200">50–200</option>
                    <option value="200–500">200–500</option>
                    <option value="500+">500+</option>
                  </select>
                  {formErrors.monthlyVolume && <span className={styles.errorText}>{formErrors.monthlyVolume}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label>Selling Reach *</label>
                  <select 
                    value={reach} 
                    onChange={e => {
                      setReach(e.target.value as any);
                      clearError('reach');
                    }}
                  >
                    <option value="Local">Local</option>
                    <option value="State">State</option>
                    <option value="Pan India">Pan India</option>
                    <option value="International">International</option>
                  </select>
                  {formErrors.reach && <span className={styles.errorText}>{formErrors.reach}</span>}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setCurrentStep(2)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(4)} loading={loading} className={styles.nextBtn}>
                Experience Details <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.iconBox}><Award size={24} /></div>
              <h2>Experience & Credibility</h2>
              <p>Tell us about your background in reselling.</p>
            </div>
            <div className={styles.formGrid}>
               <div className={styles.inputGroup}>
                <label>Experience Level *</label>
                <div className={styles.tierOptions}>
                  {['Beginner', '1–2 years', '3+ years'].map(exp => (
                    <div 
                      key={exp} 
                      className={`${styles.tierItem} ${experience === exp ? styles.active : ''}`} 
                      onClick={() => {
                        setExperience(exp as any);
                        clearError('experience');
                      }}
                    >
                      {exp}
                    </div>
                  ))}
                </div>
                {formErrors.experience && <span className={styles.errorText}>{formErrors.experience}</span>}
              </div>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={soldBefore} onChange={e => setSoldBefore(e.target.checked)} />
                  <span>Have you sold products before? (Optional)</span>
                </label>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setCurrentStep(3)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(5)} loading={loading} className={styles.nextBtn}>
                Payment Setup <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.iconBox}><CreditCard size={24} /></div>
              <h2>Payment Setup</h2>
              <p>Where should we send your earnings?</p>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Account Holder Name *</label>
                <input 
                  value={accountName} 
                  onChange={e => {
                    setAccountName(e.target.value);
                    clearError('accountName');
                  }} 
                  placeholder="Full name as per bank record" 
                />
                {formErrors.accountName && <span className={styles.errorText}>{formErrors.accountName}</span>}
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Account Number *</label>
                  <input 
                    value={accountNumber} 
                    onChange={e => {
                      setAccountNumber(e.target.value);
                      clearError('accountNumber');
                    }} 
                    placeholder="0000 0000 0000" 
                  />
                  {formErrors.accountNumber && <span className={styles.errorText}>{formErrors.accountNumber}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label>IFSC Code *</label>
                  <input 
                    value={ifscCode} 
                    onChange={e => {
                      setIfscCode(e.target.value.toUpperCase());
                      clearError('ifscCode');
                    }} 
                    placeholder="ABCD0123456" 
                  />
                  {formErrors.ifscCode && <span className={styles.errorText}>{formErrors.ifscCode}</span>}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Bank Name *</label>
                <input 
                  value={bankName} 
                  onChange={e => {
                    setBankName(e.target.value);
                    clearError('bankName');
                  }} 
                  placeholder="e.g. HDFC Bank" 
                />
                {formErrors.bankName && <span className={styles.errorText}>{formErrors.bankName}</span>}
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>PAN Number (Optional)</label>
                  <input 
                    value={panNumber} 
                    onChange={e => {
                      setPanNumber(e.target.value.toUpperCase());
                      clearError('panNumber');
                    }} 
                    placeholder="ABCDE1234F" 
                    maxLength={10} 
                  />
                  {formErrors.panNumber && <span className={styles.errorText}>{formErrors.panNumber}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label>GST Number (Optional)</label>
                  <input 
                    value={gstNumber} 
                    onChange={e => {
                      setGstNumber(e.target.value.toUpperCase());
                      clearError('gstNumber');
                    }} 
                    placeholder="22AAAAA0000A1Z5" 
                    maxLength={15} 
                  />
                  {formErrors.gstNumber && <span className={styles.errorText}>{formErrors.gstNumber}</span>}
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setCurrentStep(4)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(6)} loading={loading} className={styles.nextBtn}>
                Verification <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.iconBox}><ShieldCheck size={24} /></div>
              <h2>Verification</h2>
              <p>Finalize your application with our policies.</p>
            </div>
            <div className={styles.verificationBox}>
              <div 
                className={`${styles.uploadSection} ${formErrors.idProof ? styles.errorBorder : ''}`} 
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIdProofFile(file);
                      clearError('idProof');
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <div className={styles.uploadPlaceholder}>
                  <Upload size={32} color={idProofFile || idProofUrl ? "#10b981" : "#94a3b8"} />
                  <p>
                    {idProofFile 
                      ? `✓ ${idProofFile.name}` 
                      : idProofUrl 
                        ? '✓ ID Proof uploaded' 
                        : 'Upload ID Proof (Mandatory *)'}
                  </p>
                  {formErrors.idProof && <span className={styles.errorText}>{formErrors.idProof}</span>}
                </div>
              </div>
              <div className={styles.agreements}>
                <div className={styles.inputGroup}>
                  <label className={styles.agreeRow}>
                    <input 
                      type="checkbox" 
                      checked={agreements.terms} 
                      onChange={e => {
                        setAgreements({...agreements, terms: e.target.checked});
                        if (e.target.checked) clearError('terms');
                      }} 
                    />
                    <span>I accept the Terms of Service *</span>
                  </label>
                  {formErrors.terms && <span className={styles.errorText}>{formErrors.terms}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.agreeRow}>
                    <input 
                      type="checkbox" 
                      checked={agreements.commission} 
                      onChange={e => {
                        setAgreements({...agreements, commission: e.target.checked});
                        if (e.target.checked) clearError('commission');
                      }} 
                    />
                    <span>I accept the Commission Policy *</span>
                  </label>
                  {formErrors.commission && <span className={styles.errorText}>{formErrors.commission}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.agreeRow}>
                    <input 
                      type="checkbox" 
                      checked={agreements.payment} 
                      onChange={e => {
                        setAgreements({...agreements, payment: e.target.checked});
                        if (e.target.checked) clearError('payment');
                      }} 
                    />
                    <span>I accept the Payment Terms (RTGS/NEFT) *</span>
                  </label>
                  {formErrors.payment && <span className={styles.errorText}>{formErrors.payment}</span>}
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setCurrentStep(5)}><ArrowLeft size={18} /> Back</button>
              <Button 
                onClick={() => saveStepData(7)} 
                loading={loading} 
                className={styles.nextBtn}
                disabled={!agreements.terms || !agreements.commission || !agreements.payment || (!idProofFile && !idProofUrl)}
              >
                Choose Plan <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 7:
        const PLANS = [
          { id: 'Starter', price: 'Free', limit: '200 products', benefits: 'Basic support' },
          { id: 'Basic', price: '₹999', limit: '999 products', benefits: 'Standard support' },
          { id: 'Standard', price: '₹1,000', limit: '1,000 products', benefits: 'Premium support' },
          { id: 'Premium', price: '₹5,000', limit: '5,000 products', benefits: 'Dedicated Manager' },
        ];
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.iconBox}><Star size={24} /></div>
              <h2>Select Selling Plan</h2>
              <p>Choose the capacity that fits your business goals.</p>
            </div>
            <div className={styles.planGrid}>
              {PLANS.map(plan => (
                <div 
                  key={plan.id} 
                  className={`${styles.planCard} ${subscriptionPlan === plan.id ? styles.active : ''}`}
                  onClick={() => setSubscriptionPlan(plan.id as any)}
                >
                  <div className={styles.planHeader}>
                    <h3>{plan.id}</h3>
                    <div className={styles.planPrice}>{plan.price}</div>
                  </div>
                  <ul className={styles.planFeatures}>
                    <li><Package size={14} /> {plan.limit}</li>
                    <li><ShieldCheck size={14} /> {plan.benefits}</li>
                  </ul>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={() => setCurrentStep(6)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData()} loading={loading} className={styles.submitBtn}>
                Submit Application <Check size={18} />
              </Button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  if (isSubmitted || profile?.status === 'PENDING') {
    return (
      <div className={styles.centeredForm}>
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper}>
            <CheckCircle size={48} />
          </div>
          <h2>Application Under Review</h2>
          <p>
            Thank you! Your reseller application for <strong>{storeName}</strong> has been submitted and is currently under review by our admin team.
          </p>
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
            We usually process applications within 24-48 business hours. You'll be notified once your account is activated.
          </p>

          <div className={styles.growthCard}>
            <div className={styles.growthIconWrapper}>
              <Handshake size={24} />
            </div>
            <div className={styles.growthText}>
              <p><strong>Need Help?</strong></p>
              <p>Contact our support team at +91 xxxxxxxxxx for priority onboarding.</p>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <Button 
              onClick={() => navigate('/')} 
              className={styles.homeBtn}
            >
              Go to Homepage
            </Button>
            <Button 
              variant="secondary"
              onClick={handleLogout}
              className={styles.homeBtn}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.status === 'REJECTED') {
    return (
      <div className={styles.centeredForm}>
        <div className={`${styles.successCard} ${styles.rejectedCard}`}>
          <div className={styles.errorIconWrapper}>
            <XCircle size={48} />
          </div>
          <h2 style={{ color: '#ef4444' }}>Application Rejected</h2>
          <div className={styles.rejectionReasonBox}>
            <p className={styles.rejectionLabel}>Reason for rejection:</p>
            <p className={styles.rejectionText}>{profile.rejectionReason || 'Details provided in the onboarding form were insufficient or incorrect.'}</p>
          </div>
          
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
            Don't worry! You can update your details and re-submit your application for review.
          </p>

          <div className={styles.contactCenter}>
            <a href="tel:+91xxxxxxxxxx" className={styles.contactSupportBtn}>
              Contact Support: +91 xxxxxxxxxx
            </a>
          </div>

          <div className={styles.buttonGroup}>
            <Button 
              onClick={() => {
                setProfile(null);
                setIsSubmitted(false);
                setCurrentStep(1);
              }} 
              className={styles.homeBtn}
              style={{ background: '#e65100', margin: 0 }}
            >
              Update & Re-apply
            </Button>
            <Button 
              variant="secondary"
              onClick={handleLogout}
              className={styles.homeBtn}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResellerOnboardingLayout currentStep={currentStep} steps={steps}>
      <div className={styles.formCard}>
        {renderStep()}
      </div>
    </ResellerOnboardingLayout>
  );
};

export default ResellerOnboarding;
