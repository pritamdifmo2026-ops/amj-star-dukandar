import React, { useState } from 'react';
import { Send, CheckCircle2, X, FileText, Users, Handshake } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import api from '@/api/client';

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const SUBCATEGORIES = [
  'AC Motors', 'Spare Parts', 'Raw Materials', 'Packaging Materials',
  'Industrial Machinery', 'Electronic Components', 'Textile Fabrics',
  'Agricultural Equipment', 'Food Products', 'Furniture Parts',
  'Construction Materials', 'Chemical Products', 'Auto Parts',
  'Not Listed Here',
];

const CATEGORIES = [
  'Agriculture', 'Electronics', 'Food & Beverages', 'Furniture',
  'Home Furnishing', 'Machinery', 'Textiles', 'Chemicals',
  'Construction', 'Automotive', 'Healthcare', 'Not Listed Here',
];

const inputCls = "w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3 text-sm text-[#0f172a] outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

const PostRequirementSection: React.FC = () => {
  const user = useAppSelector(state => state.auth.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick bar state
  const [quickProduct, setQuickProduct] = useState('');
  const [quickPhone, setQuickPhone] = useState(() => {
    const p = String(user?.phone || '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(p) ? p : '';
  });

  // Full form state
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    subcategory: '',
    quantity: '',
    notes: '',
    buyerName: user?.name || '',
    buyerCompany: '',
    buyerEmail: user?.email || '',
    buyerPhone: '',
    buyerLocation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = () => {
    setFormData(prev => ({
      ...prev,
      productName: quickProduct,
      buyerPhone: quickPhone,
      buyerName: user?.name || '',
      buyerEmail: user?.email || '',
    }));
    setIsModalOpen(true);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProduct.trim()) return toast.error('Please enter a product name');
    openModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.buyerName || !formData.buyerEmail || !formData.buyerPhone || !formData.buyerCompany) {
      return toast.error('Please fill in all required fields');
    }
    setIsSubmitting(true);
    try {
      await api.post('/requirements', formData);
      setSubmitted(true);
      toast.success('Requirement posted successfully!');

      // Auto close after 2 seconds
      setTimeout(() => {
        closeModal();
      }, 2000);

    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitted(false);
  };

  return (
    <>
      {/* Sleek Banner Section */}
      <section className="py-12 bg-white border-t border-[#f0f0f0]">
        <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl px-8 py-10 flex items-center gap-10 max-lg:flex-col max-lg:text-center shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            {/* Left: Value Props */}
            <div className="flex-1">
              <h2 className="text-white text-[28px] font-bold leading-tight mb-2">
                <span className="text-[#f97316]"> Get free quotes</span> <span className="text-white">from verified suppliers</span>
              </h2>
              <p className="text-[#94a3b8] text-sm mb-6">Tell us what you need. Our sales team connects you instantly.</p>
              <div className="flex gap-8 max-lg:justify-center max-sm:gap-5">
                {[
                  { icon: FileText, label: 'Tell us what\nYou Need' },
                  { icon: Users, label: 'Receive free quotes\nfrom sellers' },
                  { icon: Handshake, label: 'Seal\nthe Deal' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <Icon size={22} className="text-[#f97316]" />
                    </div>
                    <span className="text-[11px] text-[#94a3b8] text-center leading-tight whitespace-pre-line">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Input */}
            <div className="flex-1 max-w-[420px] max-lg:w-full">
              <p className="text-white font-bold text-[15px] mb-3">Tell us your Requirement</p>
              <form onSubmit={handleQuickSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={quickProduct}
                  onChange={e => setQuickProduct(e.target.value)}
                  placeholder="Enter Product / Service name"
                  className="w-full bg-white border border-white/20 rounded-[8px] px-4 py-3 text-sm text-[#0f172a] outline-none focus:ring-2 focus:ring-[#f97316]/30"
                />
                <div className="flex items-center bg-white border border-white/20 rounded-[8px] overflow-hidden">
                  <span className="px-3 text-sm font-semibold text-[#475569] border-r border-[#e2e8f0] py-3 shrink-0 bg-[#f8fafc]">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={quickPhone}
                    onChange={e => setQuickPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your mobile"
                    className="flex-1 px-3 py-3 text-sm text-[#0f172a] outline-none bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#f97316] hover:bg-[#ea6c0d] text-white font-bold py-3 rounded-[8px] text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Submit Requirement <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Full Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-[#f1f5f9]">
              <div>
                <h3 className="text-xl font-bold text-[#0f172a]">Post Your Requirement</h3>
                <p className="text-sm text-[#64748b]">Fill in the details to get matched with the best suppliers</p>
              </div>
              <button onClick={closeModal} className="p-2 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] rounded-lg transition-colors">
                <X size={22} />
              </button>
            </div>

            {submitted ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a] mb-2">Requirement Submitted!</h3>
                <p className="text-[#64748b] max-w-md">Our sales team will review and match you with verified suppliers. You'll be contacted shortly.</p>
                <button onClick={closeModal} className="mt-8 bg-primary text-white px-8 py-3 rounded-[8px] font-bold text-sm hover:bg-primary-dark transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="px-8 py-6 flex flex-col gap-6">
                  {/* Product Details */}
                  <div>
                    <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-4">Product Details</h4>
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <div className="col-span-2 max-sm:col-span-1">
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Product Name *</label>
                        <input name="productName" value={formData.productName} onChange={handleChange} className={inputCls} placeholder="e.g. Industrial Electric Motor" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Category <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                        <select name="category" value={formData.category} onChange={handleChange} className={inputCls}>
                          <option value="">Select Category</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Subcategory <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                        <select name="subcategory" value={formData.subcategory} onChange={handleChange} className={inputCls}>
                          <option value="">Select Subcategory</option>
                          {SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Quantity Requirement <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                        <input name="quantity" value={formData.quantity} onChange={handleChange} className={inputCls} placeholder="e.g. 50 Pieces" />
                      </div>
                      <div className="col-span-2 max-sm:col-span-1">
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Additional Notes <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} className={`${inputCls} resize-y min-h-[80px]`} placeholder="Describe specs, target price, delivery timeline..." />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#f1f5f9]" />

                  {/* Contact Details */}
                  <div>
                    <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-4">Contact Details</h4>
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <div>
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Contact Person *</label>
                        <input name="buyerName" value={formData.buyerName} onChange={handleChange} className={inputCls} placeholder="Your Name" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Company Name *</label>
                        <input name="buyerCompany" value={formData.buyerCompany} onChange={handleChange} className={inputCls} placeholder="Your Company" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Email Address *</label>
                        <input name="buyerEmail" type="email" value={formData.buyerEmail} onChange={handleChange} className={inputCls} placeholder="you@company.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Phone Number *</label>
                        <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                          <span className="px-3 text-sm font-semibold text-[#475569] border-r border-[#e2e8f0] py-3 shrink-0">+91</span>
                          <input name="buyerPhone" type="tel" maxLength={10} value={formData.buyerPhone} onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value.replace(/\D/g, '') })} placeholder="Mobile number" className="flex-1 px-3 py-3 text-sm text-[#0f172a] outline-none bg-transparent" />
                        </div>
                      </div>
                      <div className="col-span-2 max-sm:col-span-1">
                        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">State <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                        <select name="buyerLocation" value={formData.buyerLocation} onChange={handleChange} className={inputCls}>
                          <option value="">Select State</option>
                          {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white border-t border-[#f1f5f9] px-8 py-5 flex items-center justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-[8px] text-sm font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2.5 rounded-[8px] text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? 'Submitting...' : 'Post Requirement'} <Send size={15} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PostRequirementSection;
