import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, CalendarDays, Star, Store, Search, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import apiClient from '@/api/client';
import PlanBadge from '@/features/supplier/components/PlanBadge';

interface Supplier {
  _id: string;
  businessName: string;
  tier: string;
  createdAt: string;
  averageRating?: number;
  totalReviews?: number;
  subscription?: { status?: string; tier?: string };
  businessDetails?: {
    city?: string;
    state?: string;
    about?: string;
    description?: string;
    yearOfEstablishment?: string;
    ownerName?: string;
    isWomenEntrepreneur?: boolean;
    gstin?: string;
  };
}

const StarRating: React.FC<{ rating: number; count: number }> = ({ rating, count }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      ))}
    </div>
    <span className="text-xs text-slate-500 font-medium">
      {rating > 0 ? rating.toFixed(1) : 'No ratings'} {count > 0 && `(${count})`}
    </span>
  </div>
);

const VerifiedManufacturers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get('/supplier/verified')
      .then(res => {
        if (res.data.success) setSuppliers(res.data.suppliers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = suppliers.filter(s =>
    s.businessName.toLowerCase().includes(search.toLowerCase()) ||
    s.businessDetails?.city?.toLowerCase().includes(search.toLowerCase()) ||
    s.businessDetails?.state?.toLowerCase().includes(search.toLowerCase())
  );

  const SkeletonCard = () => (
    <div className="bg-white border border-slate-100 rounded-[12px] p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-[10px] bg-slate-100 shrink-0" />
        <div className="flex-1">
          <div className="h-5 bg-slate-100 rounded w-2/3 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded w-full mb-2" />
      <div className="h-3 bg-slate-100 rounded w-4/5" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      {/* Header and Search */}
      <div className="bg-white border-b border-slate-100 py-4 px-4 max-lg:pt-[calc(56px+env(safe-area-inset-top,0px))]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              Verified Manufacturers
              <ShieldCheck size={20} className="text-emerald-500" />
            </h1>
            <p className="text-sm text-slate-500">
              {loading ? 'Loading...' : (
                <span><strong className="text-slate-800">{filtered.length}</strong> verified manufacturer{filtered.length !== 1 ? 's' : ''} found</span>
              )}
            </p>
          </div>
          <div className="relative w-full md:w-[320px] shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, city or state..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[8px] bg-slate-50 text-sm text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Store size={36} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">No manufacturers found</h2>
            <p className="text-slate-500 text-sm max-w-sm">
              {search ? `No results for "${search}". Try a different search.` : 'No verified manufacturers are listed yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(supplier => {
              const initials = supplier.businessName.slice(0, 2).toUpperCase();
              const location = [supplier.businessDetails?.city, supplier.businessDetails?.state].filter(Boolean).join(', ');
              const about = supplier.businessDetails?.about || supplier.businessDetails?.description || '';
              const year = supplier.businessDetails?.yearOfEstablishment;
              const rating = supplier.averageRating ?? 0;
              const reviews = supplier.totalReviews ?? 0;

              return (
                <div
                  key={supplier._id}
                  className="bg-white border border-slate-100 rounded-[14px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-[10px] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shrink-0 border border-primary/10 text-primary font-extrabold text-lg">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-[0.95rem] font-extrabold text-slate-900 leading-tight">{supplier.businessName}</h2>
                        <PlanBadge supplier={supplier} className="shrink-0" />
                      </div>
                      {supplier.businessDetails?.isWomenEntrepreneur && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-pink-600 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full mt-1">
                          👩 Women Entrepreneur
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verified badge */}
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mb-3">
                    <ShieldCheck size={13} className="shrink-0" />
                    Verified by AMJSTAR
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    <StarRating rating={rating} count={reviews} />
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1.5 mb-4">
                    {location && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        {location}
                      </div>
                    )}
                    {year && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays size={12} className="shrink-0 text-slate-400" />
                        Est. {year}
                      </div>
                    )}
                  </div>

                  {about && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 flex-1">{about}</p>
                  )}

                  {/* CTA */}
                  <Link
                    to={`/store/${supplier._id}`}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded-[8px] text-xs font-bold no-underline hover:bg-primary-dark transition-colors"
                  >
                    <Store size={14} />
                    View Storefront
                    <ExternalLink size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default VerifiedManufacturers;
