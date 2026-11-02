import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, PackageSearch } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import Pagination from '@/shared/components/ui/Pagination';
import {
  Card, SectionHeader, Badge, TableWrap, TH, TD, InlineEmpty, type Tone,
} from './partner.ui';
import { shortDate, refName, humanise } from './partner.format';
import partnerService from '../services/partner.service';

const PAGE_SIZE = 20;

/** Order lifecycle, coloured so a partner can scan for stuck deals. */
function statusTone(status: string): Tone {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'delivered') return 'success';
  if (s === 'cancelled' || s === 'rejected') return 'danger';
  if (s === 'disputed') return 'danger';
  if (s === 'pending' || s === 'awaiting_payment') return 'warning';
  return 'info';
}

const PartnerOrders: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['partner', 'orders', page],
    queryFn: () => partnerService.getOrders({ page, limit: PAGE_SIZE }),
  });

  const orders = data?.orders || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Deals from my network"
        subtitle="Every order placed by a buyer you referred or fulfilled by a seller you referred. This is the pipeline your commission comes from."
        icon={Receipt}
      />

      <Card>
        <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Order history</h3>
          <span className="text-[11px] text-[#64748b] font-semibold">{total} orders</span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-[#64748b]">Loading deals…</div>
        ) : orders.length === 0 ? (
          <InlineEmpty
            icon={PackageSearch}
            title="No deals yet"
            description="As soon as somebody in your network places or fulfils an order, it shows up here — along with the commission it generates."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th className={TH}>Order</th>
                  <th className={TH}>Date</th>
                  <th className={TH}>Buyer</th>
                  <th className={TH}>Seller</th>
                  <th className={TH}>Order value</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className={`${TD} font-bold text-[#0f172a]`}>{o.orderNumber}</td>
                    <td className={TD}>{shortDate(o.createdAt)}</td>
                    <td className={TD}>{refName(o.buyerId, 'Buyer')}</td>
                    <td className={TD}>{refName(o.supplierId, 'Seller')}</td>
                    <td className={TD}>
                      <span className="font-extrabold text-[#0f172a]">{formatCurrency(o.totalAmount)}</span>
                      <span className="block text-[10px] text-[#94a3b8]">
                        {formatCurrency(o.subtotal)} before tax
                      </span>
                    </td>
                    <td className={TD}>
                      <Badge tone={statusTone(o.status)}>{humanise(o.status)}</Badge>
                      {o.paymentStatus && (
                        <span className="block text-[10px] text-[#64748b] mt-1">
                          {humanise(o.paymentStatus)}
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

export default PartnerOrders;
