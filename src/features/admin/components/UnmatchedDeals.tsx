import React, { useState, useMemo } from 'react';
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
  MessageSquare,
  ShieldAlert,
  Search,
  X,
  ExternalLink,
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
    shortLabel: string;
    description: string;
    subtext: string;
    badgeCls: string;
    activeBorder: string;
    activeBg: string;
    activeRing: string;
    iconBg: string;
    iconColor: string;
    accentColor: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  supplier_no_response: {
    label: 'Supplier No Response',
    shortLabel: 'Supplier Timeout',
    description: 'Enquiries where the supplier has not replied within the platform timeout window.',
    subtext: 'Timed out enquiries',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200/80',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-gradient-to-b from-amber-50/60 to-white',
    activeRing: 'ring-2 ring-amber-500/25',
    iconBg: 'bg-amber-100 text-amber-700',
    iconColor: 'text-amber-600',
    accentColor: '#f59e0b',
    icon: Clock,
  },
  buyer_no_response: {
    label: 'Buyer No Response',
    shortLabel: 'Buyer Inactivity',
    description: 'Quotations sent by suppliers where the buyer has not replied or acted within the time limit.',
    subtext: 'Unacted quotations',
    badgeCls: 'bg-sky-50 text-sky-800 border-sky-200/80',
    activeBorder: 'border-sky-500',
    activeBg: 'bg-gradient-to-b from-sky-50/60 to-white',
    activeRing: 'ring-2 ring-sky-500/25',
    iconBg: 'bg-sky-100 text-sky-700',
    iconColor: 'text-sky-600',
    accentColor: '#0284c7',
    icon: AlertTriangle,
  },
  supplier_cancelled: {
    label: 'Rejected by Supplier',
    shortLabel: 'Supplier Rejected',
    description: 'Enquiries or orders rejected by the supplier with recorded decline reasons.',
    subtext: 'Cancelled with reason',
    badgeCls: 'bg-rose-50 text-rose-800 border-rose-200/80',
    activeBorder: 'border-rose-500',
    activeBg: 'bg-gradient-to-b from-rose-50/60 to-white',
    activeRing: 'ring-2 ring-rose-500/25',
    iconBg: 'bg-rose-100 text-rose-700',
    iconColor: 'text-rose-600',
    accentColor: '#e11d48',
    icon: XCircle,
  },
  buyer_cancelled: {
    label: 'Rejected by Buyer',
    shortLabel: 'Buyer Rejected',
    description: 'Quotations or purchase orders declined by the buyer with recorded decline reasons.',
    subtext: 'Cancelled with reason',
    badgeCls: 'bg-purple-50 text-purple-800 border-purple-200/80',
    activeBorder: 'border-purple-500',
    activeBg: 'bg-gradient-to-b from-purple-50/60 to-white',
    activeRing: 'ring-2 ring-purple-500/25',
    iconBg: 'bg-purple-100 text-purple-700',
    iconColor: 'text-purple-600',
    accentColor: '#9333ea',
    icon: ShieldAlert,
  },
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatElapsed = (hours: number) => {
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h elapsed`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h elapsed` : `${days}d elapsed`;
};

const formatDealDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const UnmatchedDeals: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DealTab>('supplier_no_response');
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // Filter deals locally if user types in search bar
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const q = searchQuery.toLowerCase().trim();
    return deals.filter((deal) => {
      const buyerName = deal.buyerSnapshot?.name?.toLowerCase() || '';
      const buyerCompany = deal.buyerSnapshot?.company?.toLowerCase() || '';
      const buyerPhone = deal.buyerSnapshot?.phone?.toLowerCase() || '';
      const buyerEmail = deal.buyerSnapshot?.email?.toLowerCase() || '';
      const supplierName = deal.supplierSnapshot?.businessName?.toLowerCase() || '';
      const supplierPhone = deal.supplierSnapshot?.phone?.toLowerCase() || '';
      const supplierEmail = deal.supplierSnapshot?.email?.toLowerCase() || '';
      const productName = deal.productSnapshot?.name?.toLowerCase() || '';
      const productCategory = deal.productSnapshot?.category?.toLowerCase() || '';
      const reason = deal.cancellationReason?.toLowerCase() || '';
      const note = deal.adminNote?.toLowerCase() || '';
      const id = deal._id?.toLowerCase() || '';

      return (
        buyerName.includes(q) ||
        buyerCompany.includes(q) ||
        buyerPhone.includes(q) ||
        buyerEmail.includes(q) ||
        supplierName.includes(q) ||
        supplierPhone.includes(q) ||
        supplierEmail.includes(q) ||
        productName.includes(q) ||
        productCategory.includes(q) ||
        reason.includes(q) ||
        note.includes(q) ||
        id.includes(q)
      );
    });
  }, [deals, searchQuery]);

  // Total flagged sum across all 4 categories
  const totalFlaggedCount =
    (counts?.supplier_no_response ?? 0) +
    (counts?.buyer_no_response ?? 0) +
    (counts?.supplier_cancelled ?? 0) +
    (counts?.buyer_cancelled ?? 0);

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
    toast.success(`${label} copied`);
  };

  const handleTabChange = (tab: DealTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchQuery('');
  };

  const openNoteModal = (deal: UnmatchedDealItem) => {
    setNoteModalDeal(deal);
    setNoteText(deal.adminNote || '');
  };

  const currentTabConfig = TAB_CONFIG[activeTab];

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Hero Overview Card ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative gradient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/5 via-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Automated Rescue Watchdog
              </span>
              <span className="text-xs text-slate-400 font-medium">Auto-synced every 30s</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans !m-0">
              Unmarried Deals Rescue Hub
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed font-sans !m-0">
              Track stalled negotiations, unresponsive participants, and cancelled quotations. Review contact
              details, attach internal admin notes, and connect buyers with alternative suppliers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
            <div className="hidden sm:flex flex-col items-end pr-3 border-r border-slate-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Flagged</span>
              <span className="text-xl font-black text-slate-900 leading-none mt-0.5">
                {totalFlaggedCount}
              </span>
            </div>

            <button
              onClick={() => {
                refetchDeals();
                refetchCounts();
                toast.success('Deals updated');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin text-primary' : 'text-slate-500'} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 Interactive KPI Metric Cards (Merged Stats & Navigation) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(Object.keys(TAB_CONFIG) as DealTab[]).map((tab) => {
          const config = TAB_CONFIG[tab];
          const Icon = config.icon;
          const count = counts?.[tab] ?? 0;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`relative p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
                isActive
                  ? `${config.activeBg} ${config.activeBorder} ${config.activeRing} shadow-sm`
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Card Header: Icon + Subtext Pill */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? config.iconBg : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon size={18} />
                </div>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? config.badgeCls
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {config.subtext}
                </span>
              </div>

              {/* Card Body: Metric Count + Label */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                      isActive ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">deals</span>
                </div>

                <div
                  className={`text-xs font-bold mt-1.5 truncate ${
                    isActive ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {config.label}
                </div>
              </div>

              {/* Bottom active indicator line */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: config.accentColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Search, Context & Status Filter Deck ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Current Category Summary */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTabConfig.accentColor }} />
            <h3 className="text-sm font-bold text-slate-900 font-sans !m-0 flex items-center gap-2 truncate">
              <span>{currentTabConfig.label}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {totalItems} total
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate max-w-xl font-sans !m-0">
            {currentTabConfig.description}
          </p>
        </div>

        {/* Right: Search + Segmented Status Switch */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Segmented Status Switch */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            {(['open', 'closed', 'all'] as const).map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Deals Content List ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-32 bg-slate-100 rounded-full" />
                  <div className="h-5 w-16 bg-slate-100 rounded-md" />
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-28 bg-slate-100 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
                <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
                <div className="h-28 bg-slate-50 rounded-xl border border-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 size={26} />
          </div>
          <h4 className="text-base font-bold text-slate-900 font-sans !m-0">No Unmatched Deals Found</h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto font-sans !m-0">
            {searchQuery
              ? `No deals match your search query "${searchQuery}". Try clearing the search.`
              : statusFilter === 'open'
              ? `Great job! There are currently no open "${currentTabConfig.label}" deals needing admin action.`
              : `No deals matching the selected status filter.`}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeals.map((deal) => {
            const isClosed = deal.status === 'closed';
            const dealConfig = TAB_CONFIG[deal.dealType] || currentTabConfig;
            const DealIcon = dealConfig.icon;

            return (
              <div
                key={deal._id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                  isClosed
                    ? 'border-slate-200/70 opacity-75'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Card Header: Category badge, status, stage, elapsed time, timestamp */}
                <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50/90 via-slate-50/40 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Deal Category Pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${dealConfig.badgeCls}`}
                    >
                      <DealIcon size={13} className="shrink-0" />
                      <span>{dealConfig.shortLabel}</span>
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        deal.status === 'open'
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : deal.status === 'reassigned'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {deal.status === 'open' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      {deal.status.toUpperCase()}
                    </span>

                    {/* Stage Tag */}
                    {deal.stage === 'po' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100/70 text-amber-900 border border-amber-300/60">
                        📄 PO Rejected
                      </span>
                    )}
                    {deal.stage === 'order' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100/70 text-indigo-900 border border-indigo-300/60">
                        📦 Direct Order
                      </span>
                    )}
                    {deal.stage === 'enquiry' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100/70 text-purple-900 border border-purple-300/60">
                        💬 Enquiry
                      </span>
                    )}

                    {/* Elapsed Time Pill */}
                    <span
                      className={`text-xs flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium ${
                        deal.hoursElapsed >= 48
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/80 font-bold'
                          : 'text-slate-500 bg-slate-100/70'
                      }`}
                    >
                      <Clock size={12} className={deal.hoursElapsed >= 48 ? 'text-rose-500' : 'text-slate-400'} />
                      <span>{formatElapsed(deal.hoursElapsed)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-sans">
                    <span className="hidden sm:inline">Flagged {formatDealDate(deal.createdAt)}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold border border-slate-200/60">
                      #{deal._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Card Body: 3 balanced Columns (Buyer, Supplier, Product Requirement) */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Column 1: Buyer Details */}
                  <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between hover:border-slate-300/70 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <User size={13} className="text-blue-500" /> Buyer
                        </span>
                        {deal.buyerSnapshot?.company && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium truncate max-w-[130px]" title={deal.buyerSnapshot.company}>
                            {deal.buyerSnapshot.company}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {getInitials(deal.buyerSnapshot?.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate font-sans">
                            {deal.buyerSnapshot?.name || 'Unknown Buyer'}
                          </div>
                          {deal.buyerSnapshot?.userId && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              UID: {deal.buyerSnapshot.userId.slice(-6)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {deal.buyerSnapshot?.phone && (
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/70 text-slate-600 hover:border-slate-300 transition-colors">
                            <a
                              href={`tel:${deal.buyerSnapshot.phone}`}
                              className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors truncate font-medium"
                            >
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{deal.buyerSnapshot.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.buyerSnapshot.phone, 'Buyer phone')}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Copy phone"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}

                        {deal.buyerSnapshot?.email && (
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/70 text-slate-600 hover:border-slate-300 transition-colors">
                            <a
                              href={`mailto:${deal.buyerSnapshot.email}`}
                              className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors truncate font-medium"
                            >
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{deal.buyerSnapshot.email}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.buyerSnapshot.email, 'Buyer email')}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
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
                  <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between hover:border-slate-300/70 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Building2 size={13} className="text-emerald-500" /> Supplier
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          Merchant
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {getInitials(deal.supplierSnapshot?.businessName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate font-sans">
                            {deal.supplierSnapshot?.businessName || 'Unknown Supplier'}
                          </div>
                          {deal.supplierSnapshot?.userId && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              SID: {deal.supplierSnapshot.userId.slice(-6)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {deal.supplierSnapshot?.phone && (
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/70 text-slate-600 hover:border-slate-300 transition-colors">
                            <a
                              href={`tel:${deal.supplierSnapshot.phone}`}
                              className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors truncate font-medium"
                            >
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{deal.supplierSnapshot.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.supplierSnapshot.phone, 'Supplier phone')}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Copy phone"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}

                        {deal.supplierSnapshot?.email && (
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/70 text-slate-600 hover:border-slate-300 transition-colors">
                            <a
                              href={`mailto:${deal.supplierSnapshot.email}`}
                              className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors truncate font-medium"
                            >
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{deal.supplierSnapshot.email}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(deal.supplierSnapshot.email, 'Supplier email')}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
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
                  <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between hover:border-slate-300/70 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Package size={13} className="text-amber-500" /> Requirement
                        </span>
                        {deal.productSnapshot?.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[120px]" title={deal.productSnapshot.category}>
                            {deal.productSnapshot.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        {deal.productSnapshot?.imageUrl ? (
                          <img
                            src={deal.productSnapshot.imageUrl}
                            alt={deal.productSnapshot.name}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-xs"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shrink-0">
                            <Package size={22} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-sm line-clamp-2 font-sans leading-snug">
                            {deal.productSnapshot?.name || 'Product Enquiry'}
                          </div>
                          {deal.productSnapshot?.quantity && (
                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-2 px-2 py-0.5 rounded bg-white border border-slate-200/80 shadow-2xs">
                              <span className="text-slate-400">Qty:</span>
                              <span className="text-primary font-bold">{deal.productSnapshot.quantity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejection / Cancellation Reason Callout */}
                {deal.cancellationReason && (
                  <div className="px-5 pb-3.5">
                    <div className="bg-rose-50/70 border-l-4 border-rose-500 rounded-r-xl p-3 flex items-start gap-3">
                      <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-rose-900">
                          {deal.dealType === 'supplier_cancelled'
                            ? 'Supplier Rejection Reason:'
                            : 'Buyer Rejection Reason:'}
                        </span>{' '}
                        <span className="text-rose-800 italic font-sans font-medium">"{deal.cancellationReason}"</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Note if present */}
                {deal.adminNote && (
                  <div className="px-5 pb-3.5">
                    <div className="bg-amber-50/70 border-l-4 border-amber-500 rounded-r-xl p-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <MessageSquare size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-amber-900">Admin Note:</span>{' '}
                          <span className="text-amber-800 font-sans">{deal.adminNote}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openNoteModal(deal)}
                        className="text-xs text-amber-800 hover:text-amber-950 font-bold underline shrink-0 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {deal.conversationId && (
                      <a
                        href={`/chat?id=${deal.conversationId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 hover:text-primary hover:border-primary/40 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <ExternalLink size={13} />
                        View Chat History
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openNoteModal(deal)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileEdit size={13} />
                      {deal.adminNote ? 'Edit Note' : 'Add Note'}
                    </button>

                    {!isClosed && (
                      <button
                        onClick={() => setCloseModalDeal(deal)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs cursor-pointer"
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

      {/* ─── Pagination Footer ──────────────────────────────────────────────── */}
      {totalItems > limit && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80">
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

      {/* ─── Note Modal ─────────────────────────────────────────────────────── */}
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
          <p className="text-xs text-slate-500 mb-3 font-sans">
            Add internal notes for tracking follow-ups, calls, or alternative supplier recommendations.
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Called buyer on Sep 14 — buyer is looking for delivery in 3 days, assigned alternate supplier..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y font-sans"
          />
        </div>
      </Modal>

      {/* ─── Close Deal Confirmation Modal ──────────────────────────────────── */}
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
        <div className="py-2 text-sm text-slate-600 font-sans">
          Are you sure you want to mark this deal as closed?
          <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200/80 space-y-1.5">
            <div>
              <strong className="text-slate-900">Buyer:</strong>{' '}
              <span className="text-slate-700">{closeModalDeal?.buyerSnapshot?.name}</span>
            </div>
            <div>
              <strong className="text-slate-900">Supplier:</strong>{' '}
              <span className="text-slate-700">{closeModalDeal?.supplierSnapshot?.businessName}</span>
            </div>
            <div>
              <strong className="text-slate-900">Product:</strong>{' '}
              <span className="text-slate-700">{closeModalDeal?.productSnapshot?.name}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UnmatchedDeals;
