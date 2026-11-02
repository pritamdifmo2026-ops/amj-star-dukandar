import React from 'react';
import {
  Wallet, Users, Store, TrendingUp, Clock, ArrowUpRight, ShieldAlert,
  LifeBuoy, HandCoins, Share2, Receipt, Banknote, CircleDollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import {
  Card, SectionHeader, StatCard, Badge, TableWrap, TH, TD, InlineEmpty,
} from './partner.ui';
import { shortDate, formatPartnerMoney } from './partner.format';
import type { PartnerDashboardData } from '../services/partner.service';
import { isPartnerPending } from '../services/partner.service';

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

  const pending = isPartnerPending(partner?.status);
  const totalCustomers = (metrics?.totalBuyersOnboarded || 0) + (metrics?.totalSuppliersOnboarded || 0);
  const withdrawable = wallet?.withdrawableBalance || 0;
  const minPayout = 100;
  const payoutProgress = Math.min(100, Math.round((withdrawable / minPayout) * 100));

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={`Welcome back, ${partner?.fullName?.split(' ')[0] || 'Partner'}`}
        subtitle={`You earn ${partner?.sellerCommissionPercent ?? 15}% on sales by your referred Sellers and ${partner?.buyerCommissionPercent ?? 10}% on orders by your referred Buyers (${Math.round(((partner?.sellerCommissionPercent ?? 15) + (partner?.buyerCommissionPercent ?? 10)) * 100) / 100}% if both belong to you) from AMJ Star's platform fee.`}
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

      {/* ── Commission Split Card ── */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-blue-50/50 border-indigo-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                Your Commission Rates
              </span>
              <span className="text-xs font-bold text-slate-800">Carved from AMJ Star's Platform Fee</span>
            </div>
            <p className="text-[11px] text-slate-600 m-0 mt-1">
              • <strong>Referred Seller sale:</strong> {partner?.sellerCommissionPercent ?? 15}% cut &nbsp;|&nbsp;
              • <strong>Referred Buyer purchase:</strong> {partner?.buyerCommissionPercent ?? 10}% cut &nbsp;|&nbsp;
              • <strong>Both referred by you:</strong> {Math.round(((partner?.sellerCommissionPercent ?? 15) + (partner?.buyerCommissionPercent ?? 10)) * 100) / 100}% full cut.
            </p>
          </div>
          <button
            onClick={() => onNavigate('commissions')}
            className="self-start sm:self-auto shrink-0 text-[11px] font-bold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer"
          >
            View commission ledger →
          </button>
        </div>
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
          label="Gross volume referred"
          value={formatPartnerMoney(metrics?.lifetimeGrossVolume || 0)}
          hint={`${counts?.totalReferredOrders || 0} orders involving your network`}
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
                <th className={TH}>Platform fee</th>
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
                  <td className={TD}>{formatCurrency(item.amjPlatformFee)}</td>
                  <td className={`${TD} font-extrabold text-[#0f172a]`}>
                    {formatCurrency(item.earnedAmount)}
                    <span className="text-[10px] text-[#94a3b8] font-semibold ml-1">
                      @{item.partnerSharePercent}%
                    </span>
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
