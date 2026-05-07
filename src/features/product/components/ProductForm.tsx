import React, { useState, useEffect } from 'react';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import type { CreateProductPayload } from '../types';
import categoryService from '../services/category.service';
import styles from './ProductForm.module.css';

interface Props {
  initialValues?: Partial<CreateProductPayload>;
  onSubmit: (data: CreateProductPayload) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const ProductForm: React.FC<Props> = ({
  initialValues = {},
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Product',
}) => {
  const [form, setForm] = useState<CreateProductPayload>({
    name: initialValues.name || '',
    description: initialValues.description || '',
    price: initialValues.price || 0,
    unit: initialValues.unit || 'piece',
    minOrderQty: initialValues.minOrderQty || 1,
    stock: initialValues.stock || 0,
    category: initialValues.category || '',
    categoryId: initialValues.categoryId || '',
    subcategoryId: initialValues.subcategoryId || '',
    gstRate: initialValues.gstRate || 18,
    images: initialValues.images || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [categories, setCategories] = useState<any[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);

  useEffect(() => {
    categoryService.getAll().then(data => {
      if (data.categories) {
        setCategories(data.categories);
        // If editing and category is set, load subcategories
        if (initialValues.categoryId) {
          const cat = data.categories.find((c: any) => c._id === initialValues.categoryId);
          if (cat && cat.subcategories) {
            setAvailableSubcategories(cat.subcategories);
          }
        } else if (initialValues.category) {
          // Fallback if only category string is provided
          const cat = data.categories.find((c: any) => c.name === initialValues.category);
          if (cat && cat.subcategories) {
            setAvailableSubcategories(cat.subcategories);
          }
        }
      }
    }).catch(err => console.error(err));
  }, [initialValues]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    else if (form.name.length < 3) newErrors.name = 'Name must be at least 3 characters';

    if (!form.categoryId && !form.category) newErrors.category = 'Please select a category';
    if (availableSubcategories.length > 0 && !form.subcategoryId) {
      newErrors.subcategoryId = 'Please select a subcategory';
    }
    if (form.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (form.minOrderQty <= 0) newErrors.minOrderQty = 'MOQ must be at least 1';
    if (form.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (!form.unit.trim()) newErrors.unit = 'Unit is required (e.g., piece, kg)';
    if (!form.description.trim()) newErrors.description = 'Description is required';

    if (form.images.length === 0 || !form.images[0].trim()) {
      newErrors.images = 'At least one product image URL is required';
    } else {
      try {
        new URL(form.images[0]);
      } catch {
        newErrors.images = 'Please enter a valid image URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const cat = categories.find(c => c._id === selectedId);
    
    if (cat) {
      setForm(prev => ({ 
        ...prev, 
        categoryId: cat._id, 
        category: cat.name,
        subcategoryId: '' // reset subcategory when category changes
      }));
      setAvailableSubcategories(cat.subcategories || []);
    } else {
      setForm(prev => ({ 
        ...prev, 
        categoryId: '', 
        category: '',
        subcategoryId: '' 
      }));
      setAvailableSubcategories([]);
    }

    if (errors.category) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.category;
        return updated;
      });
    }
  };

  const set = (field: keyof CreateProductPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      
      if (field === 'images') {
        setForm((prev) => ({ ...prev, images: [val as string] }));
      } else {
        setForm((prev) => ({ ...prev, [field]: val }));
      }
      // Clear error on change
      if (errors[field]) {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <Input 
          label="Product Name" 
          value={form.name} 
          onChange={set('name')} 
          fullWidth 
          required 
          error={errors.name}
        />
        <div className={styles.field}>
          <label className={styles.label}>Category</label>
          <select 
            className={`${styles.select} ${errors.category ? styles.errorBorder : ''}`} 
            value={form.categoryId || form.category} // form.category is for backward compatibility if categoryId isn't set
            onChange={handleCategoryChange} 
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            {/* Fallback for old data where category string was stored but no ID */}
            {!categories.some(c => c.name === form.category || c._id === form.categoryId) && form.category && (
              <option value={form.category}>{form.category}</option>
            )}
          </select>
          {errors.category && <span className={styles.errorText}>{errors.category}</span>}
        </div>
        
        {availableSubcategories.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>Subcategory</label>
            <select 
              className={`${styles.select} ${errors.subcategoryId ? styles.errorBorder : ''}`} 
              value={form.subcategoryId || ''} 
              onChange={set('subcategoryId')} 
              required
            >
              <option value="">Select subcategory</option>
              {availableSubcategories.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
            </select>
            {errors.subcategoryId && <span className={styles.errorText}>{errors.subcategoryId}</span>}
          </div>
        )}
        
        <Input label="Price (₹)" type="number" value={form.price} onChange={set('price')} fullWidth required error={errors.price} />
        <Input label="Unit" value={form.unit} onChange={set('unit')} placeholder="e.g. piece, kg, box" fullWidth required error={errors.unit} />
        <Input label="Min. Order Qty" type="number" value={form.minOrderQty} onChange={set('minOrderQty')} fullWidth required error={errors.minOrderQty} />
        <Input label="Stock" type="number" value={form.stock} onChange={set('stock')} fullWidth required error={errors.stock} />
        <div className={styles.field}>
          <label className={styles.label}>GST Rate (%)</label>
          <select className={styles.select} value={form.gstRate} onChange={set('gstRate')}>
            {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        <div className={`${styles.field} ${styles.fullSpan}`}>
          <label className={styles.label}>Product Image URL</label>
          <Input 
            value={form.images[0] || ''} 
            onChange={set('images')} 
            placeholder="Paste image link here" 
            fullWidth 
            required 
            error={errors.images}
          />
        </div>
        <div className={`${styles.field} ${styles.fullSpan}`}>
          <label className={styles.label}>Description</label>
          <textarea 
            className={`${styles.textarea} ${errors.description ? styles.errorBorder : ''}`} 
            value={form.description} 
            onChange={set('description')} 
            rows={4} 
            required 
          />
          {errors.description && <span className={styles.errorText}>{errors.description}</span>}
        </div>
      </div>
      <div className={styles.actions}>
        <Button type="submit" loading={isLoading}>{submitLabel}</Button>
      </div>
    </form>
  );
};

export default ProductForm;
