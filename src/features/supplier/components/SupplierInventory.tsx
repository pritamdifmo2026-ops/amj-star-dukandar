import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SupplierInventoryProps {
  products: any[];
  handleRefresh: () => void;
  renderProductListing: (products: any[]) => React.ReactNode;
}

const SupplierInventory: React.FC<SupplierInventoryProps> = ({ products, handleRefresh, renderProductListing }) => {
  return (
    <section className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-8 max-lg:p-5 max-lg:rounded-[8px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[1.25rem] text-[#1e293b] m-0 font-extrabold">My Inventory</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-bold cursor-pointer text-[0.8rem] px-4 py-2 rounded-[8px] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      {renderProductListing(products)}
    </section>
  );
};

export default SupplierInventory;
