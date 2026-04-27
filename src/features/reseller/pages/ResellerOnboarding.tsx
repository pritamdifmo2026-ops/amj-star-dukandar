import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
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
  const user = useAppSelector(state => state.auth.user);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
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
        if (data) {
          if (data.status === 'APPROVED') {
            navigate(ROUTES.RESELLER_DASHBOARD);
            return;
          }
          
          if (data.storeName) setStoreName(data.storeName);
          if (data.profileType) setProfileType(data.profileType);
          if (data.profileDescription) setProfileDescription(data.profileDescription);
          if (data.platforms) setPlatforms(data.platforms);
          if (data.socialLinks) setSocialLinks(data.socialLinks);
          if (data.step) setCurrentStep(data.step);
          
          // ... populate other fields if needed
        }
      } catch (err) {
        console.log('Starting fresh onboarding');
      }
    };
    fetchProfile();
  }, [navigate]);

  const saveStepData = async (nextStep?: number) => {
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
        storeName,
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

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
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
                <label>Full Name</label>
                <input 
                  value={fullName} 
                  onChange={e => {
                    const val = e.target.value;
                    const formatted = val.replace(/\b\w/g, l => l.toUpperCase());
                    setFullName(formatted);
                  }} 
                  placeholder="Enter your full name" 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <div className={styles.verifiedInput}>
                  <input value={phone} readOnly />
                  <CheckCircle size={18} className={styles.verifiedIcon} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div className={styles.inputGroup}>
                <label>State</label>
                <select 
                  value={state} 
                  onChange={e => {
                    setState(e.target.value);
                    setCity(''); // Reset city when state changes
                  }} 
                  className={styles.input}
                >
                  <option value="">Select State</option>
                  {Object.keys(STATE_CITY_MAP).sort().map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>City</label>
                  <select 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    className={styles.input}
                    disabled={!state}
                  >
                    <option value="">Select City</option>
                    {state && STATE_CITY_MAP[state]?.sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
                <label>Profile Type</label>
                <div className={styles.radioGroup}>
                  {['Individual Reseller', 'Business Reseller'].map(type => (
                    <label key={type} className={`${styles.radioLabel} ${profileType === type ? styles.active : ''}`}>
                      <input type="radio" name="profileType" checked={profileType === type} onChange={() => setProfileType(type as any)} />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Profile Description</label>
                <textarea 
                  value={profileDescription} 
                  onChange={e => setProfileDescription(e.target.value)} 
                  placeholder="Tell us about your reseller business..." 
                  rows={4}
                />
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
                <label>Primary Selling Method</label>
                <select value={primarySellingMethod} onChange={e => setPrimarySellingMethod(e.target.value as any)}>
                  <option value="Direct to customers">Direct to customers</option>
                  <option value="To retailers/shopkeepers">To retailers/shopkeepers</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Monthly Sales Volume</label>
                  <select value={monthlyVolume} onChange={e => setMonthlyVolume(e.target.value as any)}>
                    <option value="0–50 orders">0–50 orders</option>
                    <option value="50–200">50–200</option>
                    <option value="200–500">200–500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Selling Reach</label>
                  <select value={reach} onChange={e => setReach(e.target.value as any)}>
                    <option value="Local">Local</option>
                    <option value="State">State</option>
                    <option value="Pan India">Pan India</option>
                    <option value="International">International</option>
                  </select>
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
                <label>Experience Level</label>
                <div className={styles.tierOptions}>
                  {['Beginner', '1–2 years', '3+ years'].map(exp => (
                    <div key={exp} className={`${styles.tierItem} ${experience === exp ? styles.active : ''}`} onClick={() => setExperience(exp as any)}>
                      {exp}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={soldBefore} onChange={e => setSoldBefore(e.target.checked)} />
                  <span>Have you sold products before?</span>
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
                <label>Account Holder Name</label>
                <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full name as per bank record" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Account Number</label>
                  <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="0000 0000 0000" />
                </div>
                <div className={styles.inputGroup}>
                  <label>IFSC Code</label>
                  <input value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="ABCD0123456" />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Bank Name</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>PAN Number (Optional)</label>
                  <input value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                </div>
                <div className={styles.inputGroup}>
                  <label>GST Number (Optional)</label>
                  <input value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
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
                className={styles.uploadSection} 
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setIdProofFile(file);
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
                        : 'Upload ID Proof (Aadhar/Voter ID)'}
                  </p>
                  {!idProofFile && !idProofUrl && <span style={{ fontSize: '12px', color: '#ef4444' }}>*Required</span>}
                </div>
              </div>
              <div className={styles.agreements}>
                <label className={styles.agreeRow}>
                  <input type="checkbox" checked={agreements.terms} onChange={e => setAgreements({...agreements, terms: e.target.checked})} />
                  <span>I accept the Terms of Service</span>
                </label>
                <label className={styles.agreeRow}>
                  <input type="checkbox" checked={agreements.commission} onChange={e => setAgreements({...agreements, commission: e.target.checked})} />
                  <span>I accept the Commission Policy</span>
                </label>
                <label className={styles.agreeRow}>
                  <input type="checkbox" checked={agreements.payment} onChange={e => setAgreements({...agreements, payment: e.target.checked})} />
                  <span>I accept the Payment Terms (RTGS/NEFT)</span>
                </label>
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

  if (isSubmitted) {
    return (
      <div className={styles.centeredForm}>
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper}>
            <CheckCircle size={48} />
          </div>
          <h2>Thank you for joining us!</h2>
          <p>
            Your reseller application has been successfully submitted. 
            Our team will review your details and contact you soon to finalize your account.
          </p>

          <div className={styles.growthCard}>
            <div className={styles.growthIconWrapper}>
              <Handshake size={24} />
            </div>
            <div className={styles.growthText}>
              <p><strong>Woman Entrepreneur?</strong></p>
              <p>We would love to connect and discuss growth with you!</p>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/')} 
            className={styles.homeBtn}
          >
            Go to Homepage
          </Button>
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
