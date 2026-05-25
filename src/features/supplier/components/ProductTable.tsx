import React from 'react';
import { Package, Edit2, Trash2, EyeOff, Info } from 'lucide-react';
import Button from '@/shared/components/ui/Button';

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
}

const ProductTable: React.FC<ProductTableProps> = ({ products, loading, onEdit, onDelete, onAdd, onUnpublish, onViewReason }) => {
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
                  <span>{product.name}</span>
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
                <div className="flex gap-2">
                  <button onClick={() => onEdit(product)} title="Edit" className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[#f1f5f9] text-primary border border-[#e2e8f0] cursor-pointer hover:bg-primary hover:text-white transition-all">
                    <Edit2 size={16} />
                  </button>
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
