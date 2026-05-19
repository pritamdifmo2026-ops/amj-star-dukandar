import React, { useState, useEffect } from 'react';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import type { CreateProductPayload } from '../types';
import categoryService from '../services/category.service';

interface Props {
  initialValues?: Partial<CreateProductPayload>;
  onSubmit: (data: CreateProductPayload) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const fieldCls = "flex flex-col gap-1";
const labelCls = "text-sm font-medium text-body";
const selectCls = "border border-border rounded-[var(--radius-sm)] px-2.5 py-2 text-base font-sans text-heading bg-surface outline-none w-full focus:border-primary";
const textareaCls = "border border-border rounded-[var(--radius-sm)] px-2.5 py-2 text-base font-sans text-heading bg-surface outline-none w-full focus:border-primary resize-y";
const errorTextCls = "text-error text-xs mt-0.5";

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
        if (initialValues.categoryId) {
          const cat = data.categories.find((c: any) => c._id === initialValues.categoryId);
          if (cat?.subcategories) setAvailableSubcategories(cat.subcategories);
        } else if (initialValues.category) {
          const cat = data.categories.find((c: any) => c.name === initialValues.category);
          if (cat?.subcategories) setAvailableSubcategories(cat.subcategories);
        }
      }
    }).catch(() => {});
  }, [initialValues]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    else if (form.name.length < 3) newErrors.name = 'Name must be at least 3 characters';
    if (!form.categoryId && !form.category) newErrors.category = 'Please select a category';
    if (availableSubcategories.length > 0 && !form.subcategoryId) newErrors.subcategoryId = 'Please select a subcategory';
    if (form.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (form.minOrderQty <= 0) newErrors.minOrderQty = 'MOQ must be at least 1';
    if (form.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (!form.unit.trim()) newErrors.unit = 'Unit is required (e.g., piece, kg)';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (form.images.length === 0 || !form.images[0].trim()) {
      newErrors.images = 'At least one product image URL is required';
    } else {
      try { new URL(form.images[0]); } catch { newErrors.images = 'Please enter a valid image URL'; }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const cat = categories.find(c => c._id === selectedId);
    if (cat) {
      setForm(prev => ({ ...prev, categoryId: cat._id, category: cat.name, subcategoryId: '' }));
      setAvailableSubcategories(cat.subcategories || []);
    } else {
      setForm(prev => ({ ...prev, categoryId: '', category: '', subcategoryId: '' }));
      setAvailableSubcategories([]);
    }
    if (errors.category) setErrors(prev => { const u = { ...prev }; delete u.category; return u; });
  };

  const set = (field: keyof CreateProductPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      if (field === 'images') setForm(prev => ({ ...prev, images: [val as string] }));
      else setForm(prev => ({ ...prev, [field]: val }));
      if (errors[field]) setErrors(prev => { const u = { ...prev }; delete u[field]; return u; });
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Product Name" value={form.name} onChange={set('name')} fullWidth required error={errors.name} />

        <div className={fieldCls}>
          <label className={labelCls}>Category</label>
          <select
            className={`${selectCls} ${errors.category ? 'border-error' : ''}`}
            value={form.categoryId || form.category}
            onChange={handleCategoryChange}
            required
          >
            <option value="">Select category</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            {!categories.some(c => c.name === form.category || c._id === form.categoryId) && form.category && (
              <option value={form.category}>{form.category}</option>
            )}
          </select>
          {errors.category && <span className={errorTextCls}>{errors.category}</span>}
        </div>

        {availableSubcategories.length > 0 && (
          <div className={fieldCls}>
            <label className={labelCls}>Subcategory</label>
            <select
              className={`${selectCls} ${errors.subcategoryId ? 'border-error' : ''}`}
              value={form.subcategoryId || ''}
              onChange={set('subcategoryId')}
              required
            >
              <option value="">Select subcategory</option>
              {availableSubcategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
            </select>
            {errors.subcategoryId && <span className={errorTextCls}>{errors.subcategoryId}</span>}
          </div>
        )}

        <Input label="Price (₹)" type="number" value={form.price} onChange={set('price')} fullWidth required error={errors.price} />
        <Input label="Unit" value={form.unit} onChange={set('unit')} placeholder="e.g. piece, kg, box" fullWidth required error={errors.unit} />
        <Input label="Min. Order Qty" type="number" value={form.minOrderQty} onChange={set('minOrderQty')} fullWidth required error={errors.minOrderQty} />
        <Input label="Stock" type="number" value={form.stock} onChange={set('stock')} fullWidth required error={errors.stock} />

        <div className={fieldCls}>
          <label className={labelCls}>GST Rate (%)</label>
          <select className={selectCls} value={form.gstRate} onChange={set('gstRate')}>
            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <Input value={form.images[0] || ''} onChange={set('images')} placeholder="Paste image link here" fullWidth required error={errors.images} label="Product Image URL" />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Description</label>
          <textarea
            className={`${textareaCls} ${errors.description ? 'border-error' : ''}`}
            value={form.description}
            onChange={set('description')}
            rows={4}
            required
          />
          {errors.description && <span className={errorTextCls}>{errors.description}</span>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isLoading}>{submitLabel}</Button>
      </div>
    </form>
  );
};

export default ProductForm;
