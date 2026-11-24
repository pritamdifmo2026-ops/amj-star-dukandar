import React, { useState, useMemo, useEffect } from 'react';
import {
  Power, Search, RotateCcw, Users, ShoppingBag, Store,
  TrendingUp, Calendar, ArrowUpDown, Building, Phone, Mail,
  CheckCircle2, XCircle, FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '@/shared/components/ui/Pagination';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { AdminUser } from '../types/admin.types';

interface UserManagementProps {
  users: AdminUser[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

type RoleFilterKey = 'all' | 'buyer' | 'supplier' | 'partner' | 'reseller' | 'admin';
type StatusFilterKey = 'all' | 'active' | 'banned';
type JoinDatePreset = 'all' | 'today' | '7d' | '30d' | '90d' | 'this_year' | 'custom';
type ActivityFilterKey = 'all' | 'has_orders' | 'zero_orders' | 'repeat_3' | 'top_5';
type VolumeFilterKey = 'all' | 'gt_0' | 'gt_10k' | 'gt_50k' | 'gt_100k';
type SortByKey = 'newest' | 'oldest' | 'volume_desc' | 'orders_desc' | 'name_asc';

const thCls =
  'text-left px-4 py-3.5 text-slate-500 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] border-b border-slate-200 bg-slate-50/80 whitespace-nowrap';
const tdCls = 'px-4 py-3 border-b border-slate-100 text-xs text-slate-700 align-middle';

function shortDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROLE_BADGES: Record<string, { label: string; badge: string; dot: string }> = {
  buyer: {
    label: 'Buyer',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  supplier: {
    label: 'Seller (Supplier)',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  partner: {
    label: 'Partner',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  reseller: {
    label: 'Reseller',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  admin: {
    label: 'Admin',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    dot: 'bg-slate-500',
  },
  superadmin: {
    label: 'Super Admin',
    badge: 'bg-rose-50 text-rose-800 border-rose-300',
    dot: 'bg-rose-500',
  },
};

const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus }) => {
  // Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [joinDatePreset, setJoinDatePreset] = useState<JoinDatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilterKey>('all');
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilterKey>('all');
  const [sortBy, setSortBy] = useState<SortByKey>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Overall User Stats Breakdown
  const overallStats = useMemo(() => {
    let buyers = 0;
    let suppliers = 0;
    let partners = 0;
    let resellers = 0;
    let admins = 0;
    let activeCount = 0;
    let totalGrossVolume = 0;
    let transactingUsers = 0;

    for (const u of users) {
      const r = (u.role || 'buyer').toLowerCase();
      if (r === 'buyer') buyers++;
      else if (r === 'supplier') suppliers++;
      else if (r === 'partner') partners++;
      else if (r === 'reseller') resellers++;
      else if (r === 'admin' || r === 'superadmin') admins++;
      else buyers++;

      if (u.isActive) activeCount++;
      const vol = u.totalVolume || 0;
      totalGrossVolume += vol;
      if ((u.ordersCount || 0) > 0 || vol > 0) transactingUsers++;
    }

    return {
      total: users.length,
      buyers,
      suppliers,
      partners,
      resellers,
      admins,
      activeCount,
      totalGrossVolume,
      transactingUsers,
    };
  }, [users]);

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const ms7d = todayStart - 7 * 24 * 60 * 60 * 1000;
    const ms30d = todayStart - 30 * 24 * 60 * 60 * 1000;
    const ms90d = todayStart - 90 * 24 * 60 * 60 * 1000;
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    const customStartMs = customStartDate ? new Date(customStartDate).getTime() : 0;
    const customEndMs = customEndDate ? new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000 : Infinity;

    return users
      .filter((u) => {
        // 1. Role Filter
        const r = (u.role || 'buyer').toLowerCase();
        if (roleFilter !== 'all') {
          if (roleFilter === 'admin') {
            if (r !== 'admin' && r !== 'superadmin') return false;
          } else if (r !== roleFilter) {
            return false;
          }
        }

        // 2. Status Filter
        if (statusFilter === 'active' && !u.isActive) return false;
        if (statusFilter === 'banned' && u.isActive) return false;

        // 3. Search Filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchName = u.name?.toLowerCase().includes(q);
          const matchCompany = u.companyName?.toLowerCase().includes(q);
          const matchPhone = u.phone?.toLowerCase().includes(q);
          const matchEmail = u.email?.toLowerCase().includes(q);
          const matchPartnerCode = u.partnerDetails?.partnerCode?.toLowerCase().includes(q);
          const matchSupplierStore = u.supplierDetails?.businessName?.toLowerCase().includes(q);
          if (!matchName && !matchCompany && !matchPhone && !matchEmail && !matchPartnerCode && !matchSupplierStore) {
            return false;
          }
        }

        // 4. Join Date Filter
        if (joinDatePreset !== 'all') {
          if (!u.createdAt) return false;
          const joinMs = new Date(u.createdAt).getTime();
          if (isNaN(joinMs)) return false;
          if (joinDatePreset === 'today' && joinMs < todayStart) return false;
          if (joinDatePreset === '7d' && joinMs < ms7d) return false;
          if (joinDatePreset === '30d' && joinMs < ms30d) return false;
          if (joinDatePreset === '90d' && joinMs < ms90d) return false;
          if (joinDatePreset === 'this_year' && joinMs < yearStart) return false;
          if (joinDatePreset === 'custom') {
            if (customStartMs && joinMs < customStartMs) return false;
            if (customEndDate && joinMs > customEndMs) return false;
          }
        }

        // 5. Activity Criteria (Orders / Deals)
        const count = u.ordersCount || 0;
        if (activityFilter === 'has_orders' && count < 1) return false;
        if (activityFilter === 'zero_orders' && count !== 0) return false;
        if (activityFilter === 'repeat_3' && count < 3) return false;
        if (activityFilter === 'top_5' && count < 5) return false;

        // 6. Volume Criteria
        const vol = u.totalVolume || 0;
        if (volumeFilter === 'gt_0' && vol <= 0) return false;
        if (volumeFilter === 'gt_10k' && vol < 10000) return false;
        if (volumeFilter === 'gt_50k' && vol < 50000) return false;
        if (volumeFilter === 'gt_100k' && vol < 100000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === 'volume_desc') {
          return (b.totalVolume || 0) - (a.totalVolume || 0);
        }
        if (sortBy === 'orders_desc') {
          return (b.ordersCount || 0) - (a.ordersCount || 0);
        }
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return 0;
      });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
    joinDatePreset,
    customStartDate,
    customEndDate,
    activityFilter,
    volumeFilter,
    sortBy,
  ]);

  // Reset all filters
  const isAnyFilterActive =
    search !== '' ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    joinDatePreset !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    activityFilter !== 'all' ||
    volumeFilter !== 'all' ||
    sortBy !== 'newest';

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    roleFilter,
    statusFilter,
    joinDatePreset,
    customStartDate,
    customEndDate,
    activityFilter,
    volumeFilter,
    sortBy,
  ]);

  const resetAllFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setJoinDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setActivityFilter('all');
    setVolumeFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Export to CSV & Excel function
  const handleExportCsv = () => {
    if (!filteredUsers.length) {
      toast.error('No users match current filters to export.');
      return;
    }

    const headers = [
      'User ID',
      'Name',
      'Company / Store Name',
      'Role',
      'Phone',
      'Email',
      'Status',
      'Joined Date',
      'Orders / Deals Count',
      'Total Volume (INR)',
      'Total Spend (INR)',
      'Total Sales Volume (INR)',
      'Last Activity Date',
      'Tier / KYC Status',
      'Partner Code',
    ];

    const rows = filteredUsers.map((u) => {
      const escape = (val: unknown) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const tierOrKyc =
        u.supplierDetails?.tier || u.supplierDetails?.kycStatus || '';
      const partnerCode = u.partnerDetails?.partnerCode || '';

      return [
        escape(u._id),
        escape(u.name || 'N/A'),
        escape(u.companyName || u.supplierDetails?.businessName || ''),
        escape(u.role || 'buyer'),
        escape(u.phone || ''),
        escape(u.email || ''),
        escape(u.isActive ? 'Active' : 'Banned'),
        escape(shortDate(u.createdAt)),
        escape(u.ordersCount || 0),
        escape(u.totalVolume || 0),
        escape(u.totalSpend || 0),
        escape(u.totalSalesVolume || 0),
        escape(shortDate(u.lastActivityDate)),
        escape(tierOrKyc),
        escape(partnerCode),
      ].join(',');
    });

    // Add UTF-8 BOM (\uFEFF) for native Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `amjstar_users_analysis_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredUsers.length} users to CSV/Excel`);
  };

  // Paged users for table view
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedUsers = filteredUsers.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* ── 1. Executive Analysis & Insights Header ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total User Base</span>
            <Users size={15} className="text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 leading-tight">
            {filteredUsers.length}
            {filteredUsers.length !== users.length && (
              <span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">
                / {users.length} total
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {overallStats.activeCount} active
            </span>
            <span className="text-slate-400 font-medium">
              ({Math.round((overallStats.activeCount / (users.length || 1)) * 100)}% healthy)
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Buyers & Resellers</span>
            <ShoppingBag size={15} className="text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 leading-tight">
            {overallStats.buyers} <span className="text-xs font-semibold text-slate-400 font-sans">buyers</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            + {overallStats.resellers} resellers enrolled
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Sellers & Partners</span>
            <Store size={15} className="text-orange-500" />
          </div>
          <div className="text-xl font-black text-slate-900 leading-tight">
            {overallStats.suppliers} <span className="text-xs font-semibold text-slate-400 font-sans">sellers</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            + {overallStats.partners} wholesale partner nodes
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Economic Commerce</span>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 leading-tight truncate">
            {formatCurrency(overallStats.totalGrossVolume)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overallStats.transactingUsers} accounts have transacted ({Math.round((overallStats.transactingUsers / (users.length || 1)) * 100)}%)
          </div>
        </div>
      </div>

      {/* ── 2. Role Filter Tabs Bar ── */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              ['all', `All Users (${users.length})`],
              ['buyer', `Buyers (${overallStats.buyers})`],
              ['supplier', `Sellers (${overallStats.suppliers})`],
              ['partner', `Partners (${overallStats.partners})`],
              ['reseller', `Resellers (${overallStats.resellers})`],
              ['admin', `Admins (${overallStats.admins})`],
            ] as Array<[RoleFilterKey, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setRoleFilter(key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all border ${
                roleFilter === key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Export CSV / Excel Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border-none transition-all shadow-2xs"
            title="Export currently filtered users to Excel-compatible CSV file"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* ── 3. Multi-Criteria Filter & Search Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Universal Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, store, phone, email, partner code..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer border-none bg-transparent"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Clear All Filters */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              title="Reset all applied filters"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          )}
        </div>

        {/* Criteria Selectors Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Account Status Filter */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Account Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilterKey);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="banned">Banned Only</option>
            </select>
          </div>

          {/* Join Date Filter */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Join Period
            </label>
            <select
              value={joinDatePreset}
              onChange={(e) => {
                setJoinDatePreset(e.target.value as JoinDatePreset);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Join Dates</option>
              <option value="today">Joined Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Purchases / Deals Activity Criteria */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Deals & Purchases
            </label>
            <select
              value={activityFilter}
              onChange={(e) => {
                setActivityFilter(e.target.value as ActivityFilterKey);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Activity</option>
              <option value="has_orders">Has Orders / Deals (≥ 1)</option>
              <option value="zero_orders">Zero Orders / Deals (0)</option>
              <option value="repeat_3">Repeat Active (3+)</option>
              <option value="top_5">Top Transactors (5+)</option>
            </select>
          </div>

          {/* Spend / Sales Volume Criteria */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Volume / Spend
            </label>
            <select
              value={volumeFilter}
              onChange={(e) => {
                setVolumeFilter(e.target.value as VolumeFilterKey);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Any Volume</option>
              <option value="gt_0">&gt; ₹0 (Has Transacted)</option>
              <option value="gt_10k">&gt; ₹10,000</option>
              <option value="gt_50k">&gt; ₹50,000</option>
              <option value="gt_100k">&gt; ₹1,00,000</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <ArrowUpDown size={10} /> Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortByKey);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Join Date: Newest First</option>
              <option value="oldest">Join Date: Oldest First</option>
              <option value="volume_desc">Volume / Spend: Highest First</option>
              <option value="orders_desc">Orders / Deals: Most First</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers (conditional) */}
        {joinDatePreset === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-3 flex-wrap text-xs bg-slate-50/70 p-2.5 rounded-lg">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Calendar size={13} className="text-indigo-600" /> Custom Range:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer border-none bg-transparent"
              >
                Clear Range
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Main Responsive User Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table subheader showing active match count */}
        <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-700">
            Showing <span className="text-slate-900 font-black">{pagedUsers.length}</span> of{' '}
            <span className="text-slate-900 font-black">{filteredUsers.length}</span> matching users
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr>
                <th className={thCls}>User / Business</th>
                <th className={thCls}>Contact</th>
                <th className={thCls}>Role & Info</th>
                <th className={thCls}>Orders & Deals</th>
                <th className={thCls}>Volume / Spend</th>
                <th className={thCls}>Status</th>
                <th className={`${thCls} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700 m-0">No users found</p>
                    <p className="text-[11px] text-slate-400 m-0 mt-1">
                      Try adjusting search query, role tab, or activity filters.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedUsers.map((u) => {
                  const roleCfg = ROLE_BADGES[(u.role || 'buyer').toLowerCase()] || ROLE_BADGES.buyer;
                  const isSupplier = u.role === 'supplier';
                  const isPartner = u.role === 'partner';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Company */}
                      <td className={tdCls}>
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-xs text-slate-700 shrink-0 uppercase">
                            {(u.name || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 text-xs truncate max-w-[200px]">
                              {u.name || 'N/A'}
                            </div>
                            {u.companyName && u.companyName !== u.name && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                                <Building size={10} className="shrink-0 text-slate-400" />
                                {u.companyName}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Joined: {shortDate(u.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact: Phone & Email */}
                      <td className={tdCls}>
                        <div className="space-y-0.5 font-mono text-[11px]">
                          {u.phone ? (
                            <div className="text-slate-800 flex items-center gap-1">
                              <Phone size={10} className="text-slate-400 shrink-0" /> {u.phone}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {u.email && (
                            <div className="text-slate-500 text-[10px] truncate max-w-[170px] flex items-center gap-1">
                              <Mail size={10} className="text-slate-400 shrink-0" /> {u.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role & Specific Identifiers */}
                      <td className={tdCls}>
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${roleCfg.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dot}`} />
                            {roleCfg.label}
                          </span>
                          {isSupplier && u.supplierDetails?.tier && (
                            <div className="text-[10px] text-orange-700 font-bold uppercase tracking-wider">
                              Tier: {u.supplierDetails.tier}
                            </div>
                          )}
                          {isPartner && u.partnerDetails?.partnerCode && (
                            <div className="font-mono text-[10px] font-bold text-indigo-700">
                              Code: {u.partnerDetails.partnerCode}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Orders & Deals Count */}
                      <td className={tdCls}>
                        <div className="space-y-0.5">
                          <div className="font-black text-slate-900 text-xs">
                            {u.ordersCount || 0}{' '}
                            <span className="text-slate-400 font-normal text-[10px]">
                              {isSupplier ? 'deals' : 'orders'}
                            </span>
                          </div>
                          {u.lastActivityDate && (
                            <div className="text-[10px] text-slate-400">
                              Last: {shortDate(u.lastActivityDate)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Volume / Spend */}
                      <td className={tdCls}>
                        <div className="space-y-0.5">
                          <div className="font-black text-slate-900 text-xs">
                            {formatCurrency(u.totalVolume || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isSupplier ? 'Sales' : isPartner ? 'Referred' : 'Spend'}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className={tdCls}>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 size={10} /> Active
                            </>
                          ) : (
                            <>
                              <XCircle size={10} /> Banned
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action */}
                      <td className={`${tdCls} text-right`}>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(u._id, u.isActive)}
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
                            u.isActive
                              ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                          title={u.isActive ? 'Ban this user from accessing platform' : 'Activate this user'}
                        >
                          <Power size={12} /> {u.isActive ? 'Ban' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            Page <span className="font-bold text-slate-900">{safeCurrentPage}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </div>
          <Pagination
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={safeCurrentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
