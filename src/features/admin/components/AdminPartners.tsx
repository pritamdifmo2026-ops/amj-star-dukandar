import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  CheckCircle,
  XCircle,
  Edit3,
  DollarSign,
  Wallet,
  Users,
  Plus,
  Eye,
  Clock,
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  X,
  Landmark,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Loader from '@/shared/components/feedback/Loader';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import partnerService, {
  type PartnerProfile,
  type PartnerPayoutItem
} from '@/features/partner/services/partner.service';
import AdminPartnerDossier from './AdminPartnerDossier';

const thCls = "text-left px-4 py-3.5 text-slate-500 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-slate-200 bg-slate-50";
const tdCls = "px-4 py-3.5 border-b border-slate-100 text-xs text-slate-700";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export const AdminPartners: React.FC = () => {
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<'partners' | 'pending' | 'payouts'>('partners');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('');

  // Modals
  const [viewingPartnerId, setViewingPartnerId] = useState<string | null>(null);
  const [editingPartner, setEditingPartner] = useState<PartnerProfile | null>(null);
  const [viewingBankPayout, setViewingBankPayout] = useState<PartnerPayoutItem | null>(null);
  const [viewingPartnerBank, setViewingPartnerBank] = useState<PartnerProfile | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getTdsPercent = (payout: { amount: number; tdsDeducted: number; tdsRate?: number }): number => {
    if (payout.amount && payout.tdsDeducted) {
      return Math.round((payout.tdsDeducted / payout.amount) * 100);
    }
    if (payout.tdsRate !== undefined && payout.tdsRate !== null) {
      return Math.round(payout.tdsRate * 100);
    }
    return 5;
  };

  // Approve / reject a self-registration
  const [approvalTarget, setApprovalTarget] = useState<PartnerProfile | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalSellerCommission, setApprovalSellerCommission] = useState<number>(15);
  const [approvalBuyerCommission, setApprovalBuyerCommission] = useState<number>(10);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalRejectReason, setApprovalRejectReason] = useState('');
  const [isUpdatingPartner, setIsUpdatingPartner] = useState(false);
  const [sellerCommissionRate, setSellerCommissionRate] = useState<number>(15);
  const [buyerCommissionRate, setBuyerCommissionRate] = useState<number>(10);
  const [commissionRate, setCommissionRate] = useState<number>(25);
  const [partnerStatus, setPartnerStatus] = useState<string>('active');

  // Suspend / Block Partner Confirmation Modal
  const [suspendingPartner, setSuspendingPartner] = useState<PartnerProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Create Partner Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    sellerCommissionPercent: 15,
    buyerCommissionPercent: 10,
    commissionSharePercent: 25,
    businessName: '',
    panNumber: '',
    gstin: '',
  });

  // Process Payout Modal
  const [processingPayout, setProcessingPayout] = useState<PartnerPayoutItem | null>(null);
  const [payoutAction, setPayoutAction] = useState<'approve' | 'reject'>('approve');
  const [paymentReference, setPaymentReference] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Queries
  const effectiveStatus = subTab === 'pending' ? 'pending' : (statusFilter || 'non_pending');

  const { data: partnersData, isLoading: isPartnersLoading } = useQuery({
    queryKey: ['adminPartners', subTab, search, statusFilter],
    queryFn: () => partnerService.adminGetAllPartners({
      search: search.trim() || undefined,
      status: effectiveStatus,
    }),
  });

  const { data: payoutsData, isLoading: isPayoutsLoading } = useQuery({
    queryKey: ['adminPartnerPayouts', payoutStatusFilter],
    queryFn: () => partnerService.adminGetAllPayouts({
      status: payoutStatusFilter || undefined,
    }),
  });

  // Mutations
  const createPartnerMutation = useMutation({
    mutationFn: (data: typeof createForm) => partnerService.adminCreatePartner(data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Partner onboarded successfully!');
      qc.invalidateQueries({ queryKey: ['adminPartners'] });
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        sellerCommissionPercent: 15,
        buyerCommissionPercent: 10,
        commissionSharePercent: 25,
        businessName: '',
        panNumber: '',
        gstin: '',
      });
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create partner')),
  });

  const processPayoutMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { action: 'approve' | 'reject'; paymentReference?: string; rejectionReason?: string } }) =>
      partnerService.adminProcessPayout(id, payload),
    onSuccess: (data) => {
      toast.success(data?.message || 'Payout request processed');
      qc.invalidateQueries({ queryKey: ['adminPartnerPayouts'] });
      qc.invalidateQueries({ queryKey: ['adminPartners'] });
      setProcessingPayout(null);
      setPaymentReference('');
      setRejectionReason('');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to process payout')),
  });

  const invalidatePartnerQueries = () => {
    qc.invalidateQueries({ queryKey: ['adminPartners'] });
    qc.invalidateQueries({ queryKey: ['adminPartnerDetail'] });
    qc.invalidateQueries({ queryKey: ['admin', 'partners', 'pending-count'] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      partnerService.adminUpdatePartnerStatus(id, status, reason),
    onSuccess: (data) => {
      toast.success(data?.message || 'Partner status updated successfully');
      invalidatePartnerQueries();
      setSuspendingPartner(null);
      setSuspendReason('');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update partner status')),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      commissionSharePercent,
      sellerCommissionPercent,
      buyerCommissionPercent,
      adminNotes,
    }: {
      id: string;
      commissionSharePercent: number;
      sellerCommissionPercent: number;
      buyerCommissionPercent: number;
      adminNotes?: string;
    }) =>
      partnerService.adminApprovePartner(id, {
        commissionSharePercent,
        sellerCommissionPercent,
        buyerCommissionPercent,
        ...(adminNotes ? { adminNotes } : {}),
      }),
    onSuccess: (data) => {
      toast.success(data?.message || 'Partner approved and activated');
      invalidatePartnerQueries();
      closeApprovalModal();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to approve partner')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      partnerService.adminRejectPartner(id, reason),
    onSuccess: (data) => {
      toast.success(data?.message || 'Registration rejected');
      invalidatePartnerQueries();
      closeApprovalModal();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to reject partner')),
  });

  const openApprovalModal = (partner: PartnerProfile, action: 'approve' | 'reject') => {
    setApprovalTarget(partner);
    setApprovalAction(action);
    const sRate = partner.sellerCommissionPercent ?? 15;
    const bRate = partner.buyerCommissionPercent ?? 10;
    setApprovalSellerCommission(sRate);
    setApprovalBuyerCommission(bRate);
    setApprovalNote(partner.adminNotes || '');
    setApprovalRejectReason('');
  };

  function closeApprovalModal() {
    setApprovalTarget(null);
    setApprovalNote('');
    setApprovalRejectReason('');
  }

  const handleApprovalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalTarget) return;

    if (approvalAction === 'approve') {
      if (
        approvalSellerCommission < 0 ||
        approvalSellerCommission > 100 ||
        approvalBuyerCommission < 0 ||
        approvalBuyerCommission > 100
      ) {
        toast.error('Seller and Buyer commission rates must be between 0 and 100%');
        return;
      }
      approveMutation.mutate({
        id: approvalTarget._id,
        commissionSharePercent: approvalSellerCommission + approvalBuyerCommission,
        sellerCommissionPercent: approvalSellerCommission,
        buyerCommissionPercent: approvalBuyerCommission,
        ...(approvalNote.trim() ? { adminNotes: approvalNote.trim() } : {}),
      });
      return;
    }

    if (!approvalRejectReason.trim()) {
      toast.error('Give a reason — the applicant is shown it');
      return;
    }
    rejectMutation.mutate({ id: approvalTarget._id, reason: approvalRejectReason.trim() });
  };

  const openEditModal = (partner: PartnerProfile) => {
    setEditingPartner(partner);
    const sRate = partner.sellerCommissionPercent ?? 15;
    const bRate = partner.buyerCommissionPercent ?? 10;
    setSellerCommissionRate(sRate);
    setBuyerCommissionRate(bRate);
    setCommissionRate(partner.commissionSharePercent ?? (sRate + bRate));
    // 'pending' is the legacy spelling — show the canonical one in the picker.
    setPartnerStatus(partner.status === 'pending' ? 'pending_approval' : partner.status);
  };

  const handleSavePartnerEdit = async () => {
    if (!editingPartner) return;
    const statusChanged =
      partnerStatus !== editingPartner.status &&
      !(partnerStatus === 'pending_approval' && editingPartner.status === 'pending');
    const prevSRate = editingPartner.sellerCommissionPercent ?? 15;
    const prevBRate = editingPartner.buyerCommissionPercent ?? 10;
    const prevTotRate = editingPartner.commissionSharePercent ?? (prevSRate + prevBRate);
    const commissionChanged =
      sellerCommissionRate !== prevSRate ||
      buyerCommissionRate !== prevBRate ||
      commissionRate !== prevTotRate;

    if (!statusChanged && !commissionChanged) {
      setEditingPartner(null);
      return;
    }

    // If switching an active partner to 'suspended', require confirmation!
    if (statusChanged && partnerStatus === 'suspended' && editingPartner.status !== 'suspended') {
      const target = editingPartner;
      setEditingPartner(null);
      setSuspendingPartner(target);
      return;
    }

    setIsUpdatingPartner(true);
    try {
      if (statusChanged) {
        await partnerService.adminUpdatePartnerStatus(editingPartner._id, partnerStatus);
      }
      if (commissionChanged) {
        await partnerService.adminUpdatePartnerCommission(editingPartner._id, {
          sellerCommissionPercent: sellerCommissionRate,
          buyerCommissionPercent: buyerCommissionRate,
          commissionSharePercent: sellerCommissionRate + buyerCommissionRate,
        });
      }
      toast.success('Partner details updated successfully');
      invalidatePartnerQueries();
      setEditingPartner(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update partner'));
    } finally {
      setIsUpdatingPartner(false);
    }
  };

  const handleProcessPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingPayout) return;
    if (payoutAction === 'approve' && !paymentReference.trim()) {
      toast.error('Please enter the Bank UTR / Transaction Reference');
      return;
    }
    if (payoutAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Please enter the reason for rejection');
      return;
    }

    processPayoutMutation.mutate({
      id: processingPayout._id,
      payload: {
        action: payoutAction,
        paymentReference: paymentReference.trim() || undefined,
        rejectionReason: rejectionReason.trim() || undefined,
      },
    });
  };

  const partners: PartnerProfile[] = partnersData?.partners || [];
  const payouts: PartnerPayoutItem[] = payoutsData?.payouts || [];

  // Summary counts come from the API so they cover every partner, not just this page.
  const overview = partnersData?.overview;
  const pendingCount = partnersData?.pendingCount ?? 0;
  const nonPendingCount = partnersData?.nonPendingCount ?? (overview?.nonPending ?? Math.max(0, (overview?.active ?? 0) + (overview?.suspended ?? 0) + (overview?.rejected ?? 0)));
  const activeCount = overview?.active ?? 0;
  const totalPartners = nonPendingCount + pendingCount;
  const pendingPayoutsCount = payoutsData?.requestedCount ?? payouts.filter(p => p.status === 'requested' || p.status === 'processing').length;
  const totalPartnerWithdrawable = overview?.totalWithdrawable ?? partners.reduce((sum, p) => sum + (p.wallet?.withdrawableBalance || 0), 0);
  const totalLifetimeCommission = overview?.totalLifetimeCommission ?? 0;

  // Helper to extract partner name safely from string or object
  const getPartnerDisplayName = (partnerId: PartnerPayoutItem['partnerId']) => {
    if (typeof partnerId === 'object' && partnerId !== null) {
      return partnerId.fullName || partnerId.partnerCode || 'Partner';
    }
    return typeof partnerId === 'string' ? `Partner (${partnerId.slice(-6)})` : 'Partner';
  };

  const getPartnerDisplayCode = (partnerId: PartnerPayoutItem['partnerId']) => {
    if (typeof partnerId === 'object' && partnerId !== null) {
      return partnerId.partnerCode || '';
    }
    return '';
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setSubTab('partners');
            setStatusFilter('');
          }}
          className={`bg-white p-4 rounded-xl border shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-indigo-300 transition-colors ${
            subTab === 'partners' ? 'ring-2 ring-indigo-500/20 border-indigo-200' : 'border-slate-200/80'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Partners</div>
            <div className="text-xl font-black text-slate-900">{totalPartners}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">{activeCount} active network nodes</div>
          </div>
        </div>

        <div
          onClick={() => {
            setSubTab('pending');
            setStatusFilter('');
          }}
          className={`bg-white p-4 rounded-xl border shadow-xs flex items-center gap-3.5 transition-colors cursor-pointer hover:border-amber-400 ${
            subTab === 'pending'
              ? 'ring-2 ring-amber-500/20 border-amber-300 bg-amber-50/30'
              : pendingCount > 0
              ? 'border-amber-200 bg-amber-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
            pendingCount > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <Clock size={20} className={pendingCount > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</div>
            <div className="text-xl font-black text-slate-900">{pendingCount}</div>
            <div className={`text-[11px] font-semibold ${pendingCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
              {pendingCount > 0 ? 'Requires admin verification' : 'All registrations verified'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Partner Wallets</div>
            <div className="text-xl font-black text-slate-900">{formatCurrency(totalPartnerWithdrawable)}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Available now · {formatCurrency(totalLifetimeCommission)} paid lifetime
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setSubTab('payouts');
            setStatusFilter('');
          }}
          className={`bg-white p-4 rounded-xl border shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-slate-400 transition-colors ${
            subTab === 'payouts' ? 'ring-2 ring-slate-800/20 border-slate-400' : 'border-slate-200/80'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
            pendingPayoutsCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payout Requests</div>
            <div className="text-xl font-black text-slate-900">{payouts.length}</div>
            <div className={`text-[11px] font-semibold ${pendingPayoutsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {pendingPayoutsCount > 0 ? `${pendingPayoutsCount} awaiting disbursement` : 'No pending payouts'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSubTab('partners');
              setStatusFilter('');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors border ${
              subTab === 'partners'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Partners ({nonPendingCount})
          </button>
          <button
            onClick={() => {
              setSubTab('pending');
              setStatusFilter('');
            }}
            className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors border flex items-center gap-1.5 ${
              subTab === 'pending'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
            Pending Approvals {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => {
              setSubTab('payouts');
              setStatusFilter('');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors border flex items-center gap-1.5 ${
              subTab === 'payouts'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Payout Requests
            {pendingPayoutsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {pendingPayoutsCount}
              </span>
            )}
          </button>
        </div>

        {subTab === 'partners' ? (
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
            >
              <option value="">All Statuses (Non-Pending)</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended / Banned</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="relative w-52 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search code, name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-800"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="h-8 text-xs font-bold px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus size={14} /> Onboard Partner
            </Button>
          </div>
        ) : subTab === 'pending' ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-52 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pending partner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-800"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="h-8 text-xs font-bold px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus size={14} /> Onboard Partner
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={payoutStatusFilter}
              onChange={(e) => setPayoutStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
            >
              <option value="">All Payout Requests</option>
              <option value="requested">Requested (Pending)</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* SUB-TAB: PARTNERS TABLE (Non-Pending OR Pending Approvals) */}
      {(subTab === 'partners' || subTab === 'pending') && (
        <div className="space-y-4">
          {/* Attention Banner on Partners tab when there are pending registrations */}
          {pendingCount > 0 && subTab === 'partners' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-amber-200/70 rounded-lg text-amber-800">
                  <Users size={16} />
                </span>
                <div>
                  <div className="text-xs font-bold">{pendingCount} Wholesale Partner{pendingCount > 1 ? 's' : ''} Awaiting Approval</div>
                  <div className="text-[11px] text-amber-700">Self-registered partners must be approved before they can onboard suppliers/buyers and withdraw commissions.</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSubTab('pending');
                  setStatusFilter('');
                }}
                className="text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100 h-7"
              >
                Go to Pending Approvals ({pendingCount})
              </Button>
            </div>
          )}

          {/* Info Banner on Pending tab */}
          {subTab === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2.5 text-amber-900 shadow-xs">
              <span className="p-1.5 bg-amber-200/70 rounded-lg text-amber-800">
                <Clock size={16} />
              </span>
              <div>
                <div className="text-xs font-bold">Pending Self-Registered Partners ({pendingCount})</div>
                <div className="text-[11px] text-amber-700">Self-registered partners are listed here until approved or rejected. Approving activates their account so they can onboard suppliers/buyers.</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {isPartnersLoading ? (
              <div className="py-12 flex justify-center"><Loader size="md" /></div>
            ) : partners.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                {subTab === 'pending'
                  ? 'No pending partner registrations awaiting approval.'
                  : 'No wholesale partners found matching the filter.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className={thCls}>Partner Code</th>
                      <th className={thCls}>Name & Entity</th>
                      <th className={thCls}>Contact</th>
                      <th className={thCls}>Commission %</th>
                      <th className={thCls}>Network</th>
                      <th className={thCls}>Wallet Balances</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partners.map((p) => {
                      const userObj = typeof p.userId === 'object' && p.userId !== null ? p.userId : null;
                      const partnerName = p.fullName || userObj?.name || 'Partner';
                      const partnerEmail = p.email || userObj?.email || '—';
                      const partnerPhone = p.phone || userObj?.phone || '—';
                      const isPending = p.status === 'pending' || p.status === 'pending_approval';

                      return (
                        <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className={tdCls}>
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/70">
                              {p.partnerCode}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <strong className="block text-slate-900 font-semibold">{partnerName}</strong>
                            {p.businessName ? (
                              <span className="text-[11px] text-slate-500 block">{p.businessName}</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Individual Agent</span>
                            )}
                          </td>
                          <td className={tdCls}>
                            <div className="font-mono text-slate-800 text-[11px]">{partnerPhone}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[160px]" title={partnerEmail}>{partnerEmail}</div>
                          </td>
                          <td className={tdCls}>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-800 text-xs">
                                {p.sellerCommissionPercent ?? 15}% <span className="text-slate-400 font-normal">Seller</span> · {p.buyerCommissionPercent ?? 10}% <span className="text-slate-400 font-normal">Buyer</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({p.commissionSharePercent ?? ((p.sellerCommissionPercent ?? 15) + (p.buyerCommissionPercent ?? 10))}% total if both)
                              </span>
                            </div>
                          </td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded font-bold" title="Suppliers referred">
                                {p.metrics?.totalSuppliersOnboarded || 0} Supp
                              </span>
                              <span className="text-blue-800 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded font-bold" title="Buyers referred">
                                {p.metrics?.totalBuyersOnboarded || 0} Buy
                              </span>
                            </div>
                          </td>
                          <td className={tdCls}>
                            <div className="text-emerald-600 font-black">
                              {formatCurrency(p.wallet?.withdrawableBalance || 0)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Escrow: {formatCurrency(p.wallet?.pendingBalance || 0)}
                            </div>
                          </td>
                          <td className={tdCls}>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${
                              p.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.status === 'suspended'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            }`}>
                              {isPending ? 'Pending Approval' : p.status === 'rejected' ? 'Rejected' : p.status}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingPartnerId(p._id)}
                                className="h-7 text-xs px-2 flex items-center gap-1 text-slate-600 hover:text-slate-900"
                                title="Open the full partner record"
                              >
                                <Eye size={12} /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingPartnerBank(p)}
                                className="h-7 text-xs px-2 flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 border-slate-200"
                                title="View partner registered bank and tax details"
                              >
                                <CreditCard size={12} /> Bank
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(p)}
                                className="h-7 text-xs px-2 flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 border-slate-200"
                                title={isPending ? 'Configure commission rates' : 'Configure commission & status'}
                              >
                                <Edit3 size={12} /> {isPending ? 'Edit Rates' : 'Edit'}
                              </Button>
                              {isPending ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => openApprovalModal(p, 'approve')}
                                    className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-none"
                                    title="Confirm this registration and activate their code"
                                  >
                                    <CheckCircle size={12} /> Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openApprovalModal(p, 'reject')}
                                    className="h-7 text-xs px-2 flex items-center gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 font-bold"
                                    title="Decline this registration"
                                  >
                                    <XCircle size={12} /> Reject
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {p.status === 'active' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSuspendingPartner(p)}
                                      className="h-7 text-xs px-2 flex items-center gap-1 text-rose-700 border-rose-200 hover:bg-rose-50 font-bold"
                                      title="Suspend this partner (halt commissions and lock payouts)"
                                    >
                                      <PauseCircle size={12} /> Suspend
                                    </Button>
                                  ) : p.status === 'suspended' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateStatusMutation.mutate({ id: p._id, status: 'active' })}
                                      disabled={updateStatusMutation.isPending}
                                      className="h-7 text-xs px-2 flex items-center gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold"
                                      title="Reactivate partner"
                                    >
                                      <PlayCircle size={12} /> Reactivate
                                    </Button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PAYOUT REQUESTS */}
      {subTab === 'payouts' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {isPayoutsLoading ? (
            <div className="py-12 flex justify-center"><Loader size="md" /></div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <DollarSign size={32} className="mx-auto text-slate-300 mb-2" />
              No payout requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Partner</th>
                    <th className={thCls}>Requested</th>
                    <th className={thCls}>TDS</th>
                    <th className={thCls}>Net Payable</th>
                    <th className={thCls}>Bank Details</th>
                    <th className={thCls}>Status / UTR</th>
                    <th className={thCls}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((pay) => {
                    const partnerName = getPartnerDisplayName(pay.partnerId);
                    const partnerCode = getPartnerDisplayCode(pay.partnerId);
                    const tdsPct = getTdsPercent(pay);
                    const isPenalTds = tdsPct >= 20;

                    return (
                      <tr key={pay._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className={tdCls}>
                          <span className="font-medium text-slate-900 block">
                            {new Date(pay.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(pay.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className={tdCls}>
                          <strong className="block text-slate-900 font-semibold">{partnerName}</strong>
                          {partnerCode && (
                            <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {partnerCode}
                            </span>
                          )}
                        </td>
                        <td className={tdCls}>
                          <span className="font-black text-slate-900">{formatCurrency(pay.amount)}</span>
                        </td>
                        <td className={tdCls}>
                          <span className="text-slate-700 font-bold block">-{formatCurrency(pay.tdsDeducted)}</span>
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                              isPenalTds
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}
                            title={isPenalTds ? '20% Penal TDS withheld under Section 206AA (No PAN)' : '5% TDS withheld under Section 194H'}
                          >
                            {tdsPct}% TDS · {isPenalTds ? 'No PAN (Sec 206AA)' : 'Sec 194H'}
                          </span>
                        </td>
                        <td className={tdCls}>
                          <span className="font-black text-emerald-600 text-sm">{formatCurrency(pay.netPayable)}</span>
                        </td>
                        <td className={tdCls}>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => setViewingBankPayout(pay)}
                            className="h-7 text-xs px-2.5 inline-flex items-center gap-1.5 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 shadow-none"
                            title="View full beneficiary bank and IFSC details"
                          >
                            <Landmark size={13} className="text-indigo-600" /> View Bank Details
                          </Button>
                        </td>
                        <td className={tdCls}>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block mb-1 ${
                            pay.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : pay.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {pay.status.toUpperCase()}
                          </span>
                          {pay.paymentReference && (
                            <div className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1 py-0.5 rounded border border-slate-200 w-fit">
                              UTR: {pay.paymentReference}
                            </div>
                          )}
                          {pay.rejectionReason && (
                            <div className="text-[10px] text-rose-600 mt-1 max-w-[180px] line-clamp-2" title={pay.rejectionReason}>
                              Reason: {pay.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className={tdCls}>
                          {pay.status === 'requested' || pay.status === 'processing' ? (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setProcessingPayout(pay);
                                  setPayoutAction('approve');
                                  setPaymentReference('');
                                  setRejectionReason('');
                                }}
                                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setProcessingPayout(pay);
                                  setPayoutAction('reject');
                                  setPaymentReference('');
                                  setRejectionReason('');
                                }}
                                className="h-7 text-xs px-2.5 rounded text-rose-600 border-rose-200 hover:bg-rose-50 font-bold"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">
                              {pay.status === 'completed' ? 'Paid' : pay.status === 'rejected' ? 'Rejected' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PANEL: FULL PARTNER DOSSIER */}
      {viewingPartnerId && (
        <AdminPartnerDossier
          partnerId={viewingPartnerId}
          onClose={() => setViewingPartnerId(null)}
          onApprove={(partner) => {
            setViewingPartnerId(null);
            openApprovalModal(partner, 'approve');
          }}
          onReject={(partner) => {
            setViewingPartnerId(null);
            openApprovalModal(partner, 'reject');
          }}
          onEdit={(partner) => {
            setViewingPartnerId(null);
            openEditModal(partner);
          }}
        />
      )}

      {/* MODAL: APPROVE / REJECT A REGISTRATION */}
      {approvalTarget && (
        <Modal
          isOpen={Boolean(approvalTarget)}
          onClose={closeApprovalModal}
          title={
            approvalAction === 'approve'
              ? `Approve ${approvalTarget.partnerCode}`
              : `Reject ${approvalTarget.partnerCode}`
          }
        >
          <form onSubmit={handleApprovalSubmit} className="space-y-4 pt-1">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{approvalTarget.fullName || 'Partner'}</div>
              <div className="text-slate-500 font-mono text-[11px]">
                {approvalTarget.phone || '—'} • {approvalTarget.email || 'no email'}
              </div>
              {approvalTarget.applicationNote && (
                <p className="text-[11px] text-slate-600 mt-2 mb-0 leading-relaxed">
                  “{approvalTarget.applicationNote}”
                </p>
              )}
            </div>

            {approvalAction === 'approve' ? (
              <>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs space-y-1">
                  <div className="font-bold text-amber-900">Dual-Sided Referral Commission Allocation</div>
                  <div className="text-[11px] text-amber-800 leading-relaxed">
                    Set the commission % carved out of AMJ Star's platform fee when this partner refers the Seller, the Buyer, or both:
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Seller Referral Cut (%)
                    </label>
                    <input
                      type="number"
                      step={1}
                      min={0}
                      max={100}
                      value={approvalSellerCommission}
                      onChange={(e) => setApprovalSellerCommission(Math.round(Number(e.target.value)) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">When Seller was referred by this partner</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Buyer Referral Cut (%)
                    </label>
                    <input
                      type="number"
                      step={1}
                      min={0}
                      max={100}
                      value={approvalBuyerCommission}
                      onChange={(e) => setApprovalBuyerCommission(Math.round(Number(e.target.value)) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">When Buyer was referred by this partner</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Combined Share (if both belong to this partner):</span>
                  <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {approvalSellerCommission + approvalBuyerCommission}%
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div>• <strong>Only Seller referred (Buyer organic):</strong> Partner earns {approvalSellerCommission}% (Buyer cut 0%).</div>
                  <div>• <strong>Only Buyer referred (Seller organic):</strong> Partner earns {approvalBuyerCommission}% (Seller cut 0%).</div>
                  <div>• <strong>Both referred by this partner:</strong> Partner earns {approvalSellerCommission + approvalBuyerCommission}%.</div>
                  <div>• <strong>Different partners:</strong> Seller's partner gets {approvalSellerCommission}%, Buyer's partner gets {approvalBuyerCommission}%.</div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Internal note (optional)
                  </label>
                  <textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Verified by phone, 12 years in Surat textile trade"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-800 resize-y"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 mb-0">
                    Visible to admins only — the partner never sees this.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-800">
                  On approval the partner is notified, their code starts earning, and payouts unlock.
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Reason for rejection <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={approvalRejectReason}
                    onChange={(e) => setApprovalRejectReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Could not verify identity; no response to verification calls"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-800 resize-y"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 mb-0">
                    This reason is shown to the applicant, so keep it factual.
                  </p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-[11px] text-rose-800">
                  The applicant is notified and their referral code stops attributing new sign-ups.
                  You can still re-approve them later.
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" type="button" onClick={closeApprovalModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={approvalAction === 'approve' ? 'primary' : 'danger'}
                type="submit"
                loading={approveMutation.isPending || rejectMutation.isPending}
                className={
                  approvalAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                    : 'font-bold'
                }
              >
                {approvalAction === 'approve' ? 'Approve partner' : 'Reject application'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: EDIT PARTNER (IMPROVED UI) */}
      {editingPartner && (
        <Modal
          isOpen={Boolean(editingPartner)}
          onClose={() => setEditingPartner(null)}
          title={`Configure Partner: ${editingPartner.partnerCode}`}
        >
          <div className="space-y-4 pt-1">
            {/* Partner Identity Header */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{editingPartner.fullName || 'Partner'}</div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  {editingPartner.phone} {editingPartner.email ? `• ${editingPartner.email}` : ''}
                </div>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                editingPartner.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : editingPartner.status === 'suspended'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {editingPartner.status === 'pending' || editingPartner.status === 'pending_approval'
                  ? 'Pending Approval'
                  : editingPartner.status}
              </span>
            </div>

            {/* Status Switcher Section */}
            {editingPartner.status === 'pending' || editingPartner.status === 'pending_approval' ? (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Clock size={15} className="text-amber-700 shrink-0" />
                  <span>Status: Awaiting Admin Approval</span>
                </div>
                <p className="text-[11px] text-amber-800 m-0 leading-relaxed">
                  This partner is currently waiting for approval in the Pending Approvals tab. You can pre-configure their custom commission rates below.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Partner Account Status
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPartnerStatus('active')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      partnerStatus === 'active'
                        ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <CheckCircle
                        size={15}
                        className={partnerStatus === 'active' ? 'text-emerald-600' : 'text-slate-400'}
                      />
                      <span>Active</span>
                    </div>
                    <p className="text-[11px] text-slate-500 m-0 leading-tight">
                      Earns commissions normally & payouts enabled.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartnerStatus('suspended')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      partnerStatus === 'suspended'
                        ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 text-rose-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <PauseCircle
                        size={15}
                        className={partnerStatus === 'suspended' ? 'text-rose-600' : 'text-slate-400'}
                      />
                      <span>Suspended / Blocked</span>
                    </div>
                    <p className="text-[11px] text-slate-500 m-0 leading-tight">
                      Earnings halted & payout requests locked.
                    </p>
                  </button>
                </div>

                {partnerStatus === 'suspended' && editingPartner.status !== 'suspended' && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900 flex items-start gap-2">
                    <ShieldAlert size={14} className="text-rose-700 shrink-0 mt-0.5" />
                    <span>Saving will prompt a confirmation dialog before suspending this partner.</span>
                  </div>
                )}
              </div>
            )}

            {/* Commission Configuration with Visual Split */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
              <div>
                <div className="font-bold text-slate-900 text-xs">Dual-Sided Referral Commission Split</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Carved from AMJ Star's platform fee on orders closed by their referred network:
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Seller Referral Cut (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={1}
                      min={0}
                      max={100}
                      value={sellerCommissionRate}
                      onChange={(e) => {
                        const val = Math.round(Number(e.target.value)) || 0;
                        setSellerCommissionRate(val);
                        setCommissionRate(val + buyerCommissionRate);
                      }}
                      className="w-full text-xs pr-7 pl-3 py-2 border border-slate-300 rounded-lg outline-none font-bold text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-white"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 select-none">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Sales by their referred sellers</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Buyer Referral Cut (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={1}
                      min={0}
                      max={100}
                      value={buyerCommissionRate}
                      onChange={(e) => {
                        const val = Math.round(Number(e.target.value)) || 0;
                        setBuyerCommissionRate(val);
                        setCommissionRate(sellerCommissionRate + val);
                      }}
                      className="w-full text-xs pr-7 pl-3 py-2 border border-slate-300 rounded-lg outline-none font-bold text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-white"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 select-none">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Purchases by their referred buyers</span>
                </div>
              </div>

              {/* Combined Rate & Visual Split */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Combined Share (both sides referred):</span>
                  <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {sellerCommissionRate + buyerCommissionRate}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((sellerCommissionRate / ((sellerCommissionRate + buyerCommissionRate) || 1)) * 100)
                      )}%`,
                    }}
                  />
                  <div
                    className="bg-sky-500 h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((buyerCommissionRate / ((sellerCommissionRate + buyerCommissionRate) || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                    Seller {sellerCommissionRate}%
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                    Buyer {buyerCommissionRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setEditingPartner(null)}
                disabled={isUpdatingPartner}
                className="px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSavePartnerEdit}
                disabled={isUpdatingPartner}
                className="px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                {isUpdatingPartner ? 'Saving Changes…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2.5: SUSPEND / BLOCK CONFIRMATION */}
      {suspendingPartner && (
        <Modal
          isOpen={Boolean(suspendingPartner)}
          onClose={() => {
            setSuspendingPartner(null);
            setSuspendReason('');
          }}
          title={`Suspend Partner: ${suspendingPartner.partnerCode}`}
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-rose-900 flex items-center gap-1.5 text-sm">
                <ShieldAlert size={16} className="text-rose-600" />
                <span>Confirm Account Suspension</span>
              </div>
              <p className="text-[11px] text-rose-800 m-0 leading-relaxed">
                Are you sure you want to suspend wholesale partner <strong>{suspendingPartner.fullName || suspendingPartner.partnerCode}</strong>?
              </p>
              <ul className="text-[11px] text-rose-800 m-0 pl-4 list-disc space-y-0.5">
                <li>New referral orders will NOT accrue commission.</li>
                <li>Payout withdrawal requests will be blocked.</li>
                <li>Existing earned wallet balances remain safe.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Suspension (Optional)
              </label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Identity audit required, policy violation, or requested by partner"
                className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none focus:border-rose-500 resize-y"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Logged for internal administration records.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setSuspendingPartner(null);
                  setSuspendReason('');
                }}
                disabled={updateStatusMutation.isPending}
                className="px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: suspendingPartner._id,
                    status: 'suspended',
                    reason: suspendReason.trim() || undefined,
                  });
                }}
                className="px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                {updateStatusMutation.isPending ? 'Suspending…' : 'Yes, Suspend Partner'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: PROCESS PAYOUT */}
      {processingPayout && (
        <Modal
          isOpen={Boolean(processingPayout)}
          onClose={() => setProcessingPayout(null)}
          title={payoutAction === 'approve' ? 'Approve & Mark Payout as Paid' : 'Reject Payout Request'}
          widthClass="w-[95%] max-w-[540px]"
        >
          <form onSubmit={handleProcessPayoutSubmit} className="space-y-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Partner:</span>
                <strong className="text-slate-900">{getPartnerDisplayName(processingPayout.partnerId)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Amount:</span>
                <strong className="text-slate-900">{formatCurrency(processingPayout.amount)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  TDS Withheld ({getTdsPercent(processingPayout)}%):
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      getTdsPercent(processingPayout) >= 20
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}
                  >
                    {getTdsPercent(processingPayout) >= 20 ? '20% Sec 206AA (No PAN)' : '5% Sec 194H'}
                  </span>
                </span>
                <strong className="text-rose-600 font-bold">-{formatCurrency(processingPayout.tdsDeducted)}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-700">Net Payable to Bank:</span>
                <strong className="text-emerald-600 font-black">{formatCurrency(processingPayout.netPayable)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Landmark size={12} className="text-indigo-600" /> Beneficiary Bank Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewingBankPayout(processingPayout)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Expand All Details →
                  </button>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Beneficiary:</span>
                    <strong className="text-slate-900">{processingPayout.bankSnapshot?.accountHolderName || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Account No:</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                      {processingPayout.bankSnapshot?.accountNumber || '—'}
                      {processingPayout.bankSnapshot?.accountNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(processingPayout.bankSnapshot?.accountNumber || '', 'Account Number')}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Copy Account Number"
                        >
                          {copiedField === 'Account Number' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                      {processingPayout.bankSnapshot?.ifscCode || '—'}
                      {processingPayout.bankSnapshot?.ifscCode && (
                        <button
                          type="button"
                          onClick={() => handleCopy(processingPayout.bankSnapshot?.ifscCode || '', 'IFSC Code')}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Copy IFSC"
                        >
                          {copiedField === 'IFSC Code' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </span>
                  </div>
                  {processingPayout.bankSnapshot?.upiId && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">UPI ID:</span>
                      <span className="font-mono text-indigo-600 flex items-center gap-1">
                        {processingPayout.bankSnapshot.upiId}
                        <button
                          type="button"
                          onClick={() => handleCopy(processingPayout.bankSnapshot?.upiId || '', 'UPI ID')}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Copy UPI ID"
                        >
                          {copiedField === 'UPI ID' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {payoutAction === 'approve' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank UTR / Transaction Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR987654321012"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Enter the NEFT / RTGS / IMPS reference number generated by your bank transfer.
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the payout request was rejected (the requested amount will be refunded to the partner's balance)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setProcessingPayout(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={payoutAction === 'approve' ? 'primary' : 'danger'}
                disabled={processPayoutMutation.isPending}
                className={
                  payoutAction === 'reject'
                    ? '!bg-rose-600 hover:!bg-rose-700 !text-white font-bold !border-rose-600 shadow-sm'
                    : '!bg-emerald-600 hover:!bg-emerald-700 !text-white font-bold !border-emerald-600 shadow-sm'
                }
              >
                {processPayoutMutation.isPending
                  ? 'Processing…'
                  : payoutAction === 'approve'
                  ? 'Confirm Payment & Close'
                  : 'Reject Payout Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: ONBOARD NEW PARTNER */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Onboard New Wholesale Service Partner"
          widthClass="w-[95%] max-w-[640px]"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cleanPan = (createForm.panNumber || '').trim().toUpperCase();
              if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
                toast.error('Invalid PAN format (e.g. ABCDE1234F)');
                return;
              }
              const cleanGst = (createForm.gstin || '').trim().toUpperCase();
              if (cleanGst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
                toast.error('Invalid GSTIN format (15 characters, e.g. 22AAAAA0000A1Z5)');
                return;
              }
              createPartnerMutation.mutate({
                ...createForm,
                panNumber: cleanPan,
                gstin: cleanGst,
              });
            }}
            className="space-y-4 pt-1"
          >
            {/* SECTION 1: ACCOUNT & CONTACT DETAILS */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Partner Account & Login Credentials
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit number (e.g. 9876543210)"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Used for primary partner sign-in</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="partner@company.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">For notifications and invoices</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Temporary Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Min 6 characters (e.g. Partner@123)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Share this password with the partner. They will use it to log in for the first time.
                </span>
              </div>
            </div>

            {/* SECTION 2: REFERRAL COMMISSION CONFIGURATION */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                    Referral Commission Configuration
                  </span>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Share of AMJ Star platform fee credited to partner when deals close:
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">Combined Share</span>
                  <span className="text-sm font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {createForm.sellerCommissionPercent + createForm.buyerCommissionPercent}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 rounded-lg border border-indigo-100/80 shadow-xs">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seller Referral Cut % *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step={1}
                      min="0"
                      max="100"
                      required
                      value={createForm.sellerCommissionPercent}
                      onChange={(e) => {
                        const sVal = Math.round(Number(e.target.value)) || 0;
                        setCreateForm({
                          ...createForm,
                          sellerCommissionPercent: sVal,
                          commissionSharePercent: sVal + createForm.buyerCommissionPercent,
                        });
                      }}
                      className="w-full text-xs px-3 py-2 pr-7 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 focus:border-indigo-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Default 15% (when Seller is referred)</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-indigo-100/80 shadow-xs">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Referral Cut % *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step={1}
                      min="0"
                      max="100"
                      required
                      value={createForm.buyerCommissionPercent}
                      onChange={(e) => {
                        const bVal = Math.round(Number(e.target.value)) || 0;
                        setCreateForm({
                          ...createForm,
                          buyerCommissionPercent: bVal,
                          commissionSharePercent: createForm.sellerCommissionPercent + bVal,
                        });
                      }}
                      className="w-full text-xs px-3 py-2 pr-7 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 focus:border-indigo-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Default 10% (when Buyer is referred)</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: BUSINESS & TAX COMPLIANCE */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Business & Tax Compliance (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex B2B Solutions"
                    value={createForm.businessName}
                    onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    value={createForm.panNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                      setCreateForm({ ...createForm, panNumber: val });
                    }}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none font-mono uppercase focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {createForm.panNumber && createForm.panNumber.length === 10
                      ? '✓ Qualifies for 5% TDS (Section 194H)'
                      : 'Without PAN, 20% penal TDS applies (Section 206AA)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  value={createForm.gstin}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                    setCreateForm({ ...createForm, gstin: val });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none font-mono uppercase focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                />
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="px-4 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createPartnerMutation.isPending}
                className="!bg-indigo-600 hover:!bg-indigo-700 !text-white font-bold !border-indigo-600 shadow-sm px-5 text-xs rounded-lg"
              >
                {createPartnerMutation.isPending ? 'Creating Partner…' : 'Create & Activate Partner'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: VIEW PAYOUT BANK DESTINATION */}
      {viewingBankPayout && (
        <Modal
          isOpen={Boolean(viewingBankPayout)}
          onClose={() => setViewingBankPayout(null)}
          title="Payout Destination & Beneficiary Bank Details"
          widthClass="w-[95%] max-w-[580px]"
        >
          <div className="space-y-4 pt-1">
            {/* Beneficiary Bank Account Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 p-5 rounded-2xl shadow-md border border-slate-700/80 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center shadow-inner">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase block text-indigo-300" style={{ color: '#a5b4fc' }}>
                      Beneficiary Account
                    </span>
                    <span className="text-xs text-slate-300" style={{ color: '#cbd5e1' }}>
                      Direct Transfer (NEFT / RTGS / IMPS)
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wide ${
                  viewingBankPayout.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : viewingBankPayout.status === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                }`}>
                  {viewingBankPayout.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5 text-slate-400" style={{ color: '#94a3b8' }}>
                    Account Holder Name
                  </span>
                  <span className="font-bold text-sm block text-white" style={{ color: '#ffffff' }}>
                    {viewingBankPayout.bankSnapshot?.accountHolderName || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5 text-slate-400" style={{ color: '#94a3b8' }}>
                    Bank Name
                  </span>
                  <span className="font-semibold text-sm block text-slate-200" style={{ color: '#e2e8f0' }}>
                    {viewingBankPayout.bankSnapshot?.bankName || 'Standard Bank'}
                  </span>
                </div>

                <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400" style={{ color: '#94a3b8' }}>
                      Account Number
                    </span>
                    {viewingBankPayout.bankSnapshot?.accountNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(viewingBankPayout.bankSnapshot?.accountNumber || '', 'Account Number')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors"
                      >
                        {copiedField === 'Account Number' ? (
                          <>
                            <Check size={12} className="text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="font-mono text-base font-bold tracking-widest block select-all text-white" style={{ color: '#ffffff' }}>
                    {viewingBankPayout.bankSnapshot?.accountNumber || '—'}
                  </span>
                </div>

                <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400" style={{ color: '#94a3b8' }}>
                      IFSC Code
                    </span>
                    {viewingBankPayout.bankSnapshot?.ifscCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(viewingBankPayout.bankSnapshot?.ifscCode || '', 'IFSC Code')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors"
                      >
                        {copiedField === 'IFSC Code' ? (
                          <>
                            <Check size={12} className="text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="font-mono text-base font-bold tracking-widest block select-all text-white" style={{ color: '#ffffff' }}>
                    {viewingBankPayout.bankSnapshot?.ifscCode || '—'}
                  </span>
                </div>

                {viewingBankPayout.bankSnapshot?.upiId && (
                  <div className="sm:col-span-2 bg-slate-800/90 p-3 rounded-xl border border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400" style={{ color: '#94a3b8' }}>
                        UPI Virtual Payment Address (VPA)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(viewingBankPayout.bankSnapshot?.upiId || '', 'UPI ID')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors"
                      >
                        {copiedField === 'UPI ID' ? (
                          <>
                            <Check size={12} className="text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <span className="font-mono text-xs font-bold block select-all text-indigo-300" style={{ color: '#a5b4fc' }}>
                      {viewingBankPayout.bankSnapshot.upiId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Partner:</span>
                <span className="font-bold text-slate-900">{getPartnerDisplayName(viewingBankPayout.partnerId)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Requested Amount:</span>
                <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(viewingBankPayout.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  TDS Deducted ({getTdsPercent(viewingBankPayout)}%):
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      getTdsPercent(viewingBankPayout) >= 20
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    {getTdsPercent(viewingBankPayout) >= 20 ? '20% Sec 206AA (No PAN)' : '5% Sec 194H'}
                  </span>
                </span>
                <span className="font-bold text-rose-600">-{formatCurrency(viewingBankPayout.tdsDeducted)}</span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wide block">Net Payable to Bank</span>
                  <span className="text-[10px] text-slate-400">Amount to disburse via net banking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-600 text-lg tracking-tight">
                    {formatCurrency(viewingBankPayout.netPayable)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(viewingBankPayout.netPayable.toString(), 'Net Amount')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                    title="Copy Net Amount to clipboard"
                  >
                    {copiedField === 'Net Amount' ? (
                      <>
                        <Check size={12} className="text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingBankPayout(null)}
                className="px-4 text-xs font-semibold"
              >
                Close
              </Button>
              {(viewingBankPayout.status === 'requested' || viewingBankPayout.status === 'processing') && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      const target = viewingBankPayout;
                      setViewingBankPayout(null);
                      setProcessingPayout(target);
                      setPayoutAction('reject');
                      setPaymentReference('');
                      setRejectionReason('');
                    }}
                    className="!bg-rose-600 hover:!bg-rose-700 !text-white font-bold !border-rose-600 shadow-sm px-4 py-2 text-xs rounded-lg"
                  >
                    Reject Payout
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      const target = viewingBankPayout;
                      setViewingBankPayout(null);
                      setProcessingPayout(target);
                      setPayoutAction('approve');
                      setPaymentReference('');
                      setRejectionReason('');
                    }}
                    className="!bg-emerald-600 hover:!bg-emerald-700 !text-white font-bold !border-emerald-600 shadow-sm px-4 py-2 text-xs rounded-lg whitespace-nowrap"
                  >
                    Approve & Pay ({formatCurrency(viewingBankPayout.netPayable)})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 6: VIEW PARTNER REGISTERED BANK & TAX RECORD */}
      {viewingPartnerBank && (
        <Modal
          isOpen={Boolean(viewingPartnerBank)}
          onClose={() => setViewingPartnerBank(null)}
          title="Partner Registered Bank & Tax Profile"
          widthClass="w-[95%] max-w-[580px]"
        >
          <div className="space-y-4 pt-2">
            {/* Partner Overview Header */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{viewingPartnerBank.fullName}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                    {viewingPartnerBank.partnerCode}
                  </span>
                  <span>•</span>
                  <span>{viewingPartnerBank.phone}</span>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                viewingPartnerBank.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : viewingPartnerBank.status === 'suspended'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {viewingPartnerBank.status}
              </span>
            </div>

            {/* Bank Record */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Landmark size={14} className="text-indigo-600" /> Bank Account on File
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  viewingPartnerBank.bankDetails?.accountNumber
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {viewingPartnerBank.bankDetails?.accountNumber
                    ? viewingPartnerBank.bankDetails?.isVerified
                      ? 'Verified'
                      : 'Active on File'
                    : 'Not Configured'}
                </span>
              </div>

              {viewingPartnerBank.bankDetails?.accountNumber ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Beneficiary Name</span>
                    <strong className="text-slate-900 block">{viewingPartnerBank.bankDetails.accountHolderName || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bank Name</span>
                    <strong className="text-slate-900 block">{viewingPartnerBank.bankDetails.bankName || '—'}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Account Number</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(viewingPartnerBank.bankDetails?.accountNumber || '', 'Account Number')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedField === 'Account Number' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-900 block mt-0.5">
                      {viewingPartnerBank.bankDetails.accountNumber}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">IFSC Code</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(viewingPartnerBank.bankDetails?.ifscCode || '', 'IFSC Code')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedField === 'IFSC Code' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-900 block mt-0.5">
                      {viewingPartnerBank.bankDetails.ifscCode}
                    </span>
                  </div>
                  {viewingPartnerBank.bankDetails.upiId && (
                    <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">UPI ID</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(viewingPartnerBank.bankDetails?.upiId || '', 'UPI ID')}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          {copiedField === 'UPI ID' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <span className="font-mono text-xs font-semibold text-indigo-700 block mt-0.5">
                        {viewingPartnerBank.bankDetails.upiId}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400">
                  No bank account registered yet.
                </div>
              )}
            </div>

            {/* Tax Record */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide pb-2 border-b border-slate-100">
                <ShieldCheck size={14} className="text-indigo-600" /> Tax Identification & Compliance
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">PAN Number</span>
                  {viewingPartnerBank.panNumber ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {viewingPartnerBank.panNumber}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        5% TDS (Sec 194H)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-400 italic">Not Provided</span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        20% TDS (Sec 206AA)
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">GSTIN</span>
                  {viewingPartnerBank.gstin ? (
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                      {viewingPartnerBank.gstin}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">Unregistered</span>
                  )}
                </div>
                {viewingPartnerBank.businessName && (
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Firm / Business Name</span>
                    <strong className="text-slate-900 block mt-0.5">{viewingPartnerBank.businessName}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setViewingPartnerBank(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default AdminPartners;
