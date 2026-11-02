import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleDollarSign, Receipt, Info, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import Pagination from '@/shared/components/ui/Pagination';
import {
  Card, SectionHeader, Badge, FilterTabs, TableWrap, TH, TD, InlineEmpty,
} from './partner.ui';
import { shortDate } from './partner.format';
import partnerService, { type PartnerCommissionItem } from '../services/partner.service';

type LedgerFilter = '' | 'pending' | 'cleared' | 'reversed';

const ATTRIBUTION_LABEL: Record<string, string> = {
  buyer_referred: 'Buyer referred',
  supplier_referred: 'Seller referred',
  both: 'Both sides',
};

const PAGE_SIZE = 20;

const PartnerCommissions: React.FC<{
  commissionSharePercent?: number;
  sellerCommissionPercent?: number;
  buyerCommissionPercent?: number;
}> = ({
  sellerCommissionPercent = 15,
  buyerCommissionPercent = 10,
}) => {
  const [filter, setFilter] = useState<LedgerFilter>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['partner', 'commissions', filter, page],
    queryFn: () =>
      partnerService.getCommissions({
        page,
        limit: PAGE_SIZE,
        ...(filter ? { status: filter } : {}),
      }),
  });

  const commissions: PartnerCommissionItem[] = data?.commissions || [];
  const summary = data?.summary;
  const total = data?.pagination?.total || 0;

  const changeFilter = (next: LedgerFilter) => {
    setFilter(next);
    setPage(1);
  };

  const exportCsv = () => {
    if (!commissions.length) {
      toast.error('Nothing to export');
      return;
    }
    const header = ['Order', 'Date', 'Order value', 'Platform fee', 'Share %', 'Your earning', 'Attribution', 'Status', 'Cleared on'];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = commissions.map((c) =>
      [
        c.orderNumber, shortDate(c.createdAt), c.orderSubtotal, c.amjPlatformFee,
        c.partnerSharePercent, c.earnedAmount, c.attributionType, c.status,
        c.clearedAt ? shortDate(c.clearedAt) : '',
      ].map(escape).join(',')
    );
    const blob = new Blob([[header.map(escape).join(','), ...body].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amjstar-commissions-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Commission ledger"
        subtitle={`Every deal closed by your network, with your commission (${sellerCommissionPercent}% Seller referral, ${buyerCommissionPercent}% Buyer referral, ${Math.round((sellerCommissionPercent + buyerCommissionPercent) * 100) / 100}% if both) carved from AMJ Star's platform fee line by line.`}
        icon={CircleDollarSign}
        actions={
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-[11px] font-extrabold uppercase tracking-wider cursor-pointer hover:border-[#cbd5e1] transition-colors"
          >
            <Download size={13} />
            Export page
          </button>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-4 border-l-[3px] border-l-[#f59e0b]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Pending clearance</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{formatCurrency(summary?.pending || 0)}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">{summary?.pendingCount || 0} deals in escrow</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#059669]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Cleared</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{formatCurrency(summary?.cleared || 0)}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">{summary?.clearedCount || 0} deals settled</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#b91c1c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Reversed</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{formatCurrency(summary?.reversed || 0)}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">{summary?.reversedCount || 0} cancelled deals</p>
        </Card>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0]">
        <Info size={15} className="text-[#64748b] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#475569] space-y-1.5 leading-relaxed">
          <p className="m-0">
            <span className="font-bold">Commission Allocation Rules:</span> When a purchase order is generated, AMJ Star allocates commission based on referrals:
            <span className="font-bold"> {sellerCommissionPercent}%</span> if you referred the Seller,
            <span className="font-bold"> {buyerCommissionPercent}%</span> if you referred the Buyer, or
            <span className="font-bold"> {sellerCommissionPercent + buyerCommissionPercent}%</span> if both parties on the order were referred by you. If only one party was referred by you and the other party joined organically without referral, you earn your full referral cut for your introduced customer.
          </p>
          <p className="m-0">
            <span className="font-bold">Commission Lifecycle:</span> Your share is initially recorded as <span className="font-bold">pending</span> (held in escrow). It transitions to <span className="font-bold">cleared</span> — and ready for bank payout — once the buyer confirms delivery. If an order is cancelled or unwound during a dispute, the pending commission is <span className="font-bold">reversed</span>. Cleared commission is never reversed.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between gap-3 flex-wrap">
          <FilterTabs<LedgerFilter>
            value={filter}
            onChange={changeFilter}
            options={[
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending', count: summary?.pendingCount },
              { value: 'cleared', label: 'Cleared', count: summary?.clearedCount },
              { value: 'reversed', label: 'Reversed', count: summary?.reversedCount },
            ]}
          />
          <span className="text-[11px] text-[#64748b] font-semibold">{total} entries</span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-[#64748b]">Loading your ledger…</div>
        ) : commissions.length === 0 ? (
          <InlineEmpty
            icon={Receipt}
            title={filter ? `No ${filter} commission` : 'No commission entries yet'}
            description={
              filter
                ? 'Try a different filter to see your other entries.'
                : 'Commission is recorded the moment a deal between your referred accounts generates a purchase order.'
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th className={TH}>Order</th>
                  <th className={TH}>Date</th>
                  <th className={TH}>Order value</th>
                  <th className={TH}>AMJ platform fee</th>
                  <th className={TH}>Your share</th>
                  <th className={TH}>Attribution</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((item) => (
                  <tr key={item._id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className={`${TD} font-bold text-[#0f172a]`}>{item.orderNumber}</td>
                    <td className={TD}>{shortDate(item.createdAt)}</td>
                    <td className={TD}>{formatCurrency(item.orderSubtotal)}</td>
                    <td className={TD}>{formatCurrency(item.amjPlatformFee)}</td>
                    <td className={TD}>
                      <span className="font-extrabold text-[#0f172a]">{formatCurrency(item.earnedAmount)}</span>
                      <span className="block text-[10px] text-[#94a3b8] font-semibold">
                        {item.partnerSharePercent}% of platform fee
                      </span>
                    </td>
                    <td className={TD}>
                      <Badge tone={item.attributionType === 'both' ? 'brand' : 'neutral'}>
                        {ATTRIBUTION_LABEL[item.attributionType] || item.attributionType}
                      </Badge>
                    </td>
                    <td className={TD}>
                      <Badge
                        tone={
                          item.status === 'cleared' ? 'success' : item.status === 'reversed' ? 'danger' : 'warning'
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.status === 'cleared' && item.clearedAt && (
                        <span className="block text-[10px] text-[#94a3b8] mt-1">{shortDate(item.clearedAt)}</span>
                      )}
                      {item.status === 'reversed' && item.reversedReason && (
                        <span className="block text-[10px] text-[#b91c1c] mt-1 max-w-[180px] leading-snug">
                          {item.reversedReason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <div className="p-4">
              <Pagination
                totalItems={total}
                itemsPerPage={PAGE_SIZE}
                currentPage={page}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PartnerCommissions;
