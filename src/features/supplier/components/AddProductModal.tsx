import React, { useState, useEffect } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import productService, { type ProductInput } from '@/features/product/services/product.service';
import categoryService from '@/features/product/services/category.service';
import uploadService from '@/features/product/services/upload.service';
import ImageCropper from '@/features/product/components/ImageCropper';
import { X, Plus } from 'lucide-react';
import styles from './AddProductModal.module.css';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: any;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSuccess, editingProduct }) => {
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
    } else {
      setFormData({
        name: '',
        description: '',
        hsnCode: '',
        basePrice: 0,
        moq: 1,
        unit: 'pcs',
        category: categories[0]?.name || '',
        images: [],
      });
    }
  }, [editingProduct, isOpen, categories]);

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setFormData(prev => ({ ...prev, category: data.categories[0].name }));
        }
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

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
      onClose();
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

  if (showCropper && tempImage) {
    return (
      <Modal isOpen={true} onClose={() => setShowCropper(false)} title="Crop Product Image">
        <ImageCropper 
          image={tempImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setShowCropper(false)} 
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Edit Product' : 'Add New Product'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name}>
            {loading ? 'Processing...' : editingProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </>
      }
    >
      <form className={styles.modalForm}>
        <div className={styles.formGroup}>
          <label>Product Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Premium Cotton Fabric"
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>HSN Code</label>
            <input
              type="text"
              value={formData.hsnCode}
              onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
              placeholder="e.g. 5208"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              {categories.length === 0 && <option value="">Loading categories...</option>}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your product quality, usage, etc."
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Price (₹)</label>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
              min="0"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>MOQ</label>
            <input
              type="number"
              value={formData.moq}
              onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) })}
              min="1"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Unit</label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <option value="pcs">Pieces</option>
            <option value="kg">Kilograms</option>
            <option value="meters">Meters</option>
            <option value="lots">Lots</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Product Images (White background preferred)</label>
          <div className={styles.imageGrid}>
            {formData.images?.map((url, idx) => (
              <div key={idx} className={styles.imagePreview}>
                <img src={url} alt="Preview" />
                <button type="button" onClick={() => removeImage(idx)} className={styles.removeImg}>
                  <X size={14} />
                </button>
              </div>
            ))}
            {(formData.images?.length || 0) < 5 && (
              <label className={styles.uploadPlaceholder}>
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                <Plus size={24} />
                <span>Upload</span>
              </label>
            )}
          </div>
        </div>
      </form>
      <MessageModal 
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </Modal>
  );
};

export default AddProductModal;
