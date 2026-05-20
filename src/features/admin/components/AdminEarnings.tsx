import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, Lock, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../services/admin.service';

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SummaryCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
}> = ({ label, value, sub, icon, accent, bg }) => (
  <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: bg }}>
      <span style={{ color: accent }}>{icon}</span>
    </div>
    <div>
      <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-[#0f172a] mt-0.5">{value}</p>
      {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminEarnings: React.FC = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'earnings'],
    queryFn: adminService.getEarnings,
  });

  const startEdit = (supplierId: string, current: number | null) => {
    setEditingId(supplierId);
    setEditRate(current != null ? String(current) : '');
  };

  const cancelEdit = () => { setEditingId(null); setEditRate(''); };

  const saveRate = async (supplierId: string) => {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Rate must be 0–100');
      return;
    }
    setSaving(true);
    try {
      await adminService.setCommissionRate(supplierId, rate);
      toast.success('Commission rate updated');
      setEditingId(null);
      setEditRate('');
      qc.invalidateQueries({ queryKey: ['admin', 'earnings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update rate');
    } finally {
      setSaving(false);
    }
  };

  const totals = data?.totals;
  const rows = data?.rows ?? [];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#0f172a]">AMJStar Earnings</h2>
        <p className="text-[#64748b] text-sm mt-1">Commission collected from all suppliers. Edit rates directly from this table.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#eef2f6] rounded-[12px] p-5 h-24 animate-pulse" />
          ))
        ) : (
          <>
            <SummaryCard
              label="Total AMJ Earnings"
              value={`₹${fmt(totals?.totalCommissionEarned ?? 0)}`}
              sub="Commission confirmed on delivered orders"
              icon={<IndianRupee size={22} />}
              accent="#059669"
              bg="#ecfdf5"
            />
            <SummaryCard
              label="Currently Frozen"
              value={`₹${fmt(totals?.totalFrozen ?? 0)}`}
              sub="Pending delivery confirmation"
              icon={<Lock size={22} />}
              accent="#d97706"
              bg="#fffbeb"
            />
            <SummaryCard
              label="Total Supplier Earnings"
              value={`₹${fmt(totals?.totalSupplierEarned ?? 0)}`}
              sub="Net earnings across all suppliers"
              icon={<TrendingUp size={22} />}
              accent="#0284c7"
              bg="#eff6ff"
            />
          </>
        )}
      </div>

      {/* Per-supplier table */}
      <div className="bg-white border border-[#eef2f6] rounded-[14px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <p className="font-bold text-[#0f172a] text-sm">Supplier Commission Breakdown</p>
          <span className="text-xs text-[#64748b]">{rows.length} suppliers</span>
        </div>

        {isLoading ? (
          <div className="p-6 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#f8fafc] rounded-md animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[#94a3b8] text-sm">No suppliers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-xs font-semibold uppercase">
                  <th className="text-left px-6 py-3">Supplier</th>
                  <th className="text-center px-4 py-3">Commission Rate</th>
                  <th className="text-right px-4 py-3">Wallet Balance</th>
                  <th className="text-right px-4 py-3">Frozen</th>
                  <th className="text-right px-4 py-3">AMJ Earned</th>
                  <th className="text-right px-6 py-3">Supplier Earned</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.supplierId} className="border-t border-[#f1f5f9] hover:bg-[#fafafa]">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-[#0f172a]">{row.businessName}</div>
                      {row.contactName && row.contactName !== row.businessName && (
                        <div className="text-xs text-[#94a3b8]">{row.contactName}</div>
                      )}
                      {row.phone && <div className="text-xs text-[#94a3b8]">{row.phone}</div>}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {editingId === row.supplierId ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editRate}
                            onChange={e => setEditRate(e.target.value)}
                            className="w-16 border border-[#e2e8f0] rounded-md px-2 py-1 text-xs text-center outline-none focus:border-[#0284c7]"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveRate(row.supplierId);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <span className="text-xs text-[#64748b]">%</span>
                          <button
                            onClick={() => saveRate(row.supplierId)}
                            disabled={saving}
                            className="w-6 h-6 flex items-center justify-center rounded bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-50 cursor-pointer"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-6 h-6 flex items-center justify-center rounded bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          {row.commissionRate != null ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#0284c7] font-bold text-xs">
                              {row.commissionRate}%
                            </span>
                          ) : (
                            <span className="text-xs text-[#94a3b8] italic">Not set</span>
                          )}
                          <button
                            onClick={() => startEdit(row.supplierId, row.commissionRate)}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#94a3b8] hover:text-[#0284c7] hover:bg-[#eff6ff] cursor-pointer transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-[#0f172a] font-medium">
                      ₹{fmt(row.availableBalance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.frozenBalance > 0 ? (
                        <span className="text-[#d97706] font-medium">₹{fmt(row.frozenBalance)}</span>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#059669]">
                      ₹{fmt(row.totalCommissionPaid)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-[#0f172a]">
                      ₹{fmt(row.totalEarned)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#e2e8f0] bg-[#f8fafc]">
                  <td className="px-6 py-3 font-bold text-[#0f172a] text-xs uppercase tracking-wide" colSpan={2}>Totals</td>
                  <td className="px-4 py-3 text-right font-bold text-[#0f172a]">
                    ₹{fmt(rows.reduce((s, r) => s + r.availableBalance, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#d97706]">
                    ₹{fmt(rows.reduce((s, r) => s + r.frozenBalance, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#059669]">
                    ₹{fmt(totals?.totalCommissionEarned ?? 0)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-[#0f172a]">
                    ₹{fmt(totals?.totalSupplierEarned ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEarnings;
