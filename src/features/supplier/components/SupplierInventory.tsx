import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const PER_PAGE = 10;
type FilterType = 'all' | 'draft' | 'published' | 'rejected';

interface SupplierInventoryProps {
  products: any[];
  handleRefresh: () => void;
  onAddProduct: () => void;
  renderProductListing: (products: any[]) => React.ReactNode;
}

const SupplierInventory: React.FC<SupplierInventoryProps> = ({
  products, handleRefresh, onAddProduct, renderProductListing
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [filter]);

  const getFiltered = (f: FilterType) => {
    if (f === 'all') return products;
    return products.filter(p => {
      const s = p.status?.toUpperCase() || 'PENDING';
      if (f === 'draft')     return s === 'DRAFT';
      if (f === 'published') return s === 'PENDING' || s === 'APPROVED';
      if (f === 'rejected')  return s === 'REJECTED';
      return true;
    });
  };

  const filtered    = getFiltered(filter);
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged       = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasRejected = products.some(p => p.status?.toUpperCase() === 'REJECTED');

  const filterDefs: { key: FilterType; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'draft',     label: 'Draft' },
    { key: 'published', label: 'Published' },
    ...(hasRejected ? [{ key: 'rejected' as FilterType, label: 'Rejected' }] : []),
  ];

  // Smart page number renderer — shows first, last, current ±1, ellipsis in gaps
  const pageNumbers = () => {
    const items: (number | 'ellipsis')[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        items.push(i);
      } else if (items[items.length - 1] !== 'ellipsis') {
        items.push('ellipsis');
      }
    }
    return items;
  };

  return (
    <section className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-8 max-lg:p-5">

      {/* Header row */}
      <div className="flex justify-between items-center mb-5 gap-3 flex-wrap">
        <h2 className="text-[1.25rem] text-[#1e293b] m-0 font-extrabold">My Inventory</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-bold cursor-pointer text-[0.8rem] px-4 py-2 rounded-[8px] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={onAddProduct}
            className="flex items-center gap-1.5 bg-primary text-white font-bold cursor-pointer text-[0.8rem] px-4 py-2 rounded-[8px] transition-all hover:opacity-90 border-none"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {filterDefs.map(({ key, label }) => {
          const count = getFiltered(key).length;
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-primary hover:text-primary'
              }`}
            >
              {label}
              <span className={`text-[10px] font-semibold min-w-[16px] h-[16px] rounded-full flex items-center justify-center ${active ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Product list */}
      {renderProductListing(paged)}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#eef2f6]">
          <span className="text-xs text-[#64748b] font-semibold">
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} products
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e2e8f0] text-[#64748b] bg-white hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            {pageNumbers().map((item, i) =>
              item === 'ellipsis' ? (
                <span key={`e-${i}`} className="w-8 text-center text-[#94a3b8] text-xs select-none">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-xs font-bold border transition-all cursor-pointer ${
                    item === page
                      ? 'bg-primary text-white border-primary'
                      : 'border-[#e2e8f0] text-[#64748b] bg-white hover:bg-[#f8fafc]'
                  }`}
                >
                  {item}
                </button>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e2e8f0] text-[#64748b] bg-white hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default SupplierInventory;
