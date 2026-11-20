import React from 'react';
import { Calculator, ShieldCheck, Info } from 'lucide-react';
import { TableWrap, TH, TD, Badge } from './partner.ui';
import { getPersonalizedBenchmarks } from '../services/partnerBenchmark';

interface PartnerBenchmarkTableProps {
  sellerRate?: number;
  buyerRate?: number;
  className?: string;
  embedded?: boolean;
}

export const PartnerBenchmarkTable: React.FC<PartnerBenchmarkTableProps> = ({
  sellerRate = 15,
  buyerRate = 10,
  className = '',
  embedded = false,
}) => {
  const benchmarks = getPersonalizedBenchmarks(sellerRate, buyerRate);

  const containerClasses = embedded
    ? `bg-slate-50/70 rounded-[10px] p-4 sm:p-5 border border-slate-200/80 ${className}`
    : `bg-white rounded-[12px] p-5 border border-[#e2e8f0] ${className}`;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Calculator size={16} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Deal Size Payout Reference</h3>
            <p className="text-[11px] text-[#64748b] m-0">
              Estimated earning brackets calculated for your approved partner account.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
          <ShieldCheck size={13} className="text-emerald-600" />
          Auto-credited upon delivery
        </div>
      </div>

      <div className="bg-white rounded-[8px] overflow-hidden border border-slate-200/60">
        <TableWrap>
        <thead>
          <tr>
            <th className={TH}>Deal Size Bracket</th>
            <th className={TH}>Supplier Sale</th>
            <th className={TH}>Buyer Purchase</th>
            <th className={TH}>Matched Trade (Both Sides)</th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.map((row) => (
            <tr key={row.dealBracket} className="hover:bg-[#f8fafc] transition-colors">
              <td className={`${TD} font-bold text-[#0f172a]`}>
                <Badge tone="neutral">{row.dealBracket}</Badge>
                <span className="block text-[10px] text-[#94a3b8] font-normal mt-0.5">
                  {row.orderRangeLabel}
                </span>
              </td>
              <td className={`${TD} font-extrabold text-slate-800`}>
                {row.sellerEarningRange}
              </td>
              <td className={`${TD} font-extrabold text-slate-800`}>
                {row.buyerEarningRange}
              </td>
              <td className={TD}>
                <span className="inline-block px-2.5 py-1 rounded-[6px] bg-indigo-50/80 border border-indigo-200 text-indigo-900 font-extrabold text-xs">
                  {row.bothEarningRange}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      </div>

      <div className="mt-3.5 p-3 rounded-[8px] bg-white border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
        <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <span>
          Estimates are based on standard wholesale product take-rates (2%–5%). Payouts clear to your available balance in real time when delivery is verified by the buyer.
        </span>
      </div>
    </div>
  );
};
