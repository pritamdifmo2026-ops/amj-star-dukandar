import React, { useState } from 'react';
import { Store, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import Button from '@/shared/components/ui/Button';

interface SupplierStoreFrontProps {
  supplierId: string;
}

const SupplierStoreFront: React.FC<SupplierStoreFrontProps> = ({ supplierId }) => {
  const [copied, setCopied] = useState(false);

  const storeLink = `${window.location.origin}/store/${supplierId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const openStorefront = () => {
    window.open(storeLink, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#fff7ed] text-[#d97706] rounded-[10px] flex items-center justify-center">
            <Store size={24} />
          </div>
          <div>
            <h2 className="text-[1.25rem] text-[#1e293b] m-0 font-extrabold">Your Public Storefront</h2>
            <p className="text-sm text-[#64748b] mt-1 m-0">Share your store link with customers, on Instagram, Twitter, or anywhere.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3">
            <span className="text-[#0f172a] font-medium text-sm truncate flex-1">{storeLink}</span>
            <button 
              onClick={copyToClipboard}
              className="text-[#64748b] hover:text-primary transition-colors cursor-pointer p-1"
              title="Copy Link"
            >
              {copied ? <CheckCircle size={18} className="text-[#059669]" /> : <Copy size={18} />}
            </button>
          </div>
          <Button onClick={openStorefront} className="max-md:w-full flex items-center justify-center gap-2">
            <ExternalLink size={16} /> Visit Store
          </Button>
        </div>
      </div>

      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-6 text-center">
        <Store size={48} className="text-[#94a3b8] mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-[#1e293b] mb-2">Build Trust with Buyers</h3>
        <p className="text-sm text-[#64748b] max-w-lg mx-auto leading-relaxed">
          Your public storefront displays all your approved products automatically. Buyers can view your complete catalog, learn about your business, and trust your verified profile.
        </p>
      </div>
    </div>
  );
};

export default SupplierStoreFront;
