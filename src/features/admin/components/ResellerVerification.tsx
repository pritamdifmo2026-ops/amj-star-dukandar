import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldCheck, ChevronLeft, Search, ExternalLink } from 'lucide-react';
import Pagination from '@/shared/components/ui/Pagination';

import type { AdminReseller } from '../types/admin.types';

interface ResellerVerificationProps {
  resellers: AdminReseller[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9] max-md:hidden";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155] max-md:flex max-md:justify-between max-md:items-center max-md:border-none max-md:py-2 max-md:px-0 text-right md:text-left";
const trCls = "hover:bg-[#fafbfc] max-md:block max-md:p-4 max-md:border-b max-md:border-[#e2e8f0] last:border-none";

const DetailItem = ({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) => (
  <div className={span2 ? 'col-span-2 max-sm:col-span-1' : ''}>
    <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">{label}</label>
    <div className="text-sm text-[#1e293b] font-medium">{children}</div>
  </div>
);

const ResellerTable: React.FC<{
  title: string; resellers: AdminReseller[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onView: (id: string) => void;
  showActions?: boolean;
}> = ({ title, resellers, onVerify, onView, showActions }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = resellers.filter(r =>
    r.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search)
  );
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const statusCls = (status: string) => {
    if (status === 'APPROVED') return 'bg-[#ecfdf5] text-[#059669]';
    if (status === 'REJECTED') return 'bg-[#fef2f2] text-[#dc2626]';
    return 'bg-[#fffbeb] text-[#a16207]';
  };

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
              <tr>{['Store Name', 'Reseller Name', 'Contact', 'Status', 'Plan', 'Reach', 'Actions'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
            </thead>
            <tbody className="max-md:block">
              {paginated.map(r => (
                <tr key={r._id} className={trCls}>
                  <td className={tdCls + " font-semibold text-[#0f172a]"}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Store Name</span> {r.storeName}</td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Reseller Name</span> {r.fullName || r.user?.name || 'N/A'}</td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Contact</span> {r.phone || r.user?.phone || r.user?.email || 'N/A'}</td>
                  <td className={tdCls}>
                    <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCls(r.status)}`}>{r.status}</span>
                  </td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Plan</span> <span className="text-xs bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] px-2 py-0.5 rounded-full font-semibold">{r.subscriptionPlan || 'Starter'}</span></td>
                  <td className={tdCls}><span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Reach</span> <span className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">{r.reach}</span></td>
                  <td className={tdCls}>
                    <span className="md:hidden font-bold text-xs text-[#94a3b8] uppercase">Actions</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onView(r._id)} className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0">View</button>
                      {showActions && r.status === 'PENDING' && (
                        <>
                          <button onClick={() => onVerify(r._id, 'APPROVED')} className="w-7 h-7 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center border-none cursor-pointer hover:bg-[#d1fae5]" title="Approve"><CheckCircle size={15} /></button>
                          <button onClick={() => onVerify(r._id, 'REJECTED')} className="w-7 h-7 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center border-none cursor-pointer hover:bg-[#fee2e2]" title="Reject"><XCircle size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr className="max-md:block max-md:p-4"><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#64748b] max-md:block max-md:p-0">No {title.toLowerCase()} found</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={page} onPageChange={setPage} />
      </div>
    </div>
  );
};

const ResellerVerification: React.FC<ResellerVerificationProps> = ({ resellers, onVerify }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'resellers';
  const resellerId = searchParams.get('id');
  const selectedReseller = resellers.find(r => r._id === resellerId);
  const pendingResellers = resellers.filter(r => r.status === 'PENDING');
  const approvedResellers = resellers.filter(r => r.status === 'APPROVED');

  if (activeTab === 'reseller-detail' && selectedReseller) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <button onClick={() => setSearchParams({ tab: 'resellers' })} className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] bg-transparent border-none cursor-pointer hover:text-[#1e293b] p-0">
            <ChevronLeft size={18} /> Back to List
          </button>
          {selectedReseller.status === 'PENDING' && (
            <div className="flex items-center gap-2">
              <button onClick={() => onVerify(selectedReseller._id, 'REJECTED')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] cursor-pointer hover:bg-[#fee2e2]">
                <XCircle size={16} /> Reject Application
              </button>
              <button onClick={() => onVerify(selectedReseller._id, 'APPROVED')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857]">
                <CheckCircle size={16} /> Approve Reseller
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#eef2f6] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-6 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2 mb-4 text-primary"><ShieldCheck size={20} /><h3 className="text-base font-extrabold text-[#0f172a] m-0">Reseller Onboarding Profile</h3></div>
            <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
              <DetailItem label="Store Name">{selectedReseller.storeName}</DetailItem>
              <DetailItem label="Full Name">{selectedReseller.fullName || 'N/A'}</DetailItem>
              <DetailItem label="Location">{selectedReseller.city}, {selectedReseller.state}{selectedReseller.pinCode ? ` — ${selectedReseller.pinCode}` : ''}, {selectedReseller.country}</DetailItem>
              <DetailItem label="Full Address" span2>{selectedReseller.address || 'N/A'}</DetailItem>
              <DetailItem label="Contact Info">
                {selectedReseller.phone || selectedReseller.user?.phone || 'N/A'}<br />
                <span className="text-[#64748b] text-xs">{selectedReseller.email || selectedReseller.user?.email || 'No email provided'}</span>
              </DetailItem>
              <DetailItem label="Profile Type">{selectedReseller.profileType || 'N/A'}</DetailItem>
              <DetailItem label="Experience">{selectedReseller.experience || 'N/A'}</DetailItem>
              <DetailItem label="Reach"><span className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">{selectedReseller.reach}</span></DetailItem>
              <DetailItem label="Monthly Volume">{selectedReseller.monthlyVolume || 'N/A'}</DetailItem>
              <DetailItem label="Subscription Plan">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] border border-[#10b981]">{selectedReseller.subscriptionPlan || 'Free Starter'}</span>
              </DetailItem>
              <DetailItem label="Sales Experience">{selectedReseller.experience} ({selectedReseller.soldBefore ? 'Has sold before' : 'New seller'})</DetailItem>
            </div>
          </div>

          <div className="p-6 border-b border-[#f1f5f9]">
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-4">Channels & Platforms</h3>
            <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
              <DetailItem label="Selling Platforms" span2>
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedReseller.platforms?.map((p: string) => (
                    <span key={p} className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">{p}</span>
                  )) || 'None listed'}
                </div>
              </DetailItem>
              <DetailItem label="About Business" span2>
                <p className="text-sm text-[#475569] leading-relaxed m-0">{selectedReseller.profileDescription || 'No description provided'}</p>
              </DetailItem>
            </div>
          </div>

          <div className="p-6 border-b border-[#f1f5f9]">
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-4">Bank & Tax Details</h3>
            <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
              <DetailItem label="Account Holder Name" span2><span className="text-base font-bold">{selectedReseller.accountName || 'N/A'}</span></DetailItem>
              <DetailItem label="Bank Name">{selectedReseller.bankName || 'N/A'}</DetailItem>
              <DetailItem label="Account Number">{selectedReseller.accountNumber || 'N/A'}</DetailItem>
              <DetailItem label="IFSC Code">{selectedReseller.ifscCode || 'N/A'}</DetailItem>
              <DetailItem label="GST Number"><strong>{selectedReseller.gstNumber || 'N/A'}</strong></DetailItem>
              <DetailItem label="PAN Number">{selectedReseller.panNumber || 'N/A'}</DetailItem>
              <DetailItem label="Verification Document" span2>
                {selectedReseller.idProofUrl ? (
                  <a href={selectedReseller.idProofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-bold no-underline hover:underline text-sm">
                    <ExternalLink size={16} /> View ID Proof Document
                  </a>
                ) : <p className="text-[#ef4444] text-sm m-0">Document not uploaded</p>}
              </DetailItem>
            </div>
          </div>

          {selectedReseller.status === 'REJECTED' && (
            <div className="p-6 border-2 border-[#fee2e2] bg-[#fffafb] m-4 rounded-[10px]">
              <h3 className="text-base font-extrabold text-[#ef4444] m-0 mb-2">Rejection Reason</h3>
              <p className="text-sm text-[#7f1d1d] m-0 mt-2">{selectedReseller.rejectionReason || 'No reason provided'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ResellerTable title="Pending Resellers" resellers={pendingResellers} onVerify={onVerify} onView={id => setSearchParams({ tab: 'reseller-detail', id })} showActions />
      <div className="my-8 border-t-2 border-[#e2e8f0]" />
      <ResellerTable title="Approved Resellers" resellers={approvedResellers} onVerify={onVerify} onView={id => setSearchParams({ tab: 'reseller-detail', id })} />
    </div>
  );
};

export default ResellerVerification;
