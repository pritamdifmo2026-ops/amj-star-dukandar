import React, { useState, useEffect } from 'react';
import {
  Package, CheckCircle, XCircle, ArrowLeft, Eye,
  FileText, Tag, Info, BoxSelect, BarChart2
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';
import type { AdminProduct } from '../types/admin.types';

interface ProductQueueProps {
  pendingProducts: AdminProduct[];
  approvedProducts: AdminProduct[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => void;
}

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9] max-md:hidden";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155] max-md:flex max-md:justify-between max-md:items-center max-md:border-none max-md:py-2 max-md:px-0 text-right md:text-left";
const trCls = "hover:bg-[#fafbfc] max-md:block max-md:p-4 max-md:border-b max-md:border-[#e2e8f0] last:border-none";

// ── Small helpers ─────────────────────────────────────────────────────────────

const statusBadge = (status?: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-[#fff7ed] text-[#d97706]',
    APPROVED: 'bg-[#ecfdf5] text-[#059669]',
    REJECTED: 'bg-[#fef2f2] text-[#dc2626]',
  };
  const s = status?.toUpperCase() || 'PENDING';
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${map[s] || map.PENDING}`}>
      {s}
    </span>
  );
};

const DetailRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start gap-4 text-sm py-2 border-b border-[#f8fafc] last:border-none">
      <span className="text-[#64748b] font-medium shrink-0">{label}</span>
      <span className="font-semibold text-[#0f172a] text-right">{value}</span>
    </div>
  );
};

// ── Product Detail View ───────────────────────────────────────────────────────

const ProductDetailView: React.FC<{
  product: AdminProduct;
  onBack: () => void;
  onAction: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => void;
}> = ({ product, onBack, onAction }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | 'TAKE_DOWN' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPending = product.status === 'PENDING' || !product.status;

  useEffect(() => {
    setReasonError('');
    if (!confirmAction) {
      setRejectionReason('');
    }
  }, [confirmAction]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if ((confirmAction === 'REJECTED' || confirmAction === 'TAKE_DOWN') && !rejectionReason.trim()) {
      setReasonError('Please provide a reason for rejecting this product.');
      return;
    }
    setReasonError('');
    setLoading(true);
    await onAction(product.id || product._id || '', confirmAction === 'TAKE_DOWN' ? 'REJECTED' : confirmAction, (confirmAction === 'REJECTED' || confirmAction === 'TAKE_DOWN') ? rejectionReason : undefined);
    setLoading(false);
    setConfirmAction(null);
  };

  const specs = product.specifications ? Object.entries(product.specifications) : [];

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-6 border-none bg-transparent cursor-pointer p-0 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Queue
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* LEFT — Images */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-[12px] border border-[#eef2f6] overflow-hidden aspect-square flex items-center justify-center">
            {product.images?.length > 0 ? (
              <img
                src={product.images[activeImg]}
                alt={product.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#94a3b8]">
                <Package size={48} className="opacity-40" />
                <span className="text-xs">No images uploaded</span>
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-[8px] overflow-hidden border-2 transition-all cursor-pointer ${
                    i === activeImg ? 'border-primary' : 'border-[#eef2f6] hover:border-primary/40'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Status + Action Buttons */}
          <div className="bg-white rounded-[12px] border border-[#eef2f6] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#94a3b8] tracking-wider">Status</span>
              {statusBadge(product.status)}
            </div>
            {isPending && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setConfirmAction('APPROVED')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-[#059669] px-3 py-2.5 rounded-[8px] cursor-pointer hover:bg-[#047857] transition-colors border-none"
                >
                  <CheckCircle size={15} /> Approve
                </button>
                <button
                  onClick={() => setConfirmAction('REJECTED')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-[#dc2626] px-3 py-2.5 rounded-[8px] cursor-pointer hover:bg-[#b91c1c] transition-colors border-none"
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
            {!isPending && product.status === 'APPROVED' && (
              <div className="flex flex-col mt-2 pt-2 border-t border-[#f1f5f9]">
                <span className="text-[10px] font-extrabold uppercase text-[#dc2626] tracking-wider mb-2 flex items-center gap-1">⚠️ Danger Zone</span>
                <button
                  onClick={() => setConfirmAction('TAKE_DOWN')}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-[#ef4444] px-3 py-2.5 rounded-[8px] cursor-pointer hover:bg-[#dc2626] transition-colors border-none"
                >
                  <XCircle size={15} /> Take Down Product
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Details */}
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="bg-white rounded-[12px] border border-[#eef2f6] p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-xl font-extrabold text-[#0f172a] m-0 leading-tight">{product.name}</h2>
              <span className="text-2xl font-extrabold text-[#0f172a] shrink-0">₹{product.basePrice?.toLocaleString()}</span>
            </div>
            {product.supplierId?.businessName && (
              <p className="text-sm text-[#64748b] font-medium mb-3">
                By <span className="text-[#0f172a] font-bold">{product.supplierId.businessName}</span>
              </p>
            )}
            {product.description && (
              <p className="text-sm text-[#475569] leading-relaxed border-t border-[#f1f5f9] pt-3 mt-3">
                {product.description}
              </p>
            )}
          </div>

          {/* Core Info */}
          <div className="bg-white rounded-[12px] border border-[#eef2f6] p-5">
            <p className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-3 flex items-center gap-1.5">
              <Info size={12} /> Core Details
            </p>
            <DetailRow label="Category" value={product.category} />
            {product.subcategory && <DetailRow label="Subcategory" value={product.subcategory} />}
            <DetailRow label="HSN Code" value={product.hsnCode} />
            <DetailRow label="Brand / Make" value={product.brand} />
            <DetailRow label="Unit" value={product.unit} />
            <DetailRow label="MOQ" value={product.moq ? `${product.moq} ${product.unit || 'pcs'}` : undefined} />
            <DetailRow label="Available Stock" value={product.stock ? `${product.stock} ${product.unit || 'pcs'}` : undefined} />
            <DetailRow label="Lead Time" value={product.leadTime} />
            <DetailRow label="Country of Origin" value={product.countryOfOrigin} />
            {product.gstRate !== undefined && (
              <DetailRow
                label="GST"
                value={`${product.gstRate}% — ${product.gstIncluded ? 'Included in price' : 'Exclusive'}`}
              />
            )}
          </div>

          {/* Packaging */}
          {(product.packagingType || product.packagingSize || product.packagingDimensions || product.packagingWeight) && (
            <div className="bg-white rounded-[12px] border border-[#eef2f6] p-5">
              <p className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-3 flex items-center gap-1.5">
                <BoxSelect size={12} /> Packaging
              </p>
              <DetailRow label="Type" value={product.packagingType} />
              <DetailRow label="Size" value={product.packagingSize} />
              <DetailRow label="Dimensions" value={product.packagingDimensions} />
              <DetailRow label="Weight" value={product.packagingWeight} />
            </div>
          )}

          {/* Specifications */}
          {specs.length > 0 && (
            <div className="bg-white rounded-[12px] border border-[#eef2f6] p-5">
              <p className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart2 size={12} /> Specifications
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {specs.map(([key, val]) => (
                  <DetailRow key={key} label={key} value={val} />
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {product.keywords && product.keywords.length > 0 && (
            <div className="bg-white rounded-[12px] border border-[#eef2f6] p-5">
              <p className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-3 flex items-center gap-1.5">
                <Tag size={12} /> Search Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.keywords.map((kw, i) => (
                  <span key={i} className="inline-block text-xs font-semibold bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] rounded-full px-2.5 py-0.5">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certification Documents */}
          {product.certificationDocs && product.certificationDocs.length > 0 && (
            <div className="bg-white rounded-[12px] border border-[#eef2f6] p-5">
              <p className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-3 flex items-center gap-1.5">
                <FileText size={12} /> Compliance Documents
              </p>
              <div className="flex flex-col gap-2">
                {product.certificationDocs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 bg-[#f8fafc] border border-[#eef2f6] rounded-[8px] px-4 py-3">
                    <div>
                      <span className="text-sm font-semibold text-[#1e293b]">{doc.name}</span>
                      {doc.mandatory && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded-full">Required</span>
                      )}
                    </div>
                    {doc.documentUrl ? (
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary border border-primary px-3 py-1.5 rounded-[6px] no-underline hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="text-xs text-[#94a3b8]">Not uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm action modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'APPROVED' ? 'Approve Product' : confirmAction === 'TAKE_DOWN' ? 'Take Down Live Product' : 'Reject Product'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={loading}>Cancel</Button>
            <Button
              variant={confirmAction === 'APPROVED' ? 'primary' : 'danger'}
              onClick={handleConfirm}
              loading={loading}
            >
              Confirm {confirmAction === 'APPROVED' ? 'Approve' : confirmAction === 'TAKE_DOWN' ? 'Take Down' : 'Reject'}
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to <strong>{confirmAction === 'TAKE_DOWN' ? 'take down' : confirmAction?.toLowerCase()}</strong> the product{' '}
          "<strong>{product.name}</strong>"?
        </p>
        
        {confirmAction === 'TAKE_DOWN' && (
          <div className="mt-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px]">
            <p className="text-sm text-[#b91c1c] m-0 font-semibold">
              ⚠️ This product is already live. If you do this, the product will no longer be displayed or available on the live website to buyers.
            </p>
            <p className="text-xs text-[#dc2626] m-0 mt-1">
              (This will not affect ongoing enquiries between buyers and this supplier).
            </p>
          </div>
        )}

        {confirmAction !== 'TAKE_DOWN' && (
          <p className="mt-2.5 text-sm text-[#64748b]">
            {confirmAction === 'APPROVED'
              ? 'This product will become visible to all buyers immediately.'
              : 'This product will be removed from the queue and the supplier will be notified.'}
          </p>
        )}

        {(confirmAction === 'REJECTED' || confirmAction === 'TAKE_DOWN') && (
          <div className="mt-4">
            <label className="block text-sm font-bold text-[#0f172a] mb-2">
              Reason for Rejection <span className="text-[#dc2626]">*</span>
            </label>
            <textarea
              className="w-full border border-[#e2e8f0] rounded-[8px] p-3 text-sm focus:border-primary outline-none resize-none"
              rows={3}
              placeholder="Explain what needs to be fixed (e.g., Please upload clear images of the product packaging)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            {reasonError && (
              <p className="text-xs text-[#dc2626] font-semibold mt-1.5">{reasonError}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const ProductQueue: React.FC<ProductQueueProps> = ({ pendingProducts, approvedProducts, onVerify }) => {
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onAction={async (id, status, reason) => {
          await onVerify(id, status, reason);
          setSelectedProduct(null);
        }}
      />
    );
  }

  const renderTable = (products: AdminProduct[], isPending: boolean, currentPage: number) => {
    const paged = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    return (
      <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="w-full">
          <table className="w-full border-collapse max-md:block">
            <thead className="max-md:hidden">
              <tr>
                <th className={thCls}>Product</th>
                <th className={thCls}>Supplier</th>
                <th className={thCls}>Price</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {paged.map(p => (
                <tr key={p.id || p._id} className={trCls}>
                  <td className={tdCls}>
                    <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Product</span>
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-[6px] object-cover border border-[#eef2f6] shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-[6px] bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] shrink-0"><Package size={16} /></div>
                      )}
                      <span className="font-semibold text-[#0f172a]">{p.name}</span>
                    </div>
                  </td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Supplier</span> {p.supplierId?.businessName || '—'}</td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Price</span> ₹{p.basePrice?.toLocaleString()}</td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Category</span> {p.category}</td>
                  <td className={tdCls}>
                    <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Actions</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-[6px] cursor-pointer hover:bg-primary/20 transition-all"
                        title="View full details"
                      >
                        <Eye size={13} /> View
                      </button>
                      {isPending && (
                        <>
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center border-none cursor-pointer hover:bg-[#d1fae5]"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="w-8 h-8 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center border-none cursor-pointer hover:bg-[#fee2e2]"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {!isPending && (
                        <span className="flex items-center gap-1 text-xs font-bold text-[#059669]">
                          <CheckCircle size={14} /> Approved
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr key="empty" className="max-md:block max-md:p-4">
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b] max-md:block max-md:p-0">
                    No {isPending ? 'pending' : 'approved'} products
                  </td>
                </tr>
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
    </div>
  );
};

export default ProductQueue;
