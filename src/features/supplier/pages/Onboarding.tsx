import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIfscVerification } from '@/shared/hooks/useIfscVerification';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import { SupplierTier, OnboardingStatus, setSupplierProfile } from '@/features/supplier/store/supplier.slice';
import { ROUTES } from '@/shared/constants/routes';
import supplierService from '../services/supplier.service';
import { PLAN_LIST, formatINR } from '../constants/plans';
import SupplierOnboardingLayout from '../layout/SupplierOnboardingLayout';
import Button from '@/shared/components/ui/Button';
import { Check, ShieldCheck, User, Building2, Mail, Phone, ArrowRight, Handshake, XCircle, Upload, Package, Landmark, LocateFixed, Loader2 } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import { useLocateMe } from '@/shared/hooks/useLocateMe';

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
  const fssaiFileRef = React.useRef<HTMLInputElement>(null);
  const taxFileRef = React.useRef<HTMLInputElement>(null);
  const panDocRef = React.useRef<HTMLInputElement>(null);
  const gstinDocRef = React.useRef<HTMLInputElement>(null);

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
  const [selectedTier, setSelectedTier] = useState<SupplierTier>(SupplierTier.VERIFIED);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPhoneVerified] = useState(true);
  const [isPhoneEditable, setIsPhoneEditable] = useState(false);
  const [isFoodSupplier, setIsFoodSupplier] = useState(false);
  const [fssaiLicenseNumber, setFssaiLicenseNumber] = useState('');
  const [fssaiCertificate, setFssaiCertificate] = useState<File | null>(null);
  const [fssaiCertificateUrl, setFssaiCertificateUrl] = useState('');
  const [isWomenEntrepreneur, setIsWomenEntrepreneur] = useState(false);
  const [annualTurnover, setAnnualTurnover] = useState('');

  const { locate, locating, error: locateError } = useLocateMe();
  const handleLocateMe = () => {
    locate((geo) => {
      const matchedState = Object.keys(INDIA_STATES).find(s => s.toLowerCase() === geo.state.toLowerCase()) || '';
      const cityOptions = matchedState ? (INDIA_STATES[matchedState] ?? []) : [];
      const matchedCity = cityOptions.find(c => c.toLowerCase() === geo.city.toLowerCase()) || '';

      if (geo.pincode) setPinCode(geo.pincode);
      if (matchedState) setState(matchedState);
      if (matchedCity) setCity(matchedCity);
      const addressLine = [geo.houseNo, geo.area].filter(Boolean).join(', ') || geo.formattedAddress;
      if (addressLine) setAddress(addressLine);
      setErrors(prev => ({ ...prev, address: '', pinCode: '', state: '', city: '' }));
    });
  };
  const [monthlyProductionCapacity, setMonthlyProductionCapacity] = useState('');
  const [taxFilingMethod, setTaxFilingMethod] = useState('');
  const [taxFilingDetails, setTaxFilingDetails] = useState<File | null>(null);
  const [taxFilingDetailsUrl, setTaxFilingDetailsUrl] = useState('');
  const [taxPaymentsCompliance, setTaxPaymentsCompliance] = useState('');
  const [panDocument, setPanDocument] = useState<File | null>(null);
  const [panDocumentUrl, setPanDocumentUrl] = useState('');
  const [gstinDocument, setGstinDocument] = useState<File | null>(null);
  const [gstinDocumentUrl, setGstinDocumentUrl] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [returnPolicyType, setReturnPolicyType] = useState('');
  const [returnPolicyCustomTerms, setReturnPolicyCustomTerms] = useState('');

  // Bank Details State
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  const { verifying: ifscVerifying, bankInfo: ifscBankInfo, ifscError: ifscApiError } = useIfscVerification(ifscCode);

  useEffect(() => {
    if (ifscBankInfo?.bank && !bankName) {
      setBankName(ifscBankInfo.bank);
    }
  }, [ifscBankInfo]);

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
            if (bd.annualTurnover) setAnnualTurnover(bd.annualTurnover.toString());
            if (bd.monthlyProductionCapacity) setMonthlyProductionCapacity(bd.monthlyProductionCapacity.toString());
            if (bd.taxFilingMethod) setTaxFilingMethod(bd.taxFilingMethod);
            if (bd.taxFilingDetails) setTaxFilingDetailsUrl(bd.taxFilingDetails);
            if (bd.taxPaymentsCompliance) setTaxPaymentsCompliance(bd.taxPaymentsCompliance);
            if (bd.panDocument) setPanDocumentUrl(bd.panDocument);
            if (bd.gstinDocument) setGstinDocumentUrl(bd.gstinDocument);
            if (bd.returnPolicyType) setReturnPolicyType(bd.returnPolicyType);
            if (bd.returnPolicyCustomTerms) setReturnPolicyCustomTerms(bd.returnPolicyCustomTerms);
          }
          if (data.supplier.commissionRate) setCommissionRate(data.supplier.commissionRate.toString());
          if (data.supplier.banks && data.supplier.banks.length > 0) {
            const primaryBank = data.supplier.banks.find((b: any) => b.isPrimary) || data.supplier.banks[0];
            if (primaryBank) {
              setAccountHolderName(primaryBank.accountHolderName || '');
              setAccountNumber(primaryBank.accountNumber || '');
              setConfirmAccountNumber(primaryBank.accountNumber || '');
              setIfscCode(primaryBank.ifscCode || '');
              setBankName(primaryBank.bankName || '');
            }
          }
          if (data.supplier.kycStatus === 'REJECTED' || (data.supplier.kycStatus === 'PENDING' && data.supplier.onboardingStatus === OnboardingStatus.COMPLETED)) {
            setCurrentStep(7);
          } else if (data.supplier.banks && data.supplier.banks.length > 0) {
            setCurrentStep(6);
          } else if (data.supplier.businessDetails?.annualTurnover || data.supplier.businessDetails?.monthlyProductionCapacity) {
            setCurrentStep(5);
          } else if (data.supplier.businessDetails?.about || data.supplier.businessDetails?.yearOfEstablishment) {
            setCurrentStep(4);
          } else if (data.supplier.businessDetails?.address || data.supplier.businessDetails?.gstin) {
            setCurrentStep(3);
          } else if (data.supplier.businessName) {
            setCurrentStep(2);
          } else {
            setCurrentStep(1);
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

  const handleReapply = async () => {
    setLoading(true);
    try {
      await supplierService.reapply();
      const data = await supplierService.getProfile();
      if (data.supplier) {
        dispatch(setSupplierProfile(data.supplier));
      }
      setCurrentStep(1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate reapply');
    } finally {
      setLoading(false);
    }
  };

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
    if (!panDocument && !panDocumentUrl) newErrs.panDocument = "PAN card document upload is required";
    if (gstin.trim() && !gstinDocument && !gstinDocumentUrl) newErrs.gstinDocument = "GSTIN certificate is required when GSTIN is provided";
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateProfileInfo = () => {
    const newErrs: Record<string, string> = {};
    const currentYear = new Date().getFullYear();
    if (!yearOfEstablishment.trim()) {
      newErrs.yearOfEstablishment = "Year of establishment is required";
    } else {
      const year = parseInt(yearOfEstablishment);
      if (isNaN(year) || year < 1900 || year > currentYear) newErrs.yearOfEstablishment = `Enter a valid year between 1900 and ${currentYear}`;
    }
    if (isFoodSupplier) {
      if (!fssaiLicenseNumber.trim() || fssaiLicenseNumber.length !== 14) newErrs.fssaiLicenseNumber = "FSSAI License Number must be exactly 14 digits";
      if (!fssaiCertificate && !fssaiCertificateUrl) newErrs.fssaiCertificate = "FSSAI Certificate is required for food products";
    }
    if (!returnPolicyType) newErrs.returnPolicyType = "Please select a return & refund policy";
    if (returnPolicyType === 'custom' && !returnPolicyCustomTerms.trim()) newErrs.returnPolicyCustomTerms = "Please describe your custom return terms";
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

  // ── Indian bank field validation helpers ───────────────────────────────────
  const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const NAME_RE = /^[a-zA-Z\s.'-]{2,100}$/;

  const bankFieldError = {
    accountHolderName: (v: string) => {
      if (!v.trim()) return 'Account holder name is required';
      if (v.trim().length < 3) return 'Minimum 3 characters required';
      if (!NAME_RE.test(v)) return 'Only letters, spaces and . \' - are allowed';
      return '';
    },
    accountNumber: (v: string) => {
      if (!v.trim()) return 'Account number is required';
      if (!/^\d+$/.test(v)) return 'Only digits allowed (no spaces or letters)';
      if (v.length < 9) return `Too short — must be 9–18 digits (${v.length}/18)`;
      if (v.length > 18) return 'Too long — max 18 digits';
      return '';
    },
    ifscCode: (v: string) => {
      if (!v.trim()) return 'IFSC code is required';
      if (v.length < 11) return `IFSC must be 11 characters — e.g. SBIN0001234 (${v.length}/11)`;
      if (!IFSC_RE.test(v)) return 'Invalid format. Must be: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)';
      return '';
    },
    bankName: (v: string) => {
      if (!v.trim()) return 'Bank name is required';
      if (v.trim().length < 3) return 'Minimum 3 characters required';
      return '';
    },
  };

  const validateBankDetails = () => {
    const newErrs: Record<string, string> = {};
    const e1 = bankFieldError.accountHolderName(accountHolderName); if (e1) newErrs.accountHolderName = e1;
    const e2 = bankFieldError.accountNumber(accountNumber); if (e2) newErrs.accountNumber = e2;
    const e3 = bankFieldError.ifscCode(ifscCode); if (e3) newErrs.ifscCode = e3;
    const e4 = bankFieldError.bankName(bankName); if (e4) newErrs.bankName = e4;
    if (!confirmAccountNumber.trim()) {
      newErrs.confirmAccountNumber = 'Please confirm your account number';
    } else if (confirmAccountNumber !== accountNumber) {
      newErrs.confirmAccountNumber = 'Account numbers do not match';
    }
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateBusinessScale = () => {
    const newErrs: Record<string, string> = {};
    if (!annualTurnover.trim()) newErrs.annualTurnover = "Annual turnover is required";
    else if (isNaN(parseInt(annualTurnover)) || parseInt(annualTurnover) <= 0) newErrs.annualTurnover = "Enter a valid positive number";

    if (!monthlyProductionCapacity.trim()) newErrs.monthlyProductionCapacity = "Monthly production capacity is required";
    else if (isNaN(parseInt(monthlyProductionCapacity)) || parseInt(monthlyProductionCapacity) <= 0) newErrs.monthlyProductionCapacity = "Enter a valid positive number";

    if (!taxFilingMethod.trim()) newErrs.taxFilingMethod = "Tax filing method is required";

    if (!taxPaymentsCompliance.trim()) newErrs.taxPaymentsCompliance = "Tax compliance information is required";

    if (!taxFilingDetails && !taxFilingDetailsUrl) newErrs.taxFilingDetails = "Tax filing document is required";

    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
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
        let finalPanDocUrl = panDocumentUrl;
        if (panDocument) {
          const uploadRes = await supplierService.uploadDoc(panDocument);
          finalPanDocUrl = uploadRes.url;
          setPanDocumentUrl(finalPanDocUrl);
          setPanDocument(null);
        }
        let finalGstinDocUrl = gstinDocumentUrl;
        if (gstinDocument) {
          const uploadRes = await supplierService.uploadDoc(gstinDocument);
          finalGstinDocUrl = uploadRes.url;
          setGstinDocumentUrl(finalGstinDocUrl);
          setGstinDocument(null);
        }
        await supplierService.saveDraft({ ownerName, email, address, pinCode, state, city, gstin, pan, panDocument: finalPanDocUrl, gstinDocument: finalGstinDocUrl });
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
        await supplierService.saveDraft({ ownerName, email, address, pinCode, state, city, gstin, pan, panDocument: panDocumentUrl, gstinDocument: gstinDocumentUrl, about, yearOfEstablishment, isFoodSupplier, fssaiLicenseNumber, fssaiCertificate: finalCertUrl, isWomenEntrepreneur, returnPolicyType, returnPolicyCustomTerms });
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!validateBusinessScale()) return;
        let finalTaxDocUrl = taxFilingDetailsUrl;
        if (taxFilingDetails) {
          const uploadRes = await supplierService.uploadDoc(taxFilingDetails);
          finalTaxDocUrl = uploadRes.url;
          setTaxFilingDetailsUrl(finalTaxDocUrl);
          setTaxFilingDetails(null);
        }
        await supplierService.saveDraft({
          ownerName, email, address, pinCode, state, city, gstin, pan, panDocument: panDocumentUrl, gstinDocument: gstinDocumentUrl,
          about, yearOfEstablishment, isFoodSupplier, fssaiLicenseNumber,
          fssaiCertificate: fssaiCertificateUrl, isWomenEntrepreneur, returnPolicyType, returnPolicyCustomTerms,
          annualTurnover: parseInt(annualTurnover),
          monthlyProductionCapacity: parseInt(monthlyProductionCapacity),
          taxFilingMethod, taxFilingDetails: finalTaxDocUrl, taxPaymentsCompliance
        });
        setCurrentStep(5);
      } else if (currentStep === 5) {
        if (!validateBankDetails()) return;
        await supplierService.addBank({ accountHolderName, accountNumber, ifscCode, bankName });
        setCurrentStep(6);
      } else if (currentStep === 6) {
        if (!validateProfileCompletion()) return;
        const tierData = await supplierService.selectTier(selectedTier);
        dispatch(setSupplierProfile(tierData.supplier));
        const kycData = await supplierService.submitKYC({
          ownerName, email, address, pinCode, state, city, gstin, pan, panDocument: panDocumentUrl, gstinDocument: gstinDocumentUrl,
          about, yearOfEstablishment, isFoodSupplier, fssaiLicenseNumber,
          fssaiCertificate: fssaiCertificateUrl, isWomenEntrepreneur, returnPolicyType, returnPolicyCustomTerms,
          annualTurnover: parseInt(annualTurnover),
          monthlyProductionCapacity: parseInt(monthlyProductionCapacity),
          taxFilingMethod, taxFilingDetails: taxFilingDetailsUrl, taxPaymentsCompliance,
          commissionRate: commissionRate ? parseFloat(commissionRate) : undefined
        });
        dispatch(setSupplierProfile(kycData.supplier));
        if (user?.role === 'reseller') { navigate(ROUTES.RESELLER_DASHBOARD); return; }
        setCurrentStep(7);
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

              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locating}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] cursor-pointer hover:bg-[#ffedd5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                  {locating ? 'Detecting...' : 'Locate Me'}
                </button>
              </div>
              {locateError && <p className="text-xs text-[#dc2626] -mt-2">{locateError}</p>}

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

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>PAN Number <span className="text-[#dc2626]">*</span></label>
                <input name="pan" className={inputCls(!!errors.pan)} value={pan}
                  onChange={e => { setPan(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, pan: '' })); }}
                  placeholder="ABCDE1234F" maxLength={10} />
                {errors.pan && <span className={errorTextCls}>{errors.pan}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>PAN Card Document <span className="text-[#dc2626]">*</span></label>
                <input type="file" ref={panDocRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { setPanDocument(e.target.files?.[0] || null); setErrors(prev => ({ ...prev, panDocument: '' })); }} />
                <div className="flex items-center gap-3 flex-wrap">
                  <button type="button" onClick={() => panDocRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-semibold text-[#475569] cursor-pointer hover:border-primary hover:text-primary transition-colors">
                    <Upload size={16} /> {panDocument || panDocumentUrl ? 'Change File' : 'Upload PAN Document'}
                  </button>
                  {panDocument ? (
                    <span className="text-sm text-[#059669] font-semibold">✓ {panDocument.name}</span>
                  ) : panDocumentUrl ? (
                    <a href={panDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#059669] font-semibold hover:underline">✓ View uploaded doc</a>
                  ) : (
                    <span className="text-xs text-[#94a3b8]">PDF, JPG or PNG</span>
                  )}
                </div>
                {errors.panDocument && <span className={errorTextCls}>{errors.panDocument}</span>}
              </div>

              {gstin.trim() && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>GSTIN Certificate <span className="text-[#dc2626]">*</span></label>
                  <input type="file" ref={gstinDocRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => { setGstinDocument(e.target.files?.[0] || null); setErrors(prev => ({ ...prev, gstinDocument: '' })); }} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={() => gstinDocRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-semibold text-[#475569] cursor-pointer hover:border-primary hover:text-primary transition-colors">
                      <Upload size={16} /> {gstinDocument || gstinDocumentUrl ? 'Change File' : 'Upload GSTIN Certificate'}
                    </button>
                    {gstinDocument ? (
                      <span className="text-sm text-[#059669] font-semibold">✓ {gstinDocument.name}</span>
                    ) : gstinDocumentUrl ? (
                      <a href={gstinDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#059669] font-semibold hover:underline">✓ View uploaded doc</a>
                    ) : (
                      <span className="text-xs text-[#94a3b8]">PDF, JPG or PNG</span>
                    )}
                  </div>
                  {errors.gstinDocument && <span className={errorTextCls}>{errors.gstinDocument}</span>}
                </div>
              )}

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
                    <input type="file" ref={fssaiFileRef} accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const file = e.target.files?.[0]; if (file) { setFssaiCertificate(file); setErrors(prev => ({ ...prev, fssaiCertificate: '' })); } }} className="hidden" />
                    <div className="flex items-center gap-3 flex-wrap">
                      <button type="button" onClick={() => fssaiFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-semibold text-[#475569] cursor-pointer hover:border-primary hover:text-primary transition-colors">
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
                <label className={labelCls}>Year of Establishment <span className="text-[#dc2626]">*</span></label>
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
                  <p className="text-xs text-[#c2410c] ml-6 m-0">Women-led businesses receive priority onboarding support.</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Dispute Resolution Policy <span className="text-[#dc2626]">*</span></label>
                <p className="text-xs text-[#64748b] -mt-1 mb-1">If a buyer reports a genuine issue (verified by AMJSTAR), how will you make it right? This is shown to buyers on your listings.</p>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'refund', label: 'Refund', desc: 'You return the buyer’s money for verified issues' },
                    { value: 'replacement', label: 'Replacement', desc: 'You send a replacement item — no money returned' },
                    { value: 'both', label: 'Both (Refund or Replacement)', desc: 'You offer either, decided per case' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-[8px] cursor-pointer transition-colors ${returnPolicyType === opt.value ? 'border-primary bg-[#fff7ed]' : 'border-[#e2e8f0] hover:border-primary/50'}`}
                    >
                      <input
                        type="radio"
                        name="returnPolicyType"
                        value={opt.value}
                        checked={returnPolicyType === opt.value}
                        onChange={() => { setReturnPolicyType(opt.value); setErrors(prev => ({ ...prev, returnPolicyType: '' })); }}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1e293b] m-0">{opt.label}</p>
                        <p className="text-xs text-[#64748b] m-0">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.returnPolicyType && <span className={errorTextCls}>{errors.returnPolicyType}</span>}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setCurrentStep(2)} className={outlineBtnCls}>Back</button>
                <button onClick={submitStep} disabled={loading} className={orangeBtnCls}>
                  {loading ? 'Saving...' : 'Next: Business Scale'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="w-full max-w-[580px] mx-auto px-4">
            <div className="flex flex-col gap-5">
              <StepHeader icon={<Building2 size={24} />} title="Business Scale & Tax Compliance" desc="Tell us about your production capacity and tax compliance details." />

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Annual Turnover (₹) <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <Building2 size={18} className="absolute left-3 text-[#94a3b8] pointer-events-none" />
                  <input name="annualTurnover" type="number" className={`${inputCls(!!errors.annualTurnover)} pl-10`} value={annualTurnover}
                    onChange={e => { setAnnualTurnover(e.target.value); setErrors(prev => ({ ...prev, annualTurnover: '' })); }}
                    placeholder="e.g. 1000000" min="0" />
                </div>
                {errors.annualTurnover && <span className={errorTextCls}>{errors.annualTurnover}</span>}
                <p className="text-xs text-[#64748b] mt-1 m-0">Format: Plain number (e.g. 1000000 for ₹10 lakhs)</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Monthly Production Capacity (Units) <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <Package size={18} className="absolute left-3 text-[#94a3b8] pointer-events-none" />
                  <input name="monthlyProductionCapacity" type="number" className={`${inputCls(!!errors.monthlyProductionCapacity)} pl-10`} value={monthlyProductionCapacity}
                    onChange={e => { setMonthlyProductionCapacity(e.target.value); setErrors(prev => ({ ...prev, monthlyProductionCapacity: '' })); }}
                    placeholder="e.g. 5000" min="0" />
                </div>
                {errors.monthlyProductionCapacity && <span className={errorTextCls}>{errors.monthlyProductionCapacity}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Tax Filing Method <span className="text-[#dc2626]">*</span></label>
                <select name="taxFilingMethod" className={inputCls(!!errors.taxFilingMethod)} value={taxFilingMethod}
                  onChange={e => { setTaxFilingMethod(e.target.value); setErrors(prev => ({ ...prev, taxFilingMethod: '' })); }}>
                  <option value="">Select Tax Filing Method</option>
                  <option value="ITR - Individual">ITR - Individual</option>
                  <option value="ITR - Business/Professional">ITR - Business/Professional</option>
                  <option value="Corporate Tax">Corporate Tax</option>
                  <option value="Quarterly GST">Quarterly GST</option>
                  <option value="Monthly GST">Monthly GST</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
                {errors.taxFilingMethod && <span className={errorTextCls}>{errors.taxFilingMethod}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Tax Compliance Status <span className="text-[#dc2626]">*</span></label>
                <textarea name="taxPaymentsCompliance" className={inputCls(!!errors.taxPaymentsCompliance)} value={taxPaymentsCompliance}
                  onChange={e => { setTaxPaymentsCompliance(e.target.value); setErrors(prev => ({ ...prev, taxPaymentsCompliance: '' })); }}
                  placeholder="e.g. All taxes up to date, filed annually, no pending liabilities" rows={3} />
                {errors.taxPaymentsCompliance && <span className={errorTextCls}>{errors.taxPaymentsCompliance}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Tax Filing Document <span className="text-[#dc2626]">*</span></label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={taxFileRef} className="hidden" onChange={e => { setTaxFilingDetails(e.target.files?.[0] || null); setErrors(prev => ({ ...prev, taxFilingDetails: '' })); }} accept=".pdf,.jpg,.jpeg,.png" />
                  <button type="button" onClick={() => taxFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-[#e2e8f0] bg-white text-[#475569] rounded-[8px] font-semibold text-sm hover:bg-[#f8fafc] cursor-pointer">
                    <Upload size={16} /> {taxFilingDetails ? taxFilingDetails.name : 'Upload Document'}
                  </button>
                  {taxFilingDetailsUrl && <span className="text-xs text-[#059669] font-semibold">✓ Document uploaded</span>}
                </div>
                {errors.taxFilingDetails && <span className={errorTextCls}>{errors.taxFilingDetails}</span>}
                <p className="text-xs text-[#64748b] m-0">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setCurrentStep(3)} className={outlineBtnCls}>Back</button>
                <button onClick={submitStep} disabled={loading} className={orangeBtnCls}>
                  {loading ? 'Saving...' : 'Next: Select Plan'} <ArrowRight size={18} />
                </button>
              </div>
              <SecureNote />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="w-full max-w-[580px] mx-auto px-4">
            <div className="flex flex-col gap-5">
              <StepHeader icon={<Landmark size={24} />} title="Bank Account Details" desc="Add your bank account for withdrawal of commissions." />

              {/* Account Holder Name */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Account Holder Name <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <User size={18} className="absolute left-3 text-[#94a3b8] pointer-events-none" />
                  <input
                    name="accountHolderName"
                    className={`${inputCls(!!errors.accountHolderName)} pl-10 pr-9`}
                    value={accountHolderName}
                    onChange={e => {
                      const val = e.target.value.replace(/^[\s]/, '');
                      setAccountHolderName(val.replace(/\b\w/g, l => l.toUpperCase()));
                      setErrors(prev => ({ ...prev, accountHolderName: bankFieldError.accountHolderName(val) }));
                    }}
                    onBlur={() => setErrors(prev => ({ ...prev, accountHolderName: bankFieldError.accountHolderName(accountHolderName) }))}
                    placeholder="e.g. Rajesh Kumar"
                  />
                  {accountHolderName && !bankFieldError.accountHolderName(accountHolderName) && (
                    <Check size={16} className="absolute right-3 text-[#059669] pointer-events-none" />
                  )}
                </div>
                {errors.accountHolderName
                  ? <span className={errorTextCls}>⚠ {errors.accountHolderName}</span>
                  : <span className="text-xs text-[#94a3b8]">Full name as per bank records (letters only)</span>
                }
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Account Number <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <input
                    name="accountNumber"
                    className={`${inputCls(!!errors.accountNumber)} pr-9`}
                    value={accountNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 18) {
                        setAccountNumber(val);
                        setErrors(prev => ({ ...prev, accountNumber: bankFieldError.accountNumber(val) }));
                      }
                    }}
                    onBlur={() => setErrors(prev => ({ ...prev, accountNumber: bankFieldError.accountNumber(accountNumber) }))}
                    placeholder="9 to 18 digits"
                    maxLength={18}
                    inputMode="numeric"
                  />
                  {accountNumber && !bankFieldError.accountNumber(accountNumber) && (
                    <Check size={16} className="absolute right-3 text-[#059669] pointer-events-none" />
                  )}
                </div>
                {errors.accountNumber
                  ? <span className={errorTextCls}>⚠ {errors.accountNumber}</span>
                  : <span className="text-xs text-[#94a3b8]">9–18 digit account number (digits only, no spaces)</span>
                }
              </div>

              {/* Confirm Account Number */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Confirm Account Number <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <input
                    name="confirmAccountNumber"
                    className={`${inputCls(!!errors.confirmAccountNumber)} pr-9`}
                    value={confirmAccountNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setConfirmAccountNumber(val);
                      setErrors(prev => ({
                        ...prev,
                        confirmAccountNumber: val !== accountNumber ? 'Account numbers do not match' : '',
                      }));
                    }}
                    onBlur={() => {
                      setErrors(prev => ({ ...prev, confirmAccountNumber: confirmAccountNumber !== accountNumber ? 'Account numbers do not match' : '' }));
                    }}
                    placeholder="Re-enter account number"
                    maxLength={18}
                    inputMode="numeric"
                  />
                  {confirmAccountNumber && confirmAccountNumber === accountNumber && (
                    <Check size={16} className="absolute right-3 text-[#059669] pointer-events-none" />
                  )}
                </div>
                {errors.confirmAccountNumber
                  ? <span className={errorTextCls}>⚠ {errors.confirmAccountNumber}</span>
                  : <span className="text-xs text-[#94a3b8]">Re-enter to confirm</span>
                }
              </div>

              {/* IFSC Code */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>IFSC Code <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <input
                    name="ifscCode"
                    className={`${inputCls(!!(errors.ifscCode || ifscApiError))} uppercase font-mono pr-9`}
                    value={ifscCode}
                    onChange={e => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (val.length <= 11) {
                        setIfscCode(val);
                        setErrors(prev => ({ ...prev, ifscCode: bankFieldError.ifscCode(val) }));
                      }
                    }}
                    onBlur={() => setErrors(prev => ({ ...prev, ifscCode: bankFieldError.ifscCode(ifscCode) }))}
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                  />
                  {ifscVerifying && (
                    <svg className="absolute right-3 animate-spin h-4 w-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {!ifscVerifying && ifscBankInfo && !errors.ifscCode && (
                    <Check size={16} className="absolute right-3 text-[#059669] pointer-events-none" />
                  )}
                </div>
                {errors.ifscCode
                  ? <span className={errorTextCls}>⚠ {errors.ifscCode}</span>
                  : ifscApiError
                    ? <span className={errorTextCls}>⚠ {ifscApiError}</span>
                    : ifscBankInfo
                      ? (
                        <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#f0fdf4] border border-[#86efac] rounded-[8px]">
                          <Check size={13} className="text-[#16a34a] shrink-0" />
                          <span className="text-xs text-[#15803d] font-semibold">{ifscBankInfo.bank} — {ifscBankInfo.branch}{ifscBankInfo.city ? `, ${ifscBankInfo.city}` : ''}</span>
                        </div>
                      )
                      : <span className="text-xs text-[#94a3b8]">11 chars: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234) — {ifscCode.length}/11</span>
                }
              </div>

              {/* Bank Name */}
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Bank Name <span className="text-[#dc2626]">*</span></label>
                <div className="relative flex items-center">
                  <Landmark size={18} className="absolute left-3 text-[#94a3b8] pointer-events-none" />
                  <input
                    name="bankName"
                    className={`${inputCls(!!errors.bankName)} pl-10 pr-9`}
                    value={bankName}
                    onChange={e => {
                      const val = e.target.value.replace(/\b\w/g, l => l.toUpperCase());
                      setBankName(val);
                      setErrors(prev => ({ ...prev, bankName: bankFieldError.bankName(val) }));
                    }}
                    onBlur={() => setErrors(prev => ({ ...prev, bankName: bankFieldError.bankName(bankName) }))}
                    placeholder="e.g. State Bank of India"
                  />
                  {bankName && !bankFieldError.bankName(bankName) && (
                    <Check size={16} className="absolute right-3 text-[#059669] pointer-events-none" />
                  )}
                </div>
                {errors.bankName
                  ? <span className={errorTextCls}>⚠ {errors.bankName}</span>
                  : <span className="text-xs text-[#94a3b8]">Full official bank name (e.g. HDFC Bank, Kotak Mahindra Bank)</span>
                }
              </div>

              <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] p-3.5 text-xs text-[#7c2d12]">
                <strong>Note:</strong> This becomes your primary bank account. You can add more banks later in <strong>Settings → Bank Accounts</strong>.
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setCurrentStep(4)} className={outlineBtnCls}>Back</button>
                <button
                  onClick={submitStep}
                  disabled={
                    loading ||
                    !!bankFieldError.accountHolderName(accountHolderName) ||
                    !!bankFieldError.accountNumber(accountNumber) ||
                    !!bankFieldError.ifscCode(ifscCode) ||
                    !!bankFieldError.bankName(bankName) ||
                    !confirmAccountNumber ||
                    confirmAccountNumber !== accountNumber
                  }
                  className={orangeBtnCls}
                >
                  {loading ? 'Saving...' : 'Save & Continue'} <ArrowRight size={18} />
                </button>
              </div>
              <SecureNote />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="w-full max-w-[580px] mx-auto px-4">
            <div className="flex flex-col gap-5">
              <StepHeader icon={<Check size={24} />} title="Select Subscription Plan" desc="Choose a plan that fits your business needs." />
              <p className="text-xs text-[#64748b] -mt-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3">
                Pick the plan you want. You'll be prompted to pay and activate it from your dashboard <strong>after AMJSTAR verifies your account</strong>.
              </p>
              <div className="flex flex-col gap-3">
                {PLAN_LIST.map(plan => (
                  <div
                    key={plan.id}
                    className={`flex items-center gap-4 p-5 border-2 rounded-[12px] cursor-pointer transition-all ${selectedTier === plan.id ? 'border-primary bg-[#fff7ed]' : 'border-[#e2e8f0] hover:border-primary hover:bg-[#fafafa]'}`}
                    onClick={() => setSelectedTier(plan.id)}
                  >
                    <div className="flex-1 flex flex-col gap-2">
                      <div>
                        <h3 className="text-base font-bold text-[#0f172a] m-0">{plan.name}</h3>
                        <p className="text-sm text-[#64748b] m-0">{plan.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.features.map((f, i) => (
                          <span key={i} className="text-xs bg-white border border-[#e2e8f0] text-[#475569] px-2.5 py-1 rounded-full font-semibold">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-extrabold text-[#0f172a]">{formatINR(plan.price)}</span>
                        <span className="text-sm font-semibold text-[#64748b] mb-0.5">/year + GST</span>
                      </div>
                      {selectedTier === plan.id && (
                        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center"><Check size={14} /></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className={labelCls}>Suggested Commission Rate (%) <span className="text-xs text-[#94a3b8] font-normal normal-case">(per mature deal)</span></label>
                <div className="relative flex items-center">
                  <input
                    name="commissionRate"
                    type="number"
                    step="0.1"
                    min="0"
                    className={`${inputCls(false)} pr-9`}
                    value={commissionRate}
                    onChange={e => setCommissionRate(e.target.value)}
                    placeholder="e.g. 1.5"
                  />
                  {commissionRate && (
                    <span className="absolute right-3 text-[#94a3b8] pointer-events-none">%</span>
                  )}
                </div>
                {commissionRate && parseFloat(commissionRate) > 0 && parseFloat(commissionRate) <= 2 && (
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-[8px] p-3 text-xs text-[#059669] mt-1 font-semibold leading-relaxed">
                    Offering a competitive commission (e.g., 2%+) significantly boosts your product ranking and visibility across the AMJSTAR platform!
                  </div>
                )}
                {commissionRate && parseFloat(commissionRate) > 2 && (
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-[8px] p-3 text-xs text-[#059669] mt-1 font-semibold leading-relaxed">
                    Excellent! This highly competitive commission rate will maximize your product ranking and visibility across the AMJSTAR platform!
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setCurrentStep(5)} className={outlineBtnCls}>Back</button>
                <button
                  onClick={submitStep}
                  disabled={loading || !commissionRate || isNaN(parseFloat(commissionRate)) || parseFloat(commissionRate) <= 0}
                  className={orangeBtnCls}
                >
                  {loading ? 'Submitting...' : 'Complete Onboarding'} <Check size={18} />
                </button>
              </div>
            </div>
          </div>
        );

      case 7: {
        const isRejected = profile?.kycStatus === 'REJECTED';
        return (
          <>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#ecfdf5] text-[#059669]'}`}>
              {isRejected ? <XCircle size={48} /> : <ShieldCheck size={48} />}
            </div>
            <h1 className="text-2.5xl font-extrabold text-[#0f172a] text-center m-0 mb-4">
              {isRejected ? 'Application Rejected' : 'Application Submitted!'}
            </h1>

            {!isRejected ? (
              <p className="text-center text-[#475569] text-base max-w-[480px] mx-auto leading-relaxed">
                Your application is now under review. As part of our high-trust B2B process,
                <strong> you will receive a verification call within 24 hours </strong>
                to confirm your details.
              </p>
            ) : (
              <div className="w-full bg-[#fef2f2] border border-[#fecaca] rounded-[10px] p-5 text-sm text-[#b91c1c] my-4 text-left">
                <p className="font-bold m-0 mb-2 text-xs uppercase tracking-wider text-[#991b1b]">Reason for Rejection:</p>
                <p className="m-0 text-base font-semibold leading-relaxed">{profile?.rejectionReason || 'Your application did not meet our initial requirements.'}</p>
              </div>
            )}

            <div className={`w-full rounded-[10px] p-5 text-center my-4 ${isRejected ? 'bg-[#fef2f2] border border-[#fecaca]' : 'bg-[#f8fafc] border border-[#e2e8f0]'}`}>
              <p className="m-0 font-semibold text-base text-[#1e293b]">Status: <strong className={isRejected ? 'text-[#b91c1c]' : 'text-[#059669]'}>{profile?.kycStatus || 'PENDING'}</strong></p>
              {!isRejected && <p className="text-sm text-[#64748b] m-0 mt-1">Next step: Formal Cold Call (within 24h)</p>}
            </div>

            {!isRejected && (selectedTier === SupplierTier.GAMMA || selectedTier === SupplierTier.BETA) && (
              <div className="w-full bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] p-5 my-4 text-left">
                <div className="flex items-center gap-2 mb-2 text-[#1d4ed8]">
                  <ShieldCheck size={18} />
                  <p className="font-bold m-0 text-sm">Physical Verification (part of your SME TrustSEAL plan)</p>
                </div>
                <p className="text-sm text-[#334155] m-0 mb-2 leading-relaxed">
                  An AMJSTAR technical expert will <strong>schedule a call and visit your premises</strong> to verify your
                  business — location &amp; documents, the products/services you offer, your manufacturing/service process,
                  and quality standards.
                </p>
                <p className="text-xs text-[#475569] m-0 leading-relaxed">
                  Verification runs <strong>once a year</strong> (or on request). Please be ready to arrange
                  <strong> travel &amp; stay for up to 2 people</strong> if the visit requires it.
                </p>
              </div>
            )}

            {isRejected && (
              <div className="w-full text-center flex flex-col gap-3 my-4 text-sm text-[#475569]">
                <p className="m-0">Need help? Contact our support team:</p>
                <p className="m-0 text-base"><strong>Phone: +91 9034440682</strong></p>
                <p className="m-0 text-xs text-[#94a3b8]">Or update your details and try again.</p>
                <Button onClick={handleReapply} className="w-full mt-2" variant="outline">Update &amp; Reapply</Button>
              </div>
            )}

            {!isRejected && (
              <div className="w-full flex items-center gap-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] p-4 my-4 text-left">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0"><Handshake size={22} /></div>
                <div className="flex flex-col gap-1 text-sm text-[#475569]">
                  <p className="font-bold m-0">Woman Entrepreneur?</p>
                  <p className="m-0">We would love to connect and discuss growth with you!</p>
                </div>
              </div>
            )}

            <Button onClick={() => navigate('/')} className="w-full mt-4" size="lg">Go to Homepage</Button>
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
    { n: 4, label: 'Business Scale', desc: 'Turnover & Tax' },
    { n: 5, label: 'Bank Details', desc: 'Payment Account' },
    { n: 6, label: 'Plans', desc: 'Selling Tiers' },
    { n: 7, label: 'Complete', desc: 'Submission' }
  ];

  if (currentStep === 7) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] py-10 px-4">
        <div className="bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-10 max-w-[600px] w-full flex flex-col items-center text-center">
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
