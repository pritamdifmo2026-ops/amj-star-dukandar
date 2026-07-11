import React from 'react';
import Modal from '@/shared/components/ui/Modal';

interface Props {
  tx?: any | null;
  withdrawal?: any | null; // when opened directly from the Withdrawal Requests list
  withdrawals: any[];
  onClose: () => void;
}

const txTypeLabel: Record<string, string> = {
  topup: 'Top-up',
  freeze: 'Commission Frozen',
  release_to_amj: 'Commission Released',
  unfreeze: 'Commission Unfrozen',
  withdrawal_request: 'Withdrawal Requested',
  withdrawal_complete: 'Withdrawal Processed',
  listing_fee: 'Listing Fee',
  listing_renewal: 'Listing Renewal',
};

const statusStyle: Record<string, string> = {
  completed: 'bg-[#ecfdf5] text-[#059669]',
  rejected: 'bg-[#fef2f2] text-[#dc2626]',
  pending: 'bg-[#fffbeb] text-[#d97706]',
  failed: 'bg-[#fef2f2] text-[#dc2626]',
};

function maskAccount(acc?: string): string {
  if (!acc) return '—';
  const last4 = acc.slice(-4);
  return `${'•'.repeat(Math.max(0, acc.length - 4))}${last4}`;
}

function fmtDateTime(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
    <span className="text-[13px] text-[#94a3b8] shrink-0">{label}</span>
    <span className="text-[13px] font-medium text-[#1e293b] text-right break-words">{children}</span>
  </div>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusStyle[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {status.toUpperCase()}
  </span>
);

// Bank + processing details shared by both entry points (transaction row & withdrawal row).
const WithdrawalFields: React.FC<{ w: any }> = ({ w }) => (
  <>
    {w.bankDetails?.bankName && <Row label="Bank">{w.bankDetails.bankName}</Row>}
    {w.bankDetails?.accountNumber && <Row label="Account">{maskAccount(w.bankDetails.accountNumber)}</Row>}
    {w.bankDetails?.ifscCode && <Row label="IFSC">{w.bankDetails.ifscCode}</Row>}
    <Row label="Requested">{fmtDateTime(w.requestedAt)}</Row>
    {w.processedAt && <Row label="Processed">{fmtDateTime(w.processedAt)}</Row>}
    {w.transactionId && <Row label="Transaction ID / UTR">{w.transactionId}</Row>}
    {w.status === 'rejected' && (
      <Row label="Rejection reason">{w.adminNote || 'No reason provided'}</Row>
    )}
    {w.status !== 'rejected' && w.adminNote && <Row label="Admin note">{w.adminNote}</Row>}
  </>
);

/**
 * Type-aware details for a wallet transaction, or a withdrawal request opened
 * directly from the Withdrawal Requests list. Common fields (amount, status,
 * date) appear in both; each adds what's genuinely useful — withdrawal
 * reason/UTR/bank, top-up payment ID, order reference.
 */
const TransactionDetailsModal: React.FC<Props> = ({ tx, withdrawal, withdrawals, onClose }) => {
  if (!tx && !withdrawal) return null;

  // ── Opened from the Withdrawal Requests list ──────────────────────────────
  if (withdrawal) {
    const status = String(withdrawal.status || '').toLowerCase();
    return (
      <Modal isOpen onClose={onClose} title="Withdrawal Request">
        <div className="flex flex-col">
          <Row label="Amount"><span className="text-[#dc2626]">-₹{Number(withdrawal.amount).toFixed(2)}</span></Row>
          {status && <Row label="Status"><StatusPill status={status} /></Row>}
          <WithdrawalFields w={withdrawal} />
        </div>
      </Modal>
    );
  }

  // ── Opened from the Transaction History list ──────────────────────────────
  const isTopup = tx.type === 'topup';
  const isWithdrawal = tx.type === 'withdrawal_request' || tx.type === 'withdrawal_complete';
  const isOrderCommission = ['freeze', 'release_to_amj', 'unfreeze'].includes(tx.type);

  // Match the linked withdrawal request — by explicit link, falling back to
  // amount for older rows created before the link field existed.
  const w = isWithdrawal
    ? (withdrawals.find((x) => x._id === tx.relatedWithdrawalId)
        ?? withdrawals.find((x) => x.amount === tx.amount))
    : null;

  const status = String(w?.status || tx.status || '').toLowerCase();

  return (
    <Modal isOpen onClose={onClose} title={txTypeLabel[tx.type] ?? 'Transaction Details'}>
      <div className="flex flex-col">
        <Row label="Amount">
          <span className={isTopup ? 'text-[#059669]' : 'text-[#dc2626]'}>
            {isTopup ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
          </span>
        </Row>

        {status && <Row label="Status"><StatusPill status={status} /></Row>}

        <Row label="Date">{fmtDateTime(tx.createdAt)}</Row>
        {tx.description && <Row label="Note">{tx.description}</Row>}

        {isTopup && tx.razorpayPaymentId && (
          <Row label="Payment ID">{tx.razorpayPaymentId}</Row>
        )}

        {isWithdrawal && w && <WithdrawalFields w={w} />}

        {isWithdrawal && !w && (
          <p className="text-[12px] text-[#94a3b8] mt-3">Detailed request info isn't available for this entry.</p>
        )}

        {isOrderCommission && tx.relatedOrderId && (
          <Row label="Order reference">#{String(tx.relatedOrderId).slice(-6).toUpperCase()}</Row>
        )}
      </div>
    </Modal>
  );
};

export default TransactionDetailsModal;
