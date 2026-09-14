import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  XCircle,
  AlertTriangle,
  User,
  Building2,
  Phone,
  Mail,
  Package,
  CheckCircle2,
  FileEdit,
  RefreshCw,
  Copy,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import adminService from '../services/admin.service';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';
import toast from 'react-hot-toast';

export type DealTab =
  | 'supplier_no_response'
  | 'buyer_no_response'
  | 'supplier_cancelled'
  | 'buyer_cancelled';

interface UnmatchedDealItem {
  _id: string;
  dealType: DealTab;
  status: 'open' | 'reassigned' | 'closed';
  conversationId?: string;
  quotationId?: string;
  buyerSnapshot: {
    userId?: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  supplierSnapshot: {
    userId?: string;
    businessName: string;
    email: string;
    phone: string;
  };
  productSnapshot: {
    name: string;
    category?: string;
    quantity?: string;
    imageUrl?: string;
  };
  cancellationReason?: string;
  stage?: 'enquiry' | 'quotation' | 'po' | 'order';
  hoursElapsed: number;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

const TAB_CONFIG: Record<
  DealTab,
  {
    label: string;
    description: string;
    color: string;
    badgeCls: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  supplier_no_response: {
    label: 'Supplier No Response',
    description: 'Enquiries where the supplier has not replied within the platform timeout window',
    color: 'amber',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  buyer_no_response: {
    label: 'Buyer No Response',
    description: 'Quotations sent by suppliers where the buyer has not replied or taken action',
    color: 'orange',
    badgeCls: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertTriangle,
  },
  supplier_cancelled: {
    label: 'Rejected by Supplier',
    description: 'Deals rejected or cancelled by the supplier with stated rejection reasons',
    color: 'rose',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  buyer_cancelled: {
    label: 'Rejected by Buyer',
    description: 'Quotations rejected or cancelled by the buyer with stated reasons',
    color: 'purple',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: ShieldAlert,
  },
};

export const UnmatchedDeals: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DealTab>('supplier_no_response');
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Note Modal State
  const [noteModalDeal, setNoteModalDeal] = useState<UnmatchedDealItem | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Close Deal Modal State
  const [closeModalDeal, setCloseModalDeal] = useState<UnmatchedDealItem | null>(null);

  // Fetch Counts
  const { data: counts, refetch: refetchCounts } = useQuery({
    queryKey: ['admin', 'unmatched-deals', 'counts'],
    queryFn: () => adminService.getUnmatchedDealsCounts(),
    refetchInterval: 30_000,
  });

  // Fetch Deals
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchDeals,
  } = useQuery({
    queryKey: ['admin', 'unmatched-deals', activeTab, statusFilter, page],
    queryFn: () =>
      adminService.getUnmatchedDeals({
        dealType: activeTab,
        status: statusFilter,
        page,
        limit,
      }),
  });

  const deals: UnmatchedDealItem[] = data?.deals || [];
  const totalItems: number = data?.total || 0;

  // Mutations
  const closeMutation = useMutation({
    mutationFn: (id: string) => adminService.closeUnmatchedDeal(id),
    onSuccess: () => {
      toast.success('Deal marked as closed');
      queryClient.invalidateQueries({ queryKey: ['admin', 'unmatched-deals'] });
      setCloseModalDeal(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to close deal');
    },
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminService.addUnmatchedDealNote(id, note),
    onSuccess: () => {
      toast.success('Admin note saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'unmatched-deals'] });
      setNoteModalDeal(null);
      setNoteText('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save note');
    },
  });

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleTabChange = (tab: DealTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const openNoteModal = (deal: UnmatchedDealItem) => {
    setNoteModalDeal(deal);
    setNoteText(deal.adminNote || '');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#334155] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Action Required
              </span>
              <span className="text-xs text-slate-300">Auto-monitored by Platform Cron</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-2 text-white">
              Unmarried Deals Management
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Track and rescue stalled negotiations, unresponsive participants, and cancelled quotations.
              Connect buyers to alternative suppliers to maximize order fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchDeals();
                refetchCounts();
                toast.success('Refreshing deals...');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Supplier No Reply</div>
            <div className="text-xl font-bold text-amber-300 mt-1">
              {counts?.supplier_no_response ?? 0}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Buyer No Reply</div>
            <div className="text-xl font-bold text-orange-300 mt-1">
              {counts?.buyer_no_response ?? 0}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Supplier Rejected</div>
            <div className="text-xl font-bold text-rose-300 mt-1">
              {counts?.supplier_cancelled ?? 0}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Buyer Rejected</div>
            <div className="text-xl font-bold text-purple-300 mt-1">
              {counts?.buyer_cancelled ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {(Object.keys(TAB_CONFIG) as DealTab[]).map((tab) => {
            const config = TAB_CONFIG[tab];
            const Icon = config.icon;
            const count = counts?.[tab] ?? 0;
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-xs'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{config.label}</div>
                    <div
                      className={`text-[11px] truncate ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {tab.includes('cancelled') ? 'Cancelled with reason' : 'Timed out'}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    isActive
                      ? 'bg-white text-slate-900'
                      : count > 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Tab Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{TAB_CONFIG[activeTab].label}</span>
            <span className="text-xs font-normal text-slate-500">
              ({totalItems} {statusFilter} deal{totalItems === 1 ? '' : 's'})
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{TAB_CONFIG[activeTab].description}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['open', 'closed', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                statusFilter === st
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading unmatched deals...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-900">No Unmatched Deals Found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {statusFilter === 'open'
              ? `There are currently no open "${TAB_CONFIG[activeTab].label}" deals requiring admin intervention.`
              : `No deals matching the selected criteria.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const isClosed = deal.status === 'closed';

            return (
              <div
                key={deal._id}
                className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md overflow-hidden ${
                  isClosed ? 'border-slate-200 opacity-75' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${TAB_CONFIG[deal.dealType].badgeCls}`}
                    >
                      {React.createElement(TAB_CONFIG[deal.dealType].icon, { size: 13 })}
                      {TAB_CONFIG[deal.dealType].label}
                    </span>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        deal.status === 'open'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : deal.status === 'reassigned'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {deal.status.toUpperCase()}
                    </span>

                    {deal.stage === 'po' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        📄 PO Rejected
                      </span>
                    )}
                    {deal.stage === 'order' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        📦 Direct Order Rejected
                      </span>
                    )}
                    {deal.stage === 'enquiry' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                        💬 Enquiry Rejected
                      </span>
                    )}

                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {deal.hoursElapsed}h elapsed
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Flagged on {new Date(deal.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Card Body — 3 Columns: Buyer, Supplier, Product */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Column 1: Buyer Details */}
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" /> Buyer
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-sm">
                        {deal.buyerSnapshot?.name || 'Unknown Buyer'}
                      </div>

                      {deal.buyerSnapshot?.company && (
                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{deal.buyerSnapshot.company}</span>
                        </div>
                      )}

                      <div className="mt-3 space-y-1.5 text-xs">
                        {deal.buyerSnapshot?.phone && (
                          <div className="flex items-center justify-between text-slate-600">
                            <a
                              href={`tel:${deal.buyerSnapshot.phone}`}
                              className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
                            >
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{deal.buyerSnapshot.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.buyerSnapshot.phone, 'Buyer phone')}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Copy phone"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}

                        {deal.buyerSnapshot?.email && (
                          <div className="flex items-center justify-between text-slate-600">
                            <a
                              href={`mailto:${deal.buyerSnapshot.email}`}
                              className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
                            >
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{deal.buyerSnapshot.email}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.buyerSnapshot.email, 'Buyer email')}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Copy email"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Supplier Details */}
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400" /> Supplier
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-sm">
                        {deal.supplierSnapshot?.businessName || 'Unknown Supplier'}
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        {deal.supplierSnapshot?.phone && (
                          <div className="flex items-center justify-between text-slate-600">
                            <a
                              href={`tel:${deal.supplierSnapshot.phone}`}
                              className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
                            >
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{deal.supplierSnapshot.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.supplierSnapshot.phone, 'Supplier phone')}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Copy phone"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}

                        {deal.supplierSnapshot?.email && (
                          <div className="flex items-center justify-between text-slate-600">
                            <a
                              href={`mailto:${deal.supplierSnapshot.email}`}
                              className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
                            >
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{deal.supplierSnapshot.email}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.supplierSnapshot.email, 'Supplier email')}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Copy email"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Product Enquiry Snapshot */}
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Package size={13} className="text-slate-400" /> Product Enquiry
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {deal.productSnapshot?.imageUrl ? (
                          <img
                            src={deal.productSnapshot.imageUrl}
                            alt={deal.productSnapshot.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package size={20} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">
                            {deal.productSnapshot?.name || 'Product Enquiry'}
                          </div>
                          {deal.productSnapshot?.category && (
                            <div className="text-xs text-slate-500 truncate">
                              {deal.productSnapshot.category}
                            </div>
                          )}
                          {deal.productSnapshot?.quantity && (
                            <div className="text-xs text-slate-700 font-medium mt-1">
                              Qty: <span className="font-bold">{deal.productSnapshot.quantity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejection / Cancellation Reason Callout (Crucial for tabs 3 & 4) */}
                {deal.cancellationReason && (
                  <div className="px-5 pb-3">
                    <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5">
                      <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-rose-900">
                          {deal.dealType === 'supplier_cancelled'
                            ? 'Supplier Rejection Reason:'
                            : 'Buyer Rejection Reason:'}
                        </span>{' '}
                        <span className="text-rose-800 italic">"{deal.cancellationReason}"</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Note if present */}
                {deal.adminNote && (
                  <div className="px-5 pb-3">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                      <MessageSquare size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-900">Admin Note:</span>{' '}
                        <span className="text-amber-800">{deal.adminNote}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openNoteModal(deal)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileEdit size={13} />
                      {deal.adminNote ? 'Edit Note' : 'Add Note'}
                    </button>

                    {!isClosed && (
                      <button
                        onClick={() => setCloseModalDeal(deal)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-200 transition-colors"
                      >
                        <CheckCircle2 size={13} />
                        Close Deal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalItems > limit && (
        <div className="pt-2 flex items-center justify-between border-t border-slate-200">
          <div className="text-xs text-slate-500 font-medium">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} deals
          </div>
          <Pagination
            totalItems={totalItems}
            itemsPerPage={limit}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Note Modal */}
      <Modal
        isOpen={Boolean(noteModalDeal)}
        onClose={() => setNoteModalDeal(null)}
        title="Admin Note for Deal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteModalDeal(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (noteModalDeal) {
                  noteMutation.mutate({ id: noteModalDeal._id, note: noteText });
                }
              }}
              disabled={noteMutation.isPending}
            >
              {noteMutation.isPending ? 'Saving...' : 'Save Note'}
            </Button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-xs text-slate-500 mb-3">
            Add internal notes for tracking follow-ups, calls, or alternative supplier recommendations.
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Called buyer on Sep 14 — buyer is looking for delivery in 3 days, supplier cannot fulfill..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y"
          />
        </div>
      </Modal>

      {/* Close Deal Confirmation Modal */}
      <Modal
        isOpen={Boolean(closeModalDeal)}
        onClose={() => setCloseModalDeal(null)}
        title="Close Unmatched Deal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseModalDeal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (closeModalDeal) {
                  closeMutation.mutate(closeModalDeal._id);
                }
              }}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? 'Closing...' : 'Confirm Close'}
            </Button>
          </>
        }
      >
        <div className="py-2 text-sm text-slate-600">
          Are you sure you want to mark this deal as closed?
          <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs border border-slate-100 space-y-1">
            <div>
              <strong>Buyer:</strong> {closeModalDeal?.buyerSnapshot?.name}
            </div>
            <div>
              <strong>Supplier:</strong> {closeModalDeal?.supplierSnapshot?.businessName}
            </div>
            <div>
              <strong>Product:</strong> {closeModalDeal?.productSnapshot?.name}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UnmatchedDeals;
