import React, { useMemo, useState } from 'react';
import { Users, Search, Store, ShoppingBag, LifeBuoy, Phone, Mail, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import {
  Card, SectionHeader, Badge, FilterTabs, TableWrap, TH, TD, InlineEmpty, inputCls, type Tone,
} from './partner.ui';
import { shortDate } from './partner.format';
import type { PartnerReferrals } from '../services/partner.service';

type CustomerKind = 'buyer' | 'seller';
type Filter = 'all' | 'buyers' | 'sellers';

interface CustomerRow {
  id: string;
  /** User id — what the support-issue endpoint expects. */
  userId?: string;
  kind: CustomerKind;
  name: string;
  roleLabel: string;
  phone?: string;
  email?: string;
  statusText: string;
  statusTone: Tone;
  tier?: string;
  orders: number;
  volume: number;
  createdAt: string;
}

/** Turns a supplier KYC/onboarding state into something a partner can act on. */
function supplierStatus(kyc?: string, onboarding?: string): { text: string; tone: Tone } {
  const k = (kyc || '').toUpperCase();
  if (k === 'VERIFIED' || k === 'APPROVED') return { text: 'KYC verified', tone: 'success' };
  if (k === 'REJECTED') return { text: 'KYC rejected', tone: 'danger' };
  if (onboarding && onboarding.toUpperCase() !== 'COMPLETED') return { text: 'Onboarding', tone: 'warning' };
  return { text: k ? `KYC ${k.toLowerCase()}` : 'KYC pending', tone: 'warning' };
}

const PartnerCustomers: React.FC<{
  referrals?: PartnerReferrals;
  isLoading?: boolean;
  onRaiseIssue: (customer: { userId: string; name: string }) => void;
}> = ({ referrals, isLoading, onRaiseIssue }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const rows = useMemo<CustomerRow[]>(() => {
    const buyers = (referrals?.buyers || []).map((b) => ({
      id: b._id,
      userId: b._id,
      kind: 'buyer' as const,
      name: b.name || 'Buyer',
      roleLabel: b.role === 'reseller' ? 'Reseller' : 'Bulk buyer / retailer',
      phone: b.phone,
      email: b.email,
      statusText: b.isActive === false ? 'Inactive' : 'Active',
      statusTone: (b.isActive === false ? 'neutral' : 'success') as Tone,
      orders: b.orders || 0,
      volume: b.volume || 0,
      createdAt: b.createdAt,
    }));

    const sellers = (referrals?.suppliers || []).map((s) => {
      const status = supplierStatus(s.kycStatus, s.onboardingStatus);
      return {
        id: s._id,
        ...(s.userId ? { userId: s.userId } : {}),
        kind: 'seller' as const,
        name: s.businessName || 'Seller store',
        roleLabel: 'Manufacturer / wholesaler',
        phone: s.phone,
        email: s.email,
        statusText: status.text,
        statusTone: status.tone,
        ...(s.tier ? { tier: s.tier } : {}),
        orders: s.orders || 0,
        volume: s.volume || 0,
        createdAt: s.createdAt,
      };
    });

    return [...buyers, ...sellers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [referrals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesKind =
        filter === 'all' ||
        (filter === 'buyers' && row.kind === 'buyer') ||
        (filter === 'sellers' && row.kind === 'seller');
      if (!matchesKind) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        (row.phone || '').toLowerCase().includes(q) ||
        (row.email || '').toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  const totals = useMemo(
    () => ({
      volume: filtered.reduce((sum, r) => sum + r.volume, 0),
      orders: filtered.reduce((sum, r) => sum + r.orders, 0),
      transacting: filtered.filter((r) => r.orders > 0).length,
    }),
    [filtered]
  );

  /** Exports exactly what is on screen, so filters carry into the file. */
  const exportCsv = () => {
    if (!filtered.length) {
      toast.error('Nothing to export');
      return;
    }
    const header = ['Name', 'Type', 'Role', 'Phone', 'Email', 'Status', 'Orders', 'Volume (INR)', 'Joined'];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = filtered.map((r) =>
      [r.name, r.kind === 'seller' ? 'Seller' : 'Buyer', r.roleLabel, r.phone, r.email, r.statusText, r.orders, r.volume, shortDate(r.createdAt)]
        .map(escape)
        .join(',')
    );
    const blob = new Blob([[header.map(escape).join(','), ...body].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amjstar-my-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} customers`);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="My customers"
        subtitle="Everyone who joined AMJ Star through your referral link or code. Attribution is permanent — you earn on their deals for as long as they trade."
        icon={Users}
        actions={
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-[11px] font-extrabold uppercase tracking-wider cursor-pointer hover:border-[#cbd5e1] transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Showing</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{filtered.length}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">
            {referrals?.totalSuppliers || 0} sellers · {referrals?.totalBuyers || 0} buyers in total
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Actively trading</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{totals.transacting}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">{totals.orders} orders between them</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Volume transacted</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{formatCurrency(totals.volume)}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">Order value across your network</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 flex items-center gap-3 flex-wrap border-b border-[#f1f5f9]">
          <FilterTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: rows.length },
              { value: 'sellers', label: 'Sellers', count: referrals?.totalSuppliers || 0 },
              { value: 'buyers', label: 'Buyers', count: referrals?.totalBuyers || 0 },
            ]}
          />
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or email…"
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-[#64748b]">Loading your customers…</div>
        ) : filtered.length === 0 ? (
          <InlineEmpty
            icon={Users}
            title={rows.length === 0 ? 'No customers yet' : 'No matches'}
            description={
              rows.length === 0
                ? 'Share your referral links with manufacturers and bulk buyers. Everyone who signs up through them appears here immediately.'
                : 'Try a different search term or clear the filter.'
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={TH}>Customer</th>
                <th className={TH}>Type</th>
                <th className={TH}>Contact</th>
                <th className={TH}>Status</th>
                <th className={TH}>Orders</th>
                <th className={TH}>Volume</th>
                <th className={TH}>Joined</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="hover:bg-[#f8fafc] transition-colors">
                  <td className={TD}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center ${
                          row.kind === 'seller'
                            ? 'bg-[#fff7ed] text-[#c2410c]'
                            : 'bg-[#eff6ff] text-[#1d4ed8]'
                        }`}
                      >
                        {row.kind === 'seller' ? <Store size={15} /> : <ShoppingBag size={15} />}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#0f172a] m-0 truncate max-w-[180px]">{row.name}</p>
                        <p className="text-[10px] text-[#94a3b8] m-0">{row.roleLabel}</p>
                      </div>
                    </div>
                  </td>
                  <td className={TD}>
                    <Badge tone={row.kind === 'seller' ? 'brand' : 'info'}>
                      {row.kind === 'seller' ? 'Seller' : 'Buyer'}
                    </Badge>
                    {row.tier && (
                      <span className="block text-[10px] text-[#94a3b8] mt-1 font-semibold">{row.tier}</span>
                    )}
                  </td>
                  <td className={TD}>
                    <div className="flex flex-col gap-0.5">
                      {row.phone ? (
                        <a
                          href={`tel:${row.phone}`}
                          className="inline-flex items-center gap-1 text-[#334155] hover:text-[#0f172a] no-underline"
                        >
                          <Phone size={11} className="text-[#94a3b8]" />
                          {row.phone}
                        </a>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                      {row.email && (
                        <a
                          href={`mailto:${row.email}`}
                          className="inline-flex items-center gap-1 text-[10px] text-[#64748b] hover:text-[#0f172a] no-underline truncate max-w-[160px]"
                        >
                          <Mail size={10} className="text-[#94a3b8] shrink-0" />
                          {row.email}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className={TD}>
                    <Badge tone={row.statusTone}>{row.statusText}</Badge>
                  </td>
                  <td className={`${TD} font-bold text-[#0f172a]`}>{row.orders}</td>
                  <td className={`${TD} font-bold text-[#0f172a]`}>
                    {row.volume > 0 ? formatCurrency(row.volume) : '—'}
                  </td>
                  <td className={TD}>{shortDate(row.createdAt)}</td>
                  <td className={TD}>
                    <button
                      onClick={() =>
                        row.userId
                          ? onRaiseIssue({ userId: row.userId, name: row.name })
                          : toast.error('This customer has no linked login yet')
                      }
                      title="Raise a support issue for this customer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-[#e2e8f0] bg-white text-[#475569] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer hover:border-[#cbd5e1] hover:text-[#0f172a] transition-colors whitespace-nowrap shadow-xs"
                    >
                      <LifeBuoy size={11} />
                      Raise Issue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};

export default PartnerCustomers;
