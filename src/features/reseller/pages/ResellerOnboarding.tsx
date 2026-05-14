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

const inputCls = (hasError = false) =>
  `w-full border rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none transition-colors ${hasError ? 'border-[#dc2626] bg-[#fef2f2]' : 'border-[#e2e8f0] bg-white focus:border-primary'}`;
const labelCls = "text-xs font-bold uppercase text-[#94a3b8] tracking-wider";
const errorCls = "text-xs text-[#dc2626] mt-0.5";
const backBtnCls = "flex items-center gap-1.5 text-sm text-[#475569] font-semibold bg-transparent border-none cursor-pointer hover:text-[#1e293b] p-0";

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

const StepHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-start gap-4 mb-2">
    <div className="w-12 h-12 bg-[#fff7ed] rounded-[12px] flex items-center justify-center text-primary shrink-0">{icon}</div>
    <div>
      <h2 className="text-xl font-extrabold text-[#0f172a] m-0 mb-1">{title}</h2>
      <p className="text-sm text-[#64748b] m-0">{desc}</p>
    </div>
  </div>
);

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

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [phone] = useState(user?.phone || '');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country] = useState('India');

  const [storeName, setStoreName] = useState('');
  const [profileType, setProfileType] = useState<'Individual Reseller' | 'Business Reseller'>('Individual Reseller');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileImageUrl] = useState('');

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [primarySellingMethod, setPrimarySellingMethod] = useState<'Direct to customers' | 'To retailers/shopkeepers' | 'Both'>('Direct to customers');
  const [monthlyVolume, setMonthlyVolume] = useState<'0–50 orders' | '50–200' | '200–500' | '500+'>('0–50 orders');
  const [reach, setReach] = useState<'Local' | 'State' | 'Pan India' | 'International'>('Local');

  const [experience, setExperience] = useState<'Beginner' | '1–2 years' | '3+ years'>('Beginner');
  const [soldBefore, setSoldBefore] = useState(false);

  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const [idProofUrl, setIdProofUrl] = useState('');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [agreements, setAgreements] = useState({ terms: false, commission: false, payment: false });

  const [subscriptionPlan, setSubscriptionPlan] = useState<'Starter' | 'Basic' | 'Standard' | 'Premium'>('Starter');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await resellerService.getProfile();
        setProfile(data);
        if (data) {
          if (data.status === 'APPROVED') { navigate(ROUTES.RESELLER_DASHBOARD); return; }
          if (data.status === 'PENDING') setIsSubmitted(true);
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
          if (data.accountName) setAccountName(data.accountName);
          if (data.accountNumber) setAccountNumber(data.accountNumber);
          if (data.ifscCode) setIfscCode(data.ifscCode);
          if (data.bankName) setBankName(data.bankName);
          if (data.panNumber) setPanNumber(data.panNumber);
          if (data.gstNumber) setGstNumber(data.gstNumber);
          if (data.idProofUrl) setIdProofUrl(data.idProofUrl);
          if (data.subscriptionPlan) setSubscriptionPlan(data.subscriptionPlan);
        }
      } catch {
        // Starting fresh onboarding
      }
    };
    fetchProfile();
  }, [navigate]);

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!fullName.trim()) errors.fullName = 'Full name is required';
      else if (fullName.trim().split(' ').length < 2) errors.fullName = 'Please enter your full name (First & Last Name)';
      if (!email.trim()) errors.email = 'Email address is required';
      else if (!/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/.test(email)) errors.email = 'Please enter a valid email address (e.g. name@example.com)';
      if (!address.trim()) errors.address = 'Proper address is required';
      else if (address.length < 10) errors.address = 'Detailed address (min 10 characters) is required';
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
      if (!accountNumber.trim()) errors.accountNumber = 'Account number is required';
      else if (!/^\d{9,18}$/.test(accountNumber)) errors.accountNumber = 'Account number must be between 9 and 18 digits';
      if (!ifscCode.trim()) errors.ifscCode = 'IFSC code is required';
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) errors.ifscCode = 'Invalid IFSC format (e.g. ABCD0123456)';
      if (!bankName.trim()) errors.bankName = 'Bank name is required';
      if (panNumber && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(panNumber)) errors.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
      if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) errors.gstNumber = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)';
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
    setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const saveStepData = async (nextStep?: number) => {
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      let finalIdProofUrl = idProofUrl;
      if (idProofFile && nextStep === 7) {
        const uploadRes = await resellerService.uploadDoc(idProofFile);
        finalIdProofUrl = uploadRes.url;
        setIdProofUrl(finalIdProofUrl);
        setIdProofFile(null);
      }
      const data: any = {
        fullName, email, storeName, address, city, state, country, profileType,
        profileDescription, profileImage: profileImageUrl, platforms, socialLinks,
        primarySellingMethod, monthlyVolume, reach, experience, soldBefore,
        accountName, accountNumber, ifscCode, bankName, panNumber, gstNumber,
        idProofUrl: finalIdProofUrl, subscriptionPlan,
        step: nextStep || currentStep,
        termsAccepted: agreements.terms,
        commissionPolicyAccepted: agreements.commission,
        paymentTermsAccepted: agreements.payment
      };
      Object.keys(data).forEach(key => { if (data[key] === '') delete data[key]; });
      setFormErrors({});
      await resellerService.onboard(data);
      if (nextStep) {
        if (nextStep === 8 || (currentStep === 7 && !nextStep)) setIsSubmitted(true);
        else setCurrentStep(nextStep);
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

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  const handlePlatformToggle = (platform: string) => {
    setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
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
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col gap-5">
            <StepHeader icon={<User size={24} />} title="Basic Account Setup" desc="Let's start with your contact details." />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Full Name *</label>
                <input
                  className={inputCls(!!formErrors.fullName)}
                  value={fullName}
                  onChange={e => {
                    const val = e.target.value;
                    setFullName(val.replace(/\b\w/g, l => l.toUpperCase()));
                    clearError('fullName');
                  }}
                  placeholder="Enter your full name"
                />
                {formErrors.fullName && <span className={errorCls}>{formErrors.fullName}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Phone Number</label>
                <div className="relative flex items-center">
                  <input className={inputCls() + ' pr-10 opacity-70 bg-[#f8fafc]'} value={phone} readOnly />
                  <CheckCircle size={18} className="absolute right-3 text-[#059669]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Email Address *</label>
                <input
                  className={inputCls(!!formErrors.email)}
                  value={email}
                  onChange={e => {
                    let val = e.target.value.toLowerCase().replace(/[^a-z0-9@.]/g, '');
                    val = val.replace(/[@.]{2,}/g, match => match[0]);
                    if (val.startsWith('.') || val.startsWith('@')) val = val.slice(1);
                    setEmail(val);
                    clearError('email');
                  }}
                  placeholder="email@example.com"
                />
                {formErrors.email && <span className={errorCls}>{formErrors.email}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Proper Address *</label>
                <textarea
                  className={inputCls(!!formErrors.address) + ' resize-none'}
                  value={address}
                  onChange={e => { setAddress(e.target.value); clearError('address'); }}
                  placeholder="Street, Area, Building..."
                  rows={2}
                />
                {formErrors.address && <span className={errorCls}>{formErrors.address}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>State *</label>
                <select
                  className={inputCls(!!formErrors.state)}
                  value={state}
                  onChange={e => { setState(e.target.value); setCity(''); clearError('state'); }}
                >
                  <option value="">Select State</option>
                  {Object.keys(STATE_CITY_MAP).sort().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {formErrors.state && <span className={errorCls}>{formErrors.state}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>City *</label>
                  <select
                    className={inputCls(!!formErrors.city)}
                    value={city}
                    onChange={e => { setCity(e.target.value); clearError('city'); }}
                    disabled={!state}
                  >
                    <option value="">Select City</option>
                    {state && STATE_CITY_MAP[state]?.sort().map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.city && <span className={errorCls}>{formErrors.city}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Country</label>
                  <input className={inputCls() + ' opacity-70 bg-[#f8fafc]'} value={country} readOnly />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button onClick={() => saveStepData(2)} loading={loading} className="flex items-center gap-2">
                Next Step <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-5">
            <StepHeader icon={<Store size={24} />} title="Reseller Profile" desc="Your storefront identity on AMJStar." />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Store Name *</label>
                <input
                  className={inputCls(!!formErrors.storeName)}
                  value={storeName}
                  onChange={e => { setStoreName(e.target.value); clearError('storeName'); }}
                  placeholder="e.g. Trendify Boutique"
                />
                {formErrors.storeName && <span className={errorCls}>{formErrors.storeName}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Profile Type *</label>
                <div className="flex gap-3 flex-wrap">
                  {['Individual Reseller', 'Business Reseller'].map(type => (
                    <label
                      key={type}
                      className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-[8px] cursor-pointer text-sm font-semibold transition-all ${profileType === type ? 'border-primary bg-[#fff7ed] text-primary' : 'border-[#e2e8f0] text-[#475569] hover:border-primary'}`}
                    >
                      <input
                        type="radio"
                        name="profileType"
                        checked={profileType === type}
                        onChange={() => { setProfileType(type as any); clearError('profileType'); }}
                        className="sr-only"
                      />
                      {type}
                    </label>
                  ))}
                </div>
                {formErrors.profileType && <span className={errorCls}>{formErrors.profileType}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Profile Description *</label>
                <textarea
                  className={inputCls(!!formErrors.profileDescription) + ' resize-none'}
                  value={profileDescription}
                  onChange={e => { setProfileDescription(e.target.value); clearError('profileDescription'); }}
                  placeholder="Tell us about your reseller business..."
                  rows={4}
                />
                {formErrors.profileDescription && <span className={errorCls}>{formErrors.profileDescription}</span>}
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className={backBtnCls} onClick={() => setCurrentStep(1)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(3)} loading={loading} className="flex items-center gap-2">
                Continue <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 3: {
        const PLATFORM_OPTIONS = ['WhatsApp', 'Instagram', 'Facebook', 'Offline network', 'Amazon / Flipkart/ Meesho', 'Personal Website', 'Others'];
        return (
          <div className="flex flex-col gap-5">
            <StepHeader icon={<Globe size={24} />} title="Selling Channels" desc="Where do you currently sell your products?" />
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-2">
              {PLATFORM_OPTIONS.map(p => (
                <div
                  key={p}
                  onClick={() => handlePlatformToggle(p)}
                  className={`px-3 py-3 border-2 rounded-[8px] text-sm font-semibold text-center cursor-pointer transition-all select-none ${platforms.includes(p) ? 'border-primary bg-[#fff7ed] text-primary' : 'border-[#e2e8f0] text-[#475569] hover:border-primary hover:text-primary'}`}
                >
                  {p}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Primary Selling Method *</label>
                <select
                  className={inputCls(!!formErrors.primarySellingMethod)}
                  value={primarySellingMethod}
                  onChange={e => { setPrimarySellingMethod(e.target.value as any); clearError('primarySellingMethod'); }}
                >
                  <option value="Direct to customers">Direct to customers</option>
                  <option value="To retailers/shopkeepers">To retailers/shopkeepers</option>
                  <option value="Both">Both</option>
                </select>
                {formErrors.primarySellingMethod && <span className={errorCls}>{formErrors.primarySellingMethod}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Monthly Sales Volume *</label>
                  <select
                    className={inputCls(!!formErrors.monthlyVolume)}
                    value={monthlyVolume}
                    onChange={e => { setMonthlyVolume(e.target.value as any); clearError('monthlyVolume'); }}
                  >
                    <option value="0–50 orders">0–50 orders</option>
                    <option value="50–200">50–200</option>
                    <option value="200–500">200–500</option>
                    <option value="500+">500+</option>
                  </select>
                  {formErrors.monthlyVolume && <span className={errorCls}>{formErrors.monthlyVolume}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Selling Reach *</label>
                  <select
                    className={inputCls(!!formErrors.reach)}
                    value={reach}
                    onChange={e => { setReach(e.target.value as any); clearError('reach'); }}
                  >
                    <option value="Local">Local</option>
                    <option value="State">State</option>
                    <option value="Pan India">Pan India</option>
                    <option value="International">International</option>
                  </select>
                  {formErrors.reach && <span className={errorCls}>{formErrors.reach}</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button className={backBtnCls} onClick={() => setCurrentStep(2)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(4)} loading={loading} className="flex items-center gap-2">
                Experience Details <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );
      }

      case 4:
        return (
          <div className="flex flex-col gap-5">
            <StepHeader icon={<Award size={24} />} title="Experience & Credibility" desc="Tell us about your background in reselling." />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Experience Level *</label>
                <div className="flex gap-3 flex-wrap">
                  {(['Beginner', '1–2 years', '3+ years'] as const).map(exp => (
                    <div
                      key={exp}
                      onClick={() => { setExperience(exp); clearError('experience'); }}
                      className={`flex items-center gap-2 px-5 py-3 border-2 rounded-[8px] cursor-pointer text-sm font-semibold transition-all ${experience === exp ? 'border-primary bg-[#fff7ed] text-primary' : 'border-[#e2e8f0] text-[#475569] hover:border-primary'}`}
                    >
                      {experience === exp && <Check size={14} />}
                      {exp}
                    </div>
                  ))}
                </div>
                {formErrors.experience && <span className={errorCls}>{formErrors.experience}</span>}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#334155]">
                <input type="checkbox" checked={soldBefore} onChange={e => setSoldBefore(e.target.checked)} className="w-4 h-4 accent-primary" />
                <span>Have you sold products before? (Optional)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-2">
              <button className={backBtnCls} onClick={() => setCurrentStep(3)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(5)} loading={loading} className="flex items-center gap-2">
                Payment Setup <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col gap-5">
            <StepHeader icon={<CreditCard size={24} />} title="Payment Setup" desc="Where should we send your earnings?" />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Account Holder Name *</label>
                <input
                  className={inputCls(!!formErrors.accountName)}
                  value={accountName}
                  onChange={e => { setAccountName(e.target.value); clearError('accountName'); }}
                  placeholder="Full name as per bank record"
                />
                {formErrors.accountName && <span className={errorCls}>{formErrors.accountName}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Account Number *</label>
                  <input
                    className={inputCls(!!formErrors.accountNumber)}
                    value={accountNumber}
                    onChange={e => { setAccountNumber(e.target.value); clearError('accountNumber'); }}
                    placeholder="0000 0000 0000"
                  />
                  {formErrors.accountNumber && <span className={errorCls}>{formErrors.accountNumber}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>IFSC Code *</label>
                  <input
                    className={inputCls(!!formErrors.ifscCode)}
                    value={ifscCode}
                    onChange={e => { setIfscCode(e.target.value.toUpperCase()); clearError('ifscCode'); }}
                    placeholder="ABCD0123456"
                  />
                  {formErrors.ifscCode && <span className={errorCls}>{formErrors.ifscCode}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Bank Name *</label>
                <input
                  className={inputCls(!!formErrors.bankName)}
                  value={bankName}
                  onChange={e => { setBankName(e.target.value); clearError('bankName'); }}
                  placeholder="e.g. HDFC Bank"
                />
                {formErrors.bankName && <span className={errorCls}>{formErrors.bankName}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>PAN Number (Optional)</label>
                  <input
                    className={inputCls(!!formErrors.panNumber)}
                    value={panNumber}
                    onChange={e => { setPanNumber(e.target.value.toUpperCase()); clearError('panNumber'); }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                  {formErrors.panNumber && <span className={errorCls}>{formErrors.panNumber}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>GST Number (Optional)</label>
                  <input
                    className={inputCls(!!formErrors.gstNumber)}
                    value={gstNumber}
                    onChange={e => { setGstNumber(e.target.value.toUpperCase()); clearError('gstNumber'); }}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                  {formErrors.gstNumber && <span className={errorCls}>{formErrors.gstNumber}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className={backBtnCls} onClick={() => setCurrentStep(4)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData(6)} loading={loading} className="flex items-center gap-2">
                Verification <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col gap-5">
            <StepHeader icon={<ShieldCheck size={24} />} title="Verification" desc="Finalize your application with our policies." />
            <div className="flex flex-col gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${formErrors.idProof ? 'border-[#dc2626] bg-[#fef2f2]' : (idProofFile || idProofUrl) ? 'border-[#10b981] bg-[#f0fdf4]' : 'border-[#e2e8f0] hover:border-primary'}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setIdProofFile(file); clearError('idProof'); }
                  }}
                  className="hidden"
                />
                <Upload size={32} color={idProofFile || idProofUrl ? '#10b981' : '#94a3b8'} />
                <p className="text-sm font-semibold text-[#475569] text-center m-0">
                  {idProofFile ? `✓ ${idProofFile.name}` : idProofUrl ? '✓ ID Proof uploaded' : 'Upload ID Proof (Mandatory *)'}
                </p>
                {formErrors.idProof && <span className={errorCls}>{formErrors.idProof}</span>}
              </div>

              <div className="flex flex-col gap-3">
                {([
                  { key: 'terms', label: 'I accept the Terms of Service *', checked: agreements.terms, onChange: (v: boolean) => { setAgreements({ ...agreements, terms: v }); if (v) clearError('terms'); } },
                  { key: 'commission', label: 'I accept the Commission Policy *', checked: agreements.commission, onChange: (v: boolean) => { setAgreements({ ...agreements, commission: v }); if (v) clearError('commission'); } },
                  { key: 'payment', label: 'I accept the Payment Terms (RTGS/NEFT) *', checked: agreements.payment, onChange: (v: boolean) => { setAgreements({ ...agreements, payment: v }); if (v) clearError('payment'); } },
                ] as const).map(({ key, label, checked, onChange }) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[#334155]">
                      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span>{label}</span>
                    </label>
                    {formErrors[key] && <span className={errorCls}>{formErrors[key]}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className={backBtnCls} onClick={() => setCurrentStep(5)}><ArrowLeft size={18} /> Back</button>
              <Button
                onClick={() => saveStepData(7)}
                loading={loading}
                disabled={!agreements.terms || !agreements.commission || !agreements.payment || (!idProofFile && !idProofUrl)}
                className="flex items-center gap-2"
              >
                Choose Plan <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        );

      case 7: {
        const PLANS = [
          { id: 'Starter', price: 'Free', limit: '200 products', benefits: 'Basic support' },
          { id: 'Basic', price: '₹999', limit: '999 products', benefits: 'Standard support' },
          { id: 'Standard', price: '₹1,000', limit: '1,000 products', benefits: 'Premium support' },
          { id: 'Premium', price: '₹5,000', limit: '5,000 products', benefits: 'Dedicated Manager' },
        ];
        return (
          <div className="flex flex-col gap-5">
            <StepHeader icon={<Star size={24} />} title="Select Selling Plan" desc="Choose the capacity that fits your business goals." />
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSubscriptionPlan(plan.id as any)}
                  className={`border-2 rounded-[12px] p-5 cursor-pointer transition-all ${subscriptionPlan === plan.id ? 'border-primary bg-[#fff7ed]' : 'border-[#e2e8f0] hover:border-primary hover:bg-[#fafafa]'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-extrabold text-[#0f172a] m-0">{plan.id}</h3>
                    <span className="text-lg font-extrabold text-primary">{plan.price}</span>
                  </div>
                  <ul className="flex flex-col gap-1.5 m-0 p-0 list-none text-sm text-[#475569]">
                    <li className="flex items-center gap-1.5"><Package size={14} className="shrink-0" /> {plan.limit}</li>
                    <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="shrink-0" /> {plan.benefits}</li>
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button className={backBtnCls} onClick={() => setCurrentStep(6)}><ArrowLeft size={18} /> Back</button>
              <Button onClick={() => saveStepData()} loading={loading} className="flex items-center gap-2">
                Submit Application <Check size={18} />
              </Button>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (isSubmitted || profile?.status === 'PENDING') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] py-10 px-4">
        <div className="bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-10 max-w-[540px] w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#ecfdf5] rounded-full flex items-center justify-center text-[#059669] mb-4">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-3">Application Under Review</h2>
          <p className="text-sm text-[#475569] m-0">
            Thank you! Your reseller application for <strong>{storeName}</strong> has been submitted and is currently under review by our admin team.
          </p>
          <p className="text-sm text-[#64748b] mt-3 m-0">
            We usually process applications within 24-48 business hours. You'll be notified once your account is activated.
          </p>

          <div className="flex items-center gap-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] p-4 my-4 text-left w-full">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shrink-0">
              <Handshake size={22} />
            </div>
            <div className="flex flex-col gap-0.5 text-sm">
              <p className="font-bold text-[#0f172a] m-0">Need Help?</p>
              <p className="text-[#64748b] m-0">Contact our support team at +91 xxxxxxxxxx for priority onboarding.</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <Button onClick={() => navigate('/')}>Go to Homepage</Button>
            <Button variant="secondary" onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.status === 'REJECTED') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] py-10 px-4">
        <div className="bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-10 max-w-[540px] w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#fef2f2] rounded-full flex items-center justify-center text-[#dc2626] mb-4">
            <XCircle size={48} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#ef4444] m-0 mb-3">Application Rejected</h2>
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[8px] p-4 text-sm text-left w-full mt-2">
            <p className="font-bold text-[#dc2626] mb-1 m-0">Reason for rejection:</p>
            <p className="text-[#475569] m-0">{profile.rejectionReason || 'Details provided in the onboarding form were insufficient or incorrect.'}</p>
          </div>
          <p className="text-sm text-[#64748b] mt-5 m-0">
            Don't worry! You can update your details and re-submit your application for review.
          </p>
          <div className="mt-4 w-full">
            <a href="tel:+91xxxxxxxxxx" className="flex items-center justify-center gap-2 text-sm text-primary font-bold no-underline hover:underline">
              Contact Support: +91 xxxxxxxxxx
            </a>
          </div>
          <div className="flex gap-3 flex-wrap justify-center mt-6">
            <Button
              onClick={() => { setProfile(null); setIsSubmitted(false); setCurrentStep(1); }}
              style={{ background: '#e65100' }}
            >
              Update & Re-apply
            </Button>
            <Button variant="secondary" onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResellerOnboardingLayout currentStep={currentStep} steps={steps}>
      <div className="bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 max-w-[640px] mx-auto">
        {renderStep()}
      </div>
    </ResellerOnboardingLayout>
  );
};

export default ResellerOnboarding;
