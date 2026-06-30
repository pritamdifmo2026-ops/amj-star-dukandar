import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, Lock, Edit2, Check, X, Unlock, AlertTriangle, Package } from 'lucide-react';
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

  // Frozen-orders modal state
  const [frozenModal, setFrozenModal] = useState<{ userId: string; businessName: string } | null>(null);
  const [confirmUnfreeze, setConfirmUnfreeze] = useState<{ orderId: string; amount: number } | null>(null);
  const [unfreezeReason, setUnfreezeReason] = useState('');
  const [unfreezing, setUnfreezing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'earnings'],
    queryFn: adminService.getEarnings,
  });

  const { data: frozenOrders = [], isLoading: frozenLoading } = useQuery({
    queryKey: ['admin', 'frozen-orders', frozenModal?.userId],
    queryFn: () => adminService.getFrozenOrders(frozenModal!.userId),
    enabled: !!frozenModal,
  });

  const doUnfreeze = async () => {
    if (!confirmUnfreeze) return;
    setUnfreezing(true);
    try {
      await adminService.unfreezeCommission(confirmUnfreeze.orderId, unfreezeReason.trim() || 'Manual release by admin');
      toast.success(`₹${fmt(confirmUnfreeze.amount)} released back to supplier`);
      setConfirmUnfreeze(null);
      setUnfreezeReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'frozen-orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'earnings'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to unfreeze');
    } finally {
      setUnfreezing(false);
    }
  };

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
        {/* <h2 className="text-2xl font-extrabold text-[#0f172a]">AMJStar Earnings</h2> */}
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
              value={`₹${fmt(totals?.totalAmjEarned ?? 0)}`}
              sub="Commissions + Listing Fees"
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
                  <th className="text-right px-4 py-3">Listing Fees</th>
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
                        <button
                          onClick={() => setFrozenModal({ userId: row.userId, businessName: row.businessName })}
                          className="inline-flex items-center gap-1 text-[#d97706] font-medium hover:bg-[#fffbeb] px-2 py-1 rounded-md cursor-pointer transition-colors border border-transparent hover:border-[#fcd34d]"
                          title="View frozen orders & release"
                        >
                          ₹{fmt(row.frozenBalance)}
                          <Lock size={11} />
                        </button>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[#0f172a]">
                      ₹{fmt(row.totalListingFeesPaid ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#059669]">
                      ₹{fmt((row.totalCommissionPaid ?? 0) + (row.totalListingFeesPaid ?? 0))}
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
                  <td className="px-4 py-3 text-right font-medium text-[#0f172a]">
                    ₹{fmt(totals?.totalListingFeesEarned ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#059669]">
                    ₹{fmt(totals?.totalAmjEarned ?? 0)}
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

      {/* ── Frozen Orders Modal ─────────────────────────────────────────── */}
      {frozenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
          onClick={e => { if (e.target === e.currentTarget) setFrozenModal(null); }}
        >
          <div className="w-full max-w-2xl bg-white rounded-[16px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] m-0 flex items-center gap-2">
                  <Lock size={16} className="text-[#d97706]" /> Frozen Commissions
                </h3>
                <p className="text-xs text-[#94a3b8] m-0 mt-0.5">{frozenModal.businessName}</p>
              </div>
              <button onClick={() => setFrozenModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] border-none bg-transparent cursor-pointer text-[#64748b]">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-[8px] px-4 py-2.5 mb-4 text-xs text-[#92400e] flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Releasing a frozen commission returns it to the supplier's available balance and <strong>cancels the order</strong>. Use only when a deal has genuinely collapsed or a dispute was resolved in the supplier's favour.</span>
              </div>

              {frozenLoading ? (
                <div className="py-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#e2e8f0] border-t-[#d97706] rounded-full animate-spin" />
                </div>
              ) : frozenOrders.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#94a3b8]">No frozen orders found.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {frozenOrders.map(order => (
                    <div key={order.orderId} className="border border-[#eef2f6] rounded-[10px] p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#0f172a] bg-[#f1f5f9] px-2 py-0.5 rounded-full">{order.orderNumber}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#0284c7]">{order.status}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#0f172a] m-0 mt-1.5 flex items-center gap-1.5">
                          <Package size={13} className="text-[#94a3b8]" /> {order.itemName || 'Order'}
                        </p>
                        <p className="text-xs text-[#94a3b8] m-0 mt-0.5">
                          Buyer: {order.buyerName} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide m-0">Frozen</p>
                        <p className="text-base font-extrabold text-[#d97706] m-0">₹{fmt(order.frozenAmount)}</p>
                        <button
                          onClick={() => { setConfirmUnfreeze({ orderId: order.orderId, amount: order.frozenAmount }); setUnfreezeReason(''); }}
                          className="mt-1.5 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#059669] rounded-[6px] hover:bg-[#047857] border-none cursor-pointer"
                        >
                          <Unlock size={12} /> Release
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Unfreeze Modal ──────────────────────────────────────── */}
      {confirmUnfreeze && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
          onClick={e => { if (e.target === e.currentTarget && !unfreezing) setConfirmUnfreeze(null); }}
        >
          <div className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-[#ecfdf5] flex items-center justify-center mb-4">
                <Unlock size={22} className="text-[#059669]" />
              </div>
              <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Release ₹{fmt(confirmUnfreeze.amount)}?</h3>
              <p className="text-sm text-[#64748b] m-0 mb-4">
                This returns ₹{fmt(confirmUnfreeze.amount)} to the supplier's available balance and cancels the order. This cannot be undone.
              </p>
              <label className="text-xs font-bold text-[#475569] block mb-1.5">Reason (recorded in audit log)</label>
              <textarea
                value={unfreezeReason}
                onChange={e => setUnfreezeReason(e.target.value)}
                placeholder="e.g. Deal cancelled mutually, dispute resolved in supplier's favour…"
                rows={3}
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-[#0284c7] resize-none"
              />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setConfirmUnfreeze(null)}
                  disabled={unfreezing}
                  className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={doUnfreeze}
                  disabled={unfreezing}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50"
                >
                  {unfreezing ? 'Releasing…' : 'Confirm Release'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEarnings;
