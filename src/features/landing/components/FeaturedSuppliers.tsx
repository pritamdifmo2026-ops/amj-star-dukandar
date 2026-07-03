import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import apiClient from '@/api/client';
import PlanBadge from '@/features/supplier/components/PlanBadge';

interface FeaturedSupplier {
  _id: string;
  businessName: string;
  tier: string;
  subscription?: { status?: string; tier?: string };
  businessDetails?: { city?: string; state?: string; about?: string; gstin?: string };
}

const containerCls = 'w-full max-w-[var(--width-container)] mx-auto px-4 sm:px-8';

const FeaturedSuppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<FeaturedSupplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/supplier/featured')
      .then(res => { if (res.data.success) setSuppliers(res.data.suppliers); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Hide the whole section when there are no active Gamma/Beta suppliers.
  if (loading || suppliers.length === 0) return null;

  return (
    <section className="py-10 mb-6 bg-gradient-to-b from-[#fff7ed] to-white border-y border-[#f0f0f0]">
      <div className={containerCls}>
        <div className="flex justify-between items-center mb-6 border-l-[6px] border-primary pl-4">
          <h2 className="text-xl font-extrabold text-heading flex items-center gap-2">
            <Sparkles size={20} className="text-primary" /> Featured Suppliers
          </h2>
          <Link to="/verified-manufacturers" className="text-[#0066c0] font-medium text-sm no-underline hover:text-[#c45500] hover:underline">
            See all
          </Link>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {suppliers.slice(0, 8).map(s => {
            const initials = s.businessName.slice(0, 2).toUpperCase();
            const location = [s.businessDetails?.city, s.businessDetails?.state].filter(Boolean).join(', ');
            return (
              <Link
                key={s._id}
                to={`/store/${s._id}`}
                className="no-underline bg-white border border-[#eee] rounded-[12px] p-4 flex flex-col gap-3 hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-[10px] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shrink-0 border border-primary/10 text-primary font-extrabold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-heading leading-tight line-clamp-2 m-0">{s.businessName}</h3>
                    <PlanBadge supplier={s} className="mt-1" />
                  </div>
                </div>
                {location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={12} className="shrink-0" /> {location}
                  </div>
                )}
                <span className="mt-auto flex items-center justify-center gap-1.5 text-xs font-bold text-primary border border-primary/20 rounded-[8px] py-2 hover:bg-primary hover:text-white transition-colors">
                  <Store size={13} /> View Storefront <ExternalLink size={11} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSuppliers;
