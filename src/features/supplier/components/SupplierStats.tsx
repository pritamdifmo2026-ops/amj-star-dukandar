import React from 'react';
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SupplierStatsProps {
  products: any[];
}

const SupplierStats: React.FC<SupplierStatsProps> = ({ products }) => {
  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: '#2563eb' },
    { label: 'Live', value: products.filter(p => p.status === 'APPROVED').length, icon: CheckCircle, color: '#059669' },
    { label: 'Pending', value: products.filter(p => p.status === 'PENDING').length, icon: Clock, color: '#d97706' },
    { label: 'Rejected', value: products.filter(p => p.status === 'REJECTED').length, icon: AlertCircle, color: '#dc2626' },
  ];

  return (
    <div className="grid grid-cols-4 gap-6 mb-10 max-xl:grid-cols-2 max-lg:grid-cols-1 max-lg:gap-4">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-white px-6 py-6 rounded-[8px] border border-[#eef2f6] flex items-center gap-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.04)] hover:border-[#e2e8f0]">
            <div className="w-12 h-12 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: '#f1f5f9', color: stat.color }}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-2xl m-0 text-[#0f172a] font-extrabold">{stat.value}</h3>
              <p className="m-0 text-[#64748b] text-[0.85rem] font-semibold">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SupplierStats;
