import React, { useState } from 'react';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import type { CreateProductPayload } from '../types';
import styles from './ProductForm.module.css';

const CATEGORIES = [
  'Electronics', 'Textiles', 'Food & Beverages', 'Chemicals',
  'Furniture', 'Machinery', 'Packaging', 'Agriculture', 'Other',
];

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
    gstRate: initialValues.gstRate || 18,
    images: initialValues.images || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    else if (form.name.length < 3) newErrors.name = 'Name must be at least 3 characters';

    if (!form.category) newErrors.category = 'Please select a category';
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
            value={form.category} 
            onChange={set('category')} 
            required
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <span className={styles.errorText}>{errors.category}</span>}
        </div>
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
