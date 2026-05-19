import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Handshake, Store, MapPin, Phone, Package } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import toast from 'react-hot-toast';
import supplierService from '../services/supplier.service';

const sectionCls = "bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5";

const SupplierPartnerships: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'partners'>('requests');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, partnersRes] = await Promise.all([
        supplierService.getPartnershipRequests(),
        supplierService.getPartners()
      ]);
      setRequests(requestsRes.requests || []);
      setPartners(partnersRes.partners || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleRespond = async (id: string, action: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      await supplierService.respondToRequest(id, action, reason);
      toast.success(`Request ${action.toLowerCase()} successfully`);
      setModalType(null); setSelectedRequest(null); setRejectionReason('');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to respond'); }
  };

  const openModal = (req: any, type: 'APPROVE' | 'REJECT') => { setSelectedRequest(req); setModalType(type); setRejectionReason(''); };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-[#64748b] gap-4">
      <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
      <p>Loading your reseller network...</p>
    </div>
  );

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const tabCls = (active: boolean) => `px-6 py-3 text-sm font-bold border-b-2 cursor-pointer transition-all ${active ? 'border-primary text-primary' : 'border-transparent text-[#64748b] hover:text-[#1e293b]'}`;

  return (
    <div>
      <div className="flex border-b border-[#eef2f6] mb-6">
        <button className={tabCls(activeTab === 'requests')} onClick={() => setActiveTab('requests')}>
          Partnership Requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
          )}
        </button>
        <button className={tabCls(activeTab === 'partners')} onClick={() => setActiveTab('partners')}>My Reseller Network</button>
      </div>

      {activeTab === 'requests' && (
        <div className="flex flex-col gap-4">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-[#64748b]">
              <div className="w-20 h-20 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-4"><Handshake size={40} /></div>
              <h3 className="text-lg font-bold text-[#1e293b] mb-2">No Pending Requests</h3>
              <p className="text-sm max-w-[360px]">When resellers request to partner with you, they'll appear here for your review.</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req._id} className={sectionCls}>
                <div className="flex items-center gap-4 mb-4">
                  {req.product?.images?.[0] ? (
                    <img src={req.product.images[0]} alt={req.product.name} className="w-14 h-14 object-cover rounded-[8px] border border-[#eef2f6]" />
                  ) : (
                    <div className="w-14 h-14 bg-[#f1f5f9] rounded-[8px] flex items-center justify-center text-[#94a3b8]"><Package size={20} /></div>
                  )}
                  <div>
                    <h4 className="font-bold text-[#1e293b] text-base m-0">{req.product?.name}</h4>
                    <span className="text-primary font-bold text-sm">₹{req.product?.basePrice?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-4 text-sm text-[#475569]">
                  <div className="flex items-center gap-2"><Store size={16} /> <strong>{req.reseller?.storeName}</strong></div>
                  <div className="flex items-center gap-2"><MapPin size={16} /> <span>{req.reseller?.city}, {req.reseller?.state}</span></div>
                </div>
                <div className="flex gap-3 max-sm:flex-col">
                  <Button variant="outline" onClick={() => openModal(req, 'REJECT')} className="flex items-center gap-2 !text-[#dc2626] !border-[#dc2626] hover:!bg-[#fef2f2]">
                    <XCircle size={16} /> Reject
                  </Button>
                  <Button onClick={() => openModal(req, 'APPROVE')} className="flex items-center gap-2">
                    <CheckCircle size={16} /> Review &amp; Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="flex flex-col gap-4">
          {partners.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-[#64748b]">
              <div className="w-20 h-20 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-4"><Store size={40} /></div>
              <h3 className="text-lg font-bold text-[#1e293b] mb-2">No Reseller Partners Yet</h3>
              <p className="text-sm max-w-[360px]">Accept requests from the 'Requests' tab to start building your distribution network.</p>
            </div>
          ) : (
            partners.map(partner => (
              <div key={partner._id} className={sectionCls}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 font-bold text-[#1e293b]"><Store size={20} /> {partner.reseller?.storeName}</div>
                  <span className="text-xs text-[#64748b]">Active Partner Since {new Date(partner.respondedAt).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                  {[
                    { label: 'Reseller Name', val: partner.reseller?.user?.name || 'N/A' },
                    { label: 'Location', val: `${partner.reseller?.city}, ${partner.reseller?.state}` },
                    { label: 'Authorized Product', val: partner.product?.name },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <span className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">{label}</span>
                      <span className="text-sm font-semibold text-[#1e293b]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalType === 'APPROVE' && selectedRequest && (
        <Modal isOpen onClose={() => setModalType(null)} title="Approve Partnership">
          <div className="p-4">
            <p className="text-[#475569] mb-6">
              You are authorizing <strong>{selectedRequest.reseller?.storeName}</strong> to list and sell <strong>{selectedRequest.product?.name}</strong> on their storefront.
            </p>
            <div className="mb-6">
              <h4 className="font-bold text-sm mb-3 text-[#1e293b]">Partner Profile</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Business', val: selectedRequest.reseller?.storeName },
                  { label: 'Contact', val: selectedRequest.reseller?.user?.name || 'N/A' },
                  { label: 'Phone', val: selectedRequest.reseller?.user?.phone || 'N/A' },
                  { label: 'Email', val: selectedRequest.reseller?.user?.email || 'N/A' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-[#f8fafc] rounded-[8px] p-3">
                    <label className="text-xs text-[#94a3b8] font-bold block mb-0.5">{label}</label>
                    <span className="text-sm font-semibold text-[#1e293b]">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <a href={`tel:${selectedRequest.reseller?.user?.phone}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] rounded-[8px] no-underline font-semibold text-sm">
                <Phone size={16} /> Call Reseller
              </a>
              <Button onClick={() => handleRespond(selectedRequest._id, 'APPROVED')} className="flex-1">Confirm Partnership</Button>
            </div>
          </div>
        </Modal>
      )}

      {modalType === 'REJECT' && selectedRequest && (
        <Modal isOpen onClose={() => setModalType(null)} title="Decline Partnership">
          <div className="p-4">
            <p className="text-[#475569] mb-6">
              Declining the request from <strong>{selectedRequest.reseller?.storeName}</strong>. You can provide a reason below.
            </p>
            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-2">Rejection Note (Optional)</label>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. We require a higher MOQ for this product."
                rows={4} className="w-full border border-[#e2e8f0] rounded-[8px] p-3 text-sm outline-none resize-none focus:border-primary" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModalType(null)} className="flex-1">Keep Pending</Button>
              <Button onClick={() => handleRespond(selectedRequest._id, 'REJECTED', rejectionReason)} className="flex-1 !bg-[#dc2626]">Confirm Decline</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SupplierPartnerships;
