import React, { useState, useEffect } from 'react';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import productService, { type ProductInput } from '@/features/product/services/product.service';
import categoryService from '@/features/product/services/category.service';
import uploadService from '@/features/product/services/upload.service';
import ImageCropper from '@/features/product/components/ImageCropper';
import Modal from '@/shared/components/ui/Modal';
import { X, Plus, ChevronLeft, Save, Package } from 'lucide-react';

interface AddProductFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingProduct?: any;
}

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] bg-[#f8fafc] outline-none focus:border-primary";
const labelCls = "block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-1.5";
const sectionCls = "bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-5";

const AddProductForm: React.FC<AddProductFormProps> = ({ onBack, onSuccess, editingProduct }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);
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
  });
  const [keywordInput, setKeywordInput] = useState('');

  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

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
          });

          if (editingProduct.categoryId) {
            const cat = data.categories.find((c: any) => c._id === editingProduct.categoryId);
            if (cat && cat.subcategories) setAvailableSubcategories(cat.subcategories);
          } else if (editingProduct.category) {
            const cat = data.categories.find((c: any) => c.name === editingProduct.category);
            if (cat && cat.subcategories) setAvailableSubcategories(cat.subcategories);
          }
        } else if (data.categories.length > 0) {
          setFormData(prev => ({ ...prev, category: data.categories[0].name, categoryId: data.categories[0]._id }));
          if (data.categories[0].subcategories) setAvailableSubcategories(data.categories[0].subcategories);
        }
      } catch (err) {
        console.error('Failed to fetch categories');
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
    setLoading(true);
    try {
      const data = await uploadService.uploadImage(croppedBlob);
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), data.url] }));
    } catch (err) {
      setMessageModal({ isOpen: true, title: 'Upload Failed', message: 'Failed to upload image. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId && !formData.category) {
      setMessageModal({ isOpen: true, title: 'Validation Error', message: 'Please select a category for your product.', type: 'error' });
      return;
    }
    if (availableSubcategories.length > 0 && !formData.subcategoryId) {
      setMessageModal({ isOpen: true, title: 'Validation Error', message: 'Please select a subcategory for your product.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const cleanData: any = { ...formData };
      if (!cleanData.categoryId) delete cleanData.categoryId;
      if (!cleanData.subcategoryId) delete cleanData.subcategoryId;

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id || editingProduct._id, cleanData);
      } else {
        await productService.createProduct(formData);
      }
      onSuccess();
    } catch (err) {
      setMessageModal({ isOpen: true, title: 'Submission Failed', message: editingProduct ? 'Failed to update product' : 'Failed to add product', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-10 bg-white border-b border-[#eef2f6] px-8 py-4 flex justify-between items-center max-md:px-4 max-md:flex-col max-md:gap-3">
        <div className="flex flex-col gap-1">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#64748b] font-semibold bg-none border-none cursor-pointer p-0 hover:text-primary transition-colors">
            <ChevronLeft size={18} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Package size={22} className="text-primary" />
            <h2 className="text-lg font-extrabold text-[#0f172a] m-0">
              {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
            </h2>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={loading}>Discard Changes</Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name}>
            {loading ? 'Processing...' : (
              <span className="flex items-center gap-2">
                <Save size={16} /> {editingProduct ? 'Save Changes' : 'Publish Product'}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-[820px] mx-auto w-full px-8 py-8 max-md:px-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          {/* General Information */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">General Information</h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Define how your product appears to buyers.</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Product Name <span className="text-[#dc2626]">*</span></label>
                <input className={inputCls} type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Premium Cotton Fabric (Bulk)" required />
              </div>

              <div>
                <label className={labelCls}>Product Description <span className="text-[#dc2626]">*</span></label>
                <textarea className={`${inputCls} resize-none`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe product quality, weave, weight, usage, etc." rows={4} required />
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>HSN Code <span className="text-[#dc2626]">*</span></label>
                  <input className={inputCls} type="text" value={formData.hsnCode} onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} placeholder="e.g. 5208" required />
                </div>
                <div>
                  <label className={labelCls}>Product Category <span className="text-[#dc2626]">*</span></label>
                  <select className={inputCls} value={formData.categoryId || formData.category} onChange={handleCategoryChange} required>
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    {!categories.some(c => c.name === formData.category || c._id === formData.categoryId) && formData.category && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                  </select>
                </div>
                {availableSubcategories.length > 0 && (
                  <div>
                    <label className={labelCls}>Subcategory <span className="text-[#dc2626]">*</span></label>
                    <select className={inputCls} value={formData.subcategoryId || ''} onChange={e => setFormData({ ...formData, subcategoryId: e.target.value })} required>
                      <option value="" disabled>Select a subcategory</option>
                      {availableSubcategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Logistics */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Pricing &amp; Logistics</h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Set your bulk pricing and minimum order quantities.</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Base Price (₹) <span className="text-[#dc2626]">*</span></label>
                  <div className="flex items-center border border-[#e2e8f0] rounded-[8px] bg-[#f8fafc] focus-within:border-primary overflow-hidden">
                    <span className="px-3 py-2.5 text-sm text-[#94a3b8] font-bold border-r border-[#e2e8f0] bg-[#f1f5f9]">₹</span>
                    <input className="flex-1 border-none outline-none px-3 py-2.5 text-sm text-[#1e293b] bg-transparent" type="number" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} min="0" required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>MOQ <span className="text-[#dc2626]">*</span></label>
                  <input className={inputCls} type="number" value={formData.moq} onChange={e => setFormData({ ...formData, moq: Number(e.target.value) })} min="1" required />
                </div>
                <div>
                  <label className={labelCls}>Selling Unit <span className="text-[#dc2626]">*</span></label>
                  <select className={inputCls} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} required>
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="meters">Meters</option>
                    <option value="lots">Lots</option>
                    <option value="rolls">Rolls</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className={labelCls}>Available Stock (Units)</label>
                  <input className={inputCls} type="number" value={formData.stock ?? 0} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} min="0" placeholder="e.g. 500" />
                </div>
                <div>
                  <label className={labelCls}>Brand Name</label>
                  <input className={inputCls} type="text" value={formData.brand ?? ''} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Reliance Industries" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Search Keywords</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-[#e2e8f0] rounded-[8px] min-h-[44px] items-center bg-[#f8fafc] focus-within:border-primary">
                  {(formData.keywords ?? []).map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {kw}
                      <button type="button" onClick={() => setFormData({ ...formData, keywords: (formData.keywords ?? []).filter((_, idx) => idx !== i) })} className="bg-none border-none cursor-pointer text-[#c2410c] p-0 leading-none text-sm">×</button>
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
                    placeholder={(formData.keywords ?? []).length === 0 ? 'e.g. cotton, fabric, bulk...' : ''}
                    className="border-none outline-none flex-1 min-w-[120px] text-sm bg-transparent"
                  />
                </div>
                <p className="text-xs text-[#94a3b8] mt-1">Press Enter or comma to add. Keywords help buyers discover your product.</p>
              </div>
            </div>
          </div>

          {/* Product Media */}
          <div className={sectionCls}>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Product Media</h3>
            <p className="text-sm text-[#64748b] mb-5 m-0">Upload high-quality images. White background is highly recommended.</p>

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
        </form>
      </div>

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => {
          setMessageModal({ ...messageModal, isOpen: false });
          if (messageModal.type === 'success') onBack();
        }}
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
