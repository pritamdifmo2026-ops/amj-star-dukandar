import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import { SupplierTier, OnboardingStatus, setSupplierProfile } from '@/features/supplier/store/supplier.slice';
import { ROUTES } from '@/shared/constants/routes';
import supplierService from '../services/supplier.service';
import SupplierOnboardingLayout from '../layout/SupplierOnboardingLayout';
import Button from '@/shared/components/ui/Button';
import { Check, ShieldCheck, User, Building2, Mail, Phone, ArrowRight, Star, Handshake, XCircle, Upload } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';

const INDIA_STATES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kakinada", "Rajahmundry"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Tawang", "Pasighat"],
  "Assam": ["Guwahati", "Dispur", "Silchar", "Jorhat", "Dibrugarh", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Korba", "Rajnandgaon"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar", "Jamnagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar", "Rohtak", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Dharamsala", "Manali", "Solan", "Mandi", "Kullu"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi", "Davangere", "Ballari"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Berhampur"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Bharatpur"],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Vellore"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Agra", "Varanasi", "Prayagraj", "Meerut", "Ghaziabad", "Bareilly"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Roorkee", "Haldwani"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Durgapur", "Siliguri", "Asansol"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Dwarka"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe"]
};

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] bg-white outline-none focus:border-primary transition-colors ${hasError ? 'border-[#dc2626] bg-[#fef2f2]' : 'border-[#e2e8f0]'}`;

const labelCls = "block text-xs font-bold uppercase text-[#475569] tracking-wider mb-1.5";
const orangeBtnCls = "flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-[8px] font-bold text-sm cursor-pointer border-none hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const outlineBtnCls = "px-6 py-3 bg-white border border-[#e2e8f0] text-[#475569] rounded-[8px] font-bold text-sm cursor-pointer hover:bg-[#f8fafc] transition-colors";
const errorTextCls = "text-xs text-[#dc2626] mt-0.5";

const StepHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="w-12 h-12 bg-[#fff7ed] rounded-[12px] flex items-center justify-center text-primary shrink-0">{icon}</div>
    <div>
      <h1 className="text-xl font-extrabold text-[#0f172a] m-0 mb-0.5">{title}</h1>
      <p className="text-sm text-[#64748b] m-0">{desc}</p>
    </div>
  </div>
);

const SecureNote = () => (
  <div className="flex items-center gap-2 text-xs text-[#94a3b8] mt-5">
    <ShieldCheck size={14} />
    Your information is secure and will only be used to set up your account.
  </div>
);

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.supplier);
  const user = useAppSelector(state => state.auth.user);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById('supplier-form-scroll-area');
    if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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
  const [pan, setPan] = useState('');
  const [about, setAbout] = useState('');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('');
  const [selectedTier, setSelectedTier] = useState<SupplierTier>(SupplierTier.FREE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPhoneVerified] = useState(true);
  const [isPhoneEditable, setIsPhoneEditable] = useState(false);
  const [isFoodSupplier, setIsFoodSupplier] = useState(false);
  const [fssaiLicenseNumber, setFssaiLicenseNumber] = useState('');
  const [fssaiCertificate, setFssaiCertificate] = useState<File | null>(null);
  const [fssaiCertificateUrl, setFssaiCertificateUrl] = useState('');
  const [isWomenEntrepreneur, setIsWomenEntrepreneur] = useState(false);

  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user, phone]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await supplierService.getProfile();
        if (data.supplier) {
          dispatch(setSupplierProfile(data.supplier));
          if (data.supplier.isActive && data.supplier.verifiedByAdmin) {
            const destination = user?.role === 'reseller' ? '/reseller/dashboard' : '/supplier/dashboard';
            navigate(destination);
            return;
          }
          if (data.supplier.businessName) setBusinessName(data.supplier.businessName);
          if (data.supplier.phone) setPhone(data.supplier.phone);
          if (data.supplier.tier) setSelectedTier(data.supplier.tier);
          if (user?.email && !email) setEmail(user.email);
          if (user?.name && !ownerName) setOwnerName(user.name);
          const bd = data.supplier.businessDetails;
          if (bd) {
            if (bd.ownerName) setOwnerName(bd.ownerName);
            if (bd.email) setEmail(bd.email);
            if (bd.address) setAddress(bd.address);
            if (bd.pinCode) setPinCode(bd.pinCode);
            if (bd.state) setState(bd.state);
            if (bd.city) setCity(bd.city);
            if (bd.gstin) setGstin(bd.gstin);
            if (bd.pan) setPan(bd.pan);
            if (bd.about) setAbout(bd.about);
            if (bd.yearOfEstablishment) setYearOfEstablishment(bd.yearOfEstablishment);
            if (bd.isFoodSupplier) setIsFoodSupplier(bd.isFoodSupplier);
            if (bd.fssaiLicenseNumber) setFssaiLicenseNumber(bd.fssaiLicenseNumber);
            if (bd.fssaiCertificate) setFssaiCertificateUrl(bd.fssaiCertificate);
            if (bd.isWomenEntrepreneur) setIsWomenEntrepreneur(bd.isWomenEntrepreneur);
          }
          if (data.supplier.onboardingStatus === OnboardingStatus.COMPLETED) setCurrentStep(5);
          else if (data.supplier.businessDetails?.address || data.supplier.businessDetails?.gstin) setCurrentStep(3);
          else if (data.supplier.businessName) setCurrentStep(2);
          else setCurrentStep(1);
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

  const handleReapply = () => setCurrentStep(1);

  const validateBasicInfo = () => {
    const newErrs: Record<string, string> = {};
    if (!ownerName.trim()) newErrs.ownerName = "Owner name is required";
    if (!businessName.trim()) newErrs.businessName = "Business name is required";
    if (!email.trim() || !/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/.test(email)) newErrs.email = "Valid email address is required (e.g. name@company.com)";
    if (!isPhoneVerified) newErrs.phone = "Phone must be verified";
    if (countryCode === '+91' && !/^\d{10}$/.test(phone)) newErrs.phone = "Enter a valid 10-digit number";
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateBusinessDetails = () => {
    const newErrs: Record<string, string> = {};
    if (!address.trim() || address.length < 10) newErrs.address = "Detailed address (min 10 chars) is required";
    if (!pinCode.trim() || pinCode.length !== 6) newErrs.pinCode = "Valid 6-digit PIN is required";
    if (!state) newErrs.state = "State is required";
    if (!city) newErrs.city = "City is required";
    if (gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) newErrs.gstin = "Invalid GSTIN format (15 characters)";
    if (!pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) newErrs.pan = "Valid 10-character PAN is required (e.g. ABCDE1234F)";
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateProfileInfo = () => {
    const newErrs: Record<string, string> = {};
    if (yearOfEstablishment.trim()) {
      const year = parseInt(yearOfEstablishment);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) newErrs.yearOfEstablishment = `Enter a valid year between 1900 and ${currentYear}`;
    }
    if (isFoodSupplier) {
      if (!fssaiLicenseNumber.trim() || fssaiLicenseNumber.length !== 14) newErrs.fssaiLicenseNumber = "FSSAI License Number must be exactly 14 digits";
      if (!fssaiCertificate && !fssaiCertificateUrl) newErrs.fssaiCertificate = "FSSAI Certificate is required for food products";
    }
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateProfileCompletion = () => {
    const newErrs: Record<string, string> = {};
    if (!ownerName.trim()) newErrs.ownerName = "Owner name is required";
    if (!email.trim()) newErrs.email = "Email is required";
    if (!address.trim()) newErrs.address = "Address is required";
    if (!pinCode.trim()) newErrs.pinCode = "PIN code is required";
    if (!state.trim()) newErrs.state = "State is required";
    if (!city.trim()) newErrs.city = "City is required";
    if (Object.keys(newErrs).length > 0) {
      setErrors(newErrs);
      alert("Please ensure all business details (Address, Owner Name, etc.) are filled in previous steps.");
      return false;
    }
    return true;
  };

  const submitStep = async () => {
    setLoading(true);
    try {
      if (currentStep === 1) {
        if (!validateBasicInfo()) return;
        const data = await supplierService.onboard({ businessName, phone, ownerName, email });
        dispatch(setSupplierProfile(data.supplier));
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!validateBusinessDetails()) return;
        await supplierService.saveDraft({ ownerName, email, address, pinCode, state, city, gstin, pan });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (!validateProfileInfo()) return;
        let finalCertUrl = fssaiCertificateUrl;
        if (fssaiCertificate) {
          const uploadRes = await supplierService.uploadDoc(fssaiCertificate);
          finalCertUrl = uploadRes.url;
          setFssaiCertificateUrl(finalCertUrl);
          setFssaiCertificate(null);
        }
        await supplierService.saveDraft({ ownerName, email, address, pinCode, state, city, gstin, pan, about, yearOfEstablishment, isFoodSupplier, fssaiLicenseNumber, fssaiCertificate: finalCertUrl, isWomenEntrepreneur });
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!validateProfileCompletion()) return;
        const tierData = await supplierService.selectTier(selectedTier);
        dispatch(setSupplierProfile(tierData.supplier));
        const kycData = await supplierService.submitKYC({ ownerName, email, address, pinCode, state, city, gstin, pan, about, yearOfEstablishment, isFoodSupplier, fssaiLicenseNumber, fssaiCertificate: fssaiCertificateUrl, isWomenEntrepreneur });
        dispatch(setSupplierProfile(kycData.supplier));
        if (user?.role === 'reseller') { navigate(ROUTES.RESELLER_DASHBOARD); return; }
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
          <div className="w-full max-w-[580px] mx-auto px-4">
            <div className="flex flex-col gap-5">
              <StepHeader icon={<User size={24} />} title="Basic Information" desc="Tell us who you are so we can set up your supplier account." />

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Owner / Representative Name <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <User size={18} className="absolute left-3 text-[#94a3b8] pointer-events-none" />
                  <input name="ownerName" className={`${inputCls(!!errors.ownerName)} pl-10`} value={ownerName} onChange={handleCapitalizeChange(setOwnerName)} placeholder="e.g. John Smith" />
                </div>
                {errors.ownerName && <span className={errorTextCls}>{errors.ownerName}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Company / Business Name <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <Building2 size={18} className="absolute left-3 text-[#94a3b8] pointer-events-none" />
                  <input name="businessName" className={`${inputCls(!!errors.businessName)} pl-10`} value={businessName} onChange={handleCapitalizeChange(setBusinessName)} placeholder="e.g. AMJ Textiles Pvt Ltd" />
                </div>
                {errors.businessName && <span className={errorTextCls}>{errors.businessName}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Email Address <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-3 text-[#94a3b8] pointer-events-none" />
                  <input name="email" type="email" className={`${inputCls(!!errors.email)} pl-10`} value={email}
                    onChange={e => {
                      let val = e.target.value.toLowerCase().replace(/[^a-z0-9@.]/g, '');
                      val = val.replace(/[@.]{2,}/g, match => match[0]);
                      if (val.startsWith('.') || val.startsWith('@')) val = val.slice(1);
                      setEmail(val);
                      setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <span className={errorTextCls}>{errors.email}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelCls} mb-0`}>Contact Phone <span className="text-[#dc2626]">*</span></label>
                  {!isPhoneEditable && (
                    <button type="button" className="text-xs text-primary font-semibold bg-none border-none cursor-pointer" onClick={() => setIsPhoneEditable(true)}>Change</button>
                  )}
                </div>
                <div className={`flex items-center border rounded-[8px] overflow-hidden ${errors.phone ? 'border-[#dc2626]' : 'border-[#e2e8f0]'} ${!isPhoneEditable ? 'opacity-70 bg-[#f8fafc]' : 'bg-white'}`}>
                  <div className="flex items-center border-r border-[#e2e8f0] px-2">
                    <Phone size={18} className="text-[#94a3b8] mr-1" />
                    <select className="border-none outline-none text-sm bg-transparent py-2.5" value={countryCode} onChange={e => setCountryCode(e.target.value)} disabled={!isPhoneEditable}>
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                  </div>
                  <input name="phone" type="tel" className="flex-1 border-none outline-none px-3 py-2.5 text-sm bg-transparent" value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, phone: '' })); }}
                    disabled={!isPhoneEditable} maxLength={15} placeholder="9090909090"
                  />
                </div>
                {errors.phone && <span className={errorTextCls}>{errors.phone}</span>}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={submitStep} disabled={loading} className={orangeBtnCls}>
                  {loading ? 'Saving...' : 'Save & Continue'} <ArrowRight size={18} />
                </button>
              </div>
              <SecureNote />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="w-full max-w-[580px] mx-auto px-4">
            <div className="flex flex-col gap-5">
              <StepHeader icon={<Building2 size={24} />} title="Business Details" desc="Where is your business registered?" />

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Registered Address <span className="text-[#dc2626]">*</span></label>
                <textarea name="address" className={inputCls(!!errors.address)} value={address} onChange={handleCapitalizeChange(setAddress)} placeholder="Building, Street, Area" rows={3} />
                {errors.address && <span className={errorTextCls}>{errors.address}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>PIN Code <span className="text-[#dc2626]">*</span></label>
                  <input name="pinCode" className={inputCls(!!errors.pinCode)} value={pinCode}
                    onChange={e => { setPinCode(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, pinCode: '' })); }}
                    maxLength={6} placeholder="e.g. 400001" />
                  {errors.pinCode && <span className={errorTextCls}>{errors.pinCode}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>State <span className="text-[#dc2626]">*</span></label>
                  <select name="state" className={inputCls(!!errors.state)} value={state}
                    onChange={e => { setState(e.target.value); setCity(''); setErrors(prev => ({ ...prev, state: '' })); }}>
                    <option value="">Select State</option>
                    {Object.keys(INDIA_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <span className={errorTextCls}>{errors.state}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>City <span className="text-[#dc2626]">*</span></label>
                  <select name="city" className={inputCls(!!errors.city)} value={city} onChange={handleChange(setCity)} disabled={!state}>
                    <option value="">Select City</option>
                    {state && INDIA_STATES[state]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <span className={errorTextCls}>{errors.city}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>GSTIN (Optional)</label>
                  <input name="gstin" className={inputCls(!!errors.gstin)} value={gstin}
                    onChange={e => { setGstin(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, gstin: '' })); }}
                    placeholder="22AAAAA0000A1Z5" maxLength={15} />
                  {errors.gstin && <span className={errorTextCls}>{errors.gstin}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>PAN Number <span className="text-[#dc2626]">*</span></label>
                  <input name="pan" className={inputCls(!!errors.pan)} value={pan}
                    onChange={e => { setPan(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, pan: '' })); }}
                    placeholder="ABCDE1234F" maxLength={10} />
                  {errors.pan && <span className={errorTextCls}>{errors.pan}</span>}
                </div>
                <div />
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setCurrentStep(1)} className={outlineBtnCls}>Back</button>
                <button onClick={submitStep} disabled={loading} className={orangeBtnCls}>
                  {loading ? 'Saving...' : 'Save & Continue'} <ArrowRight size={18} />
                </button>
              </div>
              <SecureNote />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="w-full max-w-[580px] mx-auto px-4">
            <div className="flex flex-col gap-5">
              <StepHeader icon={<User size={24} />} title="Business Profile" desc="Add some flair to your profile to attract more buyers." />

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>About Company (Optional)</label>
                <textarea className={inputCls()} value={about} onChange={e => setAbout(e.target.value)} placeholder="What makes your products special?" rows={4} />
              </div>

              <label className="flex items-center gap-2.5 text-sm text-[#475569] cursor-pointer">
                <input type="checkbox" checked={isFoodSupplier} onChange={e => setIsFoodSupplier(e.target.checked)} className="w-4 h-4 accent-primary" />
                <span>Are you a food product supplier?</span>
              </label>

              {isFoodSupplier && (
                <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] p-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>FSSAI License Number <span className="text-[#dc2626]">*</span></label>
                    <input type="text" className={inputCls(!!errors.fssaiLicenseNumber)} value={fssaiLicenseNumber}
                      onChange={e => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 14) setFssaiLicenseNumber(val); }}
                      placeholder="Enter 14 digit license number" maxLength={14} />
                    {errors.fssaiLicenseNumber && <span className={errorTextCls}>{errors.fssaiLicenseNumber}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Upload FSSAI Certificate <span className="text-[#dc2626]">*</span></label>
                    <input type="file" ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const file = e.target.files?.[0]; if (file) { setFssaiCertificate(file); setErrors(prev => ({ ...prev, fssaiCertificate: '' })); } }} className="hidden" />
                    <div className="flex items-center gap-3 flex-wrap">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-semibold text-[#475569] cursor-pointer hover:border-primary hover:text-primary transition-colors">
                        <Upload size={16} /> {fssaiCertificate || fssaiCertificateUrl ? 'Change File' : 'Choose File'}
                      </button>
                      {fssaiCertificate ? (
                        <p className="text-sm text-[#059669] font-semibold m-0">✓ {fssaiCertificate.name}</p>
                      ) : fssaiCertificateUrl ? (
                        <p className="text-sm text-[#059669] font-semibold m-0">✓ Certificate already uploaded</p>
                      ) : (
                        <p className="text-xs text-[#94a3b8] m-0">Accepted formats: PDF, JPG, PNG</p>
                      )}
                    </div>
                    {errors.fssaiCertificate && <span className={errorTextCls}>{errors.fssaiCertificate}</span>}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Year of Establishment (Optional)</label>
                <input name="yearOfEstablishment" type="number" className={inputCls(!!errors.yearOfEstablishment)} value={yearOfEstablishment}
                  onChange={e => { setYearOfEstablishment(e.target.value); setErrors(prev => ({ ...prev, yearOfEstablishment: '' })); }}
                  placeholder="e.g. 2010" />
                {errors.yearOfEstablishment && <span className={errorTextCls}>{errors.yearOfEstablishment}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm text-[#475569] cursor-pointer">
                  <input type="checkbox" checked={isWomenEntrepreneur} onChange={e => setIsWomenEntrepreneur(e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span>Is this a women-led / women-owned business?</span>
                </label>
                {isWomenEntrepreneur && (
                  <p className="text-xs text-[#c2410c] ml-6 m-0">Women-led businesses receive priority onboarding support and platform visibility benefits.</p>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setCurrentStep(2)} className={outlineBtnCls}>Back</button>
                <button onClick={submitStep} disabled={loading} className={orangeBtnCls}>
                  {loading ? 'Saving...' : 'Next: Select Plan'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="w-full max-w-[760px] mx-auto px-4">
            <div className="flex flex-col gap-5">
              <StepHeader icon={<Star size={24} />} title="Choose your Selling Plan" desc="Select a plan that fits your business scale and growth goals." />

              <div className="flex flex-col gap-3">
                {[
                  { id: SupplierTier.FREE, label: 'Free Tier', desc: 'Basic visibility. List up to 5K products (group).', price: '₹0', features: ['Up to 5,000 Products', 'Basic Marketplace Visibility'] },
                  { id: SupplierTier.GOLD, label: 'Gold Plan', desc: 'Increased visibility. KYC required. List up to 5K products.', price: '₹999/mo', features: ['Up to 5,000 Products', 'Priority Placement', 'KYC Verified Badge'] },
                  { id: SupplierTier.DIAMOND, label: 'Diamond Plan', desc: 'Higher ranking. Can list single product pushes.', price: '₹2,499/mo', features: ['Single Product Pushes', 'Higher Ranking', 'Advanced Analytics'] },
                  { id: SupplierTier.PLATINUM, label: 'Platinum Plan', desc: 'Max visibility, dedicated support, e-commerce integration.', price: '₹4,999/mo', features: ['Maximum Visibility', 'Dedicated Account Manager', 'E-commerce Integration'] },
                ].map(tier => (
                  <div
                    key={tier.id}
                    className={`flex items-center gap-4 p-5 border-2 rounded-[12px] cursor-pointer transition-all ${selectedTier === tier.id ? 'border-primary bg-[#fff7ed]' : 'border-[#e2e8f0] hover:border-primary hover:bg-[#fafafa]'}`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    <div className="flex-1 flex flex-col gap-2">
                      <div>
                        <h3 className="text-base font-bold text-[#0f172a] m-0">{tier.label}</h3>
                        <p className="text-sm text-[#64748b] m-0">{tier.desc}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tier.features.map((f, i) => (
                          <span key={i} className="text-xs bg-white border border-[#e2e8f0] text-[#475569] px-2.5 py-1 rounded-full font-semibold">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xl font-extrabold text-[#0f172a]">{tier.price}</span>
                      {selectedTier === tier.id && (
                        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center"><Check size={14} /></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setCurrentStep(3)} className={outlineBtnCls}>Back</button>
                <button onClick={submitStep} disabled={loading} className={orangeBtnCls}>
                  {loading ? 'Submitting...' : 'Complete Onboarding'} <Check size={18} />
                </button>
              </div>
            </div>
          </div>
        );

      case 5: {
        const isRejected = profile?.kycStatus === 'REJECTED';
        return (
          <>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#ecfdf5] text-[#059669]'}`}>
              {isRejected ? <XCircle size={48} /> : <ShieldCheck size={48} />}
            </div>
            <h1 className="text-2xl font-extrabold text-[#0f172a] text-center m-0 mb-4">
              {isRejected ? 'Application Rejected' : 'Application Submitted!'}
            </h1>

            {!isRejected ? (
              <p className="text-center text-[#475569] text-base max-w-[440px] mx-auto">
                Your application is now under review. As part of our high-trust B2B process,
                <strong> you will receive a verification call within 24 hours </strong>
                to confirm your details.
              </p>
            ) : (
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[8px] p-4 text-sm text-[#b91c1c] my-4">
                <p className="font-bold m-0 mb-1">Reason for Rejection:</p>
                <p className="m-0">{profile?.rejectionReason || 'Your application did not meet our initial requirements.'}</p>
              </div>
            )}

            <div className={`rounded-[10px] p-5 text-center my-4 ${isRejected ? 'bg-[#fef2f2] border border-[#fecaca]' : 'bg-[#f8fafc] border border-[#e2e8f0]'}`}>
              <p className="m-0 font-semibold">Status: <strong>{profile?.kycStatus || 'PENDING'}</strong></p>
              {!isRejected && <p className="text-sm text-[#64748b] m-0 mt-1">Next step: Formal Cold Call (within 24h)</p>}
            </div>

            {isRejected && (
              <div className="text-center flex flex-col gap-2 my-4 text-sm text-[#475569]">
                <p className="m-0">Need help? Contact our support team:</p>
                <p className="m-0"><strong>Phone: +91 xxxxxxxx</strong></p>
                <p className="m-0">Or update your details and try again.</p>
                <Button onClick={handleReapply} variant="outline">Update &amp; Reapply</Button>
              </div>
            )}

            {!isRejected && (
              <div className="flex items-center gap-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] p-4 my-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0"><Handshake size={22} /></div>
                <div className="flex flex-col gap-1 text-sm text-[#475569]">
                  <p className="font-bold m-0">Woman Entrepreneur?</p>
                  <p className="m-0">We would love to connect and discuss growth with you!</p>
                </div>
              </div>
            )}

            <Button onClick={() => navigate('/')} size="lg">Go to Homepage</Button>
          </>
        );
      }

      default:
        return null;
    }
  };

  const steps = [
    { n: 1, label: 'Basic Info', desc: 'Name & Email' },
    { n: 2, label: 'Business', desc: 'Address & GST' },
    { n: 3, label: 'Profile', desc: 'About' },
    { n: 4, label: 'Plans', desc: 'Selling Tiers' }
  ];

  if (currentStep === 5) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] py-10 px-4">
        <div className="bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-10 max-w-[540px] w-full flex flex-col items-center text-center">
          {renderStepContent()}
        </div>
      </div>
    );
  }

  return (
    <SupplierOnboardingLayout currentStep={currentStep} steps={steps}>
      {renderStepContent()}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { dispatch(logout()); navigate('/'); }}>Sign Out</Button>
          </>
        }
      >
        Are you sure you want to sign out? Your onboarding progress is saved.
      </Modal>
    </SupplierOnboardingLayout>
  );
};

export default Onboarding;
