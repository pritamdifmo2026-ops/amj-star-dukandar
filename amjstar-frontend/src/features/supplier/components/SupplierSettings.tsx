import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import { toast } from 'react-hot-toast';
import supplierService from '../services/supplier.service';
import styles from './SupplierSettings.module.css';

interface SupplierSettingsProps {
  profile: any;
}

const SupplierSettings: React.FC<SupplierSettingsProps> = ({ profile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({
    name: profile?.businessDetails?.ownerName || profile?.user?.name || '',
    businessName: profile?.businessName || '',
    email: profile?.businessDetails?.email || profile?.user?.email || '',
    phone: profile?.phone || profile?.user?.phone || ''
  });

  const handleUpdate = () => {
    setIsEditing(false);
    toast.success('Settings updated!');
  };

  const handleEmailVerify = async () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      await supplierService.requestEmailChange(formData.email);
      toast.success('Verification link sent to your new email!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification link');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handlePhoneUpdate = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsVerifyingPhone(true);
    try {
      await supplierService.requestPhoneChange(formData.phone);
      setShowOtpInput(true);
      toast.success('OTP sent to your new phone number!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handlePhoneVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifyingPhone(true);
    try {
      await supplierService.verifyPhoneChange(otp);
      toast.success('Phone number updated successfully!');
      setShowOtpInput(false);
      setOtp('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Account Settings</h2>
          <p>Manage your account details and business information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className={styles.headerActions}>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdate} className={styles.saveBtn}>
              <Save size={18} /> Save Changes
            </Button>
          </div>
        )}
      </header>

      <div className={styles.grid}>
        {/* Personal & Account Info */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User size={20} />
            <h3>Basic Information</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.formGroup}>
              <label>Full Name (Owner)</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.inputIcon} />
                <input 
                  type="text" 
                  value={formData.name} 
                  disabled={true}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Business Name</label>
              <div className={styles.inputWrapper}>
                <Building2 size={16} className={styles.inputIcon} />
                <input 
                  type="text" 
                  value={formData.businessName} 
                  disabled={true}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <div className={styles.inputWithVerify}>
                <Mail size={16} className={styles.inputIcon} />
                <input 
                  type="email" 
                  value={formData.email} 
                  disabled={!isEditing}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <button 
                  className={styles.verifyBtn} 
                  onClick={handleEmailVerify}
                  disabled={isVerifyingEmail}
                >
                  {isVerifyingEmail ? 'Sending...' : 'Verify'}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <div className={styles.inputWithVerify}>
                <Phone size={16} className={styles.inputIcon} />
                <input 
                  type="tel" 
                  value={formData.phone} 
                  disabled={!isEditing}
                  maxLength={10}
                  onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                />
                <button 
                  className={styles.verifyBtn}
                  onClick={handlePhoneUpdate}
                  disabled={isVerifyingPhone}
                >
                  {isVerifyingPhone ? 'Sending...' : 'Update'}
                </button>
              </div>

              {showOtpInput && (
                <div className={styles.otpSection} style={{ marginTop: '12px' }}>
                  <div className={styles.inputWithVerify}>
                    <ShieldCheck size={16} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      maxLength={6}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                    <button 
                      className={styles.verifyBtn}
                      onClick={handlePhoneVerify}
                      disabled={isVerifyingPhone}
                    >
                      {isVerifyingPhone ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                  <p className={styles.helperText} style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                    Use dummy OTP: <strong style={{ color: '#0284c7' }}>123456</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Business Location & About */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Building2 size={20} />
            <h3>Business Details</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.formGroup}>
              <label>Office/Store Address</label>
              <textarea 
                value={profile?.businessDetails?.address || ''} 
                disabled 
                className={styles.textarea}
              />
            </div>
            
            <div className={styles.readOnlyGrid}>
              <div className={styles.readOnlyItem}>
                <label>City</label>
                <p>{profile?.businessDetails?.city || 'N/A'}</p>
              </div>
              <div className={styles.readOnlyItem}>
                <label>State</label>
                <p>{profile?.businessDetails?.state || 'N/A'}</p>
              </div>
              <div className={styles.readOnlyItem}>
                <label>PIN Code</label>
                <p>{profile?.businessDetails?.pinCode || 'N/A'}</p>
              </div>
              <div className={styles.readOnlyItem}>
                <label>Established</label>
                <p>{profile?.businessDetails?.yearOfEstablishment || 'N/A'}</p>
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '20px' }}>
              <label>About Company</label>
              <p className={styles.aboutText}>{profile?.businessDetails?.about || 'No description provided.'}</p>
            </div>
          </div>
        </div>

        {/* Business Verification Details */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <ShieldCheck size={20} />
            <h3>Verification & Legal</h3>
            <span className={styles.verifiedBadge}>{profile?.kycStatus || 'PENDING'}</span>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.readOnlyGrid}>
              <div className={styles.readOnlyItem}>
                <label>GSTIN Number</label>
                <p>{profile?.businessDetails?.gstin || 'N/A'}</p>
              </div>
              <div className={styles.readOnlyItem}>
                <label>Tier</label>
                <p className={styles.tierText}>{profile?.tier || 'FREE'}</p>
              </div>
              <div className={styles.readOnlyItem}>
                <label>PAN Number</label>
                <p>{profile?.businessDetails?.pan || 'N/A'}</p>
              </div>
              <div className={styles.readOnlyItem}>
                <label>Verification Status</label>
                <div className={styles.statusRow}>
                  {profile?.kycStatus === 'VERIFIED' ? (
                    <><CheckCircle2 size={14} color="#16a34a" /> <span>Approved</span></>
                  ) : (
                    <><AlertCircle size={14} color="#d97706" /> <span>{profile?.kycStatus || 'In Review'}</span></>
                  )}
                </div>
              </div>
              <div className={styles.readOnlyItem}>
                <label>Plan Limit</label>
                <p>{profile?.maxProducts?.toLocaleString()} Products</p>
              </div>
            </div>
            
            <div className={styles.verificationNotice}>
              <AlertCircle size={16} />
              <p>Legal and Tier details are managed by AMJStar Admin. Contact support to request changes to these records.</p>
            </div>

            <Button variant="outline" className={styles.adminContact}>
              Contact Admin Support <ExternalLink size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierSettings;
