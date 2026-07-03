import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import productService from '@/features/product/services/product.service';
import toast from 'react-hot-toast';

interface Props {
  product: any;
  onClose: () => void;
  onSuccess: (updatedProduct: any) => void;
}

const GST_OPTIONS = [0, 5, 12, 18, 28];

const LiveUpdateModal: React.FC<Props> = ({ product, onClose, onSuccess }) => {
  const [stock, setStock] = useState<number>(product.stock ?? 0);
  const [basePrice, setBasePrice] = useState<number>(product.basePrice ?? product.price ?? 0);
  const [moq, setMoq] = useState<number>(product.moq ?? product.minOrderQty ?? 1);
  const [leadTime, setLeadTime] = useState<string>(product.leadTime ?? '');
  const [gstRate, setGstRate] = useState<number>(product.gstRate ?? 18);
  const [gstIncluded, setGstIncluded] = useState<boolean>(product.gstIncluded ?? false);
  const [keywords, setKeywords] = useState<string>((product.keywords ?? []).join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (basePrice <= 0) { toast.error('Price must be greater than 0'); return; }
    if (moq <= 0) { toast.error('MOQ must be at least 1'); return; }
    if (stock < 0) { toast.error('Stock cannot be negative'); return; }

    setSaving(true);
    try {
      const result = await productService.liveUpdate(product.id || product._id, {
        stock,
        basePrice,
        moq,
        leadTime: leadTime.trim() || undefined,
        gstRate,
        gstIncluded,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      });
      toast.success('Product updated successfully');
      onSuccess(result.product ?? result);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-primary transition-colors bg-white';
  const labelCls = 'block text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[16px] w-full max-w-[520px] shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a] m-0">Update Live Product</h3>
            <p className="text-xs text-[#94a3b8] m-0 mt-0.5 line-clamp-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] border-none cursor-pointer hover:bg-[#e2e8f0]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Price (₹) *</label>
              <input type="number" min={1} value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stock *</label>
              <input type="number" min={0} value={stock} onChange={e => setStock(Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>MOQ *</label>
              <input type="number" min={1} value={moq} onChange={e => setMoq(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Lead Time</label>
              <input type="text" value={leadTime} onChange={e => setLeadTime(e.target.value)} className={inputCls} placeholder="e.g. 3-5 days" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>GST Rate (%)</label>
              <select value={gstRate} onChange={e => setGstRate(Number(e.target.value))} className={inputCls}>
                {GST_OPTIONS.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setGstIncluded(v => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${gstIncluded ? 'bg-primary' : 'bg-[#e2e8f0]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${gstIncluded ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-[#475569]">GST Included in price</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Search Keywords</label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              className={inputCls}
              placeholder="Comma-separated: wireless, headphones, bluetooth"
            />
            <p className="text-[10px] text-[#94a3b8] mt-1">Separate keywords with commas</p>
          </div>

          <div className="bg-[#fff7ed] rounded-[10px] border border-[#ffedd5] px-4 py-3 text-xs text-[#92400e]">
            To change product specifications, name, or images — unpublish or delete this product and publish a new one. It will go through admin approval procedure.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#f1f5f9]">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer hover:bg-[#e2e8f0]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveUpdateModal;
