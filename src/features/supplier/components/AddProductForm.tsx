import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import productService, { type ProductInput } from '@/features/product/services/product.service';
import categoryService from '@/features/product/services/category.service';
import uploadService from '@/features/product/services/upload.service';
import ImageCropper from '@/features/product/components/ImageCropper';
import Modal from '@/shared/components/ui/Modal';
import { X, Plus, ChevronLeft, Save, Package, Trash2, FileText, Send } from 'lucide-react';

interface AddProductFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingProduct?: any;
  returnTab?: string;
}

type SpecRow = { id: string; key: string; value: string };

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] bg-white outline-none focus:border-primary transition-colors";
const labelCls = "block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-1.5";
const sectionCls = "bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-5";

const CERTIFICATIONS = ['FSSAI', 'ISO 9001', 'BIS', 'Organic India', 'Halal', 'MSME Registered', 'GMP Certified', 'CE Mark', 'Export Quality'];

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  textile: ['Fabric Type', 'GSM', 'Width (cm)', 'Pattern', 'Color', 'Dye Type'],
  food: ['Shelf Life (months)', 'Ingredients', 'FSSAI License No.', 'Organic', 'Harvest Season'],
  machinery: ['Power / Voltage', 'Production Capacity', 'Machine Weight (kg)', 'Warranty (months)', 'Automation Level'],
  chemical: ['Purity (%)', 'CAS Number', 'Storage Conditions', 'Dangerous Goods'],
};

const getCategorySuggestions = (categoryName: string): string[] => {
  const n = categoryName.toLowerCase();
  if (n.includes('textile') || n.includes('fabric') || n.includes('cloth') || n.includes('garment') || n.includes('yarn')) return CATEGORY_SUGGESTIONS.textile;
  if (n.includes('food') || n.includes('agri') || n.includes('grain') || n.includes('spice') || n.includes('rice') || n.includes('dal') || n.includes('pulse')) return CATEGORY_SUGGESTIONS.food;
  if (n.includes('machin') || n.includes('equipment') || n.includes('industrial') || n.includes('tools')) return CATEGORY_SUGGESTIONS.machinery;
  if (n.includes('chemical') || n.includes('raw material') || n.includes('plastic') || n.includes('polymer')) return CATEGORY_SUGGESTIONS.chemical;
  return [];
};

const specsToRows = (specs: Record<string, string> = {}): SpecRow[] =>
  Object.entries(specs).map(([key, value], i) => ({ id: String(i), key, value: String(value) }));

const rowsToSpecs = (rows: SpecRow[]): Record<string, string> => {
  const out: Record<string, string> = {};
  rows.forEach(r => { if (r.key.trim() && r.value.trim()) out[r.key.trim()] = r.value.trim(); });
  return out;
};

const AddProductForm: React.FC<AddProductFormProps> = ({ onSuccess, editingProduct, returnTab }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<'publish' | 'draft' | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    hsnCode: '',
    basePrice: 0,
    moq: 1,
    unit: 'pcs',
    category: '',
    images: [],
    stock: 0,
    brand: '',
    keywords: [],
    leadTime: '',
    packagingType: 'bulk',
    countryOfOrigin: 'India',
    certifications: [],
    gstIncluded: false,
    gstRate: 18,
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false, title: '', message: '', type: 'info'
  });
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  const isDraftProduct = editingProduct?.status === 'DRAFT';
  const isEditingPublished = !!editingProduct && !isDraftProduct;

  const validateForPublish = (): string[] => {
    const missing: string[] = [];
    if (!formData.name.trim()) missing.push('Product Name');
    if (!formData.description.trim()) missing.push('Product Description');
    if (!formData.hsnCode.trim()) missing.push('HSN Code');
    if (!formData.basePrice || formData.basePrice <= 0) missing.push('Base Price (must be greater than 0)');
    if (!formData.moq || formData.moq < 1) missing.push('Minimum Order Quantity');
    if (!formData.categoryId && !formData.category) missing.push('Product Category');
    if (availableSubcategories.length > 0 && !formData.subcategoryId) missing.push('Subcategory');
    if (!formData.stock || formData.stock <= 0) missing.push('Available Stock (must be greater than 0)');
    if (!formData.images || formData.images.length === 0) missing.push('At least 1 product image');
    if (formData.gstRate === undefined || formData.gstRate === null) missing.push('GST Rate');
    return missing;
  };

  const buildPayload = (status: 'DRAFT' | 'PENDING') => {
    const cleanData: any = { ...formData, specifications: rowsToSpecs(specRows), status };
    if (!cleanData.categoryId) delete cleanData.categoryId;
    if (!cleanData.subcategoryId) delete cleanData.subcategoryId;
    return cleanData;
  };

  const handlePublish = async () => {
    // For editing a published product, skip strict re-validation (it was already validated once)
    if (!isEditingPublished) {
      const missing = validateForPublish();
      if (missing.length > 0) {
        setMessageModal({
          isOpen: true, type: 'error', title: 'Required Fields Missing',
          message: `Please fill in the following before publishing:\n• ${missing.join('\n• ')}`
        });
        return;
      }
    }
    setSubmitting('publish');
    try {
      const payload = buildPayload('PENDING');
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id || editingProduct._id, payload);
      } else {
        await productService.createProduct(payload);
      }
      onSuccess();
      navigate('/supplier/dashboard?tab=overview');
    } catch {
      setMessageModal({ isOpen: true, type: 'error', title: 'Submission Failed', message: 'Could not publish product. Please try again.' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name.trim()) {
      setMessageModal({ isOpen: true, type: 'error', title: 'Name Required', message: 'Please enter a product name before saving as draft.' });
      return;
    }
    setSubmitting('draft');
    try {
      const payload = buildPayload('DRAFT');
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id || editingProduct._id, payload);
      } else {
        await productService.createProduct(payload);
      }
      onSuccess();
      navigate('/supplier/dashboard?tab=overview');
    } catch {
      setMessageModal({ isOpen: true, type: 'error', title: 'Save Failed', message: 'Could not save draft. Please try again.' });
    } finally {
      setSubmitting(null);
    }
  };

  const handleDiscard = () => navigate(`/supplier/dashboard?tab=${returnTab ?? 'overview'}`);

  const toggleCertification = (cert: string) => {
    const current = formData.certifications || [];
    setFormData(prev => ({
      ...prev,
      certifications: current.includes(cert) ? current.filter(c => c !== cert) : [...current, cert],
    }));
  };

  const addSpecRow = () => setSpecRows(prev => [...prev, { id: Date.now().toString(), key: '', value: '' }]);
  const updateSpecRow = (id: string, field: 'key' | 'value', val: string) =>
    setSpecRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  const removeSpecRow = (id: string) => setSpecRows(prev => prev.filter(r => r.id !== id));

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data.categories);

        if (editingProduct) {
          setFormData({
            name: editingProduct.name || '',
            description: editingProduct.description || '',
            hsnCode: editingProduct.hsnCode || '',
            basePrice: editingProduct.basePrice || 0,
            moq: editingProduct.moq || 1,
            unit: editingProduct.unit || 'pcs',
            category: editingProduct.category || '',
            categoryId: editingProduct.categoryId || '',
            subcategoryId: editingProduct.subcategoryId || '',
            images: editingProduct.images || [],
            stock: editingProduct.stock || 0,
            brand: editingProduct.brand || '',
            keywords: editingProduct.keywords || [],
            leadTime: editingProduct.leadTime || '',
            packagingType: editingProduct.packagingType || 'bulk',
            countryOfOrigin: editingProduct.countryOfOrigin || 'India',
            certifications: editingProduct.certifications || [],
            gstIncluded: editingProduct.gstIncluded ?? false,
            gstRate: editingProduct.gstRate ?? 18,
          });
          setSpecRows(specsToRows(editingProduct.specifications || {}));

          if (editingProduct.categoryId) {
            const cat = data.categories.find((c: any) => c._id === editingProduct.categoryId);
            if (cat?.subcategories) setAvailableSubcategories(cat.subcategories);
          } else if (editingProduct.category) {
            const cat = data.categories.find((c: any) => c.name === editingProduct.category);
            if (cat?.subcategories) setAvailableSubcategories(cat.subcategories);
          }
        }
      } catch {
        setCategoriesError(true);
      }
    };
    fetchCategories();
  }, [editingProduct]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const cat = categories.find(c => c._id === selectedId);
    if (cat) {
      setFormData(prev => ({ ...prev, categoryId: cat._id, category: cat.name, subcategoryId: '' }));
      setAvailableSubcategories(cat.subcategories || []);
      const allRowsEmpty = specRows.every(r => r.value.trim() === '');
      if (allRowsEmpty) {
        const suggestions = getCategorySuggestions(cat.name);
        setSpecRows(suggestions.map((key, i) => ({ id: `s-${i}`, key, value: '' })));
      }
    } else {
      setFormData(prev => ({ ...prev, categoryId: '', category: '', subcategoryId: '' }));
      setAvailableSubcategories([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => { setTempImage(reader.result as string); setShowCropper(true); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setSubmitting('publish'); // show loading on images too
    try {
      const data = await uploadService.uploadImage(croppedBlob);
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), data.url] }));
    } catch {
      setMessageModal({ isOpen: true, title: 'Upload Failed', message: 'Failed to upload image. Please try again.', type: 'error' });
    } finally {
      setSubmitting(null);
    }
  };

  const removeImage = (index: number) =>
    setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));

  const loading = submitting !== null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#eef2f6] px-8 py-4 flex justify-between items-center gap-4 max-md:px-4 max-md:flex-col max-md:gap-3">
        <div className="flex flex-col gap-1">
          <button onClick={handleDiscard} className="flex items-center gap-1.5 text-sm text-[#64748b] font-semibold bg-none border-none cursor-pointer p-0 hover:text-primary transition-colors">
            <ChevronLeft size={18} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Package size={22} className="text-primary" />
            <h2 className="text-lg font-extrabold text-[#0f172a] m-0">
              {editingProduct ? (isDraftProduct ? 'Edit Draft Product' : 'Edit Product') : 'Add New Product'}
            </h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 items-center">
          <button
            onClick={handleDiscard}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-[#64748b] bg-transparent border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
          >
            Discard
          </button>

          {/* Save as Draft — shown for new products and draft products being edited */}
          {!isEditingPublished && (
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#475569] bg-white border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <FileText size={15} />
              {submitting === 'draft' ? 'Saving...' : 'Save as Draft'}
            </button>
          )}

          <Button onClick={handlePublish} disabled={loading}>
            <span className="flex items-center gap-2">
              {submitting === 'publish' ? (
                'Processing...'
              ) : isEditingPublished ? (
                <><Save size={15} /> Save Changes</>
              ) : (
                <><Send size={15} /> Publish Product</>
              )}
            </span>
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-[820px] mx-auto w-full px-8 py-8 max-md:px-4">
        <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-0">

          {/* General Information */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">General Information</h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Core details shown on your product listing.</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Product Name <span className="text-[#dc2626]">*</span></label>
                <input className={inputCls} type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Premium Cotton Fabric (Bulk)" />
              </div>

              <div>
                <label className={labelCls}>Product Description <span className="text-[#dc2626]">*</span></label>
                <textarea className={`${inputCls} resize-none`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe product quality, usage, certifications, etc." rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>HSN Code <span className="text-[#dc2626]">*</span></label>
                  <input className={inputCls} type="text" value={formData.hsnCode} onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} placeholder="e.g. 5208" />
                </div>
                <div>
                  <label className={labelCls}>Brand / Make</label>
                  <input className={inputCls} type="text" value={formData.brand ?? ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Reliance, own brand, etc." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Product Category <span className="text-[#dc2626]">*</span></label>
                  {categoriesError ? (
                    <div className="flex items-center gap-2 border border-[#fecaca] bg-[#fef2f2] rounded-[8px] px-3 py-2.5">
                      <span className="text-xs text-[#dc2626]">Failed to load categories.</span>
                      <button type="button" className="text-xs text-primary underline cursor-pointer bg-transparent border-none" onClick={() => { setCategoriesError(false); window.location.reload(); }}>Retry</button>
                    </div>
                  ) : (
                    <select className={inputCls} value={formData.categoryId || ''} onChange={handleCategoryChange}>
                      <option value="" disabled>Select a category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
                {availableSubcategories.length > 0 && (
                  <div>
                    <label className={labelCls}>Subcategory <span className="text-[#dc2626]">*</span></label>
                    <select className={inputCls} value={formData.subcategoryId || ''} onChange={e => setFormData({ ...formData, subcategoryId: e.target.value })}>
                      <option value="" disabled>Select a subcategory</option>
                      {availableSubcategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Supply */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Pricing &amp; Supply</h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Set your bulk pricing, unit and minimum order.</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Base Price (₹) <span className="text-[#dc2626]">*</span></label>
                  <div className="flex items-center border border-[#e2e8f0] rounded-[8px] bg-white focus-within:border-primary transition-colors">
                    <span className="px-3 py-2.5 text-sm text-[#94a3b8] font-bold border-r border-[#e2e8f0] bg-[#f8fafc] rounded-l-[8px] select-none">₹</span>
                    <input className="flex-1 border-none outline-none px-3 py-2.5 text-sm text-[#1e293b] bg-transparent rounded-r-[8px]" type="number" value={formData.basePrice || ''} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} min="1" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>MOQ <span className="text-[#dc2626]">*</span></label>
                  <input className={inputCls} type="number" value={formData.moq || ''} onChange={e => setFormData({ ...formData, moq: Number(e.target.value) })} min="1" placeholder="1" />
                </div>
                <div>
                  <label className={labelCls}>Unit <span className="text-[#dc2626]">*</span></label>
                  <select className={inputCls} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="litre">Litres</option>
                    <option value="meters">Meters</option>
                    <option value="box">Boxes</option>
                    <option value="set">Sets</option>
                    <option value="lots">Lots</option>
                    <option value="rolls">Rolls</option>
                    <option value="ton">Tonnes</option>
                    <option value="quintal">Quintal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Available Stock <span className="text-[#dc2626]">*</span></label>
                  <input className={inputCls} type="number" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} min="1" placeholder="e.g. 500" />
                  <p className="text-[11px] text-[#94a3b8] mt-1">Must be &gt; 0 to publish.</p>
                </div>
                <div>
                  <label className={labelCls}>Lead Time</label>
                  <input className={inputCls} type="text" value={formData.leadTime ?? ''} onChange={e => setFormData({ ...formData, leadTime: e.target.value })} placeholder="e.g. 7–10 days" />
                </div>
                <div>
                  <label className={labelCls}>Packaging Type</label>
                  <select className={inputCls} value={formData.packagingType ?? 'bulk'} onChange={e => setFormData({ ...formData, packagingType: e.target.value })}>
                    <option value="bulk">Bulk</option>
                    <option value="retail">Retail Pack</option>
                    <option value="custom">Custom Packaging</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Country of Origin</label>
                  <input className={inputCls} type="text" value={formData.countryOfOrigin ?? 'India'} onChange={e => setFormData({ ...formData, countryOfOrigin: e.target.value })} placeholder="India" />
                </div>
              </div>

              {/* GST Information */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">GST Information</span>

                </div>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div>
                    <label className={labelCls}>GST Rate <span className="text-[#dc2626]">*</span></label>
                    <select
                      className={inputCls}
                      value={formData.gstRate ?? 18}
                      onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    >
                      <option value={0}>0% — Exempt (e.g. fresh produce, grains)</option>
                      <option value={5}>5% — Essential goods</option>
                      <option value={12}>12% — Standard goods</option>
                      <option value={18}>18% — Most goods &amp; services</option>
                      <option value={28}>28% — Luxury / demerit goods</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Is GST included in your stated price? <span className="text-[#dc2626]">*</span></label>
                    <div className="flex gap-3 mt-1">
                      {[{ val: false, label: 'No — price is exclusive of GST' }, { val: true, label: 'Yes — price is GST inclusive' }].map(({ val, label }) => (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => setFormData({ ...formData, gstIncluded: val })}
                          className={`flex-1 px-3 py-2.5 rounded-[8px] text-xs font-bold border transition-all cursor-pointer text-left ${formData.gstIncluded === val
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary hover:text-primary'
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[#64748b] m-0">
                  {formData.gstIncluded
                    ? `Your price of ₹${formData.basePrice || 0} already includes ${formData.gstRate ?? 18}% GST. Buyers see this as the all-inclusive price.`
                    : `Your price of ₹${formData.basePrice || 0} is before tax. Buyers will see ₹${formData.basePrice || 0} + ${formData.gstRate ?? 18}% GST extra.`
                  }
                </p>
              </div>

              <div>
                <label className={labelCls}>Search Keywords</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-[#e2e8f0] rounded-[8px] min-h-[44px] items-center bg-white focus-within:border-primary">
                  {(formData.keywords ?? []).map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {kw}
                      <button type="button" onClick={() => setFormData({ ...formData, keywords: (formData.keywords ?? []).filter((_, idx) => idx !== i) })} className="bg-none border-none cursor-pointer text-[#c2410c] p-0 leading-none">×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const kw = keywordInput.trim().replace(/,$/, '');
                        if (kw && !(formData.keywords ?? []).includes(kw)) {
                          setFormData({ ...formData, keywords: [...(formData.keywords ?? []), kw] });
                        }
                        setKeywordInput('');
                      }
                    }}
                    placeholder={(formData.keywords ?? []).length === 0 ? 'e.g. cotton, fabric, bulk — press Enter to add' : '+ add keyword'}
                    className="border-none outline-none flex-1 min-w-[140px] text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Certifications</h3>
            <p className="text-sm text-[#64748b] mb-4 m-0">Select all certifications applicable to this product.</p>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATIONS.map(cert => {
                const checked = (formData.certifications || []).includes(cert);
                return (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleCertification(cert)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${checked ? 'bg-primary text-white border-primary' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-primary hover:text-primary'}`}
                  >
                    {cert}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Specifications */}
          <div className={sectionCls}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] m-0">Product Specifications</h3>
                <p className="text-sm text-[#64748b] mt-1 mb-0">
                  Add any product attributes — Material, GSM, Voltage, Capacity, etc.
                  {formData.category && getCategorySuggestions(formData.category).length > 0 && (
                    <span className="text-primary font-semibold"> Suggestions pre-filled for {formData.category}.</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={addSpecRow}
                className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary px-3 py-1.5 rounded-[8px] bg-white hover:bg-primary hover:text-white transition-all shrink-0 ml-4 cursor-pointer"
              >
                <Plus size={14} /> Add Attribute
              </button>
            </div>

            {specRows.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 mb-0.5 px-1">
                  <span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider">Attribute Name</span>
                  <span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider">Value</span>
                  <span />
                </div>
                {specRows.map(row => (
                  <div key={row.id} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
                    <input
                      className={inputCls}
                      type="text"
                      value={row.key}
                      onChange={e => updateSpecRow(row.id, 'key', e.target.value)}
                      placeholder="e.g. Material"
                    />
                    <input
                      className={inputCls}
                      type="text"
                      value={row.value}
                      onChange={e => updateSpecRow(row.id, 'value', e.target.value)}
                      placeholder="e.g. Oxford Cotton"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecRow(row.id)}
                      className="w-9 h-9 flex items-center justify-center text-[#dc2626] border border-[#fecaca] rounded-[8px] bg-white hover:bg-[#fef2f2] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#e2e8f0] rounded-[8px] p-6 text-center">
                <p className="text-sm text-[#94a3b8]">No attributes added yet.</p>
                <p className="text-xs text-[#94a3b8] mt-1">Select a category above or click "+ Add Attribute" to start.</p>
              </div>
            )}
          </div>

          {/* Product Images */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">
              Product Images <span className="text-[#dc2626]">*</span>
            </h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Upload up to 5 images. White background recommended.</p>

            <div className="flex flex-wrap gap-3">
              {formData.images?.map((url, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-[10px] overflow-hidden border border-[#e2e8f0]">
                  <img src={url} alt="Product" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-[rgba(0,0,0,0.55)] text-white rounded-full flex items-center justify-center cursor-pointer border-none p-0 hover:bg-[rgba(220,38,38,0.9)]">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(formData.images?.length || 0) < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-[#e2e8f0] rounded-[10px] flex flex-col items-center justify-center cursor-pointer text-[#94a3b8] hover:border-primary hover:text-primary transition-colors gap-1.5">
                  <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  <Plus size={28} />
                  <span className="text-xs font-semibold">Add Image</span>
                </label>
              )}
            </div>
          </div>

          {/* Required fields reminder */}
          {!isEditingPublished && (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] px-5 py-3 mb-5 text-xs text-[#92400e]">
              <span className="font-bold">Before publishing:</span> Name, Description, HSN Code, Category, Price &gt; 0, MOQ, Stock &gt; 0, and at least 1 image are required.
            </div>
          )}
        </form>
      </div>

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

      {showCropper && tempImage && (
        <Modal isOpen={true} onClose={() => setShowCropper(false)} title="Crop Product Image">
          <ImageCropper image={tempImage} onCropComplete={handleCropComplete} onCancel={() => setShowCropper(false)} />
        </Modal>
      )}
    </div>
  );
};

export default AddProductForm;
