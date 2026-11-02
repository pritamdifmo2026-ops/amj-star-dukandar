import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Info, ShieldCheck, Phone } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import Pagination from '@/shared/components/ui/Pagination';
import {
  Card, SectionHeader, Badge, FilterTabs, TableWrap, TH, TD, InlineEmpty, type Tone,
} from './partner.ui';
import { shortDate, refName, humanise } from './partner.format';
import partnerService from '../services/partner.service';

type DisputeFilter = '' | 'open' | 'closed';

const PAGE_SIZE = 20;

/** Dispute states, coloured by how worried the partner should be. */
const STATUS_TONE: Record<string, Tone> = {
  open: 'danger',
  validated: 'danger',
  reopened: 'danger',
  supplier_resolved: 'warning',
  exchange: 'warning',
  resolved: 'success',
  rejected: 'neutral',
};

const SIDE_LABEL: Record<string, string> = {
  buyer: 'Your buyer',
  supplier: 'Your seller',
  both: 'Both yours',
};

const PartnerDisputes: React.FC = () => {
  const [filter, setFilter] = useState<DisputeFilter>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['partner', 'disputes', filter, page],
    queryFn: () =>
      partnerService.getDisputes({ page, limit: PAGE_SIZE, ...(filter ? { status: filter } : {}) }),
  });

  const disputes = data?.disputes || [];
  const summary = data?.summary;
  const total = data?.pagination?.total || 0;

  const changeFilter = (next: DisputeFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Disputes in my network"
        subtitle="Quality, quantity and damage claims raised on orders between the buyers and sellers you introduced."
        icon={ShieldAlert}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-4 border-l-[3px] border-l-[#b91c1c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Open</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{summary?.open ?? 0}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">Still being worked</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#059669]">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">Closed</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{summary?.resolved ?? 0}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">Resolved or dismissed</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">All time</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1">{summary?.total ?? 0}</p>
          <p className="text-[11px] text-[#94a3b8] m-0">Across your whole network</p>
        </Card>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0]">
        <Info size={15} className="text-[#64748b] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#475569] m-0 leading-relaxed">
          <span className="font-bold">This view is read-only by design.</span> Disputes are settled
          between the buyer, the seller and AMJ Star's support team — you are not a party to the
          order, so you cannot act on one here. It matters to you because a dispute that ends in
          cancellation reverses your pending commission on that deal, so it is worth calling your
          customer and helping them close it out.
        </p>
      </div>

      <Card>
        <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between gap-3 flex-wrap">
          <FilterTabs<DisputeFilter>
            value={filter}
            onChange={changeFilter}
            options={[
              { value: '', label: 'All' },
              { value: 'open', label: 'Open', count: summary?.open },
              { value: 'closed', label: 'Closed', count: summary?.resolved },
            ]}
          />
          <span className="text-[11px] text-[#64748b] font-semibold">{total} disputes</span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-[#64748b]">Loading disputes…</div>
        ) : disputes.length === 0 ? (
          <InlineEmpty
            icon={ShieldCheck}
            title={filter === 'open' ? 'No open disputes' : 'No disputes'}
            description="Nothing to chase right now — your customers' orders are running clean."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th className={TH}>Order</th>
                  <th className={TH}>Raised</th>
                  <th className={TH}>Issue</th>
                  <th className={TH}>Buyer</th>
                  <th className={TH}>Seller</th>
                  <th className={TH}>My side</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => {
                  const order = typeof d.orderId === 'object' ? d.orderId : undefined;
                  const buyerPhone =
                    typeof d.buyerId === 'object' ? (d.buyerId as { phone?: string }).phone : undefined;
                  const sellerPhone =
                    typeof d.supplierId === 'object' ? (d.supplierId as { phone?: string }).phone : undefined;
                  return (
                    <tr key={d._id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className={TD}>
                        <p className="font-bold text-[#0f172a] m-0">{order?.orderNumber || '—'}</p>
                        {order?.totalAmount !== undefined && (
                          <p className="text-[10px] text-[#94a3b8] m-0">{formatCurrency(order.totalAmount)}</p>
                        )}
                      </td>
                      <td className={TD}>
                        {shortDate(d.createdAt)}
                        {!!d.reopenCount && d.reopenCount > 0 && (
                          <span className="block text-[10px] text-[#b45309] font-bold mt-0.5">
                            Reopened {d.reopenCount}×
                          </span>
                        )}
                      </td>
                      <td className={TD}>
                        <Badge tone="neutral">{humanise(d.issueType)}</Badge>
                        <p className="text-[10px] text-[#64748b] m-0 mt-1 max-w-[220px] leading-snug line-clamp-2">
                          {d.description}
                        </p>
                      </td>
                      <td className={TD}>
                        <p className="m-0 font-semibold text-[#334155]">{refName(d.buyerId, 'Buyer')}</p>
                        {buyerPhone && (
                          <a
                            href={`tel:${buyerPhone}`}
                            className="inline-flex items-center gap-1 text-[10px] text-[#64748b] no-underline hover:text-[#0f172a]"
                          >
                            <Phone size={9} /> {buyerPhone}
                          </a>
                        )}
                      </td>
                      <td className={TD}>
                        <p className="m-0 font-semibold text-[#334155]">{refName(d.supplierId, 'Seller')}</p>
                        {sellerPhone && (
                          <a
                            href={`tel:${sellerPhone}`}
                            className="inline-flex items-center gap-1 text-[10px] text-[#64748b] no-underline hover:text-[#0f172a]"
                          >
                            <Phone size={9} /> {sellerPhone}
                          </a>
                        )}
                      </td>
                      <td className={TD}>
                        <Badge tone={d.mySide === 'both' ? 'brand' : 'info'}>
                          {SIDE_LABEL[d.mySide] || d.mySide}
                        </Badge>
                      </td>
                      <td className={TD}>
                        <Badge tone={STATUS_TONE[d.status] || 'neutral'}>{humanise(d.status)}</Badge>
                        {d.resolutionMethod && (
                          <span className="block text-[10px] text-[#64748b] mt-1">
                            via {humanise(d.resolutionMethod)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

export default PartnerDisputes;
