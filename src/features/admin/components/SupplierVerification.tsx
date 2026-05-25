import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldCheck, ChevronLeft, Search, Package, ExternalLink, Percent, Landmark } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Pagination from '@/shared/components/ui/Pagination';
import { useSupplierProducts } from '../hooks/useSupplierProducts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../services/admin.service';
import { toast } from 'react-hot-toast';
import { formatIndianNumber } from '@/shared/utils/formatNumber';

import type { AdminSupplier } from '../types/admin.types';

interface SupplierVerificationProps {
  suppliers: AdminSupplier[];
  onVerify: (id: string, status: 'VERIFIED' | 'REJECTED') => void;
  onVerifyProduct: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9] max-md:hidden";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155] max-md:flex max-md:justify-between max-md:items-center max-md:border-none max-md:py-2 max-md:px-0 text-right md:text-left truncate max-w-xs";
const trCls = "hover:bg-[#fafbfc] max-md:block max-md:p-4 max-md:border-b max-md:border-[#e2e8f0] last:border-none";

const DetailItem = ({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) => (
  <div className={span2 ? 'col-span-2 max-sm:col-span-1' : ''}>
    <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">{label}</label>
    <div className="text-sm text-[#1e293b] font-medium">{children}</div>
  </div>
);

const SupplierTable: React.FC<{
  title: string; suppliers: AdminSupplier[];
  onVerify: (id: string, status: 'VERIFIED' | 'REJECTED') => void;
  onView: (id: string) => void;
  showActions?: boolean;
}> = ({ title, suppliers, onVerify, onView, showActions }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = suppliers.filter(s =>
    s.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    s.businessDetails?.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <h3 className="text-base font-extrabold text-[#0f172a] m-0">{title} ({filtered.length})</h3>
        <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2 bg-white focus-within:border-primary min-w-[200px]">
          <Search size={14} className="text-[#94a3b8] shrink-0" />
          <input className="border-none outline-none text-sm bg-transparent flex-1 text-[#1e293b] placeholder:text-[#94a3b8]" type="text" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="w-full">
          <table className="w-full border-collapse max-md:block">
            <thead className="max-md:hidden">
              <tr>{['Business Name', 'Owner', 'Contact', 'Status', 'Tier', 'Actions'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
            </thead>
            <tbody className="max-md:block">
              {paginated.map(s => (
                <tr key={s._id} className={trCls}>
                  <td className={tdCls + " font-semibold text-[#0f172a]"}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Business Name</span> {s.businessName}</td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Owner</span> {s.businessDetails?.ownerName || s.userId?.name || 'N/A'}</td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Contact</span> {s.phone}</td>
                  <td className={tdCls}>
                    <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.kycStatus === 'VERIFIED' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fffbeb] text-[#a16207]'}`}>{s.kycStatus}</span>
                  </td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Tier</span> <span className="text-xs bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-2 py-0.5 rounded-full font-semibold">{s.tier}</span></td>
                  <td className={tdCls}>
                    <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Actions</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onView(s._id)} className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0">View</button>
                      {showActions && s.kycStatus === 'PENDING' && (
                        <>
                          <button onClick={() => onVerify(s._id, 'VERIFIED')} className="w-7 h-7 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center border-none cursor-pointer hover:bg-[#d1fae5]" title="Verify"><CheckCircle size={15} /></button>
                          <button onClick={() => onVerify(s._id, 'REJECTED')} className="w-7 h-7 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center border-none cursor-pointer hover:bg-[#fee2e2]" title="Reject"><XCircle size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr className="max-md:block max-md:p-4"><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#64748b] max-md:block max-md:p-0">No {title.toLowerCase()} found</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={page} onPageChange={setPage} />
      </div>
    </div>
  );
};

const SupplierProducts: React.FC<{ 
  supplierId: string; 
  businessName: string; 
  onBack: () => void;
  onVerifyProduct: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}> = ({ supplierId, businessName, onBack, onVerifyProduct }) => {
  const { products, loading, refreshProducts } = useSupplierProducts(supplierId);
  const [confirmModal, setConfirmModal] = useState<{ productId: string; name: string; action: 'APPROVED' | 'REJECTED' } | null>(null);

  const handleAction = async () => {
    if (!confirmModal) return;
    try { 
      await onVerifyProduct(confirmModal.productId, confirmModal.action); 
      setConfirmModal(null); 
      refreshProducts(); 
    } catch { 
      console.error(`Failed to ${confirmModal.action.toLowerCase()} product`); 
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] bg-transparent border-none cursor-pointer hover:text-[#1e293b] p-0">
          <ChevronLeft size={18} /> Back to Profile
        </button>
        <h2 className="text-base font-extrabold text-[#0f172a] m-0">Products by {businessName}</h2>
      </div>
      {loading ? (
        <div className="py-8 text-center text-sm text-[#64748b]">Loading products...</div>
      ) : (
        <div className="bg-white rounded-[10px] border border-[#eef2f6] overflow-hidden">
          <div className="w-full">
            <table className="w-full border-collapse max-md:block">
              <thead className="max-md:hidden"><tr>{['Product', 'Category', 'Price', 'Status', 'Actions'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="max-md:block">
                {products.map(p => (
                  <tr key={p._id} className={trCls}>
                    <td className={tdCls}>
                      <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Product</span>
                      <div className="flex items-center gap-3">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded-[4px] object-cover" />}
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Category</span> {p.category}</td>
                    <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Price</span> ₹{p.basePrice}/{p.unit}</td>
                    <td className={tdCls}>
                      <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Status</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'APPROVED' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fffbeb] text-[#a16207]'}`}>{p.status}</span>
                    </td>
                    <td className={tdCls}>
                      <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Actions</span>
                      <div className="flex items-center gap-2">
                        {p.status === 'PENDING' && (
                          <>
                            <button onClick={() => setConfirmModal({ productId: p._id, name: p.name, action: 'APPROVED' })} className="w-7 h-7 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center border-none cursor-pointer" title="Approve"><CheckCircle size={15} /></button>
                            <button onClick={() => setConfirmModal({ productId: p._id, name: p.name, action: 'REJECTED' })} className="w-7 h-7 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center border-none cursor-pointer" title="Reject"><XCircle size={15} /></button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <a href={`/products/${p._id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center"><ExternalLink size={15} /></a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && <tr className="max-md:block max-md:p-4"><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b] max-md:block max-md:p-0">No products found for this supplier</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {confirmModal && (
        <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title={confirmModal.action === 'APPROVED' ? 'Approve Product' : 'Reject Product'}>
          <div className="text-center py-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${confirmModal.action === 'APPROVED' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
              {confirmModal.action === 'APPROVED' ? <CheckCircle size={32} /> : <XCircle size={32} />}
            </div>
            <h3 className="text-lg font-bold mb-2.5">{confirmModal.action === 'APPROVED' ? 'Approve' : 'Reject'} this product?</h3>
            <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
              {confirmModal.action === 'APPROVED' ? <>This will make <strong>{confirmModal.name}</strong> live on the marketplace.</> : <>This will reject <strong>{confirmModal.name}</strong>. The supplier will need to revise and resubmit.</>}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button variant={confirmModal.action === 'APPROVED' ? 'primary' : 'danger'} onClick={handleAction}>
                {confirmModal.action === 'APPROVED' ? 'Confirm & Publish' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const CommissionRateEditor: React.FC<{ supplierId: string; currentRate: number | null | undefined }> = ({ supplierId, currentRate }) => {
  const [rate, setRate] = useState(currentRate != null ? String(currentRate) : '');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => adminService.setCommissionRate(supplierId, Number(rate)),
    onSuccess: () => {
      toast.success('Commission rate saved');
      qc.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  return (
    <div className="p-6 border-t border-[#f1f5f9]">
      <div className="flex items-center gap-2 mb-4 text-[#7c3aed]"><Percent size={18} /><h3 className="text-base font-extrabold text-[#0f172a] m-0">Commission Rate</h3></div>
      <div className="flex items-center gap-3 max-w-xs">
        <div className="flex-1 flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 focus-within:border-primary">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder="e.g. 5"
            className="flex-1 border-none outline-none text-sm text-[#1e293b] bg-transparent"
          />
          <span className="text-[#94a3b8] text-sm font-bold">%</span>
        </div>
        <Button
          onClick={() => mutation.mutate()}
          disabled={!rate || isNaN(Number(rate)) || mutation.isPending}
          className="!py-2.5 !text-sm"
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {currentRate != null && <p className="text-xs text-[#94a3b8] mt-2">Current rate: {currentRate}%</p>}
      {currentRate == null && <p className="text-xs text-[#d97706] mt-2">Not yet configured — PO generation is blocked for this supplier.</p>}
    </div>
  );
};

const SupplierVerification: React.FC<SupplierVerificationProps> = ({ suppliers, onVerify, onVerifyProduct }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'suppliers';
  const supplierId = searchParams.get('id');
  const selectedSupplier = suppliers.find(s => s._id === supplierId);
  const pendingSuppliers = suppliers.filter(s => s.kycStatus === 'PENDING');
  const verifiedSuppliers = suppliers.filter(s => s.kycStatus === 'VERIFIED');
  const statusParam = searchParams.get('status');
  const initialView = statusParam === 'VERIFIED' ? 'VERIFIED' : 'PENDING';
  const [viewMode, setViewMode] = useState<'PENDING' | 'VERIFIED'>(initialView);

  // Update URL when viewMode changes
  const updateViewMode = (mode: 'PENDING' | 'VERIFIED') => {
    setViewMode(mode);
    setSearchParams({ tab: 'suppliers', status: mode });
  };

  // Helper to navigate to supplier detail
  const goToDetail = (id: string) => setSearchParams({ tab: 'supplier-detail', id });

  if (activeTab === 'supplier-products' && selectedSupplier) {
    return (
      <SupplierProducts
        supplierId={selectedSupplier._id}
        businessName={selectedSupplier.businessName}
        onBack={() => setSearchParams({ tab: 'supplier-detail', id: selectedSupplier._id })}
        onVerifyProduct={onVerifyProduct}
      />
    );
  }

  if (activeTab === 'supplier-detail' && selectedSupplier) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <button
            onClick={() => setSearchParams({ tab: 'suppliers', status: viewMode })}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] bg-transparent border-none cursor-pointer hover:text-[#1e293b] p-0"
          >
            <ChevronLeft size={18} /> Back to List
          </button>
          <div className="flex items-center gap-2">
            {selectedSupplier.kycStatus === 'VERIFIED' && (
              <button
                onClick={() => setSearchParams({ tab: 'supplier-products', id: selectedSupplier._id })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0369a1] bg-[#f0f9ff] border border-[#bae6fd] rounded-[8px] cursor-pointer hover:bg-[#e0f2fe]"
              >
                <Package size={16} /> View Products
              </button>
            )}
            {selectedSupplier.kycStatus === 'PENDING' && (
              <>
                <button
                  onClick={() => onVerify(selectedSupplier._id, 'REJECTED')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] cursor-pointer hover:bg-[#fee2e2]"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  onClick={() => onVerify(selectedSupplier._id, 'VERIFIED')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857]"
                >
                  <CheckCircle size={16} /> Verify Supplier
                </button>
              </>
            )}
          </div>
        </div>
        <div className="bg-white border border-[#eef2f6] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-6 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <ShieldCheck size={20} />
              <h3 className="text-base font-extrabold text-[#0f172a] m-0">Business Verification Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
              <DetailItem label="Business Name">{selectedSupplier.businessName}</DetailItem>
              <DetailItem label="Owner Name">{selectedSupplier.businessDetails?.ownerName || 'N/A'}</DetailItem>
              <DetailItem label="Contact Phone">{selectedSupplier.phone}</DetailItem>
              <DetailItem label="Email Address">{selectedSupplier.businessDetails?.email || selectedSupplier.userId?.email || 'N/A'}</DetailItem>
              <DetailItem label="Year Established">{selectedSupplier.businessDetails?.yearOfEstablishment || 'N/A'}</DetailItem>
              <DetailItem label="Tier">
                <span className="text-xs bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-2 py-0.5 rounded-full font-semibold">
                  {selectedSupplier.tier}
                </span>
              </DetailItem>
              <DetailItem label="PAN Number">
                <span className="font-mono">{selectedSupplier.businessDetails?.pan || 'N/A'}</span>
              </DetailItem>
              <DetailItem label="PAN Document">
                {selectedSupplier.businessDetails?.panDocument ? (
                  <a href={selectedSupplier.businessDetails.panDocument} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-bold no-underline hover:underline text-sm">
                    <ExternalLink size={14} /> View PAN Doc
                  </a>
                ) : (
                  <span className="text-[#ef4444] text-sm font-semibold">Not uploaded</span>
                )}
              </DetailItem>
              <DetailItem label="GSTIN">
                <span className="font-mono">{selectedSupplier.businessDetails?.gstin || 'Not provided'}</span>
              </DetailItem>
              <DetailItem label="GSTIN Certificate">
                {selectedSupplier.businessDetails?.gstinDocument ? (
                  <a href={selectedSupplier.businessDetails.gstinDocument} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-bold no-underline hover:underline text-sm">
                    <ExternalLink size={14} /> View GSTIN Doc
                  </a>
                ) : selectedSupplier.businessDetails?.gstin ? (
                  <span className="text-[#ef4444] text-sm font-semibold">Not uploaded</span>
                ) : (
                  <span className="text-[#94a3b8] text-sm">N/A</span>
                )}
              </DetailItem>
            </div>
          </div>
          <div className="p-6 border-b border-[#f1f5f9]">
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-4">Location & About</h3>
            <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
              <DetailItem label="Full Address" span2>{selectedSupplier.businessDetails?.address}, {selectedSupplier.businessDetails?.city}, {selectedSupplier.businessDetails?.state} - {selectedSupplier.businessDetails?.pinCode}</DetailItem>
              <DetailItem label="About Company" span2>
                <p className="text-sm text-[#475569] leading-relaxed m-0">{selectedSupplier.businessDetails?.about || 'No description provided'}</p>
              </DetailItem>
            </div>
          </div>
          {selectedSupplier.businessDetails?.isFoodSupplier && (
            <div className="p-6 border-2 border-[#ffedd5] bg-[#fffaf5] m-4 rounded-[10px]">
              <h3 className="text-base font-extrabold text-[#ea580c] m-0 mb-4">FSSAI Compliance</h3>
              <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                <DetailItem label="FSSAI License Number"><span className="font-mono text-sm">{selectedSupplier.businessDetails.fssaiLicenseNumber}</span></DetailItem>
                <DetailItem label="Verification Document">
                  {selectedSupplier.businessDetails.fssaiCertificate ? (
                    <a href={selectedSupplier.businessDetails.fssaiCertificate} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-bold no-underline hover:underline text-sm">
                      <ShieldCheck size={16} /> View FSSAI Certificate
                    </a>
                  ) : (
                    <p className="text-[#ef4444] text-sm m-0">Document not uploaded</p>
                  )}
                </DetailItem>
              </div>
            </div>
          )}
          {selectedSupplier.businessDetails?.isWomenEntrepreneur && (
            <div className="p-4 m-4">
              <span className="flex items-center gap-2 text-sm font-bold text-[#7c3aed] bg-[#f5f3ff] border border-[#ddd6fe] px-3 py-2 rounded-[8px] w-fit">
                <ShieldCheck size={16} /> Registered as Woman-led Business
              </span>
            </div>
          )}
          {(selectedSupplier.businessDetails?.annualTurnover || selectedSupplier.businessDetails?.monthlyProductionCapacity || selectedSupplier.businessDetails?.taxFilingMethod || selectedSupplier.businessDetails?.taxFilingDetails || selectedSupplier.businessDetails?.taxPaymentsCompliance) && (
            <div className="p-6 border-b border-[#f1f5f9]">
              <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-4">Business Scale & Compliance</h3>
              <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                {selectedSupplier.businessDetails?.annualTurnover && (
                  <DetailItem label="Annual Turnover (₹)">₹{formatIndianNumber(selectedSupplier.businessDetails.annualTurnover)}</DetailItem>
                )}
                {selectedSupplier.businessDetails?.monthlyProductionCapacity && (
                  <DetailItem label="Monthly Production Capacity">{formatIndianNumber(selectedSupplier.businessDetails.monthlyProductionCapacity)} units</DetailItem>
                )}
                {selectedSupplier.businessDetails?.taxFilingMethod && (
                  <DetailItem label="Tax Filing Method">{selectedSupplier.businessDetails.taxFilingMethod}</DetailItem>
                )}
                {selectedSupplier.businessDetails?.taxPaymentsCompliance && (
                  <DetailItem label="Tax Compliance Status">{selectedSupplier.businessDetails.taxPaymentsCompliance}</DetailItem>
                )}
                {selectedSupplier.businessDetails?.taxFilingDetails && (
                  <DetailItem label="Tax Filing Document">
                    <a href={selectedSupplier.businessDetails.taxFilingDetails} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-bold no-underline hover:underline text-sm">
                      <ExternalLink size={16} /> View Document
                    </a>
                  </DetailItem>
                )}
              </div>
            </div>
          )}
          <div className="p-6 border-b border-[#f1f5f9] bg-[#f8fafc]/50">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <Landmark size={20} />
              <h3 className="text-base font-extrabold text-[#0f172a] m-0">Bank Accounts</h3>
            </div>
            {selectedSupplier.banks && selectedSupplier.banks.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                {selectedSupplier.banks.map((bank, index) => (
                  <div key={index} className="p-4 bg-white border border-[#eef2f6] rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col gap-2 relative overflow-hidden">
                    {bank.isPrimary && (
                      <span className="absolute top-2 right-2 text-[9px] bg-[#ecfdf5] text-[#059669] font-bold px-2 py-0.5 rounded-full border border-[#a7f3d0]">PRIMARY</span>
                    )}
                    <div><span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block">Bank Name</span><p className="text-sm font-semibold text-[#1e293b] m-0">{bank.bankName}</p></div>
                    <div><span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block">Account Holder</span><p className="text-sm font-medium text-[#475569] m-0">{bank.accountHolderName}</p></div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div><span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block">Account Number</span><p className="text-sm font-mono text-[#475569] m-0">{bank.accountNumber}</p></div>
                      <div><span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block">IFSC Code</span><p className="text-sm font-mono text-[#475569] m-0">{bank.ifscCode}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#94a3b8] m-0">No bank accounts entered yet.</p>
            )}
          </div>
          <CommissionRateEditor supplierId={selectedSupplier._id} currentRate={(selectedSupplier as any).commissionRate} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <select
          value={viewMode}
          onChange={e => updateViewMode(e.target.value as 'PENDING' | 'VERIFIED')}
          className="w-full sm:w-auto border border-[#e2e8f0] rounded-[8px] px-3 py-2 focus-within:border-primary"
        >
          <option value="PENDING">Pending Suppliers</option>
          <option value="VERIFIED">Approved Suppliers</option>
        </select>
      </div>
      <SupplierTable
        title={viewMode === 'PENDING' ? 'Pending Suppliers' : 'Approved Suppliers'}
        suppliers={viewMode === 'PENDING' ? pendingSuppliers : verifiedSuppliers}
        onVerify={onVerify}
        onView={goToDetail}
        showActions={true}
      />
    </div>
  );
};

export default SupplierVerification;
