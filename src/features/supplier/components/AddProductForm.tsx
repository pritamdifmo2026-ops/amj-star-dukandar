import React, { useState, useEffect } from 'react';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import productService, { type ProductInput } from '@/features/product/services/product.service';
import categoryService from '@/features/product/services/category.service';
import uploadService from '@/features/product/services/upload.service';
import ImageCropper from '@/features/product/components/ImageCropper';
import Modal from '@/shared/components/ui/Modal';
import { X, Plus, ChevronLeft, Save, Package } from 'lucide-react';
import styles from '../pages/SupplierDashboard.module.css';

interface AddProductFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingProduct?: any;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onBack, onSuccess, editingProduct }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    hsnCode: '',
    basePrice: 0,
    moq: 1,
    unit: 'pcs',
    category: '',
    images: [],
  });
  
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data.categories);
        if (data.categories.length > 0 && !editingProduct) {
          setFormData(prev => ({ ...prev, category: data.categories[0].name }));
        }
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, [editingProduct]);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        hsnCode: editingProduct.hsnCode || '',
        basePrice: editingProduct.basePrice || 0,
        moq: editingProduct.moq || 1,
        unit: editingProduct.unit || 'pcs',
        category: editingProduct.category || '',
        images: editingProduct.images || [],
      });
    }
  }, [editingProduct]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setLoading(true);
    try {
      const data = await uploadService.uploadImage(croppedBlob);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), data.url]
      }));
    } catch (err) {
      setMessageModal({
        isOpen: true,
        title: 'Upload Failed',
        message: 'Failed to upload image. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      setMessageModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please select a category for your product.',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, formData);
      } else {
        await productService.createProduct(formData);
      }
      onSuccess();
    } catch (err) {
      setMessageModal({
        isOpen: true,
        title: 'Submission Failed',
        message: editingProduct ? 'Failed to update product' : 'Failed to add product',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.fullPageFormContainer}>
      <header className={styles.formHeader}>
        <div className={styles.headerLeft}>
          <button onClick={onBack} className={styles.backBtn}>
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          <div className={styles.titleArea}>
            <Package size={24} className={styles.titleIcon} />
            <h2>{editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}</h2>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button variant="outline" onClick={onBack} disabled={loading}>Discard Changes</Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name}>
            {loading ? 'Processing...' : (
              <span className={styles.btnContent}>
                <Save size={18} /> {editingProduct ? 'Save Changes' : 'Publish Product'}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className={styles.formContent}>
        <form onSubmit={handleSubmit} className={styles.seriousForm}>
          <div className={styles.formSection}>
            <h3>General Information</h3>
            <p>Define how your product appears to buyers.</p>
            
            <div className={styles.formGroup}>
              <label>Product Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Premium Cotton Fabric (Bulk)"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Product Description <span className={styles.required}>*</span></label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe product quality, weave, weight, usage, etc. detailed descriptions help sell faster."
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>HSN Code <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  placeholder="e.g. 5208"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Product Category <span className={styles.required}>*</span></label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Pricing & Logistics</h3>
            <p>Set your bulk pricing and minimum order quantities.</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Base Price (₹) <span className={styles.required}>*</span></label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrefix}>₹</span>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Minimum Order Quantity (MOQ) <span className={styles.required}>*</span></label>
                <input
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Selling Unit <span className={styles.required}>*</span></label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="meters">Meters</option>
                  <option value="lots">Lots</option>
                  <option value="rolls">Rolls</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Product Media</h3>
            <p>Upload high-quality images. White background is highly recommended for bulk listings.</p>
            
            <div className={styles.imageGridContainer}>
              {formData.images?.map((url, idx) => (
                <div key={idx} className={styles.imageBox}>
                  <img src={url} alt="Product" />
                  <button type="button" onClick={() => removeImage(idx)} className={styles.deleteImgBtn}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              {(formData.images?.length || 0) < 5 && (
                <label className={styles.uploadBox}>
                  <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  <Plus size={32} />
                  <span>Add Image</span>
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
          <ImageCropper 
            image={tempImage} 
            onCropComplete={handleCropComplete} 
            onCancel={() => setShowCropper(false)} 
          />
        </Modal>
      )}
    </div>
  );
};

export default AddProductForm;
