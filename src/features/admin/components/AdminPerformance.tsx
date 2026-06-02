import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import {
  TrendingUp, TrendingDown, Star, AlertTriangle, Package,
  IndianRupee, ArrowUpDown, Minus, Search, ChevronDown, ChevronUp,
} from 'lucide-react';

const fetchPerformance = async () => {
  const res = await apiClient.get('/admin/supplier-performance');
  return res.data;
};

type SortKey = 'totalCommissionToAmj' | 'avgRating' | 'totalCompleted' | 'disputeCount' | 'growthPct';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const StarMini: React.FC<{ value: number | null }> = ({ value }) => {
  if (!value) return <span className="text-xs text-[#94a3b8]">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      <Star size={13} className="fill-[#f59e0b] text-[#f59e0b]" />
      <span className="text-xs font-bold text-[#475569]">{value.toFixed(1)}</span>
    </div>
  );
};

const GrowthBadge: React.FC<{ pct: number }> = ({ pct }) => {
  if (pct === 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-[#94a3b8] font-semibold whitespace-nowrap">
      <Minus size={11} /> 0%
    </span>
  );
  if (pct > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#15803d] bg-[#f0fdf4] px-2 py-0.5 rounded-full border border-[#bbf7d0] whitespace-nowrap">
      <TrendingUp size={11} /> +{pct}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#dc2626] bg-[#fef2f2] px-2 py-0.5 rounded-full border border-[#fecaca] whitespace-nowrap">
      <TrendingDown size={11} /> {pct}%
    </span>
  );
};

const DimGrid: React.FC<{ d: any }> = ({ d }) => {
  if (!d?.quality && !d?.packaging && !d?.communication && !d?.onTime) {
    return <span className="text-[11px] text-[#94a3b8]">No data</span>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
      {[
        { k: 'Quality', v: d.quality },
        { k: 'Pack', v: d.packaging },
        { k: 'Comms', v: d.communication },
        { k: 'Time', v: d.onTime },
      ].map(({ k, v }) => v ? (
        <span key={k} className="text-[10px] text-[#64748b] whitespace-nowrap">
          {k}: <strong className="text-[#475569]">{v}</strong>
        </span>
      ) : null)}
    </div>
  );
};

// ─── Mobile card ──────────────────────────────────────────────────────────────

const SupplierCard: React.FC<{ row: any; isTopEarner: boolean }> = ({ row, isTopEarner }) => {
  const [expanded, setExpanded] = useState(false);
  const hasDisputes = row.disputeCount > 0;
  const lowRating = row.avgRating !== null && row.avgRating < 3;
  const hasDims = row.dimensions?.quality || row.dimensions?.packaging || row.dimensions?.communication || row.dimensions?.onTime;

  return (
    <div className={`bg-white border rounded-[14px] overflow-hidden ${lowRating || hasDisputes ? 'border-[#fca5a5]' : 'border-[#e2e8f0]'}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between gap-2 border-b border-[#f1f5f9] ${lowRating || hasDisputes ? 'bg-[#fef9f9]' : 'bg-[#f8fafc]'}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isTopEarner && (
            <span className="shrink-0 text-[10px] font-bold text-[#d97706] bg-[#fffbeb] border border-[#fcd34d] px-1.5 py-0.5 rounded-full">★ TOP</span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[#0f172a] m-0 truncate">{row.businessName}</p>
            <p className="text-[11px] text-[#94a3b8] m-0 truncate">{row.email}</p>
          </div>
        </div>
        {row.commissionRate != null && (
          <span className="shrink-0 text-[10px] font-bold text-[#64748b] bg-white border border-[#e2e8f0] px-2 py-0.5 rounded-full">{row.commissionRate}%</span>
        )}
      </div>

      {/* 2×2 metrics */}
      <div className="grid grid-cols-2 divide-x divide-y divide-[#f1f5f9]">
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] m-0 mb-1">AMJ Commission</p>
          <div className="flex items-center gap-0.5">
            <IndianRupee size={14} className="text-[#059669]" />
            <span className="text-base font-extrabold text-[#059669]">{row.totalCommissionToAmj.toLocaleString('en-IN')}</span>
          </div>
          {row.totalRevenue > 0 && (
            <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5">GMV ₹{row.totalRevenue.toLocaleString('en-IN')}</p>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] m-0 mb-1">Orders</p>
          <div className="flex items-center gap-1">
            <Package size={14} className="text-[#64748b]" />
            <span className="text-base font-bold text-[#0f172a]">{row.totalCompleted}</span>
          </div>
          <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5">30d: <strong className="text-[#475569]">{row.ordersLast30}</strong></p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] m-0 mb-1">Rating</p>
          <StarMini value={row.avgRating} />
          {row.reviewCount > 0 && (
            <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5">{row.reviewCount} review{row.reviewCount !== 1 ? 's' : ''}</p>
          )}
          {lowRating && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#dc2626] mt-0.5"><AlertTriangle size={10} /> Low</span>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] m-0 mb-1">Disputes / Growth</p>
          <div className="flex items-center gap-2 flex-wrap">
            {hasDisputes ? (
              <span className="inline-flex items-center gap-0.5 text-sm font-bold text-[#dc2626]"><AlertTriangle size={13} /> {row.disputeCount}</span>
            ) : (
              <span className="text-sm font-bold text-[#15803d]">0</span>
            )}
            <GrowthBadge pct={row.growthPct} />
          </div>
          <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5">{row.ordersPrev30} → {row.ordersLast30}</p>
        </div>
      </div>

      {/* Expandable dimensions */}
      {hasDims && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-[#64748b] bg-[#f8fafc] border-t border-[#f1f5f9] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Hide ratings' : 'Category ratings'}
          </button>
          {expanded && (
            <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-[#f8fafc] border-t border-[#f1f5f9]">
              {[
                { label: 'Quality', val: row.dimensions.quality },
                { label: 'Packaging', val: row.dimensions.packaging },
                { label: 'Communication', val: row.dimensions.communication },
                { label: 'On-time', val: row.dimensions.onTime },
              ].map(({ label, val }) => val ? (
                <div key={label} className="flex items-center justify-between bg-white rounded-[8px] px-3 py-1.5 border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b]">{label}</span>
                  <div className="flex items-center gap-0.5">
                    <Star size={11} className="fill-[#f59e0b] text-[#f59e0b]" />
                    <span className="text-xs font-bold text-[#475569]">{val}</span>
                  </div>
                </div>
              ) : null)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const AdminPerformance: React.FC = () => {
  const [sortKey, setSortKey] = useState<SortKey>('totalCommissionToAmj');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'supplier-performance'],
    queryFn: fetchPerformance,
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-[#0284c7] rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-6 text-sm text-[#dc2626]">Failed to load performance data.</div>;
  }

  const { rows = [], totals = {} } = data || {};

  const filtered = rows
    .filter((r: any) => !search || r.businessName?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const SortTh: React.FC<{ label: string; k: SortKey; className?: string }> = ({ label, k, className }) => (
    <th
      onClick={() => handleSort(k)}
      className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] border-b border-[#f1f5f9] cursor-pointer hover:text-[#0f172a] select-none whitespace-nowrap ${className ?? ''}`}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className={sortKey === k ? 'text-[#0284c7]' : 'opacity-40'} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col gap-5 min-w-0">

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-5">
          <p className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider m-0 mb-1">Total AMJ Commission</p>
          <p className="text-2xl font-extrabold text-[#0f172a] m-0">₹{(totals.totalCommissionToAmj || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-[#64748b] m-0 mt-1">from {totals.totalCompleted || 0} completed orders</p>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-5">
          <p className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider m-0 mb-1">Active Suppliers</p>
          <p className="text-2xl font-extrabold text-[#0f172a] m-0">{filtered.length}</p>
          <p className="text-xs text-[#64748b] m-0 mt-1">verified & onboarded</p>
        </div>
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-[12px] p-5">
          <p className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider m-0 mb-1">Open Disputes</p>
          <p className="text-2xl font-extrabold text-[#dc2626] m-0">{totals.totalDisputes || 0}</p>
          <p className="text-xs text-[#dc2626] m-0 mt-1">require manual resolution</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 bg-white border border-[#e2e8f0] rounded-[10px] px-4 py-2.5 focus-within:border-[#0284c7] transition-colors w-full max-w-xs">
        <Search size={14} className="text-[#94a3b8] shrink-0" />
        <input
          className="border-none outline-none text-sm bg-transparent text-[#1e293b] placeholder:text-[#94a3b8] flex-1 min-w-0"
          placeholder="Search supplier…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="shrink-0 text-[#94a3b8] hover:text-[#475569] bg-transparent border-none cursor-pointer p-0 leading-none">×</button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] py-14 text-center text-sm text-[#94a3b8]">
          No suppliers found.
        </div>
      )}

      {/* ── Mobile / Tablet cards (< lg) ──────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-4 lg:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#64748b]">Sort:</span>
            {([
              { k: 'totalCommissionToAmj', label: 'Commission' },
              { k: 'totalCompleted',       label: 'Orders' },
              { k: 'avgRating',            label: 'Rating' },
              { k: 'disputeCount',         label: 'Disputes' },
              { k: 'growthPct',            label: 'Growth' },
            ] as { k: SortKey; label: string }[]).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => handleSort(k)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-colors ${
                  sortKey === k
                    ? 'bg-[#0284c7] text-white border-[#0284c7]'
                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0284c7] hover:text-[#0284c7]'
                }`}
              >
                {label}
                {sortKey === k && (sortDir === 'desc' ? <TrendingDown size={10} /> : <TrendingUp size={10} />)}
              </button>
            ))}
          </div>
          {filtered.map((row: any, idx: number) => (
            <SupplierCard key={row.supplierId} row={row} isTopEarner={row.totalCommissionToAmj > 0 && idx < 3} />
          ))}
        </div>
      )}

      {/* ── Desktop table (lg+) — 5 cols always, Dimensions on xl+ ──────── */}
      {filtered.length > 0 && (
        <div className="hidden lg:block bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden shadow-sm">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-[30%]" />           {/* Supplier */}
              <col className="w-[17%]" />           {/* Commission */}
              <col className="w-[14%]" />           {/* Orders */}
              <col className="w-[13%]" />           {/* Rating */}
              <col className="w-[13%]" />           {/* Disputes + Growth */}
              <col className="xl:table-column hidden w-[13%]" /> {/* Dimensions */}
            </colgroup>
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] border-b border-[#f1f5f9]">Supplier</th>
                <SortTh label="AMJ Commission" k="totalCommissionToAmj" />
                <SortTh label="Orders" k="totalCompleted" />
                <SortTh label="Rating" k="avgRating" />
                <SortTh label="Disputes & Growth" k="disputeCount" />
                <th className="hidden xl:table-cell px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] border-b border-[#f1f5f9]">Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row: any, idx: number) => {
                const hasDisputes = row.disputeCount > 0;
                const lowRating = row.avgRating !== null && row.avgRating < 3;
                const isTopEarner = row.totalCommissionToAmj > 0 && idx < 3;

                return (
                  <tr
                    key={row.supplierId}
                    className={`border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors ${lowRating || hasDisputes ? 'bg-[#fffafa]' : ''}`}
                  >
                    {/* Supplier */}
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2 min-w-0">
                        {isTopEarner && (
                          <span className="shrink-0 text-[10px] font-bold text-[#d97706] bg-[#fffbeb] border border-[#fcd34d] px-1.5 py-0.5 rounded-full mt-0.5">★ TOP</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#0f172a] m-0 truncate">{row.businessName}</p>
                          <p className="text-[11px] text-[#94a3b8] m-0 truncate">{row.email}</p>
                          {row.commissionRate != null && (
                            <span className="inline-block text-[10px] font-semibold text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded mt-0.5">{row.commissionRate}% rate</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Commission */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        <IndianRupee size={13} className="text-[#059669] shrink-0" />
                        <span className="text-sm font-extrabold text-[#059669]">{row.totalCommissionToAmj.toLocaleString('en-IN')}</span>
                      </div>
                      {row.totalRevenue > 0 && (
                        <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5 truncate">GMV ₹{row.totalRevenue.toLocaleString('en-IN')}</p>
                      )}
                    </td>

                    {/* Orders */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Package size={13} className="text-[#64748b] shrink-0" />
                        <span className="text-sm font-bold text-[#0f172a]">{row.totalCompleted}</span>
                      </div>
                      <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5">
                        30d: <strong className="text-[#475569]">{row.ordersLast30}</strong>
                      </p>
                    </td>

                    {/* Rating */}
                    <td className="px-3 py-3">
                      <StarMini value={row.avgRating} />
                      {row.reviewCount > 0 && (
                        <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5">{row.reviewCount} review{row.reviewCount !== 1 ? 's' : ''}</p>
                      )}
                      {lowRating && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#dc2626] mt-0.5">
                          <AlertTriangle size={10} /> Low
                        </span>
                      )}
                    </td>

                    {/* Disputes + Growth — combined column */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasDisputes ? (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#dc2626]">
                            <AlertTriangle size={12} /> {row.disputeCount}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#15803d]">0</span>
                        )}
                        <GrowthBadge pct={row.growthPct} />
                      </div>
                      <p className="text-[10px] text-[#94a3b8] m-0 mt-0.5">
                        {row.ordersPrev30} → {row.ordersLast30}
                      </p>
                    </td>

                    {/* Dimensions — xl+ only */}
                    <td className="hidden xl:table-cell px-3 py-3">
                      <DimGrid d={row.dimensions} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[#94a3b8] m-0">
        * Growth = completed orders last 30d vs previous 30d. Commission = total paid to AMJ from completed orders.
        <span className="hidden lg:inline xl:hidden"> Dimensions visible on wider screens.</span>
      </p>
    </div>
  );
};

export default AdminPerformance;
