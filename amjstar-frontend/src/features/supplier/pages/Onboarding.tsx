import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import {
  SupplierTier,
  OnboardingStatus,
  setSupplierProfile
} from '@/store/slices/supplier.slice';
import { ROUTES } from '@/shared/constants/routes';
import supplierService from '../services/supplier.service';
import SupplierOnboardingLayout from '../layout/SupplierOnboardingLayout';
import Button from '@/shared/components/ui/Button';
import { Check, ShieldCheck, User, Building2, Mail, Phone, ArrowRight, Star, Handshake, XCircle, Upload } from 'lucide-react';
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // Scroll to top of the form container or window on step change
    const scrollContainer = document.getElementById('supplier-form-scroll-area');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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
  const [pan, setPan] = useState('');

  const [about, setAbout] = useState('');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('');
  const [selectedTier, setSelectedTier] = useState<SupplierTier>(SupplierTier.FREE);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Phone Change/OTP states
  const [isPhoneVerified] = useState(true);
  const [isPhoneEditable, setIsPhoneEditable] = useState(false);
  const [isFoodSupplier, setIsFoodSupplier] = useState(false);
  const [fssaiLicenseNumber, setFssaiLicenseNumber] = useState('');
  const [fssaiCertificate, setFssaiCertificate] = useState<File | null>(null);
  const [fssaiCertificateUrl, setFssaiCertificateUrl] = useState('');

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
            const destination = user?.role === 'reseller' ? '/reseller/dashboard' : '/supplier/dashboard';
            navigate(destination);
            return;
          }

          if (data.supplier.businessName) setBusinessName(data.supplier.businessName);
          if (data.supplier.phone) setPhone(data.supplier.phone);
          if (data.supplier.tier) setSelectedTier(data.supplier.tier);

          // Fallback to user account details if business-specific ones aren't set yet
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
          }

          if (data.supplier.onboardingStatus === OnboardingStatus.COMPLETED) {
            setCurrentStep(5);
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

  const handleReapply = () => {
    setCurrentStep(1);
    // When reapplying, we want to allow editing, so we might need to reset some states
    // but the existing values will be there from the 'profile' selector.
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

    if (!pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      newErrs.pan = "Valid 10-digit PAN is required";
    }

    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const validateProfileInfo = () => {
    const newErrs: Record<string, string> = {};

    if (isFoodSupplier) {
      if (!fssaiLicenseNumber.trim() || fssaiLicenseNumber.length !== 14) {
        newErrs.fssaiLicenseNumber = "FSSAI License Number must be 14 digits";
      }
      if (!fssaiCertificate && !fssaiCertificateUrl) {
        newErrs.fssaiCertificate = "FSSAI Certificate is required for food suppliers";
      }
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
      console.error("Validation failed at final step:", newErrs);
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
        // Save draft to server
        await supplierService.saveDraft({
          ownerName, email, address, pinCode, state, city, gstin, pan
        });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (!validateProfileInfo()) return;

        let finalCertUrl = fssaiCertificateUrl;
        if (fssaiCertificate) {
          const uploadRes = await supplierService.uploadDoc(fssaiCertificate);
          finalCertUrl = uploadRes.url;
          setFssaiCertificateUrl(finalCertUrl);
          setFssaiCertificate(null); // Clear local file after successful upload
        }

        // Save profile draft
        await supplierService.saveDraft({
          ownerName, email, address, pinCode, state, city, gstin, pan, about, yearOfEstablishment,
          isFoodSupplier, fssaiLicenseNumber, fssaiCertificate: finalCertUrl
        });
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!validateProfileCompletion()) return;
        const tierData = await supplierService.selectTier(selectedTier);
        dispatch(setSupplierProfile(tierData.supplier));

        const kycData = await supplierService.submitKYC({
          ownerName, email, address, pinCode, state, city, gstin, pan, about, yearOfEstablishment,
          isFoodSupplier, fssaiLicenseNumber, fssaiCertificate: fssaiCertificateUrl
        });
        dispatch(setSupplierProfile(kycData.supplier));

        if (user?.role === 'reseller') {
          navigate(ROUTES.RESELLER_DASHBOARD);
          return;
        }

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
              <div className={styles.headerRow}>
                <div className={styles.headerIconWrapper}>
                  <User size={24} className={styles.headerIcon} />
                </div>
                <div>
                  <h1>Basic Information</h1>
                  <p>Tell us who you are so we can set up your supplier account.</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Owner / Representative Name <span className={styles.required}>*</span></label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={18} />
                  <input
                    name="ownerName"
                    className={`${styles.input} ${styles.inputWithIcon} ${errors.ownerName ? styles.inputError : ''}`}
                    value={ownerName}
                    onChange={handleCapitalizeChange(setOwnerName)}
                    placeholder="e.g. John Smith"
                  />
                </div>
                {errors.ownerName && <span className={styles.errorText}>{errors.ownerName}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Company / Business Name <span className={styles.required}>*</span></label>
                <div className={styles.inputWrapper}>
                  <Building2 className={styles.inputIcon} size={18} />
                  <input
                    name="businessName"
                    className={`${styles.input} ${styles.inputWithIcon} ${errors.businessName ? styles.inputError : ''}`}
                    value={businessName}
                    onChange={handleCapitalizeChange(setBusinessName)}
                    placeholder="e.g. AMJ Textiles Pvt Ltd"
                  />
                </div>
                {errors.businessName && <span className={styles.errorText}>{errors.businessName}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Email Address <span className={styles.required}>*</span></label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={18} />
                  <input
                    name="email"
                    type="email"
                    className={`${styles.input} ${styles.inputWithIcon} ${errors.email ? styles.inputError : ''}`}
                    value={email}
                    onChange={handleChange(setEmail)}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelWithAction}>
                  <label>Contact Phone <span className={styles.required}>*</span></label>
                  {!isPhoneEditable && (
                    <button
                      type="button"
                      className={styles.textActionBtn}
                      onClick={() => setIsPhoneEditable(true)}
                    >
                      Change
                    </button>
                  )}
                </div>
                <div className={`${styles.phoneGroup} ${errors.phone ? styles.inputError : ''} ${!isPhoneEditable ? styles.inputDisabled : ''}`}>
                  <div className={styles.countryCodeWrapper}>
                    <Phone className={styles.inputIcon} size={18} />
                    <select
                      className={`${styles.input} ${styles.countryCode}`}
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={!isPhoneEditable}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    className={`${styles.input} ${styles.phoneInput}`}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    disabled={!isPhoneEditable}
                    maxLength={15}
                    placeholder="9090909090"
                  />
                </div>
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>

              <div className={styles.buttonGroup}>
                <button onClick={submitStep} disabled={loading} className={styles.orangeBtn}>
                  {loading ? 'Saving...' : 'Save & Continue'} <ArrowRight size={18} />
                </button>
              </div>

              <div className={styles.secureText}>
                <ShieldCheck size={14} className={styles.secureIcon} />
                Your information is secure and will only be used to set up your account.
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.formContainer}>
            <div className={styles.stepContent}>
              <div className={styles.headerRow}>
                <div className={styles.headerIconWrapper}>
                  <Building2 size={24} className={styles.headerIcon} />
                </div>
                <div>
                  <h1>Business Details</h1>
                  <p>Where is your business registered?</p>
                </div>
              </div>

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

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>PAN Number <span className={styles.required}>*</span></label>
                  <input
                    name="pan"
                    className={`${styles.input} ${errors.pan ? styles.inputError : ''}`}
                    value={pan}
                    onChange={(e) => {
                      setPan(e.target.value.toUpperCase());
                      setErrors(prev => ({ ...prev, pan: '' }));
                    }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                  {errors.pan && <span className={styles.errorText}>{errors.pan}</span>}
                </div>
                <div className={styles.formGroup}>
                  {/* Empty space for grid alignment */}
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button onClick={() => setCurrentStep(1)} className={styles.outlineBtn}>Back</button>
                <button onClick={submitStep} disabled={loading} className={styles.orangeBtn}>
                  {loading ? 'Saving...' : 'Save & Continue'} <ArrowRight size={18} />
                </button>
              </div>
              <div className={styles.secureText}>
                <ShieldCheck size={14} className={styles.secureIcon} />
                Your information is secure and will only be used to set up your account.
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.formContainer}>
            <div className={styles.stepContent}>
              <div className={styles.headerRow}>
                <div className={styles.headerIconWrapper}>
                  <User size={24} className={styles.headerIcon} />
                </div>
                <div>
                  <h1>Business Profile</h1>
                  <p>Add some flair to your profile to attract more buyers.</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>About Company (Optional)</label>
                <textarea
                  className={styles.input}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="What makes your products special?"
                  rows={4}
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isFoodSupplier}
                    onChange={(e) => setIsFoodSupplier(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>Are you a food product supplier?</span>
                </label>
              </div>

              {isFoodSupplier && (
                <div className={styles.conditionalFields}>
                  <div className={styles.formGroup}>
                    <label>FSSAI License Number <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      className={styles.input}
                      value={fssaiLicenseNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 14) setFssaiLicenseNumber(val);
                      }}
                      placeholder="Enter 14 digit license number"
                      maxLength={14}
                    />
                    {errors.fssaiLicenseNumber && <span className={styles.errorText}>{errors.fssaiLicenseNumber}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Upload FSSAI Certificate <span className={styles.required}>*</span></label>
                    <div className={styles.fileInputWrapper}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFssaiCertificate(file);
                            setErrors(prev => ({ ...prev, fssaiCertificate: '' }));
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.customFileUpload}
                      >
                        <Upload size={18} /> {fssaiCertificate || fssaiCertificateUrl ? 'Change File' : 'Choose File'}
                      </button>

                      {fssaiCertificate ? (
                        <p className={styles.fileSuccess}>✓ {fssaiCertificate.name}</p>
                      ) : fssaiCertificateUrl ? (
                        <p className={styles.fileSuccess}>✓ Certificate already uploaded</p>
                      ) : (
                        <p className={styles.fileHint}>Accepted formats: PDF, JPG, PNG</p>
                      )}
                    </div>
                    {errors.fssaiCertificate && <span className={styles.errorText}>{errors.fssaiCertificate}</span>}
                  </div>
                </div>
              )}

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

              <div className={styles.buttonGroup}>
                <button onClick={() => setCurrentStep(2)} className={styles.outlineBtn}>Back</button>
                <button onClick={submitStep} disabled={loading} className={styles.orangeBtn}>
                  {loading ? 'Saving...' : 'Next: Select Plan'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className={styles.formContainer} style={{ maxWidth: '800px' }}>
            <div className={styles.stepContent}>
              <div className={styles.headerRow}>
                <div className={styles.headerIconWrapper}>
                  <Star size={24} className={styles.headerIcon} />
                </div>
                <div>
                  <h1>Choose your Selling Plan</h1>
                  <p>Select a plan that fits your business scale and growth goals.</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.tierGrid}>
                  {[
                    {
                      id: SupplierTier.FREE,
                      label: 'Free Tier',
                      desc: 'Basic visibility. List up to 5K products (group).',
                      price: '₹0',
                      features: ['Up to 5,000 Products', 'Basic Marketplace Visibility']
                    },
                    {
                      id: SupplierTier.GOLD,
                      label: 'Gold Plan',
                      desc: 'Increased visibility. KYC required. List up to 5K products.',
                      price: '₹999/mo',
                      features: ['Up to 5,000 Products', 'Priority Placement', 'KYC Verified Badge']
                    },
                    {
                      id: SupplierTier.DIAMOND,
                      label: 'Diamond Plan',
                      desc: 'Higher ranking. Can list single product pushes.',
                      price: '₹2,499/mo',
                      features: ['Single Product Pushes', 'Higher Ranking', 'Advanced Analytics']
                    },
                    {
                      id: SupplierTier.PLATINUM,
                      label: 'Platinum Plan',
                      desc: 'Max visibility, dedicated support, e-commerce integration.',
                      price: '₹4,999/mo',
                      features: ['Maximum Visibility', 'Dedicated Account Manager', 'E-commerce Integration']
                    },
                  ].map(tier => (
                    <div
                      key={tier.id}
                      className={`${styles.tierCard} ${selectedTier === tier.id ? styles.selectedTier : ''}`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      <div className={styles.tierInfo}>
                        <div className={styles.tierMain}>
                          <h3>{tier.label}</h3>
                          <p className={styles.tierDesc}>{tier.desc}</p>
                        </div>
                        <div className={styles.tierFeatures}>
                          {tier.features.map((f, i) => <span key={i} className={styles.featureTag}>{f}</span>)}
                        </div>
                      </div>
                      <div className={styles.tierPriceSide}>
                        <div className={styles.tierPrice}>{tier.price}</div>
                        {selectedTier === tier.id && <div className={styles.checkBadge}><Check size={14} /></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button onClick={() => setCurrentStep(3)} className={styles.outlineBtn}>Back</button>
                <button onClick={submitStep} disabled={loading} className={styles.orangeBtn}>
                  {loading ? 'Submitting...' : 'Complete Onboarding'} <Check size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      case 5:
        const isRejected = profile?.kycStatus === 'REJECTED';
        return (
          <>
            <div className={isRejected ? styles.iconCircleError : styles.iconCircleSuccess}>
              {isRejected ? <XCircle size={48} /> : <ShieldCheck size={48} />}
            </div>
            <h1 style={{ textAlign: 'center' }}>
              {isRejected ? 'Application Rejected' : 'Application Submitted!'}
            </h1>

            {!isRejected ? (
              <p className={styles.successText}>
                Your application is now under review. As part of our high-trust B2B process,
                <strong> you will receive a verification call within 24 hours </strong>
                to confirm your details.
              </p>
            ) : (
              <div className={styles.rejectionBox}>
                <p><strong>Reason for Rejection:</strong></p>
                <p>{profile?.rejectionReason || 'Your application did not meet our initial requirements. Please see the details below.'}</p>
              </div>
            )}

            <div className={`${styles.statusBox} ${isRejected ? styles.statusRejected : ''}`}>
              <p>Status: <strong>{profile?.kycStatus || 'PENDING'}</strong></p>
              {!isRejected && <p className={styles.subStatus}>Next step: Formal Cold Call (within 24h)</p>}
            </div>

            {isRejected && (
              <div className={styles.contactTeam}>
                <p>Need help? Contact our support team:</p>
                <p><strong>Phone: +91 xxxxxxxx</strong></p>
                <p>Or update your details and try again.</p>
                <Button
                  onClick={handleReapply}
                  className={styles.reapplyBtn}
                  variant="outline"
                >
                  Update & Reapply
                </Button>
              </div>
            )}

            {!isRejected && (
              <div className={styles.growthCard}>
                <div className={styles.growthIconWrapper}>
                  <Handshake size={24} />
                </div>
                <div className={styles.growthText}>
                  <p><strong>Woman Entrepreneur?</strong></p>
                  <p>We would love to connect and discuss growth with you!</p>
                </div>
              </div>
            )}

            <Button
              onClick={() => navigate('/')}
              size="lg"
              className={styles.homeBtn}
            >
              Go to Homepage
            </Button>
          </>
        );
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
      <div className={styles.centeredForm}>
        <div className={styles.successCard}>
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
            <Button variant="danger" onClick={() => {
              dispatch(logout());
              navigate('/');
            }}>Sign Out</Button>
          </>
        }
      >
        Are you sure you want to sign out? Your onboarding progress is saved.
      </Modal>
    </SupplierOnboardingLayout>
  );
};

export default Onboarding;
