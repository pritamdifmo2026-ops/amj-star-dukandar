import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  styles?: Record<string, string>;
}

const Pagination: React.FC<PaginationProps> = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return <span key={`dots-${index}`} className="px-2 text-[#94a3b8] text-sm">...</span>;
      }
      return (
        <button
          key={page}
          onClick={() => onPageChange(page as number)}
          className={`w-8 h-8 text-sm font-semibold rounded-[6px] border-none cursor-pointer transition-colors ${currentPage === page ? 'bg-primary text-white' : 'bg-transparent text-[#475569] hover:bg-[#f1f5f9]'}`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9]">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-[#475569] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} /> Prev
      </button>
      <div className="flex items-center gap-1">{renderPageNumbers()}</div>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-[#475569] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
