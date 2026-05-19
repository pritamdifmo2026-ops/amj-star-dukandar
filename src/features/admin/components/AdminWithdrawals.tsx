import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import adminService from '../services/admin.service';

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-[#fffbeb] text-[#d97706]',
    approved: 'bg-[#eff6ff] text-[#1d4ed8]',
    rejected: 'bg-[#fef2f2] text-[#dc2626]',
    completed: 'bg-[#ecfdf5] text-[#059669]',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[status] || 'bg-[#f1f5f9] text-[#475569]'}`}>
      {status.toUpperCase()}
    </span>
  );
};

const AdminWithdrawals: React.FC = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ id: string; action: 'approve' | 'reject' | 'complete'; supplierName: string; amount: number } | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals', statusFilter],
    queryFn: () => adminService.getWithdrawals(statusFilter || undefined),
  });

  const mutation = useMutation({
    mutationFn: () => adminService.processWithdrawal(actionModal!.id, actionModal!.action, adminNote || undefined),
    onSuccess: () => {
      const labels = { approve: 'Approved', reject: 'Rejected', complete: 'Marked complete' };
      toast.success(`${labels[actionModal!.action]} successfully`);
      setActionModal(null);
      setAdminNote('');
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Action failed'),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Filter size={16} className="text-[#64748b]" />
        <span className="text-sm font-semibold text-[#475569]">Filter:</span>
        {['', 'pending', 'approved', 'rejected', 'completed'].map(s => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary hover:text-primary'
            }`}
          >
            {s ? s.toUpperCase() : 'ALL'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-[#64748b]">Loading…</div>
      ) : withdrawals.length === 0 ? (
        <div className="py-16 text-center text-sm text-[#94a3b8]">No withdrawal requests found</div>
      ) : (
        <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Supplier', 'Amount', 'Bank', 'Status', 'Requested', 'Actions'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w._id} className="hover:bg-[#fafbfc]">
                    <td className={tdCls + " font-semibold text-[#0f172a]"}>
                      {w.userId?.name || 'Unknown'}
                      <div className="text-xs text-[#94a3b8] font-normal">{w.userId?.email}</div>
                    </td>
                    <td className={tdCls + " font-bold"}>₹{w.amount.toFixed(2)}</td>
                    <td className={tdCls}>
                      <div>{w.bankDetails?.bankName}</div>
                      <div className="text-xs text-[#94a3b8]">{w.bankDetails?.accountNumber}</div>
                      <div className="text-xs text-[#94a3b8]">IFSC: {w.bankDetails?.ifscCode}</div>
                    </td>
                    <td className={tdCls}>{statusBadge(w.status)}</td>
                    <td className={tdCls + " text-xs text-[#94a3b8]"}>
                      {new Date(w.requestedAt).toLocaleDateString()}
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setActionModal({ id: w._id, action: 'approve', supplierName: w.userId?.name, amount: w.amount })}
                              className="flex items-center gap-1 text-xs font-bold text-[#059669] bg-[#ecfdf5] border border-[#bbf7d0] px-2 py-1 rounded-[6px] cursor-pointer hover:bg-[#d1fae5]"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => setActionModal({ id: w._id, action: 'reject', supplierName: w.userId?.name, amount: w.amount })}
                              className="flex items-center gap-1 text-xs font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-2 py-1 rounded-[6px] cursor-pointer hover:bg-[#fee2e2]"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {w.status === 'approved' && (
                          <button
                            onClick={() => setActionModal({ id: w._id, action: 'complete', supplierName: w.userId?.name, amount: w.amount })}
                            className="flex items-center gap-1 text-xs font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-1 rounded-[6px] cursor-pointer hover:bg-[#dbeafe]"
                          >
                            <Clock size={13} /> Mark Complete
                          </button>
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

      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setAdminNote(''); }}
        title={
          actionModal?.action === 'approve' ? 'Approve Withdrawal' :
          actionModal?.action === 'reject' ? 'Reject Withdrawal' : 'Mark as Completed'
        }
      >
        {actionModal && (
          <div className="flex flex-col gap-4 py-1">
            <div className="p-3 bg-[#f8fafc] rounded-[8px] text-sm">
              <strong>{actionModal.supplierName}</strong> — ₹{actionModal.amount.toFixed(2)}
              {actionModal.action === 'complete' && (
                <p className="text-xs text-[#64748b] mt-1">Confirm that payment has been transferred manually to the supplier's bank account.</p>
              )}
              {actionModal.action === 'reject' && (
                <p className="text-xs text-[#dc2626] mt-1">The amount will be returned to the supplier's wallet.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2">Admin Note (optional)</label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Reason or reference…"
                rows={2}
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setActionModal(null); setAdminNote(''); }} className="flex-1">Cancel</Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className={`flex-1 ${actionModal.action === 'reject' ? '!bg-[#dc2626]' : ''}`}
              >
                {mutation.isPending ? 'Processing…' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminWithdrawals;
