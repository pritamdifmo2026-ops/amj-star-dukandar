import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Phone,
  Trash2, CheckCircle2,
  ChevronRight, ArrowLeft, Loader2,
  BookUser, Edit2
} from 'lucide-react';
import { addressApi } from '@/shared/services/address.api';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';

const inputCls = (hasError = false) =>
  `w-full border ${hasError ? 'border-[#dc2626] bg-[#fef2f2]' : 'border-[#e2e8f0]'} rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors`;
const labelCls = "text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5";
const errorCls = "text-xs text-[#dc2626] mt-1";

const Addresses: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '', phone: '', pincode: '', state: '', city: '', houseNo: '', area: '', isDefault: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Please enter a valid 10-digit phone number';
    if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = 'Please enter a valid 6-digit pincode';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.houseNo.trim()) newErrors.houseNo = 'House/Building number is required';
    if (!form.area.trim()) newErrors.area = 'Area/Street details are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors(prev => { const u = { ...prev }; delete u[field]; return u; });
    }
  };

  const redirectPath = new URLSearchParams(location.search).get('redirect');

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    try {
      const data = await addressApi.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await addressApi.updateAddress(editingId, form);
      } else {
        await addressApi.addAddress(form);
      }
      await fetchAddresses();
      setShowForm(false);
      setEditingId(null);
      setForm({ fullName: '', phone: '', pincode: '', state: '', city: '', houseNo: '', area: '', isDefault: false });
      if (redirectPath && !editingId) navigate(redirectPath);
    } catch (error) {
      console.error('Failed to save address', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (addr: any) => {
    setForm({ fullName: addr.fullName, phone: addr.phone, pincode: addr.pincode, state: addr.state, city: addr.city, houseNo: addr.houseNo, area: addr.area, isDefault: addr.isDefault });
    setEditingId(addr._id);
    setShowForm(true);
    setErrors({});
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ fullName: '', phone: '', pincode: '', state: '', city: '', houseNo: '', area: '', isDefault: false });
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressApi.deleteAddress(id);
      setAddresses(addresses.filter(a => a._id !== id));
    } catch (error) {
      console.error('Failed to delete address', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressApi.setDefault(id);
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to set default address', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#64748b]">
          <Loader2 size={48} className="animate-spin text-primary" />
          <p className="text-sm m-0">Loading addresses...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="py-10 px-4">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">My Addresses</h1>
              <p className="text-sm text-[#64748b] m-0">Manage your delivery addresses</p>
            </div>
            {!showForm && (
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => { setShowForm(true); setEditingId(null); }}
              >
                <Plus size={18} /> Add New Address
              </button>
            )}
          </div>

          {showForm ? (
            <div className="bg-white border border-[#eef2f6] rounded-[14px] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <button
                className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] bg-transparent border-none cursor-pointer hover:text-[#0f172a] p-0 mb-5"
                onClick={handleCloseForm}
              >
                <ArrowLeft size={18} /> Back to My Addresses
              </button>
              <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-6">{editingId ? 'Edit Address' : 'Add New Address'}</h2>

              <form onSubmit={handleSave}>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 mb-4">
                  {[
                    { field: 'fullName', label: 'Full Name', placeholder: 'Enter full name', type: 'text' },
                    { field: 'phone', label: 'Phone Number', placeholder: '10-digit mobile number', type: 'tel', maxLen: 10 },
                    { field: 'pincode', label: 'Pincode', placeholder: '6 digits PIN code', type: 'text', maxLen: 6 },
                    { field: 'state', label: 'State', placeholder: 'State', type: 'text' },
                    { field: 'city', label: 'City', placeholder: 'City', type: 'text' },
                    { field: 'houseNo', label: 'House No. / Building', placeholder: 'House No.', type: 'text' },
                  ].map(({ field, label, placeholder, type, maxLen }) => (
                    <div key={field}>
                      <label className={labelCls}>{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={(form as any)[field]}
                        onChange={e => handleInputChange(field, field === 'phone' || field === 'pincode' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        maxLength={maxLen}
                        className={inputCls(!!errors[field])}
                      />
                      {errors[field] && <p className={errorCls}>{errors[field]}</p>}
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <label className={labelCls}>Area / Street / Sector</label>
                  <textarea
                    rows={3}
                    placeholder="Area details"
                    value={form.area}
                    onChange={e => handleInputChange('area', e.target.value)}
                    className={inputCls(!!errors.area) + " resize-y"}
                  />
                  {errors.area && <p className={errorCls}>{errors.area}</p>}
                </div>

                <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer mb-5">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                    className="accent-primary"
                  />
                  Make this my default address
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white border border-[#eef2f6] rounded-[14px] p-12 flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-[#f1f5f9] rounded-full flex items-center justify-center">
                <BookUser size={40} className="text-[#94a3b8]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0f172a] m-0">No Addresses Found</h2>
              <p className="text-sm text-[#64748b] m-0">You haven't added any addresses yet</p>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} /> Add Your First Address
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`bg-white rounded-[12px] p-5 ${addr.isDefault ? 'border-2 border-primary shadow-[0_0_0_4px_rgba(217,79,0,0.08)]' : 'border border-[#eef2f6]'}`}
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <h3 className="text-sm font-bold text-[#0f172a] m-0">{addr.fullName}</h3>
                    <span className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">Home</span>
                    {addr.isDefault && (
                      <span className="flex items-center gap-1 text-xs font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Default
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#475569] m-0 mb-2 leading-relaxed">
                    {addr.houseNo}, {addr.area}<br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-[#64748b] mb-4">
                    <Phone size={14} /> {addr.phone}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <button
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0"
                      onClick={() => handleEdit(addr)}
                    >
                      <Edit2 size={13} /> Edit Address
                    </button>
                    {!addr.isDefault && (
                      <button
                        className="text-xs font-bold text-[#475569] bg-transparent border-none cursor-pointer hover:text-primary p-0"
                        onClick={() => handleSetDefault(addr._id)}
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      className="flex items-center gap-1.5 text-xs font-bold text-[#dc2626] bg-transparent border-none cursor-pointer hover:underline p-0"
                      onClick={() => handleDelete(addr._id)}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>

                  {redirectPath && (
                    <button
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#0f172a] text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:bg-[#1e293b] transition-colors"
                      onClick={() => navigate(redirectPath)}
                    >
                      Deliver to this address <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Addresses;
