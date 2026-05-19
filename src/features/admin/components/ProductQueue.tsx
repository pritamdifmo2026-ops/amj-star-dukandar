import React, { useState } from 'react';
import { Package, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';

import type { AdminProduct } from '../types/admin.types';

interface ProductQueueProps {
  pendingProducts: AdminProduct[];
  approvedProducts: AdminProduct[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const ProductQueue: React.FC<ProductQueueProps> = ({ pendingProducts, approvedProducts, onVerify }) => {
  const [productConfirm, setProductConfirm] = useState<{ product: any; status: 'APPROVED' | 'REJECTED' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const handleConfirmAction = async () => {
    if (!productConfirm) return;
    setLoading(true);
    try { await onVerify(productConfirm.product._id ?? productConfirm.product.id, productConfirm.status); setProductConfirm(null); }
    finally { setLoading(false); }
  };

  const renderTable = (products: any[], isPending: boolean, currentPage: number) => {
    const paged = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    return (
      <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Product</th>
                <th className={thCls}>Supplier</th>
                <th className={thCls}>Price</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>{isPending ? 'Actions' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
                <tr key={p._id ?? p.id} className="hover:bg-[#fafbfc]">
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-[6px] object-cover border border-[#eef2f6]" />
                      ) : (
                        <div className="w-10 h-10 rounded-[6px] bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]"><Package size={16} /></div>
                      )}
                      <span className="font-semibold text-[#0f172a]">{p.name}</span>
                    </div>
                  </td>
                  <td className={tdCls}>{p.supplierId?.businessName}</td>
                  <td className={tdCls}>₹{p.basePrice}</td>
                  <td className={tdCls}>{p.category}</td>
                  {isPending ? (
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setProductConfirm({ product: p, status: 'APPROVED' })} className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center border-none cursor-pointer hover:bg-[#d1fae5]" title="Approve">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => setProductConfirm({ product: p, status: 'REJECTED' })} className="w-8 h-8 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center border-none cursor-pointer hover:bg-[#fee2e2]" title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  ) : (
                    <td className={tdCls}>
                      <span className="flex items-center gap-1 text-xs font-bold text-[#059669]">
                        <CheckCircle size={14} /> Approved
                      </span>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr key="empty"><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">No {isPending ? 'pending' : 'approved'} products</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold text-[#0f172a] m-0">Pending Products</h3>
          <span className="text-xs bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] px-2.5 py-1 rounded-full font-bold">{pendingProducts.length} items</span>
        </div>
        {renderTable(pendingProducts, true, pendingPage)}
        <Pagination totalItems={pendingProducts.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={pendingPage} onPageChange={setPendingPage} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold text-[#0f172a] m-0">Approved Products</h3>
          <span className="text-xs bg-[#ecfdf5] text-[#059669] border border-[#6ee7b7] px-2.5 py-1 rounded-full font-bold">{approvedProducts.length} items</span>
        </div>
        {renderTable(approvedProducts, false, approvedPage)}
        <Pagination totalItems={approvedProducts.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={approvedPage} onPageChange={setApprovedPage} />
      </div>

      <Modal
        isOpen={!!productConfirm}
        onClose={() => setProductConfirm(null)}
        title={productConfirm?.status === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setProductConfirm(null)}>Cancel</Button>
            <Button variant={productConfirm?.status === 'APPROVED' ? 'primary' : 'danger'} onClick={handleConfirmAction} loading={loading}>
              Confirm {productConfirm?.status === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <p>Are you sure you want to <strong>{productConfirm?.status?.toLowerCase()}</strong> the product "<strong>{productConfirm?.product.name}</strong>"?</p>
        <p className="mt-2.5 text-sm text-[#64748b]">
          {productConfirm?.status === 'APPROVED'
            ? 'This product will become visible to all buyers immediately.'
            : 'This product will be removed from the queue and the supplier will be notified.'}
        </p>
      </Modal>
    </div>
  );
};

export default ProductQueue;
