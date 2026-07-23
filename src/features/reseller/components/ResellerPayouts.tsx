import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, IndianRupee, Landmark, X, Snowflake, TrendingUp } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';

interface WalletTx {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  bankDetails?: { accountName?: string; accountNumber?: string; bankName?: string };
  requestedAt?: string;
  createdAt: string;
}

const CREDIT_TYPES = ['topup', 'credit', 'commission_credit', 'unfreeze', 'refund'];

const txMeta = (tx: WalletTx) => {
  const isCredit = CREDIT_TYPES.includes(tx.type);
  return {
    sign: isCredit ? '+' : '−',
    cls: isCredit ? 'text-green-600' : 'text-red-500',
    icon: isCredit ? <ArrowDownToLine size={15} /> : <ArrowUpFromLine size={15} />,
    iconCls: isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
  };
};

const wdStatusCls: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  processed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const ResellerPayouts: React.FC = () => {
  const { profile } = useAppSelector(state => state.reseller);
  const [wallet, setWallet] = useState<any>(null);
  const [minWithdrawal, setMinWithdrawal] = useState(0);
  const [minBalance, setMinBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'withdrawals'>('ledger');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasBank = Boolean(profile?.accountNumber && profile?.ifscCode);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes, wdRes] = await Promise.all([
        resellerService.getWallet(),
        resellerService.getWalletTransactions(1, 50),
        resellerService.getWithdrawals(),
      ]);
      setWallet(walletRes.wallet);
      setMinWithdrawal(walletRes.minimumWithdrawalAmount || 0);
      setMinBalance(walletRes.minimumWalletBalance || 0);
      setTransactions(txRes.transactions || []);
      setWithdrawals(wdRes.withdrawals || []);
    } catch (err) { console.error('Failed to load wallet data', err); }
    finally { setLoading(false); }
  };

  const submitWithdrawal = async () => {
    setError('');
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    if (!hasBank) { setError('Add your bank details in Settings before requesting a withdrawal.'); return; }

    setSubmitting(true);
    try {
      await resellerService.requestWithdrawal(amt, {
        accountName: profile?.accountName || profile?.fullName || 'Account Holder',
        accountNumber: profile!.accountNumber!,
        ifscCode: profile!.ifscCode!,
        bankName: profile?.bankName || '',
      });
      setShowWithdrawModal(false);
      setAmount('');
      setSuccess('Withdrawal request submitted! Our team will process it shortly.');
      setTimeout(() => setSuccess(''), 5000);
      await loadAll();
      setActiveTab('withdrawals');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit withdrawal request');
    } finally { setSubmitting(false); }
  };

  const available = wallet?.availableBalance ?? 0;
  const frozen = wallet?.frozenBalance ?? 0;
  const totalEarned = wallet?.totalEarned ?? 0;
  const maxWithdrawable = Math.max(0, available - minBalance);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Earnings & Payouts</h2>
          <p className="text-sm text-[#64748b] m-0">Track your commission balance and withdraw to your bank account.</p>
        </div>
        <Button onClick={() => { setError(''); setShowWithdrawModal(true); }} disabled={loading || maxWithdrawable <= 0} className="flex items-center gap-2">
          <Landmark size={16} /> Request Withdrawal
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg px-4 py-3">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <div className="bg-gradient-to-br from-primary to-[#c2410c] text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3 opacity-90"><Wallet size={18} /><span className="text-xs font-bold uppercase tracking-wider">Available Balance</span></div>
          <p className="text-3xl font-extrabold m-0 mb-1">₹{available.toLocaleString('en-IN')}</p>
          <span className="text-xs opacity-80">Withdrawable: ₹{maxWithdrawable.toLocaleString('en-IN')}{minBalance > 0 ? ` (min balance ₹${minBalance} held)` : ''}</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-[#0369a1]"><Snowflake size={18} /><span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending / On Hold</span></div>
          <p className="text-3xl font-extrabold text-gray-900 m-0 mb-1">₹{frozen.toLocaleString('en-IN')}</p>
          <span className="text-xs text-gray-500">Released after order completion</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-[#15803d]"><TrendingUp size={18} /><span className="text-xs font-bold uppercase tracking-wider text-gray-500">Lifetime Earnings</span></div>
          <p className="text-3xl font-extrabold text-gray-900 m-0 mb-1">₹{totalEarned.toLocaleString('en-IN')}</p>
          <span className="text-xs text-gray-500">Total commission earned to date</span>
        </div>
      </div>

      {/* Bank info strip */}
      <div className={`flex items-center justify-between rounded-xl border px-5 py-4 ${hasBank ? 'bg-white border-gray-100' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasBank ? 'bg-[#f0f9ff] text-[#0369a1]' : 'bg-amber-100 text-amber-700'}`}>
            <Landmark size={18} />
          </div>
          {hasBank ? (
            <div>
              <p className="text-sm font-bold text-gray-900 m-0">{profile?.bankName || 'Registered Bank'} •••• {profile?.accountNumber?.slice(-4)}</p>
              <span className="text-xs text-gray-500">{profile?.accountName || profile?.fullName} — payouts go to this account</span>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-amber-800 m-0">No bank account on file</p>
              <span className="text-xs text-amber-700">Add your bank details in Settings to enable withdrawals</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100">
          {([['ledger', 'Transaction History'], ['withdrawals', 'Withdrawal Requests']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-4 text-sm font-bold border-none cursor-pointer transition-colors ${activeTab === id ? 'text-primary bg-[#fff7ed] border-b-2 border-primary' : 'text-gray-500 bg-transparent hover:text-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'ledger' ? (
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500 text-sm">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="px-6 py-14 text-center text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <IndianRupee size={32} className="text-gray-300" />
                  <p className="font-semibold text-gray-700 m-0">No transactions yet</p>
                  <p className="text-xs m-0">Commission credits and payouts will appear here.</p>
                </div>
              </div>
            ) : (
              transactions.map(tx => {
                const meta = txMeta(tx);
                return (
                  <div key={tx._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.iconCls}`}>{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 m-0 truncate">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {tx.status !== 'completed' && <span className="ml-2 capitalize text-amber-600 font-semibold">• {tx.status}</span>}
                      </span>
                    </div>
                    <span className={`text-sm font-extrabold whitespace-nowrap ${meta.cls}`}>{meta.sign}₹{tx.amount?.toLocaleString('en-IN')}</span>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Bank Account</th>
                  <th className="px-6 py-4">Requested</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Landmark size={32} className="text-gray-300" />
                        <p className="font-semibold text-gray-700 m-0">No withdrawal requests yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(wd => (
                    <tr key={wd._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-gray-900">₹{wd.amount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {wd.bankDetails?.bankName || 'Bank'} •••• {wd.bankDetails?.accountNumber?.slice(-4) || '----'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(wd.requestedAt || wd.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${wdStatusCls[wd.status] || wdStatusCls.pending}`}>
                          {wd.status === 'processed' ? <CheckCircle2 size={12} /> : wd.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                          {wd.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowWithdrawModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 m-0">Request Withdrawal</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border-none bg-transparent cursor-pointer" onClick={() => setShowWithdrawModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-3 text-xs text-gray-600">
                Withdrawable balance: <strong className="text-gray-900">₹{maxWithdrawable.toLocaleString('en-IN')}</strong>
                {minWithdrawal > 0 && <> · Minimum: <strong className="text-gray-900">₹{minWithdrawal.toLocaleString('en-IN')}</strong></>}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Payout Account</label>
                {hasBank ? (
                  <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                    <Landmark size={16} className="text-[#0369a1] shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-gray-900 m-0">{profile?.bankName || 'Bank'} •••• {profile?.accountNumber?.slice(-4)}</p>
                      <span className="text-gray-500">{profile?.accountName || profile?.fullName} · {profile?.ifscCode}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-3">
                    No bank details found. Please add your bank account in Settings first.
                  </div>
                )}
              </div>

              {error && <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</div>}

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={submitWithdrawal} disabled={submitting || !hasBank} className="flex-1">
                  {submitting ? 'Submitting...' : 'Confirm Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerPayouts;
