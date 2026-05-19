import React from 'react';
import { ShieldCheck, Zap, RefreshCw, Plus } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import SupplierStats from './SupplierStats';

interface SupplierOverviewProps {
  profile: any;
  products: any[];
  isTrusted: boolean;
  handleRefresh: () => void;
  setActiveView: (view: string) => void;
  renderProductListing: (products: any[]) => React.ReactNode;
}

const SupplierOverview: React.FC<SupplierOverviewProps> = ({
  profile, products, isTrusted, handleRefresh, setActiveView, renderProductListing
}) => {
  return (
    <>
      <div className="flex justify-between items-start mb-10 gap-6 max-lg:flex-col max-lg:items-stretch max-lg:gap-4 max-lg:mb-6">
        <div>
          <h1 className="text-[1.75rem] text-[#0f172a] mb-2 font-extrabold tracking-tight max-sm:text-2xl">
            Welcome back, {profile?.businessName || 'Supplier'}
          </h1>
          {isTrusted ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold mt-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              <ShieldCheck size={16} /> <span>Trusted Supplier</span>
            </div>
          ) : (
            <p className="text-[#64748b] m-0 text-[0.95rem]">Manage your products and orders from your command center.</p>
          )}
          {isTrusted && (
            <div className="mt-4 px-4 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[6px] text-[#166534] text-[0.85rem] flex items-center gap-2">
              <Zap size={14} />
              <span><strong>Auto-Upload Active:</strong> Your products will now be live instantly!</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 max-sm:grid max-sm:grid-cols-2">
          <Button variant="outline" onClick={handleRefresh} className="!bg-white !text-[#475569] !border-[#e2e8f0] hover:!bg-[#f8fafc]">
            <RefreshCw size={18} /> Refresh
          </Button>
          <Button onClick={() => setActiveView('add-product')}>
            <Plus size={20} /> Add New Product
          </Button>
        </div>
      </div>

      <SupplierStats products={products} />

      <section className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-8 max-lg:p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[1.25rem] text-[#1e293b] m-0 font-extrabold">Recent Products</h2>
          <button onClick={() => setActiveView('inventory')} className="bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-bold cursor-pointer text-[0.8rem] px-4 py-2 rounded-[8px] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]">
            View All
          </button>
        </div>
        {renderProductListing(products.slice(0, 5))}
      </section>
    </>
  );
};

export default SupplierOverview;
