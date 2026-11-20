import React, { useState } from 'react';
import {
  Wallet, Users, Store, TrendingUp, Clock, ArrowUpRight, ShieldAlert,
  LifeBuoy, HandCoins, Share2, Receipt, Banknote, CircleDollarSign,
  Calculator, ChevronDown, ShoppingBag, Handshake,
} from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import {
  Card, SectionHeader, StatCard, Badge, TableWrap, TH, TD, InlineEmpty,
} from './partner.ui';
import { shortDate, formatPartnerMoney } from './partner.format';
import type { PartnerDashboardData } from '../services/partner.service';
import { isPartnerPending } from '../services/partner.service';
import { PartnerBenchmarkTable } from './PartnerBenchmarkTable';

const ATTRIBUTION_LABEL: Record<string, string> = {
  buyer_referred: 'Buyer',
  supplier_referred: 'Seller',
  both: 'Both sides',
};

const PartnerOverview: React.FC<{
  data?: PartnerDashboardData;
  onNavigate: (tab: string) => void;
}> = ({ data, onNavigate }) => {
  const partner = data?.partner;
  const wallet = data?.wallet;
  const metrics = data?.metrics;
  const counts = data?.counts;
  const recent = data?.recentCommissions || [];

  const [showBenchmark, setShowBenchmark] = useState(false);
  const pending = isPartnerPending(partner?.status);
  const totalCustomers = (metrics?.totalBuyersOnboarded || 0) + (metrics?.totalSuppliersOnboarded || 0);
  const withdrawable = wallet?.withdrawableBalance || 0;
  const minPayout = 100;
  const payoutProgress = Math.min(100, Math.round((withdrawable / minPayout) * 100));

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={`Welcome back, ${partner?.fullName?.split(' ')[0] || 'Partner'}`}
        subtitle="Earn continuous commission on every deal completed across your network of manufacturers and bulk buyers. All earnings credit directly into your wallet."
        icon={TrendingUp}
        actions={
          <button
            onClick={() => onNavigate('share')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#1e293b] transition-colors"
          >
            <Share2 size={14} />
            Share your links
          </button>
        }
      />

      {/* ── Partner Revenue Streams Card ── */}
      <Card className="p-5 border-[#e2e8f0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-[4px]">
                Commission Model
              </span>
              <span className="text-sm font-extrabold text-[#0f172a]">Three Lifetime Revenue Channels</span>
            </div>
            <p className="text-xs text-[#64748b] m-0 mt-1">
              Your network generates recurring wholesale commission on every transacted order, credited straight into your wallet.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setShowBenchmark((prev) => !prev)}
              className="text-[11px] font-bold text-slate-800 bg-white border border-slate-300 px-3 py-1.5 rounded-[8px] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Calculator size={14} className="text-slate-600" />
              {showBenchmark ? 'Close Benchmarks' : 'Payout Benchmarks'}
              <ChevronDown
                size={13}
                className={`text-slate-500 transition-transform duration-200 ${showBenchmark ? 'rotate-180' : ''}`}
              />
            </button>
            <button
              onClick={() => onNavigate('commissions')}
              className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-transparent px-3 py-1.5 rounded-[8px] cursor-pointer transition-colors"
            >
              Ledger →
            </button>
          </div>
        </div>

        {/* 3 Revenue Stream Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 rounded-[10px] bg-slate-50/80 border border-slate-200/70 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-amber-100/80 border border-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Store size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Channel 1</div>
              <h4 className="text-xs font-extrabold text-[#0f172a] m-0 mt-0.5">Supplier Wholesale Sales</h4>
              <p className="text-[11px] text-[#64748b] m-0 mt-1 leading-relaxed">
                Earn ongoing commission on every wholesale shipment fulfilled by manufacturers and mills you refer.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-[10px] bg-slate-50/80 border border-slate-200/70 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-blue-100/80 border border-blue-200/80 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShoppingBag size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Channel 2</div>
              <h4 className="text-xs font-extrabold text-[#0f172a] m-0 mt-0.5">Buyer Procurement Orders</h4>
              <p className="text-[11px] text-[#64748b] m-0 mt-1 leading-relaxed">
                Earn on initial orders and repeat inventory restocks placed by retailers and bulk buyers in your network.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-[10px] bg-indigo-50/40 border border-indigo-200/70 flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-indigo-100/90 border border-indigo-200 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
              <Handshake size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Channel 3 · Top Tier</div>
              <h4 className="text-xs font-extrabold text-[#0f172a] m-0 mt-0.5">Matched Network Trades</h4>
              <p className="text-[11px] text-[#64748b] m-0 mt-1 leading-relaxed">
                Receive maximum dual-sided payout when a buyer you referred purchases from a seller you referred.
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Benchmark Guide */}
        {showBenchmark && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <PartnerBenchmarkTable
              embedded
              sellerRate={partner?.sellerCommissionPercent}
              buyerRate={partner?.buyerCommissionPercent}
            />
          </div>
        )}
      </Card>

      {/* ── Money ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Withdrawable now"
          value={formatPartnerMoney(withdrawable)}
          hint={pending ? 'Unlocks after approval' : 'Cleared and ready to withdraw'}
          icon={Wallet}
          tone="success"
          onClick={() => onNavigate('wallet')}
        />
        <StatCard
          label="Pending clearance"
          value={formatPartnerMoney(wallet?.pendingBalance || 0)}
          hint="Clears when the buyer confirms delivery"
          icon={Clock}
          tone="warning"
          onClick={() => onNavigate('commissions')}
        />
        <StatCard
          label="Payout in transit"
          value={formatPartnerMoney(wallet?.inFlightPayouts || 0)}
          hint="Requested — awaiting admin transfer"
          icon={Banknote}
          tone="info"
          onClick={() => onNavigate('wallet')}
        />
        <StatCard
          label="Lifetime earned"
          value={formatPartnerMoney(metrics?.lifetimeCommissionEarned || 0)}
          hint={`Across ${metrics?.totalOrdersReferred || 0} settled deals`}
          icon={CircleDollarSign}
          tone="brand"
          onClick={() => onNavigate('commissions')}
        />
      </div>

      {/* ── Network ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total customers"
          value={totalCustomers}
          hint="Everyone who joined through you"
          icon={Users}
          tone="info"
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          label="Sellers onboarded"
          value={metrics?.totalSuppliersOnboarded || 0}
          hint="Manufacturers and wholesalers"
          icon={Store}
          tone="neutral"
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          label="Buyers onboarded"
          value={metrics?.totalBuyersOnboarded || 0}
          hint="Retailers and bulk buyers"
          icon={Users}
          tone="neutral"
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          label="Total network deals"
          value={counts?.totalReferredOrders || metrics?.totalOrdersReferred || 0}
          hint="Orders transacted across your network"
          icon={Receipt}
          tone="neutral"
          onClick={() => onNavigate('orders')}
        />
      </div>

      {/* ── Things that need the partner's attention ── */}
      {!!(counts?.openDisputes || counts?.openIssues || counts?.pendingConcessions) && (
        <Card className="p-5">
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-1">Needs your attention</h3>
          <p className="text-xs text-[#64748b] m-0 mb-4 leading-relaxed">
            Your customers are the relationship you own. Chasing these keeps your deals closing — and
            your commission clearing.
          </p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <button
              onClick={() => onNavigate('disputes')}
              className="flex items-center gap-3 p-3 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] text-left cursor-pointer hover:border-[#fca5a5] transition-colors"
            >
              <ShieldAlert size={18} className="text-[#b91c1c] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#991b1b] m-0">{counts?.openDisputes || 0} open disputes</p>
                <p className="text-[11px] text-[#b91c1c] m-0">On your customers' orders</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('support')}
              className="flex items-center gap-3 p-3 rounded-[10px] border border-[#fde68a] bg-[#fffbeb] text-left cursor-pointer hover:border-[#fcd34d] transition-colors"
            >
              <LifeBuoy size={18} className="text-[#b45309] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#92400e] m-0">{counts?.openIssues || 0} open issues</p>
                <p className="text-[11px] text-[#b45309] m-0">Support tickets from your network</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('concessions')}
              className="flex items-center gap-3 p-3 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] text-left cursor-pointer hover:border-[#93c5fd] transition-colors"
            >
              <HandCoins size={18} className="text-[#1d4ed8] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#1e40af] m-0">
                  {counts?.pendingConcessions || 0} concessions pending
                </p>
                <p className="text-[11px] text-[#1d4ed8] m-0">Awaiting an admin decision</p>
              </div>
            </button>
          </div>
        </Card>
      )}

      {/* ── Payout readiness ── */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Payout readiness</h3>
            <p className="text-xs text-[#64748b] m-0 mt-1 leading-relaxed">
              Minimum withdrawal is {formatCurrency(minPayout)}. TDS is deducted at 5% under Section
              194H when a valid PAN is on file, or 20% without one.
            </p>
          </div>
          <button
            onClick={() => onNavigate('wallet')}
            disabled={pending || withdrawable < minPayout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#059669] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#047857] transition-colors"
          >
            <ArrowUpRight size={14} />
            Withdraw
          </button>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#059669] transition-[width] duration-500"
            style={{ width: `${payoutProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
          <span className="text-[11px] text-[#64748b]">
            {formatCurrency(withdrawable)} of {formatCurrency(minPayout)} minimum
          </span>
          {!partner?.panNumber && (
            <Badge tone="warning">Add PAN to pay 5% TDS instead of 20%</Badge>
          )}
          {!partner?.bankDetails?.accountNumber && !partner?.bankDetails?.upiId && (
            <Badge tone="danger">Bank details required</Badge>
          )}
        </div>
      </Card>

      {/* ── Recent commission activity ── */}
      <Card>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Recent commission activity</h3>
            <p className="text-xs text-[#64748b] m-0 mt-1">Your last 10 attributed deals</p>
          </div>
          <button
            onClick={() => onNavigate('commissions')}
            className="text-[11px] font-extrabold uppercase tracking-wider text-[#0f172a] bg-transparent border-none cursor-pointer hover:underline"
          >
            View all
          </button>
        </div>

        {recent.length === 0 ? (
          <InlineEmpty
            icon={Receipt}
            title="No commission yet"
            description="Once a buyer or seller you referred closes their first deal, your share of the platform fee shows up here."
            action={
              <button
                onClick={() => onNavigate('share')}
                className="px-4 py-2 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#1e293b]"
              >
                Get your referral links
              </button>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={TH}>Order</th>
                <th className={TH}>Date</th>
                <th className={TH}>Attribution</th>
                <th className={TH}>Deal Size</th>
                <th className={TH}>Your share</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((item) => (
                <tr key={item._id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className={`${TD} font-bold text-[#0f172a]`}>{item.orderNumber}</td>
                  <td className={TD}>{shortDate(item.createdAt)}</td>
                  <td className={TD}>
                    <Badge tone={item.attributionType === 'both' ? 'brand' : 'neutral'}>
                      {ATTRIBUTION_LABEL[item.attributionType] || item.attributionType}
                    </Badge>
                  </td>
                  <td className={TD}>
                    <Badge tone="neutral">{item.dealBracket || '< ₹5,000'}</Badge>
                  </td>
                  <td className={`${TD} font-extrabold text-[#0f172a]`}>
                    {formatCurrency(item.earnedAmount)}
                  </td>
                  <td className={TD}>
                    <Badge
                      tone={
                        item.status === 'cleared' ? 'success' : item.status === 'reversed' ? 'danger' : 'warning'
                      }
                    >
                      {item.status}
                    </Badge>
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

export default PartnerOverview;
