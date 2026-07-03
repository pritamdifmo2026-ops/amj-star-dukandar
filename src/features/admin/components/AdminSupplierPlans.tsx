import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Minus, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import adminService from '../services/admin.service';

type PlanFilter = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NONE';

const PAGE_SIZE = 10;

const TIER_LABEL: Record<string, string> = { VERIFIED: 'Verified', GAMMA: 'Gamma', BETA: 'Beta' };
const TIER_COLOR: Record<string, string> = {
  VERIFIED: 'bg-[#ecfdf5] text-[#059669]',
  GAMMA:    'bg-[#eff6ff] text-[#1d4ed8]',
  BETA:     'bg-[#fdf4ff] text-[#7c3aed]',
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const StatusBadge: React.FC<{ status?: string; expiryDate?: string }> = ({ status, expiryDate }) => {
  if (!status || status === 'NONE') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-[6px] bg-[#f1f5f9] text-[#64748b]">
        <Minus size={12} /> No Plan
      </span>
    );
  }
  if (status === 'ACTIVE') {
    const days = daysUntil(expiryDate);
    const soon = days !== null && days <= 30;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-[6px] ${soon ? 'bg-[#fff7ed] text-[#d97706]' : 'bg-[#ecfdf5] text-[#059669]'}`}>
        {soon ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
        {soon ? `Expiring (${days}d)` : 'Active'}
      </span>
    );
  }
  if (status === 'EXPIRED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-[6px] bg-[#fef2f2] text-[#dc2626]">
        <XCircle size={12} /> Expired
      </span>
    );
  }
  return <span className="text-xs text-[#64748b]">{status}</span>;
};

const AdminSupplierPlans: React.FC<{ onViewSupplier?: (id: string) => void }> = ({ onViewSupplier }) => {
  const [filter, setFilter] = useState<PlanFilter>('ALL');
  const [page, setPage] = useState(1);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['admin', 'supplier-plans'],
    queryFn: adminService.getSupplierPlans,
    refetchInterval: 120_000,
  });

  const getStatus = (s: typeof suppliers[0]) => s.subscription?.status ?? 'NONE';
  const getDays   = (s: typeof suppliers[0]) => daysUntil(s.subscription?.expiryDate);

  const filtered = suppliers.filter(s => {
    const status = getStatus(s);
    const days   = getDays(s);
    if (filter === 'ALL')      return true;
    if (filter === 'ACTIVE')   return status === 'ACTIVE' && (days === null || days > 30);
    if (filter === 'EXPIRING') return status === 'ACTIVE' && days !== null && days <= 30;
    if (filter === 'EXPIRED')  return status === 'EXPIRED';
    if (filter === 'NONE')     return status === 'NONE';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts: Record<PlanFilter, number> = {
    ALL:      suppliers.length,
    ACTIVE:   suppliers.filter(s => getStatus(s) === 'ACTIVE' && (getDays(s) ?? 999) > 30).length,
    EXPIRING: suppliers.filter(s => getStatus(s) === 'ACTIVE' && (getDays(s) ?? 999) <= 30).length,
    EXPIRED:  suppliers.filter(s => getStatus(s) === 'EXPIRED').length,
    NONE:     suppliers.filter(s => getStatus(s) === 'NONE').length,
  };

  const tabs: { key: PlanFilter; label: string }[] = [
    { key: 'ALL',      label: 'All' },
    { key: 'ACTIVE',   label: 'Active' },
    { key: 'EXPIRING', label: 'Expiring ≤30d' },
    { key: 'EXPIRED',  label: 'Expired' },
    { key: 'NONE',     label: 'No Plan' },
  ];

  const changeFilter = (f: PlanFilter) => { setFilter(f); setPage(1); };

  return (
    <div>
      {/* Summary bar */}
      <p className="text-sm text-[#64748b] mb-5">{suppliers.length} verified supplier{suppliers.length !== 1 ? 's' : ''} total</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => changeFilter(t.key)}
            className={`px-3 py-1.5 rounded-[8px] text-sm font-bold border-none cursor-pointer transition-colors ${
              filter === t.key ? 'bg-primary text-white' : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
            }`}
          >
            {t.label} <span className="opacity-70">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-[#64748b]">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[#64748b]">No suppliers in this category.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="bg-white rounded-[12px] border border-[#eef2f6] overflow-hidden hidden md:block">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wide">Billing Start</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wide">Expiry</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wide">Days Left</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map((s, i) => {
                  const tierKey = s.subscription?.tier ?? s.tier ?? 'VERIFIED';
                  const days    = getDays(s);
                  const rowNum  = (safePage - 1) * PAGE_SIZE + i + 1;
                  return (
                    <tr key={s._id} className={`border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors ${i % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}>
                      <td className="px-4 py-3 text-xs text-[#94a3b8] font-bold">{rowNum}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#0f172a] m-0">{s.businessName}</p>
                        {s.phone && <p className="text-xs text-[#64748b] m-0">{s.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-[6px] ${TIER_COLOR[tierKey] ?? 'bg-[#f1f5f9] text-[#64748b]'}`}>
                          {TIER_LABEL[tierKey] ?? tierKey}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.subscription?.status} expiryDate={s.subscription?.expiryDate} />
                      </td>
                      <td className="px-4 py-3 text-[#475569] text-xs">{formatDate(s.subscription?.startDate)}</td>
                      <td className="px-4 py-3 text-[#475569] text-xs">{formatDate(s.subscription?.expiryDate)}</td>
                      <td className="px-4 py-3">
                        {days === null ? (
                          <span className="text-[#94a3b8] text-xs">—</span>
                        ) : days < 0 ? (
                          <span className="text-[#dc2626] font-bold text-xs">{Math.abs(days)}d ago</span>
                        ) : (
                          <span className={`font-bold text-xs ${days <= 7 ? 'text-[#dc2626]' : days <= 30 ? 'text-[#d97706]' : 'text-[#059669]'}`}>
                            {days}d
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {onViewSupplier && (
                          <button
                            onClick={() => onViewSupplier(s._id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary border border-primary/20 rounded-[6px] px-2.5 py-1.5 bg-transparent cursor-pointer hover:bg-primary hover:text-white transition-colors"
                          >
                            View <ExternalLink size={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden bg-white rounded-[12px] border border-[#eef2f6] overflow-hidden divide-y divide-[#f1f5f9]">
            {paged.map((s, _i) => {
              const tierKey = s.subscription?.tier ?? s.tier ?? 'VERIFIED';
              const days    = getDays(s);
              return (
                <div key={s._id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0f172a] m-0 text-sm">{s.businessName}</p>
                      {s.phone && <p className="text-xs text-[#64748b] m-0">{s.phone}</p>}
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-[6px] ${TIER_COLOR[tierKey] ?? 'bg-[#f1f5f9] text-[#64748b]'}`}>
                      {TIER_LABEL[tierKey] ?? tierKey}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-[#64748b]">
                    <StatusBadge status={s.subscription?.status} expiryDate={s.subscription?.expiryDate} />
                    <span>Start: {formatDate(s.subscription?.startDate)}</span>
                    <span>Exp: {formatDate(s.subscription?.expiryDate)}</span>
                    {days !== null && (
                      <span className={`font-bold ${days < 0 ? 'text-[#dc2626]' : days <= 30 ? 'text-[#d97706]' : 'text-[#059669]'}`}>
                        {days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`}
                      </span>
                    )}
                  </div>
                  {onViewSupplier && (
                    <button
                      onClick={() => onViewSupplier(s._id)}
                      className="self-start inline-flex items-center gap-1 text-xs font-bold text-primary border border-primary/20 rounded-[6px] px-2.5 py-1.5 bg-transparent cursor-pointer"
                    >
                      View Profile <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-[#64748b] m-0">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#475569] cursor-pointer hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-sm font-bold border cursor-pointer transition-colors ${
                      p === safePage
                        ? 'bg-primary text-white border-primary'
                        : 'border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#475569] cursor-pointer hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSupplierPlans;
