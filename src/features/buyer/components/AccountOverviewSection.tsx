import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Building2, Edit2, Save, X, Loader2, CheckCircle2,
  FileText, Package, Tag, Hash, Layers, ClipboardList,
  Briefcase, MapPin, ShieldCheck, AlignLeft, BarChart2,
} from 'lucide-react';
import { buyerProfileApi } from '../services/buyer-profile.api';

// Local type definitions matching the API interfaces
type BusinessProfileData = {
  gstNumber?: string;
  companyName?: string;
  companyAddress?: string;
  businessDetails?: string;
  rawMaterialEstimate?: string;
  requirementDescription?: string;
  businessCategory?: string;
};

type RequirementData = {
  productType?: string;
  category?: string;
  subcategory?: string;
  quantityNeeded?: string;
  productSpecifications?: string;
  additionalDetails?: string;
};


// ─────────────────────────── helpers ───────────────────────────

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const inputCls =
  'w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors bg-white';

const errorInputCls =
  'w-full border border-[#dc2626] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-[#dc2626] transition-colors bg-[#fef2f2]';

const textareaCls = inputCls + ' resize-y';

const labelCls =
  'text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1';

const emptyBiz: BusinessProfileData = {
  gstNumber: '',
  companyName: '',
  companyAddress: '',
  businessDetails: '',
  rawMaterialEstimate: '',
  requirementDescription: '',
  businessCategory: '',
};

const emptyReq: RequirementData = {
  productType: '',
  category: '',
  subcategory: '',
  quantityNeeded: '',
  productSpecifications: '',
  additionalDetails: '',
};

// ─────────────────────── sub-components ────────────────────────

interface FieldViewProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
}
const FieldView: React.FC<FieldViewProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-[8px] bg-[#fff7ed] flex items-center justify-center shrink-0 mt-0.5 text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider m-0">{label}</p>
      <p className="text-sm text-[#0f172a] font-medium m-0 mt-0.5 break-words">
        {value?.trim() ? value : <span className="text-[#cbd5e1] italic font-normal">Not provided</span>}
      </p>
    </div>
  </div>
);

// ─────────────────── main component ────────────────────────────

const AccountOverviewSection: React.FC = () => {
  // ── loading / data state ──
  const [loading, setLoading] = useState(true);
  const [bizData, setBizData] = useState<BusinessProfileData>(emptyBiz);
  const [reqData, setReqData] = useState<RequirementData>(emptyReq);

  // ── edit state ──
  const [bizEditing, setBizEditing] = useState(false);
  const [reqEditing, setReqEditing] = useState(false);
  const [bizForm, setBizForm] = useState<BusinessProfileData>(emptyBiz);
  const [reqForm, setReqForm] = useState<RequirementData>(emptyReq);
  const [bizErrors, setBizErrors] = useState<Record<string, string>>({});
  const [reqErrors, setReqErrors] = useState<Record<string, string>>({});

  // ── saving state ──
  const [bizSaving, setBizSaving] = useState(false);
  const [reqSaving, setReqSaving] = useState(false);

  // ── fetch on mount ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await buyerProfileApi.getAccountOverview();
      const biz = data.businessProfile ?? emptyBiz;
      const req = data.requirement ?? emptyReq;
      setBizData(biz);
      setReqData(req);
      setBizForm(biz);
      setReqForm(req);
    } catch {
      // silently fail — section just shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ────── Business Verification ──────

  const validateBiz = (): boolean => {
    const errs: Record<string, string> = {};
    if (!bizForm.companyName?.trim()) errs.companyName = 'Company name is required';
    if (bizForm.gstNumber?.trim() && !GST_REGEX.test(bizForm.gstNumber.trim().toUpperCase()))
      errs.gstNumber = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)';
    setBizErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBizEdit = () => {
    setBizForm({ ...bizData });
    setBizErrors({});
    setBizEditing(true);
  };

  const handleBizCancel = () => {
    setBizEditing(false);
    setBizErrors({});
  };

  const handleBizSave = async () => {
    if (!validateBiz()) return;
    setBizSaving(true);
    try {
      const payload = {
        ...bizForm,
        gstNumber: bizForm.gstNumber?.trim().toUpperCase(),
      };
      const res = await buyerProfileApi.upsertBusinessProfile(payload);
      setBizData(res.businessProfile);
      setBizEditing(false);
      toast.success('Business profile saved!');
    } catch {
      toast.error('Failed to save business profile.');
    } finally {
      setBizSaving(false);
    }
  };

  const updateBiz = (field: keyof BusinessProfileData, value: string) => {
    setBizForm(prev => ({ ...prev, [field]: value }));
    if (bizErrors[field]) setBizErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ────── Requirement ──────

  const validateReq = (): boolean => {
    const errs: Record<string, string> = {};
    if (!reqForm.productType?.trim()) errs.productType = 'Product type is required';
    if (!reqForm.category?.trim()) errs.category = 'Category is required';
    setReqErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReqEdit = () => {
    setReqForm({ ...reqData });
    setReqErrors({});
    setReqEditing(true);
  };

  const handleReqCancel = () => {
    setReqEditing(false);
    setReqErrors({});
  };

  const handleReqSave = async () => {
    if (!validateReq()) return;
    setReqSaving(true);
    try {
      const res = await buyerProfileApi.upsertRequirement(reqForm);
      setReqData(res.requirement);
      setReqEditing(false);
      toast.success('Requirement saved!');
    } catch {
      toast.error('Failed to save requirement.');
    } finally {
      setReqSaving(false);
    }
  };

  const updateReq = (field: keyof RequirementData, value: string) => {
    setReqForm(prev => ({ ...prev, [field]: value }));
    if (reqErrors[field]) setReqErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ─────────────────── render ─────────────────────

  if (loading) {
    return (
      <div className="col-span-full flex items-center gap-2 py-8 text-sm text-[#94a3b8]">
        <Loader2 size={16} className="animate-spin text-primary" />
        Loading account overview...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 mb-8">

      {/* ══════════════════════════════════════════════════
          CARD 1 — Business Verification
      ══════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#eef2f6] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] bg-gradient-to-r from-[#fff7ed] to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Business Verification</h3>
              <p className="text-[11px] text-[#94a3b8] m-0">GST & company information</p>
            </div>
          </div>
          {!bizEditing ? (
            <button
              onClick={handleBizEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-primary bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] px-3 py-1.5 cursor-pointer hover:bg-[#ffedd5] transition-colors"
            >
              <Edit2 size={13} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBizCancel}
                disabled={bizSaving}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-1.5 cursor-pointer hover:bg-[#f1f5f9] disabled:opacity-50"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleBizSave}
                disabled={bizSaving}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary border-none rounded-[8px] px-3 py-1.5 cursor-pointer hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {bizSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {bizSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-6">
          {bizEditing ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 max-sm:grid-cols-1">

              {/* GST Number */}
              <div>
                <label className={labelCls}>GST Number</label>
                <input
                  value={bizForm.gstNumber ?? ''}
                  onChange={e => updateBiz('gstNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  maxLength={15}
                  className={bizErrors.gstNumber ? errorInputCls : inputCls}
                />
                {bizErrors.gstNumber && <p className="text-xs text-[#dc2626] mt-1 m-0">{bizErrors.gstNumber}</p>}
              </div>

              {/* Company Name */}
              <div>
                <label className={labelCls}>Company Name <span className="text-[#dc2626]">*</span></label>
                <input
                  value={bizForm.companyName ?? ''}
                  onChange={e => updateBiz('companyName', e.target.value)}
                  placeholder="Your registered company name"
                  className={bizErrors.companyName ? errorInputCls : inputCls}
                />
                {bizErrors.companyName && <p className="text-xs text-[#dc2626] mt-1 m-0">{bizErrors.companyName}</p>}
              </div>

              {/* Business Category */}
              <div>
                <label className={labelCls}>Business Category</label>
                <input
                  value={bizForm.businessCategory ?? ''}
                  onChange={e => updateBiz('businessCategory', e.target.value)}
                  placeholder="e.g. Textile, Electronics, FMCG"
                  className={inputCls}
                />
              </div>

              {/* Raw Material Estimate */}
              <div>
                <label className={labelCls}>Raw Material Requirement Estimate</label>
                <input
                  value={bizForm.rawMaterialEstimate ?? ''}
                  onChange={e => updateBiz('rawMaterialEstimate', e.target.value)}
                  placeholder="e.g. 50 MT/month, ₹5L/quarter"
                  className={inputCls}
                />
              </div>

              {/* Company Address — full width */}
              <div className="col-span-2 max-sm:col-span-1">
                <label className={labelCls}>Company Address</label>
                <textarea
                  rows={2}
                  value={bizForm.companyAddress ?? ''}
                  onChange={e => updateBiz('companyAddress', e.target.value)}
                  placeholder="Registered office / factory address"
                  className={textareaCls}
                />
              </div>

              {/* Business Details — full width */}
              <div className="col-span-2 max-sm:col-span-1">
                <label className={labelCls}>Business Details</label>
                <textarea
                  rows={3}
                  value={bizForm.businessDetails ?? ''}
                  onChange={e => updateBiz('businessDetails', e.target.value)}
                  placeholder="Brief description of your business, products dealt with, years of operation…"
                  className={textareaCls}
                />
              </div>

              {/* Requirement Description — full width */}
              <div className="col-span-2 max-sm:col-span-1">
                <label className={labelCls}>Requirement Description</label>
                <textarea
                  rows={2}
                  value={bizForm.requirementDescription ?? ''}
                  onChange={e => updateBiz('requirementDescription', e.target.value)}
                  placeholder="Describe what you're looking to source or procure…"
                  className={textareaCls}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-sm:grid-cols-1">
              <FieldView icon={<Hash size={15} />} label="GST Number" value={bizData.gstNumber} />
              <FieldView icon={<Building2 size={15} />} label="Company Name" value={bizData.companyName} />
              <FieldView icon={<Tag size={15} />} label="Business Category" value={bizData.businessCategory} />
              <FieldView icon={<BarChart2 size={15} />} label="Raw Material Estimate" value={bizData.rawMaterialEstimate} />
              <FieldView icon={<MapPin size={15} />} label="Company Address" value={bizData.companyAddress} />
              <FieldView icon={<Briefcase size={15} />} label="Business Details" value={bizData.businessDetails} />
              <FieldView icon={<AlignLeft size={15} />} label="Requirement Description" value={bizData.requirementDescription} />
            </div>
          )}
        </div>

        {/* Completion indicator */}
        {!bizEditing && (
          <div className="px-6 pb-4">
            {bizData.companyName?.trim() ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#059669] bg-[#ecfdf5] px-3 py-1 rounded-full">
                <CheckCircle2 size={12} /> Business profile completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#d97706] bg-[#fffbeb] px-3 py-1 rounded-full">
                ⚠ Complete your business profile to get better matches
              </span>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          CARD 2 — Enter Your Requirement
      ══════════════════════════════════════════════════ */}
      <div id="buyer-requirement-section" className="bg-white border border-[#eef2f6] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] bg-gradient-to-r from-[#f0fdf4] to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#dcfce7] flex items-center justify-center text-[#16a34a]">
              <ClipboardList size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Enter Your Requirement</h3>
              <p className="text-[11px] text-[#94a3b8] m-0">What products are you looking to source?</p>
            </div>
          </div>
          {!reqEditing ? (
            <button
              onClick={handleReqEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] px-3 py-1.5 cursor-pointer hover:bg-[#dcfce7] transition-colors"
            >
              <Edit2 size={13} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReqCancel}
                disabled={reqSaving}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-1.5 cursor-pointer hover:bg-[#f1f5f9] disabled:opacity-50"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleReqSave}
                disabled={reqSaving}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#16a34a] border-none rounded-[8px] px-3 py-1.5 cursor-pointer hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {reqSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {reqSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-6">
          {reqEditing ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 max-sm:grid-cols-1">

              {/* Product Type */}
              <div>
                <label className={labelCls}>Product Type <span className="text-[#dc2626]">*</span></label>
                <input
                  value={reqForm.productType ?? ''}
                  onChange={e => updateReq('productType', e.target.value)}
                  placeholder="e.g. Raw Cotton, Steel Rods, Packaging"
                  className={reqErrors.productType ? errorInputCls : inputCls}
                />
                {reqErrors.productType && <p className="text-xs text-[#dc2626] mt-1 m-0">{reqErrors.productType}</p>}
              </div>

              {/* Category */}
              <div>
                <label className={labelCls}>Category <span className="text-[#dc2626]">*</span></label>
                <input
                  value={reqForm.category ?? ''}
                  onChange={e => updateReq('category', e.target.value)}
                  placeholder="e.g. Agriculture, Construction, FMCG"
                  className={reqErrors.category ? errorInputCls : inputCls}
                />
                {reqErrors.category && <p className="text-xs text-[#dc2626] mt-1 m-0">{reqErrors.category}</p>}
              </div>

              {/* Subcategory */}
              <div>
                <label className={labelCls}>Subcategory</label>
                <input
                  value={reqForm.subcategory ?? ''}
                  onChange={e => updateReq('subcategory', e.target.value)}
                  placeholder="Narrower product segment"
                  className={inputCls}
                />
              </div>

              {/* Quantity Needed */}
              <div>
                <label className={labelCls}>Quantity Needed</label>
                <input
                  value={reqForm.quantityNeeded ?? ''}
                  onChange={e => updateReq('quantityNeeded', e.target.value)}
                  placeholder="e.g. 500 kg/month, 1000 units/week"
                  className={inputCls}
                />
              </div>

              {/* Product Specifications — full width */}
              <div className="col-span-2 max-sm:col-span-1">
                <label className={labelCls}>Product Specifications</label>
                <textarea
                  rows={3}
                  value={reqForm.productSpecifications ?? ''}
                  onChange={e => updateReq('productSpecifications', e.target.value)}
                  placeholder="Grade, dimensions, purity, certifications, packaging requirements…"
                  className={textareaCls}
                />
              </div>

              {/* Additional Details — full width */}
              <div className="col-span-2 max-sm:col-span-1">
                <label className={labelCls}>Additional Requirement Details</label>
                <textarea
                  rows={2}
                  value={reqForm.additionalDetails ?? ''}
                  onChange={e => updateReq('additionalDetails', e.target.value)}
                  placeholder="Delivery location, lead time, budget range, any other notes…"
                  className={textareaCls}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-sm:grid-cols-1">
              <FieldView icon={<Package size={15} />} label="Product Type" value={reqData.productType} />
              <FieldView icon={<Tag size={15} />} label="Category" value={reqData.category} />
              <FieldView icon={<Layers size={15} />} label="Subcategory" value={reqData.subcategory} />
              <FieldView icon={<Hash size={15} />} label="Quantity Needed" value={reqData.quantityNeeded} />
              <FieldView icon={<FileText size={15} />} label="Product Specifications" value={reqData.productSpecifications} />
              <FieldView icon={<AlignLeft size={15} />} label="Additional Details" value={reqData.additionalDetails} />
            </div>
          )}
        </div>

        {/* Completion indicator */}
        {!reqEditing && (
          <div className="px-6 pb-4">
            {reqData.productType?.trim() ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#059669] bg-[#ecfdf5] px-3 py-1 rounded-full">
                <CheckCircle2 size={12} /> Requirement submitted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#d97706] bg-[#fffbeb] px-3 py-1 rounded-full">
                ⚠ Add your requirements to help suppliers find you
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountOverviewSection;
