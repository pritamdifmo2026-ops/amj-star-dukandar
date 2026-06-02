import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Star, Package, MessageSquare, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

const fetchMyReviews = async () => {
  const res = await apiClient.get('/orders/supplier/reviews');
  return res.data;
};

// ─── Star row ─────────────────────────────────────────────────────────────────
const StarRow: React.FC<{ value: number; size?: number }> = ({ value, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#e2e8f0]'} />
    ))}
  </div>
);

// ─── Single review card ───────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: any }> = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  const order = review.orderId;
  const product = order?.quotationId?.conversationId?.productId;
  const buyerName = (review.buyerId?.name || 'Customer').replace(/\S/g, (c: string, i: number) => i === 0 ? c : '*');
  const hasDims = review.dimensions?.quality || review.dimensions?.packaging || review.dimensions?.communication || review.dimensions?.onTime;

  const dims = [
    { label: 'Quality',    val: review.dimensions?.quality },
    { label: 'Packaging',  val: review.dimensions?.packaging },
    { label: 'Comms',      val: review.dimensions?.communication },
    { label: 'On-time',    val: review.dimensions?.onTime },
  ].filter(d => d.val);

  return (
    <div className="bg-white border border-[#eef2f6] rounded-[12px] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow">
      {/* Main row */}
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Product image */}
        <div className="w-12 h-12 shrink-0 rounded-[8px] overflow-hidden bg-[#f8fafc] border border-[#f1f5f9] flex items-center justify-center">
          {product?.images?.[0]
            ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            : <Package size={20} className="text-[#cbd5e1]" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0f172a] m-0 truncate">
                {product?.name || order?.items?.[0]?.name || 'Product'}
              </p>
              <p className="text-xs text-[#94a3b8] m-0 mt-0.5">
                #{order?.orderNumber || '—'} · {buyerName} · {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            {/* Rating + expand toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <StarRow value={review.rating} size={15} />
                <span className="text-sm font-extrabold text-[#0f172a]">{review.rating}.0</span>
              </div>
              {(hasDims || review.comment) && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] border-none cursor-pointer hover:bg-[#e2e8f0] transition-colors"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Comment preview (truncated, always visible if short) */}
          {review.comment && !expanded && (
            <p className="text-xs text-[#64748b] m-0 mt-2 line-clamp-1 italic">"{review.comment}"</p>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#f1f5f9] px-5 py-4 bg-[#fafbfc] flex flex-col gap-3">
          {review.comment && (
            <p className="text-sm text-[#475569] m-0 italic leading-relaxed">"{review.comment}"</p>
          )}
          {dims.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {dims.map(({ label, val }) => (
                <div key={label} className="bg-white rounded-[8px] border border-[#e2e8f0] px-3 py-2 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">{label}</span>
                  <div className="flex items-center gap-1">
                    <StarRow value={val!} size={11} />
                    <span className="text-xs font-bold text-[#475569]">{val}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const SupplierReviews: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['supplier', 'my-reviews'],
    queryFn: fetchMyReviews,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-sm text-[#dc2626] py-6">Failed to load reviews.</div>;
  }

  const { reviews = [], stats } = data || {};
  const hasStats = stats?.total > 0;

  if (!hasStats) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-[#64748b]">
        <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center">
          <MessageSquare size={32} strokeWidth={1.5} className="text-[#cbd5e1]" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-[#1e293b] m-0 mb-1">No reviews yet</p>
          <p className="text-sm text-[#94a3b8] m-0">Customer reviews appear here after orders are completed and rated.</p>
        </div>
      </div>
    );
  }

  const round1 = (v: number | null) => v != null ? v.toFixed(1) : null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-extrabold text-[#0f172a] m-0 mb-1">Ratings from your Buyers</h2>
        <p className="text-sm text-[#64748b] m-0">See what customers say about your products, packaging, and service.</p>
      </div>

      {/* ── Stats header ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#eef2f6] rounded-[14px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#f1f5f9]">

          {/* Total + avg */}
          <div className="px-6 py-5 flex items-center gap-5">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-[#0f172a] m-0 leading-none">{stats.total}</p>
              <p className="text-xs text-[#94a3b8] m-0 mt-1 font-semibold uppercase tracking-wide">Reviews</p>
            </div>
            <div className="w-px h-10 bg-[#f1f5f9]" />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#f59e0b]">{stats.avgRating?.toFixed(1)}</span>
                <Star size={20} className="fill-[#f59e0b] text-[#f59e0b] mb-0.5" />
              </div>
              <StarRow value={stats.avgRating} size={14} />
              <p className="text-xs text-[#94a3b8] m-0 mt-1">Overall rating</p>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] m-0 mb-3">Rating Breakdown</p>
            <div className="flex flex-col gap-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const entry = stats.ratingBreakdown?.find((r: any) => r.star === star);
                const count = entry?.count ?? 0;
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#64748b] w-2.5 text-right">{star}</span>
                    <Star size={11} className="fill-[#f59e0b] text-[#f59e0b] shrink-0" />
                    <div className="flex-1 bg-[#f1f5f9] rounded-full h-1.5 min-w-0">
                      <div className="h-1.5 rounded-full bg-[#f59e0b] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-[#94a3b8] w-3 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimensions */}
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] m-0 mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-primary" /> Category Avg
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Quality',     val: stats.dimensions?.quality },
                { label: 'Packaging',   val: stats.dimensions?.packaging },
                { label: 'Comms',       val: stats.dimensions?.communication },
                { label: 'On-time',     val: stats.dimensions?.onTime },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#64748b] w-16 shrink-0">{label}</span>
                  <div className="flex-1 bg-[#f1f5f9] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: val ? `${(val / 5) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-[11px] font-bold text-[#475569] w-5 text-right shrink-0">{round1(val) ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Review list ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold text-[#0f172a] m-0">{reviews.length} Review{reviews.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-[#94a3b8] m-0">Tap ↓ on a card to see details</p>
        </div>
        {reviews.map((review: any) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default SupplierReviews;
