import React, { useState } from 'react';
import { Truck, Check, AlertCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import supplierService from '../services/supplier.service';
import { setSupplierProfile } from '../store/supplier.slice';

const SupplierLogistics: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(state => state.supplier.profile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnShipping = profile?.usesOwnShipping || false;

  const handleToggle = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.toggleOwnShipping();
      if (data.supplier) {
        dispatch(setSupplierProfile(data.supplier));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update shipping preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[10px] bg-[#fff7ed] text-[#ea580c] flex items-center justify-center">
          <Truck size={24} />
        </div>
        <h2 className="text-2xl font-extrabold text-[#0f172a] m-0">Logistics & Shipping</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] max-w-2xl">
        <h3 className="text-lg font-bold text-[#1e293b] mb-2">Shipping Services Preference</h3>
        <p className="text-[#64748b] text-sm leading-relaxed mb-6">
          You can choose whether you want AMJSTAR to manage your logistics, or if you prefer to use your own shipping services.
        </p>

        <div className={`p-4 rounded-[10px] border-2 transition-all ${isOwnShipping ? 'border-primary bg-orange-50/50' : 'border-[#e2e8f0]'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-[#0f172a] m-0 flex items-center gap-2">
                I have my own shipping services
                {isOwnShipping && <span className="bg-[#ecfdf5] text-[#059669] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#a7f3d0] flex items-center gap-1"><Check size={10} /> ACTIVE</span>}
              </h4>
              <p className="text-sm text-[#475569] mt-2 m-0 leading-relaxed">
                If enabled, AMJSTAR commission will <strong>not</strong> be charged on the shipping amount in your quotations. You will be responsible for fulfilling the delivery yourself.
              </p>
            </div>
            
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none border-none ${
                isOwnShipping ? 'bg-primary' : 'bg-[#cbd5e1]'
              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isOwnShipping ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#f1f5f9]">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-[#f8fafc] rounded-full flex items-center justify-center text-[#94a3b8] mb-4">
              <Truck size={32} />
            </div>
            <h4 className="text-[#1e293b] font-bold">More Logistics Features Coming Soon</h4>
            <p className="text-[#64748b] text-sm mt-2 max-w-sm">Manage your shipments, print labels, and track delivery status for all your bulk orders directly from here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierLogistics;
