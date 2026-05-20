import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import adminService from '../services/admin.service';

const cardCls = "bg-white rounded-[10px] border border-[#eef2f6] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]";
const labelCls = "block text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-2";
const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

const AdminPlatformSettings: React.FC = () => {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'platformSettings'],
    queryFn: adminService.getPlatformSettings,
  });

  const [form, setForm] = useState({ minimumWalletBalance: '', minimumWithdrawalAmount: '', contactPhone: '' });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        minimumWalletBalance: String(settings.minimumWalletBalance),
        minimumWithdrawalAmount: String(settings.minimumWithdrawalAmount),
        contactPhone: settings.contactPhone || '',
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

  if (isLoading) return <div className="py-16 text-center text-sm text-[#64748b]">Loading settings…</div>;

  return (
    <div className="max-w-lg flex flex-col gap-6">
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
    </div>
  );
};

export default AdminPlatformSettings;
