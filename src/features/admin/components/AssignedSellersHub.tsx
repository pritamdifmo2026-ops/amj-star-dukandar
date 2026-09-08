import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, Package, AlertTriangle, CheckCircle, XCircle, Phone, Mail,
  MessageCircle, ShieldCheck, MapPin, Eye, Building2,
  DollarSign, Search, UserCheck
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import adminService from '../services/admin.service';
import type { AssignedSellerDetail, AdminProduct, AdminDispute } from '../types/admin.types';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';

export const AssignedSellersHub: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAppSelector(state => state.auth);

  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'products' | 'disputes' | 'performance'>('profile');
  const [productFilter, setProductFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [sellerSearch, setSellerSearch] = useState('');

  // Product action modal states
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [productActionModal, setProductActionModal] = useState<{
    isOpen: boolean;
    product: AdminProduct | null;
    action: 'APPROVED' | 'REJECTED';
  }>({ isOpen: false, product: null, action: 'APPROVED' });
  const [rejectionReason, setRejectionReason] = useState('');

  const hasPermission = (perm: string) => {
    if (user?.role === 'superadmin') return true;
    return user?.permissions?.includes(perm) || false;
  };

  // Fetch all assigned sellers enriched with stats
  const { data: sellers = [], isLoading: sellersLoading } = useQuery<AssignedSellerDetail[]>({
    queryKey: ['admin', 'my-assigned-sellers'],
    queryFn: () => adminService.getMyAssignedSellers(),
    staleTime: 30_000,
  });

  // Default selection to first seller once loaded
  const currentSeller = useMemo(() => {
    if (!sellers.length) return null;
    if (selectedSellerId) {
      return sellers.find(s => s._id === selectedSellerId) || sellers[0];
    }
    return sellers[0];
  }, [sellers, selectedSellerId]);

  // Fetch products for currently selected seller
  const { data: sellerProducts = [], isLoading: productsLoading } = useQuery<AdminProduct[]>({
    queryKey: ['admin', 'supplier-products', currentSeller?._id],
    queryFn: () => adminService.getSupplierProducts(currentSeller!._id),
    enabled: !!currentSeller?._id && (hasPermission('product_queue') || hasPermission('supplier_verify')),
  });

  // Fetch disputes
  const { data: allDisputes = [], isLoading: disputesLoading } = useQuery<AdminDispute[]>({
    queryKey: ['admin', 'disputes'],
    queryFn: () => adminService.getDisputes(),
    enabled: !!currentSeller && hasPermission('disputes'),
  });

  // Filter disputes belonging to current seller
  const sellerDisputes = useMemo(() => {
    if (!currentSeller) return [];
    const supUserId = typeof currentSeller.userId === 'object' ? currentSeller.userId?._id : currentSeller.userId;
    return allDisputes.filter((d: AdminDispute) => {
      const dSupplierId = typeof d.supplierId === 'object' ? d.supplierId?._id : d.supplierId;
      const orderSupplierId = typeof d.orderId === 'object' ? d.orderId?.supplierId : undefined;
      return (
        Boolean(supUserId && (dSupplierId === supUserId || orderSupplierId === supUserId)) ||
        Boolean(currentSeller.businessName && d.supplierBusinessName === currentSeller.businessName)
      );
    });
  }, [allDisputes, currentSeller]);

  const openDisputesCount = useMemo(() => {
    return sellerDisputes.filter(d => ['open', 'validated', 'reopened'].includes(d.status)).length;
  }, [sellerDisputes]);

  // Product verification mutation
  const verifyProductMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      adminService.verifyProduct(id, status, reason),
    onSuccess: () => {
      toast.success('Product status updated');
      qc.invalidateQueries({ queryKey: ['admin', 'supplier-products', currentSeller?._id] });
      qc.invalidateQueries({ queryKey: ['admin', 'my-assigned-sellers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setProductActionModal({ isOpen: false, product: null, action: 'APPROVED' });
      setRejectionReason('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Failed to update product');
    },
  });

  const filteredSellers = useMemo(() => {
    if (!sellerSearch.trim()) return sellers;
    const q = sellerSearch.toLowerCase();
    return sellers.filter(s =>
      s.businessName?.toLowerCase().includes(q) ||
      s.businessDetails?.ownerName?.toLowerCase().includes(q) ||
      s.businessDetails?.email?.toLowerCase().includes(q) ||
      s.userId?.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  }, [sellers, sellerSearch]);

  const filteredProducts = useMemo(() => {
    if (productFilter === 'ALL') return sellerProducts;
    return sellerProducts.filter(p => p.status === productFilter);
  }, [sellerProducts, productFilter]);

  if (sellersLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-[#64748b]">Loading your assigned sellers...</p>
      </div>
    );
  }

  if (!sellers.length) {
    return (
      <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-12 text-center shadow-sm max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-100">
          <Store size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#0f172a] mb-2">No Sellers Currently Assigned</h3>
        <p className="text-sm text-[#64748b] max-w-md mx-auto mb-6">
          You currently do not have any sellers assigned to your account. Your platform SuperAdmin can assign specific suppliers to you in the Control Authority panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white rounded-[16px] p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              Account Management Center
            </span>
            {user?.adminRoleLabel && (
              <span className="text-xs font-semibold text-slate-300">
                • {user.adminRoleLabel}
              </span>
            )}
          </div>
          <div className="text-2xl font-extrabold m-0 !text-white flex items-center gap-2.5 font-sans tracking-tight">
            <Store className="text-amber-400" size={26} />
            My Assigned Sellers ({sellers.length})
          </div>
          <p className="text-xs !text-slate-300 m-0 mt-1 font-sans">
            Managing operations, products, and support for your dedicated sellers.
          </p>
        </div>

        {/* Manager Quick Profile Pill */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center gap-3 text-left shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
          </div>
          <div>
            <div className="text-xs font-bold text-white">{user?.name || 'Account Manager'}</div>
            <div className="text-[11px] text-slate-300">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* ── Multi-Seller Switcher (if more than 1 assigned) ───────────────── */}
      {sellers.length > 1 && (
        <div className="bg-white rounded-[14px] p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#64748b]">
              Select Assigned Seller:
            </span>
            <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-2.5 py-1.5 bg-slate-50 text-xs w-full sm:w-64">
              <Search size={13} className="text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search assigned sellers..."
                value={sellerSearch}
                onChange={e => setSellerSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-[#1e293b] w-full placeholder:text-[#94a3b8]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {filteredSellers.length === 0 ? (
              <p className="text-xs text-[#94a3b8] py-2 px-1 m-0 italic">
                No assigned sellers found matching "{sellerSearch}".
              </p>
            ) : (
              filteredSellers.map(seller => {
                const isSelected = currentSeller?._id === seller._id;
                const pendingCount = seller.stats?.products?.pending || 0;
                const disputeCount = seller.stats?.disputes?.open || 0;

                return (
                  <button
                    key={seller._id}
                    onClick={() => {
                      setSelectedSellerId(seller._id);
                      setActiveSubTab('profile');
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left cursor-pointer transition-all shrink-0 ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-sm text-primary font-bold'
                        : 'bg-[#fafbfc] border-[#e2e8f0] hover:bg-slate-50 text-[#334155]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {seller.businessName?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-bold truncate max-w-[150px]">{seller.businessName}</div>
                      <div className="text-[10px] text-[#64748b] flex items-center gap-1.5">
                        <span>{seller.tier || 'VERIFIED'}</span>
                        {pendingCount > 0 && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-1.5 rounded-full">
                            {pendingCount} pending
                          </span>
                        )}
                        {disputeCount > 0 && (
                          <span className="bg-red-100 text-red-700 font-bold px-1.5 rounded-full">
                            {disputeCount} dispute
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {currentSeller && (
        <>
          {/* ── Active Seller Quick Overview Card ─────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#f1f5f9]">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 text-primary flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
                  {currentSeller.businessName?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-extrabold text-[#0f172a] m-0 font-sans tracking-tight">
                      {currentSeller.businessName}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] flex items-center gap-1">
                      <ShieldCheck size={12} /> {currentSeller.kycStatus || 'VERIFIED'}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]">
                      {currentSeller.tier || 'VERIFIED TIER'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#64748b] mt-2 flex-wrap">
                    {currentSeller.businessDetails?.ownerName && (
                      <span className="flex items-center gap-1">
                        <UserCheck size={13} className="text-[#94a3b8]" />
                        <strong>Owner:</strong> {currentSeller.businessDetails.ownerName}
                      </span>
                    )}
                    {currentSeller.businessDetails?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-[#94a3b8]" />
                        {currentSeller.businessDetails.city}, {currentSeller.businessDetails.state}
                      </span>
                    )}
                    {currentSeller.businessDetails?.gstin && (
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] text-[#475569]">
                        GST: {currentSeller.businessDetails.gstin}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Contact & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {currentSeller.phone && (
                  <a
                    href={`tel:${currentSeller.phone}`}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1e293b] no-underline transition-all"
                  >
                    <Phone size={14} className="text-[#059669]" /> Call Phone
                  </a>
                )}
                {currentSeller.phone && (() => {
                  const cleanPhone = currentSeller.phone.replace(/\D/g, '');
                  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  return (
                    <a
                      href={`https://wa.me/${waPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 no-underline transition-all"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  );
                })()}
                {(currentSeller.businessDetails?.email || currentSeller.userId?.email) && (
                  <a
                    href={`mailto:${currentSeller.businessDetails?.email || currentSeller.userId?.email}`}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 no-underline transition-all"
                  >
                    <Mail size={14} /> Email
                  </a>
                )}
              </div>
            </div>

            {/* ── Key Metrics Bar ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-[#eef2f6]">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                  Product Queue
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-[#0f172a]">
                    {currentSeller.stats?.products?.total || 0}
                  </span>
                  {(currentSeller.stats?.products?.pending || 0) > 0 ? (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {currentSeller.stats.products.pending} pending
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      All Approved
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-[#eef2f6]">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                  Disputes
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-[#0f172a]">
                    {currentSeller.stats?.disputes?.open || 0}
                  </span>
                  {(currentSeller.stats?.disputes?.open || 0) > 0 ? (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      0 Active • All Clear
                    </span>
                  )}
                </div>
                {(currentSeller.stats?.disputes?.total || 0) > 0 && (
                  <span className="text-[11px] text-[#94a3b8] font-medium block mt-1">
                    {currentSeller.stats?.disputes?.total} total history
                  </span>
                )}
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-[#eef2f6]">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                  Completed Orders
                </span>
                <span className="text-xl font-extrabold text-[#0f172a]">
                  {currentSeller.stats?.orders?.completed || 0}
                </span>
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-[#eef2f6]">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                  Total Volume
                </span>
                <span className="text-xl font-extrabold text-[#0f172a]">
                  ₹{(currentSeller.stats?.orders?.revenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* ── Sub-Navigation Tabs ──────────────────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-px">
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 cursor-pointer transition-all bg-transparent ${
                activeSubTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Building2 size={15} /> Business Profile
            </button>

            {hasPermission('product_queue') && (
              <button
                onClick={() => setActiveSubTab('products')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 cursor-pointer transition-all bg-transparent ${
                  activeSubTab === 'products'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <Package size={15} /> Products Queue
                {(currentSeller.stats?.products?.pending || 0) > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {currentSeller.stats.products.pending}
                  </span>
                )}
              </button>
            )}

            {hasPermission('disputes') && (
              <button
                onClick={() => setActiveSubTab('disputes')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 cursor-pointer transition-all bg-transparent ${
                  activeSubTab === 'disputes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <AlertTriangle size={15} /> Disputes
                {openDisputesCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {openDisputesCount}
                  </span>
                )}
              </button>
            )}

            {(hasPermission('performance') || hasPermission('earnings')) && (
              <button
                onClick={() => setActiveSubTab('performance')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold border-b-2 cursor-pointer transition-all bg-transparent ${
                  activeSubTab === 'performance'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <DollarSign size={15} /> Performance & Earnings
              </button>
            )}
          </div>

          {/* ── Sub-Tab 1: Business Profile & Details ─────────────────────── */}
          {activeSubTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Business Details */}
              <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wider m-0 pb-3 border-b border-[#f1f5f9] font-sans">
                  Business Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">Business Name</span>
                    <span className="font-semibold text-[#0f172a]">{currentSeller.businessName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">Registered Owner</span>
                    <span className="font-semibold text-[#0f172a]">{currentSeller.businessDetails?.ownerName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">Phone Number</span>
                    <span className="font-semibold text-[#0f172a]">{currentSeller.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">Email Address</span>
                    <span className="font-semibold text-[#0f172a]">{currentSeller.businessDetails?.email || currentSeller.userId?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">GST Number</span>
                    <span className="font-mono font-semibold text-[#0f172a]">{currentSeller.businessDetails?.gstin || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">PAN Number</span>
                    <span className="font-mono font-semibold text-[#0f172a]">{currentSeller.businessDetails?.pan || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#64748b]">Complete Address</span>
                    <span className="font-semibold text-[#0f172a] text-right max-w-xs">
                      {[
                        currentSeller.businessDetails?.address,
                        currentSeller.businessDetails?.city,
                        currentSeller.businessDetails?.state,
                        currentSeller.businessDetails?.pinCode,
                      ].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Management & Membership Status */}
              <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wider m-0 pb-3 border-b border-[#f1f5f9] font-sans">
                  Account Management & Membership
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">Assigned Account Manager</span>
                    <span className="font-bold text-primary">{user?.name || 'You'} ({user?.adminRoleLabel || 'Account Manager'})</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">Platform Tier</span>
                    <span className="font-bold text-[#0284c7]">{currentSeller.tier || 'VERIFIED'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[#64748b]">Membership Plan</span>
                    <span className="font-semibold text-[#0f172a]">
                      {currentSeller.subscription?.tier || 'Standard'} ({currentSeller.subscription?.status || 'Active'})
                    </span>
                  </div>
                  {currentSeller.subscription?.expiryDate && (
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-[#64748b]">Plan Expiry Date</span>
                      <span className="font-semibold text-[#0f172a]">
                        {!isNaN(new Date(currentSeller.subscription.expiryDate).getTime())
                          ? new Date(currentSeller.subscription.expiryDate).toLocaleDateString('en-IN')
                          : '—'}
                      </span>
                    </div>
                  )}
                  {currentSeller.commissionRate !== undefined && (
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-[#64748b]">Commission Rate</span>
                      <span className="font-bold text-[#0f172a]">{currentSeller.commissionRate}%</span>
                    </div>
                  )}
                  {currentSeller.pendingUpgrade?.status === 'VERIFICATION_PENDING' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                      ⚡ Supplier has paid for an upgrade to {currentSeller.pendingUpgrade.targetTier} and is awaiting verification.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Sub-Tab 2: Products Queue ─────────────────────────────────── */}
          {activeSubTab === 'products' && hasPermission('product_queue') && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-xl">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setProductFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none transition-all ${
                        productFilter === f
                          ? 'bg-white text-[#0f172a] shadow-sm'
                          : 'bg-transparent text-[#64748b] hover:text-[#0f172a]'
                      }`}
                    >
                      {f === 'ALL' ? 'All Products' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#64748b]">
                  Showing {filteredProducts.length} product(s)
                </span>
              </div>

              {productsLoading ? (
                <div className="py-12 text-center text-sm text-[#64748b]">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center text-sm text-[#64748b]">
                  No {productFilter !== 'ALL' ? productFilter.toLowerCase() : ''} products found for this seller.
                </div>
              ) : (
                <div className="bg-white rounded-[16px] border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[#f1f5f9] bg-[#fafbfc] text-[#64748b] text-[11px] font-bold uppercase tracking-wider">
                          <th className="p-4">Product</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f8fafc]">
                        {filteredProducts.map(prod => (
                          <tr key={prod.id || prod._id} className="hover:bg-[#fafbfc] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {prod.images?.[0] ? (
                                  <img
                                    src={prod.images[0]}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover border border-[#eef2f6]"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Package size={20} />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-[#0f172a]">{prod.name}</div>
                                  <div className="text-xs text-[#64748b] truncate max-w-xs">{prod.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-xs font-semibold text-[#475569]">
                              {prod.category || '—'}
                            </td>
                            <td className="p-4 text-xs font-bold text-[#0f172a]">
                              ₹{(prod.basePrice || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                prod.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : prod.status === 'REJECTED'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {prod.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedProduct(prod)}
                                  className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye size={13} /> View
                                </button>
                                {prod.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => setProductActionModal({ isOpen: true, product: prod, action: 'APPROVED' })}
                                      className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center border-none cursor-pointer transition-all"
                                      title="Approve"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button
                                      onClick={() => setProductActionModal({ isOpen: true, product: prod, action: 'REJECTED' })}
                                      className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center border-none cursor-pointer transition-all"
                                      title="Reject"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Sub-Tab 3: Disputes ───────────────────────────────────────── */}
          {activeSubTab === 'disputes' && hasPermission('disputes') && (
            <div className="space-y-4 animate-fade-in">
              {disputesLoading ? (
                <div className="py-12 text-center text-sm text-[#64748b]">Loading disputes...</div>
              ) : sellerDisputes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="font-bold text-[#0f172a] m-0 mb-1 font-sans">No Disputes for this Seller</h4>
                  <p className="text-xs text-[#64748b] m-0">All customer orders for this seller are fulfilled smoothly.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerDisputes.map((dispute: AdminDispute) => {
                    const orderNumber = typeof dispute.orderId === 'object'
                      ? (dispute.orderId?.orderNumber || dispute.orderId?._id?.slice(-8) || 'N/A')
                      : (typeof dispute.orderId === 'string' ? dispute.orderId.slice(-8) : 'N/A');
                    const orderAmount = typeof dispute.orderId === 'object' ? (dispute.orderId?.totalAmount || 0) : 0;
                    const statusClass =
                      ['resolved', 'supplier_resolved'].includes(dispute.status)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : dispute.status === 'rejected'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : dispute.status === 'reopened'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : dispute.status === 'validated'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                      <div key={dispute._id} className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-[#0f172a]">
                              Order #{orderNumber}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase ${statusClass}`}>
                              {dispute.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] m-0">
                            <strong>Issue:</strong> {dispute.issueType || 'Quality/Damage issue'} • <strong>Details:</strong> {dispute.description || dispute.reason || 'Customer raised complaint'}
                          </p>
                          <div className="text-[11px] text-[#94a3b8] mt-1">
                            Buyer: {dispute.buyerId?.name || 'Customer'} ({dispute.buyerId?.phone || 'No phone'})
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-[#0f172a]">
                            Amount: ₹{orderAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-[#64748b] mt-1">
                            Raised: {dispute.createdAt && !isNaN(new Date(dispute.createdAt).getTime()) ? new Date(dispute.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Sub-Tab 4: Performance & Earnings ─────────────────────────── */}
          {activeSubTab === 'performance' && (hasPermission('performance') || hasPermission('earnings')) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
              <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 shadow-sm">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block mb-2">Total Sales Volume</span>
                <div className="text-2xl font-black text-[#0f172a]">
                  ₹{(currentSeller.stats?.orders?.revenue || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-xs text-emerald-600 font-semibold mt-1 block">From verified completed deliveries</span>
              </div>

              <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 shadow-sm">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block mb-2">Orders Completed</span>
                <div className="text-2xl font-black text-[#0f172a]">
                  {currentSeller.stats?.orders?.completed || 0}
                </div>
                <span className="text-xs text-[#64748b] font-semibold mt-1 block">
                  Out of {currentSeller.stats?.orders?.total || 0} total placed
                </span>
              </div>

              <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 shadow-sm">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block mb-2">Live Products</span>
                <div className="text-2xl font-black text-[#0f172a]">
                  {currentSeller.stats?.products?.approved || 0}
                </div>
                <span className="text-xs text-emerald-600 font-semibold mt-1 block">Visible to buyers across India</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Product Action Modal (Approve / Reject) ───────────────────────── */}
      <Modal
        isOpen={productActionModal.isOpen}
        onClose={() => setProductActionModal({ isOpen: false, product: null, action: 'APPROVED' })}
        title={`${productActionModal.action === 'APPROVED' ? 'Approve' : 'Reject'} Product`}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setProductActionModal({ isOpen: false, product: null, action: 'APPROVED' })}
            >
              Cancel
            </Button>
            <Button
              variant={productActionModal.action === 'APPROVED' ? 'primary' : 'danger'}
              loading={verifyProductMutation.isPending}
              disabled={verifyProductMutation.isPending}
              onClick={() => {
                if (productActionModal.action === 'REJECTED' && !rejectionReason.trim()) {
                  toast.error('Please enter a rejection reason');
                  return;
                }
                verifyProductMutation.mutate({
                  id: productActionModal.product?._id || productActionModal.product?.id || '',
                  status: productActionModal.action,
                  reason: rejectionReason,
                });
              }}
            >
              Confirm {productActionModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        }
      >
        <div className="py-3">
          <p className="text-sm text-[#334155] mb-4">
            Are you sure you want to <strong>{productActionModal.action.toLowerCase()}</strong> the product{' '}
            "<strong>{productActionModal.product?.name}</strong>"?
          </p>
          {productActionModal.action === 'REJECTED' && (
            <div>
              <label className="block text-xs font-bold text-[#0f172a] mb-1.5 uppercase">
                Rejection Reason *
              </label>
              <textarea
                className="w-full border border-[#e2e8f0] rounded-xl p-3 text-sm outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Explain what must be fixed by the seller..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ── Product Detail View Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Product Details'}
        footer={
          <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
            Close
          </Button>
        }
      >
        {selectedProduct && (
          <div className="space-y-4 py-2">
            {selectedProduct.images?.[0] && (
              <img
                src={selectedProduct.images[0]}
                alt=""
                className="w-full h-48 object-cover rounded-xl border border-slate-100"
              />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-[#64748b] block font-semibold">Category</span>
                <span className="font-bold text-[#0f172a]">{selectedProduct.category}</span>
              </div>
              <div>
                <span className="text-xs text-[#64748b] block font-semibold">Base Price</span>
                <span className="font-bold text-primary">₹{(selectedProduct.basePrice ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-[#64748b] block font-semibold">Description</span>
                <p className="text-xs text-[#334155] mt-1">{selectedProduct.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssignedSellersHub;
