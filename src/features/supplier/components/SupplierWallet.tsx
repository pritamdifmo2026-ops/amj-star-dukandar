import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import walletApi from '../services/wallet.api';

const cardCls = "bg-white rounded-[10px] border border-[#eef2f6] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]";

const txTypeLabel: Record<string, string> = {
  topup: 'Top-up',
  freeze: 'Commission Frozen',
  release_to_amj: 'Commission Released',
  withdrawal_request: 'Withdrawal Requested',
  withdrawal_complete: 'Withdrawal Processed',
};

const txIcon: Record<string, React.ReactNode> = {
  topup: <ArrowUpCircle size={18} className="text-[#059669]" />,
  freeze: <Clock size={18} className="text-[#d97706]" />,
  release_to_amj: <CheckCircle size={18} className="text-[#dc2626]" />,
  withdrawal_request: <ArrowDownCircle size={18} className="text-[#7c3aed]" />,
  withdrawal_complete: <CheckCircle size={18} className="text-[#7c3aed]" />,
};

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const SupplierWallet: React.FC = () => {
  const qc = useQueryClient();
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', ifscCode: '', bankName: '' });
  const [txPage, setTxPage] = useState(1);

  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.getWallet,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['wallet', 'transactions', txPage],
    queryFn: () => walletApi.getTransactions(txPage, 15),
  });

  const { data: withdrawalData } = useQuery({
    queryKey: ['wallet', 'withdrawals'],
    queryFn: walletApi.getWithdrawals,
  });

  const topupMutation = useMutation({
    mutationFn: async (amount: number) => {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Payment gateway failed to load. Check your connection.');

      const order = await walletApi.createTopupOrder(amount);

      return new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'AMJStar Wallet',
          description: 'Wallet Top-up',
          order_id: order.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await walletApi.verifyTopup({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount,
              });
              resolve();
            } catch (err: any) {
              reject(new Error(err?.response?.data?.message || 'Payment verification failed'));
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          theme: { color: '#e65c00' },
        });
        rzp.open();
      });
    },
    onSuccess: () => {
      toast.success('Wallet topped up successfully!');
      setShowTopupModal(false);
      setTopupAmount('');
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: any) => {
      if (err.message !== 'Payment cancelled') toast.error(err.message || 'Top-up failed');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => walletApi.requestWithdrawal(Number(withdrawAmount), bankDetails),
    onSuccess: () => {
      toast.success('Withdrawal request submitted!');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankDetails({ accountName: '', accountNumber: '', ifscCode: '', bankName: '' });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Withdrawal failed'),
  });

  const wallet = walletData?.wallet;
  const commissionRate = walletData?.commissionRate;
  const minBalance = walletData?.minimumWalletBalance ?? 500;
  const minWithdrawal = walletData?.minimumWithdrawalAmount ?? 100;
  const maxWithdrawable = wallet ? Math.max(0, (wallet.availableBalance - minBalance)) : 0;

  const hasPendingWithdrawal = withdrawalData?.withdrawals?.some((w: any) => w.status === 'pending');

  if (walletLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${cardCls} h-28 animate-pulse bg-[#f8fafc]`} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-[#0f172a] tracking-tight">AMJStar Wallet</h1>
          <p className="text-[#64748b] text-[0.95rem] mt-1">Manage your commission balance and payouts</p>
        </div>
        <button onClick={() => refetchWallet()} className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {commissionRate == null && (
        <div className="flex items-start gap-3 p-4 bg-[#fffbeb] border border-[#fcd34d] rounded-[10px] text-[#92400e]">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Commission rate not configured</p>
            <p className="text-sm mt-0.5">Contact AMJStar to set your commission rate. Until then, PO generation is paused.</p>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div className={`${cardCls} bg-gradient-to-br from-[#e65c00] to-[#f97316] text-white border-transparent`}>
          <div className="flex items-center gap-2 mb-3 opacity-90 text-sm font-semibold">
            <Wallet size={16} /> Available Balance
          </div>
          <div className="text-3xl font-extrabold">₹{wallet?.availableBalance?.toFixed(2) ?? '0.00'}</div>
          <div className="text-xs mt-2 opacity-75">Min. maintain: ₹{minBalance}</div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3 text-[#d97706] text-sm font-semibold">
            <Clock size={16} /> Frozen (Commission)
          </div>
          <div className="text-2xl font-extrabold text-[#1e293b]">₹{wallet?.frozenBalance?.toFixed(2) ?? '0.00'}</div>
          <div className="text-xs text-[#94a3b8] mt-2">Held until delivery confirmed</div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3 text-[#059669] text-sm font-semibold">
            <CheckCircle size={16} /> Total Earned
          </div>
          <div className="text-2xl font-extrabold text-[#1e293b]">₹{wallet?.totalEarned?.toFixed(2) ?? '0.00'}</div>
          <div className="text-xs text-[#94a3b8] mt-2">Lifetime earnings</div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3 text-[#7c3aed] text-sm font-semibold">
            <ArrowDownCircle size={16} /> Total Commission Paid
          </div>
          <div className="text-2xl font-extrabold text-[#1e293b]">₹{wallet?.totalCommissionPaid?.toFixed(2) ?? '0.00'}</div>
          <div className="text-xs text-[#94a3b8] mt-2">
            {commissionRate != null ? `Rate: ${commissionRate}%` : 'Rate: Not set'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => setShowTopupModal(true)} className="flex items-center gap-2">
          <Plus size={16} /> Top Up Wallet
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowWithdrawModal(true)}
          disabled={maxWithdrawable <= 0 || hasPendingWithdrawal}
          className="flex items-center gap-2"
        >
          <ArrowDownCircle size={16} />
          {hasPendingWithdrawal ? 'Withdrawal Pending' : 'Request Withdrawal'}
        </Button>
      </div>

      {/* Transaction History */}
      <div className={cardCls}>
        <h2 className="text-base font-bold text-[#0f172a] mb-4">Transaction History</h2>
        {txLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-[8px] bg-[#f8fafc] animate-pulse" />)}
          </div>
        ) : txData?.transactions?.length === 0 ? (
          <p className="text-[#94a3b8] text-sm text-center py-8">No transactions yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {txData?.transactions?.map((tx: any) => (
              <div key={tx._id} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-[#f8fafc] transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                  {txIcon[tx.type] ?? <Wallet size={18} className="text-[#64748b]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#1e293b] truncate">{txTypeLabel[tx.type] ?? tx.type}</div>
                  <div className="text-xs text-[#94a3b8] truncate">{tx.description}</div>
                </div>
                <div className={`text-sm font-bold shrink-0 ${tx.type === 'topup' ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
                  {tx.type === 'topup' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </div>
                <div className="text-xs text-[#94a3b8] shrink-0">{new Date(tx.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
            {txData?.totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-[#f1f5f9]">
                <Button variant="outline" onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} className="!text-sm !py-1.5">Prev</Button>
                <span className="text-sm text-[#64748b] self-center">Page {txPage} of {txData.totalPages}</span>
                <Button variant="outline" onClick={() => setTxPage(p => p + 1)} disabled={txPage >= txData.totalPages} className="!text-sm !py-1.5">Next</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      {withdrawalData?.withdrawals?.length > 0 && (
        <div className={cardCls}>
          <h2 className="text-base font-bold text-[#0f172a] mb-4">Withdrawal Requests</h2>
          <div className="flex flex-col gap-2">
            {withdrawalData.withdrawals.map((w: any) => (
              <div key={w._id} className="flex items-center gap-3 p-3 rounded-[8px] bg-[#f8fafc]">
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1e293b]">₹{w.amount.toFixed(2)}</div>
                  <div className="text-xs text-[#64748b]">{w.bankDetails?.bankName} • {w.bankDetails?.accountNumber?.slice(-4).padStart(w.bankDetails.accountNumber.length, '•')}</div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                  w.status === 'completed' ? 'bg-[#ecfdf5] text-[#059669]' :
                  w.status === 'approved' ? 'bg-[#eff6ff] text-[#1d4ed8]' :
                  w.status === 'rejected' ? 'bg-[#fef2f2] text-[#dc2626]' :
                  'bg-[#fffbeb] text-[#d97706]'
                }`}>
                  {w.status.toUpperCase()}
                </div>
                <div className="text-xs text-[#94a3b8]">{new Date(w.requestedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top-up Modal */}
      <Modal isOpen={showTopupModal} onClose={() => setShowTopupModal(false)} title="Top Up Wallet">
        <div className="flex flex-col gap-4 p-1">
          <p className="text-sm text-[#64748b]">Add funds to your AMJStar wallet to cover commissions on POs.</p>
          <div>
            <label className="block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2">Amount (₹)</label>
            <input
              type="text"
              inputMode="numeric"
              value={topupAmount}
              onChange={e => setTopupAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 1000"
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-[#e65c00] transition-colors"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setShowTopupModal(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => topupMutation.mutate(Number(topupAmount))}
              disabled={!topupAmount || Number(topupAmount) <= 0 || topupMutation.isPending}
              className="flex-1"
            >
              {topupMutation.isPending ? 'Processing…' : 'Proceed to Pay'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Request Withdrawal">
        <div className="flex flex-col gap-4 p-1">
          <div className="p-3 bg-[#f8fafc] rounded-[8px] text-sm text-[#475569]">
            Max withdrawable: <strong>₹{maxWithdrawable.toFixed(2)}</strong> (must keep ₹{minBalance} min. balance)
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2">Amount (₹)</label>
            <input
              type="text"
              inputMode="numeric"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value.replace(/\D/g, ''))}
              placeholder={`Min ₹${minWithdrawal}`}
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-[#e65c00] transition-colors"
            />
          </div>
          {(['accountName', 'accountNumber', 'ifscCode', 'bankName'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2">
                {field === 'accountName' ? 'Account Holder Name' : field === 'accountNumber' ? 'Account Number' : field === 'ifscCode' ? 'IFSC Code' : 'Bank Name'}
              </label>
              <input
                type="text"
                value={bankDetails[field]}
                onChange={e => setBankDetails(p => ({ ...p, [field]: e.target.value }))}
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-[#e65c00] transition-colors"
              />
            </div>
          ))}
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => withdrawMutation.mutate()}
              disabled={
                !withdrawAmount || Number(withdrawAmount) < minWithdrawal ||
                Number(withdrawAmount) > maxWithdrawable ||
                !bankDetails.accountName || !bankDetails.accountNumber ||
                !bankDetails.ifscCode || !bankDetails.bankName ||
                withdrawMutation.isPending
              }
              className="flex-1"
            >
              {withdrawMutation.isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierWallet;
