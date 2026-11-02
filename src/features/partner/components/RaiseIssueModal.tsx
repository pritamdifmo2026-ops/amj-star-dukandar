import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import { FieldLabel, inputCls } from './partner.ui';
import partnerService from '../services/partner.service';

export interface RaiseIssueTarget {
  /** Omit to file the issue against the partner's own account. */
  userId?: string;
  name?: string;
}

const ISSUE_TYPES = [
  'Order Problem',
  'Payment / Wallet Issue',
  'KYC / Verification',
  'Product Listing / Catalogue',
  'Account Login / Access',
  'Partner Commission / Escalation',
  'Other',
];

/**
 * Lets a partner raise an issue on behalf of a customer they referred (or about their
 * own account). The ticket lands in AMJ Star's support queue tagged with the partner's code.
 */
const RaiseIssueModal: React.FC<{
  onClose: () => void;
  target?: RaiseIssueTarget;
}> = ({ onClose, target }) => {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(target?.userId || '');

  const [form, setForm] = useState({
    subject: '',
    message: '',
    issueType: ISSUE_TYPES[0] as string,
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
  });

  const { data: referrals, isLoading: loadingReferrals } = useQuery({
    queryKey: ['partner', 'referrals'],
    queryFn: () => partnerService.getReferrals(),
    enabled: !target?.userId,
  });

  // If there's only 1 customer or when referrals load, keep track of selected customer
  const selectedCustomer = useMemo(() => {
    if (target?.userId) {
      return { id: target.userId, name: target.name || 'Customer', type: 'Customer' };
    }
    if (!selectedCustomerId || selectedCustomerId === 'partner_account') return null;
    const buyer = referrals?.buyers?.find((b) => b._id === selectedCustomerId);
    if (buyer) return { id: buyer._id, name: buyer.name || buyer.email || 'Referred Buyer', type: 'Buyer' };
    const supplier = referrals?.suppliers?.find((s) => (s.userId || s._id) === selectedCustomerId);
    if (supplier) {
      return {
        id: supplier.userId || supplier._id,
        name: supplier.businessName || supplier.email || 'Referred Supplier',
        type: 'Seller',
      };
    }
    return null;
  }, [target, selectedCustomerId, referrals]);

  const mutation = useMutation({
    mutationFn: () => {
      const effectiveUserId =
        target?.userId ||
        (selectedCustomerId && selectedCustomerId !== 'partner_account' ? selectedCustomerId : undefined);

      return partnerService.raiseSupportIssue({
        ...(effectiveUserId ? { customerUserId: effectiveUserId } : {}),
        subject: form.subject.trim(),
        message: form.message.trim(),
        issueType: form.issueType,
        priority: form.priority,
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Support ticket submitted');
      queryClient.invalidateQueries({ queryKey: ['partner', 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['partner', 'dashboard'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not submit support ticket';
      toast.error(msg);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target?.userId && !selectedCustomerId) {
      toast.error('Please select who has this issue (a customer or your account)');
      return;
    }
    if (!form.subject.trim()) {
      toast.error('Add a short subject');
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error('Describe the problem in a little more detail');
      return;
    }
    mutation.mutate();
  };

  const modalTitle = target?.name
    ? `Raise an Issue for ${target.name}`
    : selectedCustomer
    ? `Raise an Issue for ${selectedCustomer.name}`
    : 'Raise an Issue';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={modalTitle}
      widthClass="w-[92%] max-w-[540px]"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Context badge / Customer Selector */}
        {target?.userId ? (
          <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] block">Raising Issue For</span>
              <span className="text-xs font-bold text-[#0f172a]">{target.name || 'Referred Customer'}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1]">
              Referred Customer
            </span>
          </div>
        ) : (
          <div>
            <FieldLabel>Who has this issue?</FieldLabel>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className={inputCls}
              disabled={loadingReferrals}
            >
              <option value="">-- Select customer or account --</option>
              {referrals?.buyers && referrals.buyers.length > 0 && (
                <optgroup label="Referred Buyers">
                  {referrals.buyers.map((b) => (
                    <option key={b._id} value={b._id}>
                      Buyer: {b.name || 'Unnamed'} {b.phone ? `(${b.phone})` : b.email ? `(${b.email})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {referrals?.suppliers && referrals.suppliers.length > 0 && (
                <optgroup label="Referred Suppliers / Sellers">
                  {referrals.suppliers.map((s) => (
                    <option key={s.userId || s._id} value={s.userId || s._id}>
                      Seller: {s.businessName || 'Unnamed'} {s.phone ? `(${s.phone})` : s.email ? `(${s.email})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Partner Account">
                <option value="partner_account">
                  My Partner Account (Commission, Payout or Platform Issue)
                </option>
              </optgroup>
            </select>
          </div>
        )}

        <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-xs leading-relaxed">
          {selectedCustomer ? (
            <p className="m-0 text-[#1e40af]">
              <strong>Raising for {selectedCustomer.name}:</strong> This ticket will be assigned directly under their account in the AMJ Star admin queue, tagged with your Partner Code for fast resolution.
            </p>
          ) : selectedCustomerId === 'partner_account' ? (
            <p className="m-0 text-[#334155]">
              <strong>Partner Account:</strong> This ticket will be submitted to AMJ Star Support regarding your Wholesale Partner account.
            </p>
          ) : (
            <p className="m-0 text-[#64748b]">
              Select whether you are reporting a problem for one of your referred customers or for your own partner account.
            </p>
          )}
        </div>

        <div>
          <FieldLabel>Subject</FieldLabel>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputCls}
            placeholder={
              selectedCustomer
                ? "e.g. Buyer's payment deducted but order pending"
                : "e.g. Question about commission rate or payout"
            }
            maxLength={120}
            autoFocus
          />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <FieldLabel>Category</FieldLabel>
            <select
              value={form.issueType}
              onChange={(e) => setForm({ ...form, issueType: e.target.value })}
              className={inputCls}
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Priority</FieldLabel>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as 'Low' | 'Medium' | 'High' })}
              className={inputCls}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium (Standard)</option>
              <option value="High">High (Urgent order/payment stuck)</option>
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>What is going wrong?</FieldLabel>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={`${inputCls} min-h-[120px] resize-y`}
            placeholder="Describe what happened, what was tried, and provide any order IDs or details so AMJ Star support can resolve it immediately."
            maxLength={2000}
          />
          <p className="text-[10px] text-[#94a3b8] m-0 mt-1 text-right">{form.message.length}/2000</p>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-xs font-bold cursor-pointer hover:border-[#cbd5e1]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-5 py-2.5 rounded-[8px] bg-[#0f172a] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none disabled:opacity-60 hover:bg-[#1e293b] shadow-sm"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit Issue'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RaiseIssueModal;
