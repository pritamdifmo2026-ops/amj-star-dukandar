import React, { useState } from 'react';
import { User, Building2, Mail, Phone, ShieldCheck, Save, AlertCircle, PhoneCall, Plus, Edit2, Trash2, CheckCircle, Landmark } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import { toast } from 'react-hot-toast';
import supplierService from '../services/supplier.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import walletApi from '../services/wallet.api';

interface SupplierSettingsProps { profile: any; }

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

const cardCls = "bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)]";
const cardHeaderCls = "flex items-center gap-3 mb-6 pb-4 border-b border-[#f1f5f9]";
const labelCls = "block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2";
const inputWrapCls = "flex items-center gap-3 border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 bg-[#f8fafc]";
const inputCls = "flex-1 border-none outline-none text-sm text-[#1e293b] bg-transparent disabled:text-[#64748b] disabled:cursor-not-allowed";

const SupplierSettings: React.FC<SupplierSettingsProps> = ({ profile }) => {
  const qc = useQueryClient();
  const { data: walletData } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.getWallet });
  const { data: banksData } = useQuery({ queryKey: ['supplier', 'banks'], queryFn: supplierService.getBanks });
  const rawPhone: string = (walletData as any)?.contactPhone || '';
  const contactPhone = rawPhone.length === 10 ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}` : rawPhone;
  const contactHref = rawPhone.length === 10 ? `tel:+91${rawPhone}` : '';

  const [isEditing, setIsEditing] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' });
  const [bankErrors, setBankErrors] = useState<Record<string, string>>({});
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: profile?.businessDetails?.ownerName || profile?.user?.name || '',
    businessName: profile?.businessName || '',
    email: profile?.businessDetails?.email || profile?.user?.email || '',
    phone: profile?.phone || profile?.user?.phone || '',
  });

  const validateBankForm = () => {
    const errs: Record<string, string> = {};
    const e1 = bankFieldError.accountHolderName(bankForm.accountHolderName); if (e1) errs.accountHolderName = e1;
    const e2 = bankFieldError.accountNumber(bankForm.accountNumber); if (e2) errs.accountNumber = e2;
    const e3 = bankFieldError.ifscCode(bankForm.ifscCode); if (e3) errs.ifscCode = e3;
    const e4 = bankFieldError.bankName(bankForm.bankName); if (e4) errs.bankName = e4;
    setBankErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Bank mutations
  const addBankMutation = useMutation({
    mutationFn: (data: any) => editingBankId ? supplierService.editBank(editingBankId, data) : supplierService.addBank(data),
    onSuccess: () => {
      toast.success(editingBankId ? 'Bank updated successfully!' : 'Bank added successfully!');
      setBankForm({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' });
      setBankErrors({});
      setEditingBankId(null);
      setShowAddBank(false);
      qc.invalidateQueries({ queryKey: ['supplier', 'banks'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save bank'),
  });

  const deleteBankMutation = useMutation({
    mutationFn: (bankId: string) => supplierService.deleteBank(bankId),
    onSuccess: () => {
      toast.success('Bank deleted successfully!');
      qc.invalidateQueries({ queryKey: ['supplier', 'banks'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete bank'),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (bankId: string) => supplierService.setPrimaryBank(bankId),
    onSuccess: () => {
      toast.success('Primary bank updated!');
      qc.invalidateQueries({ queryKey: ['supplier', 'banks'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to set primary bank'),
  });

  const handleUpdate = () => { setIsEditing(false); toast.success('Settings updated!'); };

  const handleEmailVerify = async () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) { toast.error('Please enter a valid email address'); return; }
    setIsVerifyingEmail(true);
    try { await supplierService.requestEmailChange(formData.email); toast.success('Verification link sent to your new email!'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to send verification link'); }
    finally { setIsVerifyingEmail(false); }
  };

  const handlePhoneUpdate = async () => {
    if (!formData.phone || formData.phone.length < 10) { toast.error('Please enter a valid phone number'); return; }
    setIsVerifyingPhone(true);
    try { await supplierService.requestPhoneChange(formData.phone); setShowOtpInput(true); toast.success('OTP sent!'); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setIsVerifyingPhone(false); }
  };

  const handlePhoneVerify = async () => {
    if (otp.length !== 6) { toast.error('Please enter a valid 6-digit OTP'); return; }
    setIsVerifyingPhone(true);
    try { await supplierService.verifyPhoneChange(otp); toast.success('Phone number updated!'); setShowOtpInput(false); setOtp(''); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Invalid or expired OTP'); }
    finally { setIsVerifyingPhone(false); }
  };

  const verifyBtnCls = "px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-[6px] border-none cursor-pointer shrink-0 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="max-w-[900px]">
      <header className="flex justify-between items-start mb-8 max-sm:flex-col max-sm:gap-4">
        <div>
          <h2 className="text-[1.75rem] text-[#0f172a] font-extrabold m-0 mb-1">Account Settings</h2>
          <p className="text-[#64748b] m-0 text-[0.95rem]">Manage your account details and business information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdate} className="flex items-center gap-2"><Save size={18} /> Save Changes</Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        {/* Basic Info */}
        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <User size={20} className="text-primary" />
            <h3 className="text-base font-bold text-[#1e293b] m-0">Basic Information</h3>
          </div>
          <div className="flex flex-col gap-5">
            {[
              { label: 'Full Name (Owner)', icon: <User size={16} />, value: formData.name, disabled: true },
              { label: 'Business Name', icon: <Building2 size={16} />, value: formData.businessName, disabled: true },
            ].map(f => (
              <div key={f.label}>
                <label className={labelCls}>{f.label}</label>
                <div className={inputWrapCls}>{f.icon} <input className={inputCls} value={f.value} disabled /></div>
              </div>
            ))}

            <div>
              <label className={labelCls}>Email Address</label>
              <div className={inputWrapCls}>
                <Mail size={16} className="text-[#94a3b8] shrink-0" />
                <input className={inputCls} type="email" value={formData.email} disabled={!isEditing} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                <button className={verifyBtnCls} onClick={handleEmailVerify} disabled={isVerifyingEmail}>{isVerifyingEmail ? 'Sending...' : 'Verify'}</button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Phone Number</label>
              <div className={inputWrapCls}>
                <Phone size={16} className="text-[#94a3b8] shrink-0" />
                <input className={inputCls} type="tel" value={formData.phone} disabled={!isEditing} maxLength={10} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} />
                <button className={verifyBtnCls} onClick={handlePhoneUpdate} disabled={isVerifyingPhone}>{isVerifyingPhone ? 'Sending...' : 'Update'}</button>
              </div>
              {showOtpInput && (
                <div className="mt-3">
                  <div className={inputWrapCls}>
                    <ShieldCheck size={16} className="text-[#94a3b8] shrink-0" />
                    <input className={inputCls} type="text" placeholder="Enter 6-digit OTP" value={otp} maxLength={6} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                    <button className={verifyBtnCls} onClick={handlePhoneVerify} disabled={isVerifyingPhone}>{isVerifyingPhone ? 'Verifying...' : 'Verify OTP'}</button>
                  </div>
                  <p className="text-[#64748b] text-xs mt-1">Use dummy OTP: <strong className="text-[#0284c7]">123456</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <Building2 size={20} className="text-primary" />
            <h3 className="text-base font-bold text-[#1e293b] m-0">Business Details</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>Office/Store Address</label>
              <textarea value={profile?.businessDetails?.address || ''} disabled className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 bg-[#f8fafc] text-sm text-[#64748b] resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'City', val: profile?.businessDetails?.city },
                { label: 'State', val: profile?.businessDetails?.state },
                { label: 'PIN Code', val: profile?.businessDetails?.pinCode },
                { label: 'Established', val: profile?.businessDetails?.yearOfEstablishment },
              ].map(({ label, val }) => (
                <div key={label}>
                  <label className={labelCls}>{label}</label>
                  <p className="text-sm font-semibold text-[#1e293b] m-0">{val || 'N/A'}</p>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <label className={labelCls}>About Company</label>
              <p className="text-sm text-[#475569] leading-relaxed">{profile?.businessDetails?.about || 'No description provided.'}</p>
            </div>
          </div>
        </div>

        {/* Verification */}
        <div className={`${cardCls} col-span-2 max-lg:col-span-1`}>
          <div className={cardHeaderCls}>
            <ShieldCheck size={20} className="text-primary" />
            <h3 className="text-base font-bold text-[#1e293b] m-0">Verification &amp; Legal</h3>
            <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${profile?.kycStatus === 'VERIFIED' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fff7ed] text-[#c2410c]'}`}>{profile?.kycStatus || 'PENDING'}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-2 mb-6">
            {[
              { label: 'GSTIN Number', val: profile?.businessDetails?.gstin },
              { label: 'Tier', val: profile?.tier || 'FREE' },
              { label: 'PAN Number', val: profile?.businessDetails?.pan },
              { label: 'Verification Status', val: profile?.kycStatus === 'VERIFIED' ? '✅ Approved' : `⚠️ ${profile?.kycStatus || 'In Review'}` },
              { label: 'Plan Limit', val: profile?.maxProducts ? `${profile.maxProducts.toLocaleString()} Products` : 'N/A' },
            ].map(({ label, val }) => (
              <div key={label}>
                <label className={labelCls}>{label}</label>
                <p className="text-sm font-semibold text-[#1e293b] m-0">{val || 'N/A'}</p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] px-4 py-3 text-[#c2410c] text-sm mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="m-0">Legal and Tier details are managed by AMJSTAR Team. To set your commission rate or request changes, call us directly.</p>
          </div>
          {contactHref ? (
            <a
              href={contactHref}
              className="inline-flex items-center gap-3 px-5 py-3 bg-[#e65c00] text-white rounded-[10px] font-bold text-sm no-underline hover:bg-[#c94f00] transition-colors shadow-[0_4px_12px_rgba(230,92,0,0.25)]"
            >
              <PhoneCall size={18} />
              Call AMJSTAR — {contactPhone}
            </a>
          ) : (
            <Button variant="outline" className="flex items-center gap-2 !text-[#94a3b8] !border-[#e2e8f0]" disabled>
              <PhoneCall size={16} /> Contact number not configured yet
            </Button>
          )}
        </div>
      </div>

      {/* Bank Accounts */}
      <div className={`${cardCls} mt-6`}>
        <div className={cardHeaderCls}>
          <Landmark size={20} className="text-primary" />
          <h3 className="text-base font-bold text-[#1e293b] m-0">Bank Accounts</h3>
        </div>

        {banksData?.banks && banksData.banks.length > 0 ? (
          <div className="flex flex-col gap-3 mb-5">
            {banksData.banks.map((bank: any) => (
              <div key={bank._id} className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]">
                <div className="flex-1 flex items-center gap-4">
                  {bank.isPrimary && <CheckCircle size={20} className="text-[#059669] shrink-0" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1e293b] m-0">{bank.bankName}</p>
                      {bank.isPrimary && <span className="text-xs bg-[#ecfdf5] text-[#059669] font-bold px-2 py-0.5 rounded-full">PRIMARY</span>}
                    </div>
                    <p className="text-xs text-[#64748b] m-0">{bank.accountHolderName}</p>
                    <p className="text-xs text-[#94a3b8] m-0">••••{bank.accountNumber.slice(-4)} • IFSC: {bank.ifscCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!bank.isPrimary && (
                    <button
                      onClick={() => setPrimaryMutation.mutate(bank._id)}
                      disabled={setPrimaryMutation.isPending}
                      className="p-2 hover:bg-[#e2e8f0] rounded-[6px] transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={18} className="text-[#94a3b8]" />
                    </button>
                  )}
                  <button
                    onClick={() => { setBankForm(bank); setBankErrors({}); setEditingBankId(bank._id); setShowAddBank(true); }}
                    className="p-2 hover:bg-[#e2e8f0] rounded-[6px] transition-colors"
                  >
                    <Edit2 size={16} className="text-[#64748b]" />
                  </button>
                  {!bank.isPrimary && (
                    <button
                      onClick={() => { if (confirm('Delete this bank?')) deleteBankMutation.mutate(bank._id); }}
                      disabled={deleteBankMutation.isPending}
                      className="p-2 hover:bg-[#fee2e2] rounded-[6px] transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} className="text-[#dc2626]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8] mb-5">No bank accounts added yet.</p>
        )}

        {showAddBank ? (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 mb-4">
            <h4 className="text-sm font-bold text-[#1e293b] mb-3">{editingBankId ? 'Edit Bank' : 'Add New Bank'}</h4>
            <div className="flex flex-col gap-3">
              {[
                { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'e.g. John Smith' },
                { key: 'accountNumber', label: 'Account Number', placeholder: '9-18 digits' },
                { key: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g. SBIN0000123' },
                { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type={key === 'accountNumber' ? 'tel' : 'text'}
                    value={(bankForm as any)[key] || ''}
                    onChange={e => {
                      const raw = e.target.value;
                      let val = raw;
                      if (key === 'ifscCode') {
                        val = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      } else if (key === 'accountNumber') {
                        val = raw.replace(/\D/g, '');
                      }
                      setBankForm(p => ({ ...p, [key]: val }));
                      setBankErrors(p => ({ ...p, [key]: bankFieldError[key as keyof typeof bankFieldError](val) }));
                    }}
                    placeholder={placeholder}
                    className={`w-full border ${bankErrors[key] ? 'border-[#dc2626]' : 'border-[#e2e8f0]'} rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary`}
                    maxLength={key === 'ifscCode' ? 11 : key === 'accountNumber' ? 18 : 50}
                  />
                  {bankErrors[key] && <span className="text-xs text-[#dc2626] mt-1 block">⚠ {bankErrors[key]}</span>}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowAddBank(false); setEditingBankId(null); setBankForm({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' }); setBankErrors({}); }}
                  className="flex-1 px-3 py-2 border border-[#e2e8f0] rounded-[6px] text-sm font-bold text-[#475569] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (validateBankForm()) {
                      addBankMutation.mutate(bankForm);
                    }
                  }}
                  disabled={addBankMutation.isPending || !bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.ifscCode || !bankForm.bankName}
                  className="flex-1 px-3 py-2 bg-primary text-white rounded-[6px] text-sm font-bold hover:bg-primary-dark disabled:opacity-50"
                >
                  {addBankMutation.isPending ? 'Saving...' : 'Save Bank'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setShowAddBank(true); setEditingBankId(null); setBankForm({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' }); setBankErrors({}); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-[8px] font-bold text-sm cursor-pointer hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} /> Add Bank Account
          </button>
        )}
      </div>
    </div>
  );
};

export default SupplierSettings;
