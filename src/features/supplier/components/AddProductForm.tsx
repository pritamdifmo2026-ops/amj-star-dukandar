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

type CertDoc = { name: string; certificationTypeId: string; documentUrl: string; mandatory: boolean; adminRequired?: boolean; };

const PACKAGING_SIZES: Record<string, string[]> = {
  bulk: ['25 kg Bag', '50 kg Bag', '1 Ton Jumbo Bag', 'Custom Bulk'],
  retail: ['100g Pack', '250g Pack', '500g Pack', '1kg Box', 'Custom Retail'],
};

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

const getCategoryKeywords = (categoryName: string, subcategoryName?: string): string[] => {
  const n = categoryName.toLowerCase();
  const s = (subcategoryName || '').toLowerCase();
  const kws: string[] = [];

  if (categoryName) kws.push(categoryName.toLowerCase());
  if (subcategoryName) kws.push(subcategoryName.toLowerCase());

  if (n.includes('textile') || n.includes('fabric') || n.includes('cloth') || n.includes('garment') || n.includes('yarn')) {
    kws.push('fabric', 'textile', 'woven', 'knitted', 'wholesale fabric');
    if (s.includes('cotton')) kws.push('cotton', 'pure cotton', '100% cotton');
    if (s.includes('silk')) kws.push('silk', 'pure silk', 'mulberry silk');
    if (s.includes('polyester')) kws.push('polyester', 'synthetic fabric');
    if (s.includes('denim')) kws.push('denim', 'jeans fabric', 'indigo');
    if (s.includes('linen')) kws.push('linen', 'linen fabric');
    if (s.includes('wool')) kws.push('wool', 'woolen fabric');
  } else if (n.includes('food') || n.includes('agri') || n.includes('grain') || n.includes('spice') || n.includes('rice') || n.includes('dal') || n.includes('pulse')) {
    kws.push('food grade', 'fresh', 'agri', 'wholesale food');
    if (s.includes('organic')) kws.push('organic', 'certified organic', 'natural');
    if (s.includes('rice')) kws.push('rice', 'basmati', 'non-basmati');
    if (s.includes('spice') || s.includes('masala')) kws.push('spice', 'masala', 'seasoning');
    if (s.includes('dal') || s.includes('pulse') || s.includes('lentil')) kws.push('dal', 'lentils', 'pulses');
    if (s.includes('wheat') || s.includes('flour')) kws.push('wheat', 'flour', 'atta');
  } else if (n.includes('machin') || n.includes('equipment') || n.includes('industrial') || n.includes('tool')) {
    kws.push('industrial', 'machinery', 'equipment', 'heavy duty', 'manufacturing');
    if (s.includes('auto')) kws.push('automatic', 'automation', 'CNC');
    if (s.includes('pump')) kws.push('pump', 'hydraulic', 'water pump');
    if (s.includes('motor')) kws.push('motor', 'electric motor', 'AC motor');
    if (s.includes('conveyor')) kws.push('conveyor', 'conveyor belt');
  } else if (n.includes('chemical') || n.includes('raw material') || n.includes('plastic') || n.includes('polymer')) {
    kws.push('industrial grade', 'raw material', 'chemical');
    if (s.includes('plastic')) kws.push('plastic', 'polymer', 'resin', 'granules');
    if (s.includes('pigment') || s.includes('dye')) kws.push('pigment', 'dye', 'colorant');
    if (s.includes('solvent')) kws.push('solvent', 'industrial solvent');
  } else if (n.includes('electronic') || n.includes('electrical')) {
    kws.push('electronics', 'electrical', 'components', 'industrial electronics');
    if (s.includes('led')) kws.push('LED', 'LED light', 'energy saving');
    if (s.includes('wire') || s.includes('cable')) kws.push('wire', 'cable', 'electrical wire');
    if (s.includes('switch') || s.includes('panel')) kws.push('switchgear', 'control panel');
  } else if (n.includes('furniture') || n.includes('wood') || n.includes('timber')) {
    kws.push('furniture', 'wooden', 'timber', 'wholesale furniture');
    if (s.includes('plywood')) kws.push('plywood', 'marine ply', 'MDF');
    if (s.includes('office')) kws.push('office furniture', 'commercial furniture');
  } else if (n.includes('paper') || n.includes('packaging') || n.includes('stationery')) {
    kws.push('paper', 'packaging material', 'stationery', 'bulk paper');
    if (s.includes('corrugat')) kws.push('corrugated box', 'carton', 'shipping box');
    if (s.includes('kraft')) kws.push('kraft paper', 'kraft bag');
  } else if (n.includes('metal') || n.includes('steel') || n.includes('iron') || n.includes('aluminium') || n.includes('aluminum')) {
    kws.push('metal', 'steel', 'industrial metal', 'wholesale metal');
    if (s.includes('stainless')) kws.push('stainless steel', 'SS 304', 'SS 316');
    if (s.includes('alumin')) kws.push('aluminium', 'aluminium alloy', 'aluminium sheet');
    if (s.includes('pipe') || s.includes('tube')) kws.push('pipe', 'tube', 'hollow section');
  } else if (n.includes('pharma') || n.includes('medical') || n.includes('health')) {
    kws.push('pharmaceutical', 'medical grade', 'healthcare', 'bulk pharma');
  } else if (n.includes('cosmetic') || n.includes('beauty') || n.includes('personal care')) {
    kws.push('cosmetic', 'personal care', 'beauty', 'bulk cosmetic');
  }

  kws.push('bulk', 'wholesale', 'manufacturer', 'supplier');
  return [...new Set(kws)];
};

const VALUE_PLACEHOLDERS: [RegExp, string][] = [
  [/gsm/i, 'e.g. 120, 200, 350'],
  [/width|length|height|depth|size|dimension/i, 'e.g. 58 cm, 72 inch'],
  [/weight/i, 'e.g. 250 g, 1 kg'],
  [/color|colour/i, 'e.g. Navy Blue, Off-White'],
  [/pattern/i, 'e.g. Solid, Stripes, Checks'],
  [/fabric\s*type|material/i, 'e.g. Cotton, Polyester, Silk'],
  [/dye/i, 'e.g. Reactive, Pigment, Vat'],
  [/thread\s*count/i, 'e.g. 200, 300, 400 TC'],
  [/composition|content/i, 'e.g. 60% Cotton 40% Polyester'],
  [/origin|made\s*in/i, 'e.g. India, China, Bangladesh'],
  [/brand|make/i, 'e.g. Reliance, Own Brand'],
  [/voltage|power/i, 'e.g. 220V, 440V 3-Phase'],
  [/capacity/i, 'e.g. 500 kg/hr, 10 tons/day'],
  [/warranty/i, 'e.g. 12 months, 2 years'],
  [/automation/i, 'e.g. Semi-Auto, Fully Automatic'],
  [/purity/i, 'e.g. 99.5%'],
  [/shelf\s*life/i, 'e.g. 12 months, 18 months'],
  [/ingredient/i, 'e.g. Sugar, Salt, Maida'],
  [/fssai/i, 'e.g. 12345678901234'],
  [/organic/i, 'e.g. Yes, No, Certified'],
  [/harvest|season/i, 'e.g. Kharif, Rabi, Oct–Dec'],
  [/type/i, 'e.g. Woven, Knitted, Non-woven'],
  [/finish/i, 'e.g. Matte, Glossy, Satin'],
  [/count/i, 'e.g. 40s, 60s, 80s'],
  [/cas/i, 'e.g. 7647-14-5'],
  [/storage/i, 'e.g. Cool & Dry, Below 25°C'],
];

const getValuePlaceholder = (key: string): string => {
  for (const [regex, hint] of VALUE_PLACEHOLDERS) {
    if (regex.test(key)) return hint;
  }
  return 'Enter value';
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
    packagingSize: '',
    packagingDimensions: '',
    packagingWeight: '',
    countryOfOrigin: 'India',
    gstIncluded: false,
    gstRate: 18,
  });
  const [packagingWeightUnit, setPackagingWeightUnit] = useState('kg');
  const [certDocs, setCertDocs] = useState<Record<string, CertDoc>>({});
  const [uploadingCert, setUploadingCert] = useState<string | null>(null);
  const [publishAttempted, setPublishAttempted] = useState(false);
  const [isCustomSizeSelected, setIsCustomSizeSelected] = useState(false);
  const [availableCertTypes, setAvailableCertTypes] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false, title: '', message: '', type: 'info'
  });
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  const isDraftProduct = editingProduct?.status === 'DRAFT';
  const isEditingPublished = !!editingProduct && !isDraftProduct;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

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
    if (!formData.packagingType) missing.push('Packaging Type');
    if (!formData.packagingWeight?.trim()) missing.push('Package Weight');
    if (!formData.packagingSize?.trim()) missing.push('Package Size');
    if (!formData.packagingDimensions?.trim()) missing.push('Package Dimensions');
    Object.values(certDocs).forEach(d => {
      if (d.mandatory && !d.documentUrl.trim()) missing.push(`${d.name} compliance document`);
    });
    return missing;
  };

  const buildPayload = (status: 'DRAFT' | 'PENDING') => {
    const cleanData: any = {
      ...formData,
      specifications: rowsToSpecs(specRows),
      certificationDocs: Object.values(certDocs).filter(d => d.documentUrl.trim()),
      status,
    };
    if (!cleanData.categoryId) delete cleanData.categoryId;
    if (!cleanData.subcategoryId) delete cleanData.subcategoryId;
    return cleanData;
  };

  const handlePublish = async () => {
    const missingCerts = Object.values(certDocs).filter(d => d.mandatory && !d.documentUrl.trim());
    if (!isEditingPublished) {
      const missing = validateForPublish();
      if (missing.length > 0) {
        setPublishAttempted(true);
        showToast('Please complete all required fields before publishing');
        return;
      }
    } else if (missingCerts.length > 0) {
      setPublishAttempted(true);
      showToast('Please upload all required compliance documents');
      return;
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
    } catch (err: any) {
      if (err?.response?.status === 422) {
        setPublishAttempted(true);
        showToast(err.response.data?.message || 'Missing required compliance documents');
      } else {
        setMessageModal({ isOpen: true, type: 'error', title: 'Submission Failed', message: 'Could not publish product. Please try again.' });
      }
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

  const initCertDocs = (requiredCertifications: any[], existing?: any[]) => {
    const docsMap: Record<string, CertDoc> = {};
    (requiredCertifications || []).forEach((rc: any) => {
      const prev = existing?.find((d: any) => d.name?.toLowerCase() === rc.name?.toLowerCase());
      docsMap[rc.name] = {
        name: rc.name,
        certificationTypeId: rc.certificationTypeId || '',
        documentUrl: prev?.documentUrl || '',
        mandatory: rc.mandatory ?? true,
        adminRequired: true,
      };
    });
    // Re-attach any supplier-added certs from existing that aren't admin-required
    (existing || []).forEach((d: any) => {
      const alreadyIn = Object.keys(docsMap).some(k => k.toLowerCase() === d.name?.toLowerCase());
      if (!alreadyIn && d.documentUrl) {
        docsMap[d.name] = { name: d.name, certificationTypeId: d.certificationTypeId || '', documentUrl: d.documentUrl, mandatory: true, adminRequired: false };
      }
    });
    setCertDocs(docsMap);
  };

  const handleCertUpload = async (certName: string, file: File) => {
    setUploadingCert(certName);
    try {
      const res = await uploadService.uploadDoc(file);
      setCertDocs(prev => ({ ...prev, [certName]: { ...prev[certName], documentUrl: res.url } }));
    } catch {
      setMessageModal({ isOpen: true, type: 'error', title: 'Upload Failed', message: `Failed to upload ${certName} document. Please try again.` });
    } finally {
      setUploadingCert(null);
    }
  };

  const addSpecRow = () => setSpecRows(prev => [...prev, { id: Date.now().toString(), key: '', value: '' }]);
  const updateSpecRow = (id: string, field: 'key' | 'value', val: string) =>
    setSpecRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  const removeSpecRow = (id: string) => setSpecRows(prev => prev.filter(r => r.id !== id));

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [catData, certTypesData] = await Promise.all([
          categoryService.getAll(),
          categoryService.getCertTypes(),
        ]);
        const data = catData;
        setCategories(data.categories);
        setAvailableCertTypes((certTypesData.data || []).filter((ct: any) => ct.isActive !== false));

        if (editingProduct) {
          const wStr: string = editingProduct.packagingWeight || '';
          const wUnitMatch = wStr.match(/\s*(g|kg|lbs|ton|mt)\s*$/i);
          if (wUnitMatch) setPackagingWeightUnit(wUnitMatch[1].toLowerCase());

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
            packagingSize: editingProduct.packagingSize || '',
            packagingDimensions: editingProduct.packagingDimensions || '',
            packagingWeight: wStr,
            countryOfOrigin: editingProduct.countryOfOrigin || 'India',
            gstIncluded: editingProduct.gstIncluded ?? false,
            gstRate: editingProduct.gstRate ?? 18,
          });
          setSpecRows(specsToRows(editingProduct.specifications || {}));

          const pType = editingProduct.packagingType || 'bulk';
          const pSize = editingProduct.packagingSize || '';
          if (pType === 'bulk' || pType === 'retail') {
            const standardSizes = PACKAGING_SIZES[pType] || [];
            const isCustom = pSize !== '' && !standardSizes.slice(0, -1).includes(pSize);
            setIsCustomSizeSelected(isCustom);
          } else {
            setIsCustomSizeSelected(false);
          }

          const catForEdit = editingProduct.categoryId
            ? data.categories.find((c: any) => c._id === editingProduct.categoryId)
            : data.categories.find((c: any) => c.name === editingProduct.category);
          if (catForEdit?.subcategories) setAvailableSubcategories(catForEdit.subcategories);
          if (catForEdit?.requiredCertifications?.length) {
            initCertDocs(catForEdit.requiredCertifications, editingProduct.certificationDocs || []);
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
      setFormData(prev => {
        const autoKeywords = (prev.keywords ?? []).length === 0 ? getCategoryKeywords(cat.name) : prev.keywords ?? [];
        return { ...prev, categoryId: cat._id, category: cat.name, subcategoryId: '', keywords: autoKeywords };
      });
      setAvailableSubcategories(cat.subcategories || []);
      initCertDocs(cat.requiredCertifications || []);
      const allRowsEmpty = specRows.every(r => r.value.trim() === '');
      if (allRowsEmpty) {
        const suggestions = getCategorySuggestions(cat.name);
        setSpecRows(suggestions.map((key, i) => ({ id: `s-${i}`, key, value: '' })));
      }
    } else {
      setFormData(prev => ({ ...prev, categoryId: '', category: '', subcategoryId: '' }));
      setAvailableSubcategories([]);
      setCertDocs({});
    }
  };

  const handlePackagingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    let defaultSize = '';
    if (type === 'bulk') {
      defaultSize = '25 kg Bag';
    } else if (type === 'retail') {
      defaultSize = '100g Pack';
    }
    setFormData(prev => ({
      ...prev,
      packagingType: type,
      packagingSize: defaultSize,
    }));
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
    setSubmitting('publish');
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

        <div className="flex gap-2.5 items-center">
          <button
            onClick={handleDiscard}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-[#64748b] bg-transparent border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
          >
            Discard
          </button>

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
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">General Information</h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Core details shown on your product listing.</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Product Name <span className="text-[#dc2626]">*</span></label>
                <input className={`${inputCls} ${publishAttempted && !formData.name.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`} type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Premium Cotton Fabric (Bulk)" />
                {publishAttempted && !formData.name.trim() && (
                  <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                )}
              </div>

              <div>
                <label className={labelCls}>Product Description <span className="text-[#dc2626]">*</span></label>
                <textarea className={`${inputCls} resize-none ${publishAttempted && !formData.description.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe product quality, usage, certifications, etc." rows={4} />
                {publishAttempted && !formData.description.trim() && (
                  <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>HSN Code <span className="text-[#dc2626]">*</span></label>
                  <input className={`${inputCls} ${publishAttempted && !formData.hsnCode.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`} type="text" value={formData.hsnCode} onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} placeholder="e.g. 5208" />
                  {publishAttempted && !formData.hsnCode.trim() && (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  )}
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
                    <select className={`${inputCls} ${publishAttempted && !formData.categoryId && !formData.category ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`} value={formData.categoryId || ''} onChange={handleCategoryChange}>
                      <option value="" disabled>Select a category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  )}
                  {publishAttempted && !formData.categoryId && !formData.category && (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  )}
                </div>
                {availableSubcategories.length > 0 && (
                  <div>
                    <label className={labelCls}>Subcategory <span className="text-[#dc2626]">*</span></label>
                    <select
                      className={`${inputCls} ${publishAttempted && !formData.subcategoryId ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`}
                      value={formData.subcategoryId || ''}
                      onChange={e => {
                        const subId = e.target.value;
                        const sub = availableSubcategories.find(s => s._id === subId);
                        setFormData(prev => {
                          const extraKws = sub ? getCategoryKeywords(prev.category, sub.name).filter(kw => !(prev.keywords ?? []).includes(kw)) : [];
                          return { ...prev, subcategoryId: subId, keywords: [...(prev.keywords ?? []), ...extraKws] };
                        });
                      }}
                    >
                      <option value="" disabled>Select a subcategory</option>
                      {availableSubcategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                    </select>
                    {publishAttempted && !formData.subcategoryId && (
                      <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Pricing &amp; Supply</h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Set your bulk pricing, unit and minimum order.</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Base Price (₹) <span className="text-[#dc2626]">*</span></label>
                  <div className={`flex items-center border rounded-[8px] bg-white focus-within:border-primary transition-colors ${publishAttempted && (!formData.basePrice || formData.basePrice <= 0) ? "border-[#fca5a5] bg-[#fff5f5]" : "border-[#e2e8f0]"}`}>
                    <span className="px-3 py-2.5 text-sm text-[#94a3b8] font-bold border-r border-[#e2e8f0] bg-[#f8fafc] rounded-l-[8px] select-none">₹</span>
                    <input className="flex-1 border-none outline-none px-3 py-2.5 text-sm text-[#1e293b] bg-transparent rounded-r-[8px]" type="number" value={formData.basePrice || ''} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} min="1" placeholder="0" />
                  </div>
                  {publishAttempted && (!formData.basePrice || formData.basePrice <= 0) && (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  )}
                </div>
                <div>
                  <label className={labelCls}>MOQ <span className="text-[#dc2626]">*</span></label>
                  <input className={`${inputCls} ${publishAttempted && (!formData.moq || formData.moq < 1) ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`} type="number" value={formData.moq || ''} onChange={e => setFormData({ ...formData, moq: Number(e.target.value) })} min="1" placeholder="1" />
                  {publishAttempted && (!formData.moq || formData.moq < 1) && (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  )}
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
                  <input className={`${inputCls} ${publishAttempted && (!formData.stock || formData.stock <= 0) ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`} type="number" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} min="1" placeholder="e.g. 500" />
                  {publishAttempted && (!formData.stock || formData.stock <= 0) ? (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  ) : (
                    <p className="text-[11px] text-[#94a3b8] mt-1">Must be &gt; 0 to publish.</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Lead Time</label>
                  <div className="relative flex items-center">
                    <input
                      className={`${inputCls} pr-14 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                      type="number"
                      min="1"
                      value={formData.leadTime ? (parseInt(formData.leadTime) || '') : ''}
                      onChange={e => setFormData({ ...formData, leadTime: e.target.value ? `${e.target.value} Days` : '' })}
                      placeholder="e.g. 7"
                      onWheel={e => e.currentTarget.blur()}
                    />
                    <span className="absolute right-3 text-sm text-[#94a3b8] font-medium pointer-events-none select-none">Days</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Packaging Type <span className="text-[#dc2626]">*</span></label>
                  <select className={inputCls} value={formData.packagingType ?? 'bulk'} onChange={handlePackagingTypeChange}>
                    <option value="bulk">Bulk</option>
                    <option value="retail">Retail Pack</option>
                    <option value="custom">Custom Packaging</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Package Weight <span className="text-[#dc2626]">*</span></label>
                  <div className="flex gap-2">
                    <input
                      className={`${inputCls} ${publishAttempted && !formData.packagingWeight?.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`}
                      type="text"
                      inputMode="decimal"
                      value={formData.packagingWeight ? formData.packagingWeight.replace(/\s*(g|kg|lbs|ton|mt)\s*$/i, '').trim() : ''}
                      onChange={e => {
                        const num = e.target.value.replace(/[^0-9.]/g, '');
                        setFormData(prev => ({ ...prev, packagingWeight: num ? `${num} ${packagingWeightUnit}` : '' }));
                      }}
                      placeholder="e.g. 500"
                    />
                    <select
                      className="border border-[#e2e8f0] rounded-[8px] px-2 py-2.5 text-sm text-[#1e293b] bg-white outline-none focus:border-primary transition-colors shrink-0"
                      value={packagingWeightUnit}
                      onChange={e => {
                        const newUnit = e.target.value;
                        setPackagingWeightUnit(newUnit);
                        const num = (formData.packagingWeight || '').replace(/\s*(g|kg|lbs|ton|mt)\s*$/i, '').trim();
                        if (num) setFormData(prev => ({ ...prev, packagingWeight: `${num} ${newUnit}` }));
                      }}
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                      <option value="ton">ton</option>
                      <option value="mt">mt</option>
                    </select>
                  </div>
                  {publishAttempted && !formData.packagingWeight?.trim() && (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Package Size <span className="text-[#dc2626]">*</span></label>
                  {(() => {
                    const currentType = formData.packagingType || 'bulk';
                    if (currentType === 'custom') {
                      return (
                        <input
                          className={`${inputCls} ${publishAttempted && !formData.packagingSize?.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`}
                          type="text"
                          value={formData.packagingSize ?? ''}
                          onChange={e => setFormData({ ...formData, packagingSize: e.target.value })}
                          placeholder="e.g. 50kg Drum, 10L Can"
                        />
                      );
                    }
                    const options = PACKAGING_SIZES[currentType] || [];
                    const dropdownValue = isCustomSizeSelected ? options[options.length - 1] : (formData.packagingSize || options[0] || '');
                    return (
                      <div className="flex flex-col gap-2">
                        <select
                          className={`${inputCls} ${publishAttempted && !formData.packagingSize?.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`}
                          value={dropdownValue}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'Custom Bulk' || val === 'Custom Retail') {
                              setIsCustomSizeSelected(true);
                              setFormData({ ...formData, packagingSize: '' });
                            } else {
                              setIsCustomSizeSelected(false);
                              setFormData({ ...formData, packagingSize: val });
                            }
                          }}
                        >
                          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {isCustomSizeSelected && (
                          <input
                            className={`${inputCls} ${publishAttempted && !formData.packagingSize?.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`}
                            type="text"
                            value={formData.packagingSize ?? ''}
                            onChange={e => setFormData({ ...formData, packagingSize: e.target.value })}
                            placeholder={`Enter custom ${currentType === 'bulk' ? 'bulk' : 'retail'} size (e.g. 15 kg Box)`}
                            autoFocus
                          />
                        )}
                      </div>
                    );
                  })()}
                  {publishAttempted && !formData.packagingSize?.trim() && (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Package Dimensions <span className="text-[#dc2626]">*</span></label>
                  <input
                    className={`${inputCls} ${publishAttempted && !formData.packagingDimensions?.trim() ? "border-[#fca5a5] bg-[#fff5f5] focus:border-[#dc2626]" : ""}`}
                    type="text"
                    value={formData.packagingDimensions ?? ''}
                    onChange={e => setFormData({ ...formData, packagingDimensions: e.target.value })}
                    placeholder="e.g. 20×15×10 cm"
                  />
                  {publishAttempted && !formData.packagingDimensions?.trim() && (
                    <span className="text-xs text-[#dc2626] font-semibold mt-1 block">This field is required</span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-[#64748b] -mt-2">Packaging details are used for logistics and courier calculations.</p>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Country of Origin</label>
                  <input className={inputCls} type="text" value={formData.countryOfOrigin ?? 'India'} onChange={e => setFormData({ ...formData, countryOfOrigin: e.target.value })} placeholder="India" />
                </div>
                <div />
              </div>

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
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, keywords: (prev.keywords ?? []).filter((_, idx) => idx !== i) }))} className="bg-none border-none cursor-pointer text-[#c2410c] p-0 leading-none">×</button>
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
                          setFormData(prev => ({ ...prev, keywords: [...(prev.keywords ?? []), kw] }));
                        }
                        setKeywordInput('');
                      }
                    }}
                    placeholder={(formData.keywords ?? []).length === 0 ? 'e.g. cotton, fabric, bulk — press Enter to add' : '+ add keyword'}
                    className="border-none outline-none flex-1 min-w-[140px] text-sm bg-transparent"
                  />
                </div>
                {(() => {
                  const subName = availableSubcategories.find(s => s._id === formData.subcategoryId)?.name;
                  const pending = formData.category
                    ? getCategoryKeywords(formData.category, subName).filter(kw => !(formData.keywords ?? []).includes(kw))
                    : [];
                  if (!pending.length) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                      <span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider shrink-0">Suggested:</span>
                      {pending.map(kw => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, keywords: [...(prev.keywords ?? []), kw] }))}
                          className="inline-flex items-center gap-0.5 bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] rounded-full px-2.5 py-0.5 text-xs font-medium hover:bg-[#fff7ed] hover:text-[#c2410c] hover:border-[#fed7aa] transition-colors cursor-pointer"
                        >
                          + {kw}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Compliance Documents */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Compliance Documents</h3>
            <p className="text-sm text-[#64748b] mb-4 m-0">
              Upload certification documents for this product. Products with any certifications go to admin review before going live.
            </p>

            {/* Cert type picker — supplier can add certs beyond admin-required ones */}
            {availableCertTypes.length > 0 && (() => {
              const addable = availableCertTypes.filter(ct => !certDocs[ct.name]);
              if (!addable.length) return null;
              return (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2">Add Certifications Your Product Has</p>
                  <div className="flex flex-wrap gap-2">
                    {addable.map(ct => (
                      <button
                        key={ct._id}
                        type="button"
                        onClick={() => setCertDocs(prev => ({
                          ...prev,
                          [ct.name]: { name: ct.name, certificationTypeId: ct._id, documentUrl: '', mandatory: true, adminRequired: false },
                        }))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#475569] border border-[#e2e8f0] rounded-full bg-white hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        <Plus size={11} /> {ct.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {Object.keys(certDocs).length === 0 ? (
              <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3">
                <span className="text-sm text-[#94a3b8]">
                  {formData.categoryId
                    ? 'No compliance documents required for this category. You can still add certifications above.'
                    : 'Select a category to see required compliance documents.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.values(certDocs).map(doc => {
                  const hasError = publishAttempted && doc.mandatory && !doc.documentUrl;
                  return (
                    <div key={doc.name} className={`flex items-center gap-3 border rounded-[8px] px-4 py-3 transition-colors ${hasError ? 'border-[#fca5a5] bg-[#fff5f5]' : 'border-[#e2e8f0] bg-white'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#1e293b]">{doc.name}</span>
                          {doc.adminRequired ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#fef2f2] text-[#dc2626] border-[#fecaca]">Required</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]">Added by you</span>
                          )}
                        </div>
                        {doc.documentUrl ? (
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate block">
                            Document uploaded — view file
                          </a>
                        ) : hasError ? (
                          <span className="text-xs text-[#dc2626] font-semibold">Required — please upload before publishing</span>
                        ) : (
                          <span className="text-xs text-[#94a3b8]">No document uploaded yet</span>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {uploadingCert === doc.name ? (
                          <span className="text-xs text-[#64748b] px-3 py-2 animate-pulse">Uploading...</span>
                        ) : (
                          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary border border-primary rounded-[8px] cursor-pointer hover:bg-primary hover:text-white transition-colors">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              hidden
                              onChange={e => {
                                if (e.target.files?.[0]) handleCertUpload(doc.name, e.target.files[0]);
                              }}
                            />
                            {doc.documentUrl ? 'Replace' : 'Upload'}
                          </label>
                        )}
                        {!doc.adminRequired && (
                          <button
                            type="button"
                            onClick={() => setCertDocs(prev => { const next = { ...prev }; delete next[doc.name]; return next; })}
                            className="w-8 h-8 flex items-center justify-center text-[#94a3b8] border border-[#e2e8f0] rounded-[8px] bg-white hover:text-[#dc2626] hover:border-[#fecaca] transition-colors cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                      placeholder={getValuePlaceholder(row.key)}
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
          <div className={`${sectionCls} ${publishAttempted && (!formData.images || formData.images.length === 0) ? "border-[#fca5a5] bg-[#fff5f5]" : ""}`}>
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
            {publishAttempted && (!formData.images || formData.images.length === 0) && (
              <span className="text-xs text-[#dc2626] font-semibold mt-3 block">At least 1 product image is required</span>
            )}
          </div>

          {/* Required fields reminder */}
          {!isEditingPublished && (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] px-5 py-3 mb-5 text-xs text-[#92400e]">
              <span className="font-bold">Before publishing:</span> Name, Description, HSN Code, Category, Price &gt; 0, MOQ, Stock &gt; 0, at least 1 image, and all 4 packaging fields are required.
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

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1e293b] text-white px-5 py-3 rounded-[10px] shadow-lg text-sm font-semibold whitespace-nowrap animate-[fadeInUp_0.2s_ease]">
          <span className="w-5 h-5 rounded-full bg-[#dc2626] flex items-center justify-center text-white text-xs font-bold shrink-0">!</span>
          {toast}
        </div>
      )}
    </div>
  );
};

export default AddProductForm;
