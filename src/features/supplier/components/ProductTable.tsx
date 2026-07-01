import React from 'react';
import { Package, Edit2, Trash2, EyeOff, Info, AlertTriangle, WifiOff, Wifi, Ban } from 'lucide-react';
import Button from '@/shared/components/ui/Button';

const isLowStock = (p: any) =>
  typeof p.stock === 'number' && typeof p.moq === 'number' && p.moq > 0 && p.stock <= p.moq * 1.5;

/** Approved but hidden from the marketplace because the wallet couldn't cover its ₹10 listing fee. */
export const isBlocked = (p: any) =>
  p.status === 'APPROVED' && p.listingStatus === 'blocked_insufficient_balance';

const statusCls: Record<string, string> = {
  approved: 'bg-[#ecfdf5] text-[#059669]',
  pending: 'bg-[#f1f5f9] text-[#d97706]',
  rejected: 'bg-[#fef2f2] text-[#dc2626]',
};

interface ProductTableProps {
  products: any[];
  loading: boolean;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onAdd: () => void;
  onUnpublish: (product: any) => void;
  onViewReason: (reason: string) => void;
  onToggleLive: (product: any) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, loading, onEdit, onDelete, onAdd, onUnpublish, onViewReason, onToggleLive }) => {
  if (loading) return <p>Loading products...</p>;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-[#64748b]">
        <Package size={48} />
        <p>No products added yet.</p>
        <Button variant="outline" onClick={onAdd}>Add your first product</Button>
      </div>
    );
  }

  return (
    <div className="-mx-7 px-7 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Product', 'Price', 'MOQ', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-4 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, idx) => (
            <tr key={product.id || product._id || `prod-${idx}`} className="hover:bg-[#fafbfc]">
              <td className="px-4 py-5 border-b border-[#f8fafc] text-[0.95rem] text-[#334155]">
                <div className="flex items-center gap-4">
                  {product.images?.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-11 h-11 object-cover rounded-[10px] border border-[#f1f5f9] bg-[#f8fafc]" />
                  ) : (
                    <div className="w-11 h-11 rounded-[10px] bg-[#f1f5f9]" />
                  )}
                  <div className="flex flex-col gap-1">
                    <span>{product.name}</span>
                    {product.sku && <span className="text-xs text-[#94a3b8]">SKU: {product.sku}</span>}
                    {isLowStock(product) && (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-[#b45309] bg-[#fffbeb] border border-[#fcd34d] px-2 py-0.5 rounded-full w-fit">
                        <AlertTriangle size={10} /> Low Stock ({product.stock} left)
                      </span>
                    )}
                    {product.isDisabledBySeller && (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-[#6b7280] bg-[#f3f4f6] border border-[#d1d5db] px-2 py-0.5 rounded-full w-fit">
                        <WifiOff size={10} /> Offline
                      </span>
                    )}
                    {isBlocked(product) && (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 rounded-full w-fit">
                        <Ban size={10} /> Blocked — wallet low
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-5 border-b border-[#f8fafc] text-[0.95rem] text-[#334155]">₹{product.basePrice}</td>
              <td className="px-4 py-5 border-b border-[#f8fafc] text-[0.95rem] text-[#334155]">{product.moq} {product.unit}</td>
              <td className="px-4 py-5 border-b border-[#f8fafc]">
                <span className={`px-3 py-1.5 rounded-[8px] text-[0.7rem] font-extrabold uppercase tracking-[0.05em] ${statusCls[product.status?.toLowerCase() || 'pending'] || statusCls.pending}`}>
                  {product.status}
                </span>
              </td>
              <td className="px-4 py-5 border-b border-[#f8fafc]">
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => onEdit(product)} title="Edit" className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[#f1f5f9] text-primary border border-[#e2e8f0] cursor-pointer hover:bg-primary hover:text-white transition-all">
                    <Edit2 size={16} />
                  </button>
                  {product.status === 'APPROVED' && (
                    <button
                      onClick={() => onToggleLive(product)}
                      title={product.isDisabledBySeller ? 'Go Live' : 'Take Offline'}
                      className={`w-[34px] h-[34px] flex items-center justify-center rounded-[10px] border cursor-pointer transition-all ${product.isDisabledBySeller ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0] hover:bg-[#16a34a] hover:text-white' : 'bg-[#f1f5f9] text-[#6b7280] border-[#e2e8f0] hover:bg-[#6b7280] hover:text-white'}`}
                    >
                      {product.isDisabledBySeller ? <Wifi size={16} /> : <WifiOff size={16} />}
                    </button>
                  )}
                  {(product.status === 'APPROVED' || product.status === 'PENDING') && (
                    <button onClick={() => onUnpublish(product)} title="Unpublish" className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[#fff7ed] text-[#d97706] border border-[#ffedd5] cursor-pointer hover:bg-[#d97706] hover:text-white transition-all">
                      <EyeOff size={16} />
                    </button>
                  )}
                  {(product.status === 'REJECTED' && product.rejectionReason) && (
                    <button onClick={() => onViewReason(product.rejectionReason)} title="View Reason" className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2] cursor-pointer hover:bg-[#dc2626] hover:text-white transition-all">
                      <Info size={16} />
                    </button>
                  )}
                  <button onClick={() => onDelete(product)} title="Delete" className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2] cursor-pointer hover:bg-[#dc2626] hover:text-white transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
