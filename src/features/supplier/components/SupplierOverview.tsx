import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Zap, RefreshCw, Plus, AlertTriangle, Wallet } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import SupplierStats from './SupplierStats';
import { useQuery } from '@tanstack/react-query';
import walletApi from '../services/wallet.api';
import toast from 'react-hot-toast';

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
  const { data: walletData } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.getWallet });
  const commissionRate = walletData?.commissionRate;
  const commissionNotSet = walletData !== undefined && commissionRate == null;
  const toastShown = useRef(false);

  useEffect(() => {
    if (!walletData || toastShown.current) return;
    const available: number = walletData.wallet?.availableBalance ?? 0;
    const minBalance: number = walletData.minimumWalletBalance ?? 500;
    if (available < minBalance) {
      toastShown.current = true;
      toast.custom(
        t => (
          <div
            className={`flex items-start gap-3 bg-white border border-[#fcd34d] rounded-[12px] shadow-lg px-4 py-3 max-w-sm w-full transition-all ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          >
            <div className="w-9 h-9 rounded-full bg-[#fffbeb] flex items-center justify-center shrink-0 mt-0.5">
              <Wallet size={18} className="text-[#d97706]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#92400e] m-0">Low wallet balance</p>
              <p className="text-xs text-[#b45309] mt-0.5 m-0">
                ₹{available.toFixed(2)} available — minimum is ₹{minBalance}. Top up to avoid PO blocks.
              </p>
              <button
                onClick={() => { setActiveView('wallet'); toast.dismiss(t.id); }}
                className="mt-2 text-xs font-bold text-[#e65c00] bg-transparent border-none cursor-pointer p-0 hover:underline"
              >
                Add wallet balance →
              </button>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-[#94a3b8] bg-transparent border-none cursor-pointer text-lg leading-none p-0 shrink-0 hover:text-[#475569]"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ),
        { duration: Infinity, position: 'top-right' }
      );
    }
  }, [walletData]);

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

      {commissionNotSet && (
        <button
          onClick={() => setActiveView('settings')}
          className="w-full flex items-start gap-3 p-4 mb-6 bg-[#fffbeb] border border-[#fcd34d] rounded-[10px] text-left hover:bg-[#fef3c7] transition-colors cursor-pointer group"
        >
          <AlertTriangle size={20} className="text-[#d97706] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm text-[#92400e]">Commission rate not configured</p>
            <p className="text-xs text-[#b45309] mt-0.5">PO generation is paused until AMJSTAR sets your commission rate. Tap to go to Settings and find the contact CTA.</p>
          </div>
          <span className="text-xs font-bold text-[#d97706] group-hover:underline whitespace-nowrap">Go to Settings →</span>
        </button>
      )}

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
