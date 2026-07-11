import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Filter, ArrowLeft, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import adminService from '../services/admin.service';
import { useSocket } from '@/shared/contexts/SocketContext';
import { useDebounce } from '@/shared/hooks/useDebounce';

const INITIAL_LIMIT = 10;
const LOAD_STEP = 20;

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-[#fffbeb] text-[#d97706]',
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
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const debouncedAmount = useDebounce(amountFilter, 400);
  const [actionState, setActionState] = useState<'approve' | 'reject' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const requestId = searchParams.get('id');

  // Reset to the first page whenever a filter changes.
  useEffect(() => { setLimit(INITIAL_LIMIT); }, [statusFilter, dateFilter, debouncedAmount]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'withdrawals', statusFilter, dateFilter, debouncedAmount, limit],
    queryFn: () => adminService.getWithdrawals({
      status: statusFilter || undefined,
      date: dateFilter || undefined,
      amount: debouncedAmount || undefined,
      limit,
    }),
    placeholderData: (prev) => prev, // keep current rows visible while loading more
  });
  const withdrawals = data?.withdrawals ?? [];
  const total = data?.total ?? 0;

  // Refresh the list in real time when a new withdrawal request arrives.
  useEffect(() => {
    if (!socket) return;
    const handler = (n: any) => {
      if (n?.link?.includes('tab=withdrawals') || n?.title?.toLowerCase().includes('withdrawal')) {
        qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      }
    };
    socket.on('bell_notification', handler);
    return () => { socket.off('bell_notification', handler); };
  }, [socket, qc]);

  const selectedWithdrawal = withdrawals.find((w: any) => w._id === requestId) || null;

  const closeDetails = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('id');
    setSearchParams(params);
    setActionState(null);
    setTransactionId('');
    setAdminNote('');
  };

  const openRequest = (w: any) => {
    const params = new URLSearchParams(searchParams);
    params.set('id', w._id);
    setSearchParams(params);
  };

  const mutation = useMutation({
    mutationFn: (variables: { id: string; action: 'approve' | 'reject'; adminNote?: string; transactionId?: string }) =>
      adminService.processWithdrawal(variables.id, variables.action, variables.adminNote, variables.transactionId),
    onSuccess: (_, variables) => {
      const labels = { approve: 'Approved & completed', reject: 'Rejected' };
      toast.success(`${labels[variables.action]} successfully`);
      closeDetails();
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Action failed'),
  });

  if (requestId && selectedWithdrawal) {
    return (
      <div className="bg-white rounded-[12px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 max-w-[650px] animate-fade-in">
        {/* Back Button */}
        <button
          onClick={closeDetails}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-6 border-none bg-transparent cursor-pointer p-0 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Requests
        </button>

        <div className="flex flex-col gap-6 text-slate-700">
          {/* Header Info */}
          <div className="flex justify-between items-start pb-5 border-b border-[#f1f5f9] flex-wrap gap-4">
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-1">Supplier</span>
              <h3 className="font-bold text-[#0f172a] text-lg m-0">{selectedWithdrawal.businessName}</h3>
              {selectedWithdrawal.userId?.name && selectedWithdrawal.userId.name !== selectedWithdrawal.businessName && (
                <span className="block text-xs font-semibold text-[#475569] mt-0.5">Contact: {selectedWithdrawal.userId.name}</span>
              )}
              <span className="block text-sm text-[#64748b] mt-0.5">{selectedWithdrawal.userId?.email}</span>
              {selectedWithdrawal.userId?.phone && (
                <span className="block text-sm text-[#64748b]">{selectedWithdrawal.userId.phone}</span>
              )}
            </div>
            <div className="text-right max-sm:text-left">
              <span className="block text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-1">Amount Requested</span>
              <span className="text-2xl font-extrabold text-[#0f172a]">₹{selectedWithdrawal.amount.toFixed(2)}</span>
              <div className="mt-1 flex max-sm:justify-start justify-end">{statusBadge(selectedWithdrawal.status)}</div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <span className="block text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider mb-2.5">Supplier's Bank Details</span>
            <div className="bg-[#f8fafc] border border-[#eef2f6] p-5 rounded-[8px] flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm border-b border-[#f1f5f9] pb-2.5">
                <span className="text-[#64748b] font-medium">Bank Name:</span>
                <span className="font-semibold text-[#334155]">{selectedWithdrawal.bankDetails?.bankName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[#f1f5f9] pb-2.5">
                <span className="text-[#64748b] font-medium">Account Holder:</span>
                <span className="font-semibold text-[#334155]">{selectedWithdrawal.bankDetails?.accountName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[#f1f5f9] pb-2.5">
                <span className="text-[#64748b] font-medium">Account Number:</span>
                <span className="font-bold text-[#0f172a] tracking-wider font-mono">{selectedWithdrawal.bankDetails?.accountNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748b] font-medium">IFSC Code:</span>
                <span className="font-bold text-[#0f172a] font-mono">{selectedWithdrawal.bankDetails?.ifscCode || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-4 text-xs text-[#64748b] bg-[#f8fafc] border border-[#eef2f6] p-4 rounded-[8px]">
            <div>
              <span className="block text-[9px] font-extrabold uppercase text-[#94a3b8] mb-0.5">Requested On</span>
              <strong>{new Date(selectedWithdrawal.requestedAt).toLocaleString()}</strong>
            </div>
            {selectedWithdrawal.processedAt && (
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-[#94a3b8] mb-0.5">Processed On</span>
                <strong>{new Date(selectedWithdrawal.processedAt).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {/* Processing Info */}
          {(selectedWithdrawal.transactionId || selectedWithdrawal.adminNote) && (
            <div className="bg-[#f0f9ff] border border-[#e0f2fe] p-5 rounded-[8px] flex flex-col gap-2.5">
              <span className="block text-[10px] font-extrabold uppercase text-[#0369a1] tracking-wider">Processing Details</span>
              {selectedWithdrawal.transactionId && (
                <div className="text-sm">
                  <span className="text-[#0369a1] font-semibold">Transaction ID: </span>
                  <strong className="text-[#0f172a] font-mono">{selectedWithdrawal.transactionId}</strong>
                </div>
              )}
              {selectedWithdrawal.adminNote && (
                <div className="text-sm">
                  <span className="text-[#0369a1] font-semibold">{selectedWithdrawal.status === 'rejected' ? 'Rejection reason: ' : 'Admin Note: '}</span>
                  <span className="text-[#334155] italic">"{selectedWithdrawal.adminNote}"</span>
                </div>
              )}
            </div>
          )}

          {/* Action Forms */}
          {actionState ? (
            <div className="border-t border-[#f1f5f9] pt-5 flex flex-col gap-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex justify-between items-center">
                <span>
                  Action: {actionState === 'approve' ? (
                    <span className="text-[#059669]">Approve &amp; Complete Withdrawal</span>
                  ) : (
                    <span className="text-[#dc2626]">Reject Withdrawal</span>
                  )}
                </span>
                <button
                  onClick={() => { setActionState(null); setTransactionId(''); setAdminNote(''); }}
                  className="text-xs text-primary font-bold cursor-pointer hover:underline border-none bg-transparent"
                >
                  Cancel Action
                </button>
              </div>

              {actionState === 'approve' && (
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#475569] tracking-wider mb-2">
                    Transaction ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="Enter bank transaction reference / UTR ID..."
                    className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary font-mono mb-2 bg-white"
                    required
                  />
                  <p className="text-[11px] text-[#64748b]">
                    Enter the bank transfer reference / UTR. This confirms the payout and marks the withdrawal as <strong>completed</strong> in one step.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#475569] tracking-wider mb-2">
                  Admin Note {actionState === 'reject' ? '' : '(Optional)'}
                </label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder={actionState === 'reject' ? "Please explain why this request is being rejected..." : "Add any details or payment notes..."}
                  rows={2}
                  className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none bg-white"
                />
              </div>

              <div className="flex gap-3 mt-1">
                <Button variant="outline" onClick={() => { setActionState(null); setTransactionId(''); setAdminNote(''); }} className="flex-1" disabled={mutation.isPending}>
                  Back
                </Button>
                <Button
                  onClick={() => mutation.mutate({
                    id: selectedWithdrawal._id,
                    action: actionState,
                    adminNote: adminNote || undefined,
                    transactionId: actionState === 'approve' ? transactionId : undefined
                  })}
                  disabled={mutation.isPending || (actionState === 'approve' && !transactionId.trim())}
                  className={`flex-1 ${
                    actionState === 'reject' ? '!bg-[#dc2626] hover:!bg-[#b91c1c]' :
                    actionState === 'approve' ? '!bg-[#059669] hover:!bg-[#047857]' : ''
                  }`}
                >
                  {mutation.isPending ? 'Processing…' : 'Confirm'}
                </Button>
              </div>
            </div>
          ) : (
            selectedWithdrawal.status === 'pending' && (
              <div className="border-t border-[#f1f5f9] pt-5 flex gap-3">
                <button
                  onClick={() => setActionState('approve')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-[#059669] px-4 py-2.5 rounded-[8px] cursor-pointer hover:bg-[#047857] transition-colors border-none"
                >
                  <CheckCircle size={16} /> Approve &amp; Complete
                </button>
                <button
                  onClick={() => setActionState('reject')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-[#dc2626] px-4 py-2.5 rounded-[8px] cursor-pointer hover:bg-[#b91c1c] transition-colors border-none"
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap animate-fade-in">
        <Filter size={16} className="text-[#64748b]" />
        <span className="text-sm font-semibold text-[#475569]">Filter:</span>
        {['', 'pending', 'completed', 'rejected'].map(s => (
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

      {/* Search by date & amount */}
      <div className="flex items-center gap-3 mb-5 flex-wrap animate-fade-in">
        <Search size={16} className="text-[#64748b]" />
        <span className="text-sm font-semibold text-[#475569]">Search:</span>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="text-sm text-[#334155] border border-[#e2e8f0] rounded-[8px] px-3 py-1.5 outline-none focus:border-primary bg-white"
          aria-label="Filter by requested date"
        />
        <input
          type="number"
          value={amountFilter}
          onChange={e => setAmountFilter(e.target.value)}
          placeholder="Amount ₹"
          className="text-sm text-[#334155] border border-[#e2e8f0] rounded-[8px] px-3 py-1.5 outline-none focus:border-primary bg-white w-32"
          aria-label="Filter by amount"
        />
        {(dateFilter || amountFilter) && (
          <button
            onClick={() => { setDateFilter(''); setAmountFilter(''); }}
            className="flex items-center gap-1 text-xs font-semibold text-[#64748b] hover:text-[#dc2626] border-none bg-transparent cursor-pointer"
          >
            <X size={14} /> Clear
          </button>
        )}
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
                  {['Supplier', 'Amount', 'Bank Details', 'Status', 'Requested', 'Actions'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w: any) => (
                  <tr key={w._id} className="hover:bg-[#fafbfc]">
                    <td className={tdCls + " font-semibold text-[#0f172a]"}>
                      {w.businessName}
                      {w.userId?.name && w.userId.name !== w.businessName && (
                        <div className="text-xs text-[#475569] font-medium">{w.userId.name}</div>
                      )}
                      <div className="text-xs text-[#94a3b8] font-normal">{w.userId?.email}</div>
                    </td>
                    <td className={tdCls + " font-bold"}>₹{w.amount.toFixed(2)}</td>
                    <td className={tdCls}>
                      <div className="font-medium text-[#334155]">{w.bankDetails?.bankName}</div>
                      <div className="text-xs text-[#64748b] font-mono">{w.bankDetails?.accountNumber}</div>
                    </td>
                    <td className={tdCls}>{statusBadge(w.status)}</td>
                    <td className={tdCls + " text-xs text-[#94a3b8]"}>
                      {new Date(w.requestedAt).toLocaleDateString()}
                    </td>
                    <td className={tdCls}>
                      <button
                        onClick={() => openRequest(w)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#dbeafe] px-3 py-1.5 rounded-[6px] cursor-pointer hover:bg-[#dbeafe] transition-all"
                      >
                        Open Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load more (older) entries */}
      {withdrawals.length < total && (
        <div className="flex flex-col items-center gap-1.5 mt-5">
          <button
            onClick={() => setLimit(l => l + LOAD_STEP)}
            disabled={isFetching}
            className="text-sm font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#dbeafe] px-5 py-2.5 rounded-[8px] cursor-pointer hover:bg-[#dbeafe] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFetching ? 'Loading…' : 'Load previous transaction data'}
          </button>
          <span className="text-xs text-[#94a3b8]">Showing {withdrawals.length} of {total}</span>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
