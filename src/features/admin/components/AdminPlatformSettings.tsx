import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Phone, Tag, Pencil, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import adminService from '../services/admin.service';

const cardCls = "bg-white rounded-[10px] border border-[#eef2f6] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex-1 min-w-[320px] max-w-[480px]";
const labelCls = "block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2";
const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

const PLAN_DEFAULTS = { VERIFIED: 2100, GAMMA: 21000, BETA: 51000 };
const PLAN_LABELS: Record<string, string> = {
  VERIFIED: 'Verified Supplier',
  GAMMA: 'SME TrustSEAL Gamma',
  BETA: 'SME TrustSEAL Beta',
};
const GST_RATE = 18;

const AdminPlatformSettings: React.FC = () => {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'platformSettings'],
    queryFn: adminService.getPlatformSettings,
  });

  const [form, setForm] = useState({ minimumWalletBalance: '', minimumWithdrawalAmount: '', contactPhone: '' });
  const [phoneError, setPhoneError] = useState('');

  const [planForm, setPlanForm] = useState({ VERIFIED: '2100', GAMMA: '21000', BETA: '51000' });
  const [planEditing, setPlanEditing] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        minimumWalletBalance: String(settings.minimumWalletBalance),
        minimumWithdrawalAmount: String(settings.minimumWithdrawalAmount),
        contactPhone: settings.contactPhone || '',
      });
      setPlanForm({
        VERIFIED: String(settings.planPrices?.VERIFIED ?? PLAN_DEFAULTS.VERIFIED),
        GAMMA: String(settings.planPrices?.GAMMA ?? PLAN_DEFAULTS.GAMMA),
        BETA: String(settings.planPrices?.BETA ?? PLAN_DEFAULTS.BETA),
      });
    }
  }, [settings]);

  const validatePhone = (val: string) => {
    if (val === '') return '';
    if (!/^\d{10}$/.test(val)) return '10 digits required';
    if (!/^[6-9]/.test(val)) return 'Must start with 6, 7, 8, or 9';
    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm(p => ({ ...p, contactPhone: digits }));
    setPhoneError(validatePhone(digits));
  };

  const handleSave = () => {
    const err = validatePhone(form.contactPhone);
    if (err) { setPhoneError(err); return; }
    mutation.mutate();
  };

  const mutation = useMutation({
    mutationFn: () => adminService.updatePlatformSettings({
      minimumWalletBalance: Number(form.minimumWalletBalance),
      minimumWithdrawalAmount: Number(form.minimumWithdrawalAmount),
      contactPhone: form.contactPhone,
    }),
    onSuccess: () => {
      toast.success('Platform settings saved');
      qc.invalidateQueries({ queryKey: ['admin', 'platformSettings'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const planMutation = useMutation({
    mutationFn: () => adminService.updatePlatformSettings({
      planPrices: {
        VERIFIED: Number(planForm.VERIFIED),
        GAMMA: Number(planForm.GAMMA),
        BETA: Number(planForm.BETA),
      },
    }),
    onSuccess: () => {
      toast.success('Plan prices updated');
      setPlanEditing(false);
      qc.invalidateQueries({ queryKey: ['admin', 'platformSettings'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save plan prices'),
  });

  const planKeys = ['VERIFIED', 'GAMMA', 'BETA'] as const;

  if (isLoading) return <div className="py-16 text-center text-sm text-[#64748b]">Loading settings…</div>;

  return (
    <div className="flex gap-6 items-start flex-wrap">
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#f1f5f9]">
          <Settings size={20} className="text-primary" />
          <h2 className="text-base font-extrabold text-[#0f172a] m-0">Wallet & Commission Rules</h2>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className={labelCls}>Minimum Wallet Balance (₹)</label>
            <input
              type="number"
              min={0}
              value={form.minimumWalletBalance}
              onChange={e => setForm(p => ({ ...p, minimumWalletBalance: e.target.value }))}
              className={inputCls}
            />
            <p className="text-xs text-[#94a3b8] mt-1.5">Suppliers must maintain at least this balance at all times (buffer above frozen commission)</p>
          </div>

          <div>
            <label className={labelCls}>Minimum Withdrawal Amount (₹)</label>
            <input
              type="number"
              min={0}
              value={form.minimumWithdrawalAmount}
              onChange={e => setForm(p => ({ ...p, minimumWithdrawalAmount: e.target.value }))}
              className={inputCls}
            />
            <p className="text-xs text-[#94a3b8] mt-1.5">Suppliers cannot request withdrawals below this amount</p>
          </div>

          <div>
            <label className={labelCls}>AMJSTAR Contact Phone</label>
            <div className={`flex items-center gap-0 border rounded-[8px] overflow-hidden transition-colors ${phoneError ? 'border-[#dc2626]' : 'border-[#e2e8f0] focus-within:border-primary'}`}>
              <span className="flex items-center gap-1.5 px-3 py-2.5 bg-[#f1f5f9] border-r border-[#e2e8f0] text-sm font-bold text-[#475569] shrink-0 select-none">
                <Phone size={13} /> +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.contactPhone}
                onChange={handlePhoneChange}
                placeholder="98765 43210"
                className="flex-1 border-none outline-none text-sm text-[#1e293b] bg-transparent px-3 py-2.5"
              />
              {form.contactPhone.length === 10 && !phoneError && (
                <span className="pr-3 text-[#059669] text-xs font-bold shrink-0">✓</span>
              )}
            </div>
            {phoneError
              ? <p className="text-xs text-[#dc2626] mt-1.5 font-medium">{phoneError}</p>
              : <p className="text-xs text-[#94a3b8] mt-1.5">10-digit Indian mobile number. Shown to suppliers as "Call AMJSTAR".</p>
            }
          </div>

          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex items-center gap-2 w-fit"
          >
            <Save size={16} />
            {mutation.isPending ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Subscription Plan Prices */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-primary" />
            <h2 className="text-base font-extrabold text-[#0f172a] m-0">Subscription Plan Prices</h2>
          </div>
          {!planEditing && (
            <button
              onClick={() => setPlanEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary rounded-[7px] bg-white hover:bg-primary hover:text-white transition-colors cursor-pointer"
            >
              <Pencil size={12} /> Edit Prices
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {planKeys.map(key => {
            const base = planEditing ? Number(planForm[key]) || 0 : (settings?.planPrices?.[key] ?? PLAN_DEFAULTS[key]);
            const gst = Math.round((base * GST_RATE) / 100);
            const total = base + gst;
            return (
              <div key={key} className="border border-[#eef2f6] rounded-[10px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-extrabold text-[#0f172a]">{PLAN_LABELS[key]}</span>
                  <span className="text-[10px] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-[4px]">{key}</span>
                </div>
                {planEditing ? (
                  <div className="mb-3">
                    <label className={labelCls}>Base Price (₹, excl. GST)</label>
                    <input
                      type="number"
                      min={1}
                      value={planForm[key]}
                      onChange={e => setPlanForm(p => ({ ...p, [key]: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                ) : null}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#f8fafc] rounded-[8px] p-2">
                    <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wide m-0">Base</p>
                    <p className="text-sm font-extrabold text-[#0f172a] m-0">₹{base.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[8px] p-2">
                    <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wide m-0">GST 18%</p>
                    <p className="text-sm font-bold text-[#64748b] m-0">₹{gst.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-[#eff6ff] rounded-[8px] p-2">
                    <p className="text-[10px] text-[#3b82f6] font-bold uppercase tracking-wide m-0">Total</p>
                    <p className="text-sm font-extrabold text-[#1d4ed8] m-0">₹{total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {planEditing && (
          <div className="mt-5 flex flex-col gap-3">
            <p className="text-xs text-[#f59e0b] bg-[#fffbeb] border border-[#fde68a] rounded-[7px] px-3 py-2 m-0">
              Price changes apply to new subscriptions and renewals only. Active subscriptions are unaffected.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => planMutation.mutate()}
                disabled={planMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save size={15} />
                {planMutation.isPending ? 'Saving…' : 'Save Plan Prices'}
              </Button>
              <button
                onClick={() => {
                  setPlanEditing(false);
                  if (settings) {
                    setPlanForm({
                      VERIFIED: String(settings.planPrices?.VERIFIED ?? PLAN_DEFAULTS.VERIFIED),
                      GAMMA: String(settings.planPrices?.GAMMA ?? PLAN_DEFAULTS.GAMMA),
                      BETA: String(settings.planPrices?.BETA ?? PLAN_DEFAULTS.BETA),
                    });
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#64748b] border border-[#e2e8f0] rounded-[8px] bg-white hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlatformSettings;
