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

  const set = (field: keyof CreateProductPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      
      if (field === 'images') {
        setForm((prev) => ({ ...prev, images: [val as string] }));
      } else {
        setForm((prev) => ({ ...prev, [field]: val }));
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <Input label="Product Name" value={form.name} onChange={set('name')} fullWidth required />
        <div className={styles.field}>
          <label className={styles.label}>Category</label>
          <select className={styles.select} value={form.category} onChange={set('category')} required>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Price (₹)" type="number" value={form.price} onChange={set('price')} fullWidth required />
        <Input label="Unit" value={form.unit} onChange={set('unit')} placeholder="e.g. piece, kg, box" fullWidth required />
        <Input label="Min. Order Qty" type="number" value={form.minOrderQty} onChange={set('minOrderQty')} fullWidth required />
        <Input label="Stock" type="number" value={form.stock} onChange={set('stock')} fullWidth required />
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
          />
        </div>
        <div className={`${styles.field} ${styles.fullSpan}`}>
          <label className={styles.label}>Description</label>
          <textarea className={styles.textarea} value={form.description} onChange={set('description')} rows={4} required />
        </div>
      </div>
      <div className={styles.actions}>
        <Button type="submit" loading={isLoading}>{submitLabel}</Button>
      </div>
    </form>
  );
};

export default ProductForm;
