import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Store, MapPin, Globe, ShieldCheck, ChevronDown, ChevronUp,
  Package, Calendar, TrendingUp, Award, Building2, ArrowUpRight,
  Factory, Star, CheckCircle, Share2,
  LayoutGrid, List, Camera,
} from 'lucide-react';
import api from '@/api/client';
import Button from '@/shared/components/ui/Button';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/shared/constants/routes';
import EditStoreBannerModal from '@/features/supplier/components/EditStoreBannerModal';
import EditStoreLogoModal from '@/features/supplier/components/EditStoreLogoModal';
import ShareModal from '@/shared/components/ui/ShareModal';
import { extractSupplierId, toStoreSlug, formatProductShareText } from '@/shared/utils/ogImage';

/* ─── Storefront Product Card (Enquire Now variant) ─────────────────── */
const StorefrontProductCard: React.FC<{ product: any; onShare: (product: any) => void }> = ({ product, onShare }) => {
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const productId = product.id || product._id;

  const handleEnquire = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=/products/${productId}`);
      return;
    }
    navigate(`/products/${productId}`);
  };

  return (
    <Link
      to={`/products/${productId}`}
      className="flex flex-col bg-white rounded-[12px] border border-[#eef2f6] overflow-hidden no-underline transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#e65c00]/30 group"
    >
      {/* image */}
      <div className="relative aspect-[4/3] sm:aspect-square bg-[#f8fafc] overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#94a3b8]">
            <Package size={28} strokeWidth={1.5} />
            <span className="text-[10px]">No image</span>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase tracking-wide bg-white/90 text-[#e65c00] border border-[#fed7aa] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* info */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2 flex-1">
          <h3 className="text-[11px] sm:text-xs font-semibold text-[#0f172a] m-0 line-clamp-2 leading-[1.45]">
            {product.name}
          </h3>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(product); }}
            className="shrink-0 p-1.5 rounded-full text-[#64748b] bg-[#f8fafc] hover:text-[#e65c00] hover:bg-[#fff7ed] transition-colors border border-[#e2e8f0]"
            title="Share Product"
          >
            <Share2 size={13} />
          </button>
        </div>
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs sm:text-sm font-extrabold text-[#0f172a]">
            ₹{(product.price || product.basePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-medium">
              MOQ: {product.minOrderQty || product.moq} {product.unit}
            </span>
            {product.supplierDefaultPaymentTerms && (
              <span className="text-[9px] text-[#059669] bg-[#ecfdf5] px-1.5 py-[2px] rounded-sm font-semibold mt-1">
                {product.supplierDefaultPaymentTerms}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleEnquire}
          className="w-full text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 rounded-[8px] bg-[#fff7ed] text-[#e65c00] border border-[#fed7aa] hover:bg-[#e65c00] hover:text-white transition-all cursor-pointer"
        >
          For Bulk Purchase
        </button>
      </div>
    </Link>
  );
};

/* ─── tiny helpers ──────────────────────────────────────────────────── */
const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 bg-white rounded-[10px] border border-[#eef2f6] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-w-[150px] max-sm:min-w-[calc(50%-0.375rem)] flex-1">
    <div className="w-9 h-9 rounded-[8px] bg-[#fff7ed] text-[#d97706] flex items-center justify-center shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-sm font-extrabold text-[#0f172a] leading-tight truncate">{value}</p>
    </div>
  </div>
);

const InfoRow: React.FC<{ icon: React.ReactNode; text: string; href?: string }> = ({ icon, text, href }) => {
  const content = (
    <div className="flex items-center gap-2.5 text-sm text-[#475569] min-w-0">
      <span className="text-[#94a3b8] shrink-0">{icon}</span>
      <span className="leading-snug truncate">{text}</span>
      {href && <ArrowUpRight size={13} className="text-[#94a3b8] shrink-0 ml-auto" />}
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className="block no-underline hover:text-primary transition-colors">{content}</a>;
  return <div>{content}</div>;
};

/* ─── skeleton ──────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="min-h-screen bg-[#f1f5f9] animate-pulse">
    <div className="h-[220px] bg-[#e2e8f0] w-full" />
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
      <div className="bg-white rounded-[14px] border border-[#eef2f6] p-6 -mt-14 mb-5 flex gap-5 items-start">
        <div className="w-[88px] h-[88px] rounded-[12px] bg-[#f1f5f9] shrink-0" />
        <div className="flex-1 pt-1 space-y-3">
          <div className="h-5 bg-[#f1f5f9] rounded w-1/3" />
          <div className="h-3.5 bg-[#f1f5f9] rounded w-1/4" />
          <div className="h-3 bg-[#f1f5f9] rounded w-1/5" />
        </div>
      </div>
      <div className="flex gap-3 mb-6">{[1,2,3,4].map(i => <div key={i} className="h-[58px] flex-1 bg-white rounded-[10px] border border-[#eef2f6]" />)}</div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-[12px] border border-[#eef2f6]" />)}</div>
        <div className="h-96 bg-white rounded-[14px] border border-[#eef2f6]" />
      </div>
    </div>
  </div>
);

/* ─── main ──────────────────────────────────────────────────────────── */
const PublicStoreFront: React.FC = () => {
  const { id: routeId, idOrSlug } = useParams<{ id?: string; idOrSlug?: string }>();
  const rawParam = routeId || idOrSlug || '';
  const supplierId = extractSupplierId(rawParam);

  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [shareData, setShareData] = useState<{ url: string; title: string; subtitle?: string; text?: string; imageUrl?: string } | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const authUser = useAppSelector((state) => state.auth.user);
  const supplierProfile = useAppSelector((state) => state.supplier.profile);

  const canonicalSlug = supplier ? toStoreSlug(supplier.businessName, supplierId) : rawParam;
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store/${canonicalSlug}`
    : `https://amjstar.com/store/${canonicalSlug}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, productsRes] = await Promise.all([
          api.get(`/supplier/public/${supplierId}`),
          api.get(`/products?supplierId=${supplierId}`),
        ]);
        const supp = profileRes.data.supplier;
        setSupplier(supp);
        document.title = `${supp.businessName || 'Store'} - AMJSTAR`;
        setProducts(productsRes.data.products || []);

        if (typeof window !== 'undefined' && supp?.businessName) {
          const expectedSlug = toStoreSlug(supp.businessName, supplierId);
          if (rawParam === supplierId && expectedSlug !== supplierId) {
            window.history.replaceState(null, '', `/store/${expectedSlug}`);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load storefront');
      } finally {
        setLoading(false);
      }
    };
    if (supplierId) fetchData();
  }, [supplierId, rawParam]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
    return ['All', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() =>
    activeCategory === 'All' ? products : products.filter((p: any) => p.category === activeCategory),
    [products, activeCategory]
  );

  if (loading) return <Skeleton />;

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center px-4">
        <div className="bg-white rounded-[20px] border border-[#eef2f6] p-12 shadow-sm max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#fef2f2] flex items-center justify-center mx-auto mb-5">
            <Store size={36} className="text-[#fca5a5]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0f172a] mb-2">Store Not Found</h1>
          <p className="text-sm text-[#64748b] mb-6">{error || "This supplier storefront doesn't exist or may have been removed."}</p>
          <Link to="/"><Button variant="primary" className="w-full">← Back to AMJSTAR</Button></Link>
        </div>
      </div>
    );
  }

  const { businessName, businessDetails, verifiedByAdmin, tier, createdAt, gstRegistered } = supplier;
  const estYear = businessDetails?.yearOfEstablishment;
  const initials = businessName?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '??';
  const location = [businessDetails?.city, businessDetails?.state].filter(Boolean).join(', ');
  const yearsActive = estYear && !isNaN(Number(estYear))
    ? `${new Date().getFullYear() - Number(estYear)} yrs`
    : null;
  const isOwner = Boolean(
    authUser &&
      authUser.role === 'supplier' &&
      ((supplier?.userId && (authUser.id === String(supplier.userId) || authUser.id === String(supplier.userId?._id))) ||
        (supplierProfile?._id && (supplierProfile._id === supplier?._id || supplierProfile._id === supplierId)))
  );

  const hasCustomBanner = Boolean(
    supplier?.banner && (supplier.banner.desktop || supplier.banner.tablet || supplier.banner.mobile)
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] overflow-x-hidden">

      {/* Modals */}
      {shareData && (
        <ShareModal 
          isOpen={!!shareData}
          title={shareData.title}
          subtitle={shareData.subtitle}
          text={shareData.text}
          url={shareData.url}
          imageUrl={shareData.imageUrl}
          onClose={() => setShareData(null)} 
        />
      )}

      {isOwner && (
        <EditStoreBannerModal
          isOpen={isBannerModalOpen}
          onClose={() => setIsBannerModalOpen(false)}
          initialBanner={supplier?.banner}
          onBannerUpdated={(updatedBanner) => {
            setSupplier((prev: any) => ({
              ...prev,
              banner: updatedBanner,
            }));
          }}
        />
      )}

      {isOwner && (
        <EditStoreLogoModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          currentLogo={supplier?.logo}
          businessName={businessName}
          onLogoUpdated={(newLogo) => {
            setSupplier((prev: any) => ({
              ...prev,
              logo: newLogo,
            }));
          }}
        />
      )}

      {/* ── Banner ──────────────────────────────────────────────── */}
      <div className="relative h-[170px] sm:h-[200px] md:h-[240px] overflow-hidden group/storebanner">
        {hasCustomBanner ? (
          <picture className="absolute inset-0 w-full h-full">
            {supplier.banner?.desktop && (
              <source media="(min-width: 1024px)" srcSet={supplier.banner.desktop} />
            )}
            {supplier.banner?.tablet && (
              <source media="(min-width: 640px)" srcSet={supplier.banner.tablet} />
            )}
            <img
              src={supplier.banner?.mobile || supplier.banner?.tablet || supplier.banner?.desktop}
              alt={`${businessName} Banner`}
              className="w-full h-full object-cover object-center"
            />
          </picture>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#e65c00]" />
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(230,92,0,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,160,50,0.2) 0%, transparent 55%)' }} />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          </>
        )}

        {/* Protection overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/45 pointer-events-none" />

        <div className="absolute top-4 left-4 lg:left-8 z-10">
          <Link to="/" className="text-white/95 font-extrabold text-lg tracking-tight no-underline hover:text-white transition-colors drop-shadow-sm">
            AMJSTAR
          </Link>
        </div>

        <div className="absolute top-4 right-4 lg:right-8 flex items-center gap-2 z-10">
          {isOwner && (
            <>
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="flex items-center gap-1.5 bg-black/55 hover:bg-black/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/30 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                title="Change store logo"
              >
                <Store size={13} className="text-[#fed7aa]" />
                <span>Edit Logo</span>
              </button>
              <button
                onClick={() => setIsBannerModalOpen(true)}
                className="flex items-center gap-1.5 bg-black/55 hover:bg-black/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/30 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                title="Customize store background banners"
              >
                <Camera size={13} className="text-[#fed7aa]" />
                <span>Edit Banner</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShareData({
              url: storeUrl,
              title: businessName,
              subtitle: 'Verified Wholesale Store on AMJSTAR',
              text: `Explore wholesale products from ${businessName} on AMJSTAR.`,
              imageUrl: supplier?.logo || supplier?.banner?.desktop,
            })}
            className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer max-[360px]:px-2"
          >
            <Share2 size={13} /> Share Store
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 lg:px-8">

        {/* Identity Card */}
        <div className="bg-white rounded-[16px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(0,0,0,0.06)] -mt-16 mb-5 relative z-10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#e65c00] to-[#f59e0b] w-full" />
          <div className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
            <div className="relative group/logo w-[72px] h-[72px] md:w-[96px] md:h-[96px] rounded-[14px] bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] border-2 border-[#fed7aa] flex items-center justify-center shrink-0 shadow-sm overflow-hidden select-none">
              {supplier.logo ? (
                <img
                  src={supplier.logo}
                  alt={businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl md:text-3xl font-black text-[#d97706]">{initials}</span>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer border-none"
                  title="Change Store Logo"
                >
                  <Camera size={18} />
                  <span className="text-[10px] font-bold mt-1">Change</span>
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#0f172a] m-0 leading-tight break-words">{businessName}</h1>
                {verifiedByAdmin && (
                  <span className="inline-flex items-center gap-1 bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> Verified Supplier
                  </span>
                )}
                {tier && tier !== 'FREE' && (
                  <span className="inline-flex items-center gap-1 bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    <Star size={10} fill="#c2410c" /> {tier} Member
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#64748b] font-medium mb-3">
                {location && <span className="flex items-center gap-1"><MapPin size={12} />{location}</span>}
                {estYear && <span className="flex items-center gap-1"><Calendar size={12} />Est. {estYear}</span>}
                {gstRegistered && <span className="flex items-center gap-1 text-[#059669]"><CheckCircle size={12} />GST Registered</span>}
                {businessDetails?.isWomenEntrepreneur && <span className="flex items-center gap-1 text-[#7c3aed]"><Award size={12} />Women Entrepreneur</span>}
              </div>
              {(businessDetails?.about || businessDetails?.description) && (
                <p className="text-sm text-[#475569] leading-relaxed line-clamp-2 m-0">
                  {businessDetails.about || businessDetails.description}
                </p>
              )}
            </div>
            <div className="sm:self-center flex gap-2 shrink-0 flex-wrap w-full sm:w-auto">
              <button
                onClick={() => setShareData({
                  url: storeUrl,
                  title: businessName,
                  subtitle: 'Verified Wholesale Store on AMJSTAR',
                  text: `Explore wholesale products from ${businessName} on AMJSTAR.`,
                  imageUrl: supplier?.logo || supplier?.banner?.desktop,
                })}
                className="flex items-center justify-center gap-1.5 bg-[#f1f5f9] text-[#475569] text-sm font-bold px-4 py-2.5 rounded-[10px] hover:bg-[#e2e8f0] transition-colors border-none cursor-pointer"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          <StatPill icon={<Package size={17} />} label="Products Listed" value={`${products.length} Product${products.length !== 1 ? 's' : ''}`} />
          {yearsActive && <StatPill icon={<Building2 size={17} />} label="In Business" value={yearsActive} />}
          {businessDetails?.annualTurnover && (
            <StatPill icon={<TrendingUp size={17} />} label="Annual Turnover" value={`₹${Number(businessDetails.annualTurnover).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          )}
          {businessDetails?.monthlyProductionCapacity && (
            <StatPill icon={<Factory size={17} />} label="Monthly Capacity" value={`${Number(businessDetails.monthlyProductionCapacity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} units`} />
          )}
        </div>

        {/* Two-column */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_288px] gap-6 pb-16 min-w-0">

          {/* LEFT — Catalog */}
          <div className="min-w-0">
            {/* header row */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-extrabold text-[#0f172a] m-0 flex items-center gap-2">
                Product Catalog
                <span className="text-xs font-bold text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-2 py-0.5 rounded-full">
                  {filteredProducts.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {(['grid', 'list'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`w-8 h-8 flex items-center justify-center rounded-[7px] border transition-all cursor-pointer ${viewMode === mode ? 'bg-[#e65c00] text-white border-[#e65c00]' : 'bg-white text-[#94a3b8] border-[#e2e8f0] hover:border-[#e65c00]/40'}`}
                  >
                    {mode === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Category tabs */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto max-w-full pb-3 mb-5" style={{ scrollbarWidth: 'none' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-xs font-bold whitespace-nowrap px-3.5 py-1.5 rounded-full border cursor-pointer transition-all ${activeCategory === cat ? 'bg-[#e65c00] text-white border-[#e65c00] shadow-sm' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-[#e65c00]/40 hover:text-[#e65c00]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {filteredProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                  {filteredProducts.map((p: any) => (
                    <StorefrontProductCard 
                      key={p.id || p._id} 
                      product={{...p, supplierDefaultPaymentTerms: supplier?.defaultPaymentTerms}} 
                      onShare={(product) => {
                        const details = formatProductShareText({
                          name: product.name,
                          price: product.price || product.basePrice,
                          unit: product.unit,
                          moq: product.minOrderQty || product.moq,
                          description: product.description,
                        });
                        const shareUrl = window.location.origin.includes('amjstar.com') && !window.location.origin.includes('www.')
                          ? `https://www.amjstar.com/products/${product.id || product._id}`
                          : `${window.location.origin}/products/${product.id || product._id}`;
                        setShareData({
                          url: shareUrl,
                          title: details.title,
                          subtitle: details.subtitle,
                          text: details.text,
                          imageUrl: product.imageUrl || product.images?.[0],
                        });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredProducts.map((product: any) => (
                    <Link
                      key={product.id || product._id}
                      to={`/products/${product.id || product._id}`}
                      className="bg-white rounded-[12px] border border-[#eef2f6] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 no-underline hover:border-[#e65c00]/30 hover:shadow-[0_2px_12px_rgba(230,92,0,0.08)] transition-all group"
                    >
                      <div className="w-16 h-16 max-[520px]:w-14 max-[520px]:h-14 rounded-[8px] overflow-hidden bg-[#f1f5f9] shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#94a3b8]"><Package size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {product.category && <p className="text-[10px] font-bold uppercase text-[#e65c00] tracking-wide mb-0.5 m-0">{product.category}</p>}
                        <h3 className="text-sm font-bold text-[#0f172a] m-0 truncate">{product.name}</h3>
                        <p className="text-xs text-[#64748b] mt-0.5 m-0">MOQ: {product.minOrderQty || product.moq} {product.unit}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            const details = formatProductShareText({
                              name: product.name,
                              price: product.price || product.basePrice,
                              unit: product.unit,
                              moq: product.minOrderQty || product.moq,
                              description: product.description,
                            });
                            const shareUrl = window.location.origin.includes('amjstar.com') && !window.location.origin.includes('www.')
                              ? `https://www.amjstar.com/products/${product.id || product._id}`
                              : `${window.location.origin}/products/${product.id || product._id}`;
                            setShareData({
                              url: shareUrl,
                              title: details.title,
                              subtitle: details.subtitle,
                              text: details.text,
                              imageUrl: product.imageUrl || product.images?.[0],
                            });
                          }}
                          className="shrink-0 p-1.5 rounded-full text-[#64748b] bg-white border border-[#eef2f6] shadow-sm hover:text-[#e65c00] hover:border-[#fed7aa] hover:bg-[#fff7ed] transition-all cursor-pointer"
                          title="Share Product"
                        >
                          <Share2 size={12} />
                        </button>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-sm font-extrabold text-[#0f172a]">
                            ₹{(product.price || product.basePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {supplier?.defaultPaymentTerms && (
                            <span className="text-[9px] text-[#059669] bg-[#ecfdf5] px-1.5 py-[2px] rounded-sm font-semibold">
                              {supplier.defaultPaymentTerms}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="bg-white rounded-[14px] border border-[#eef2f6] p-8 sm:p-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-4">
                  <Package size={28} className="text-[#94a3b8]" />
                </div>
                <h3 className="text-base font-bold text-[#1e293b] mb-1">No products here yet</h3>
                <p className="text-sm text-[#64748b] m-0">Try switching to a different category.</p>
              </div>
            )}

            {/* About Company Accordion */}
            <div className="mt-8 bg-white rounded-[14px] border border-[#eef2f6] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <button
                onClick={() => setIsAboutOpen(v => !v)}
                className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafbfc] transition-colors border-none bg-transparent"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[7px] bg-[#f1f5f9] flex items-center justify-center">
                    <Building2 size={14} className="text-[#64748b]" />
                  </div>
                  <span className="text-sm font-extrabold text-[#0f172a]">About the Company</span>
                </div>
                <span className="text-[#94a3b8]">{isAboutOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
              </button>

              {isAboutOpen && (
                <div className="border-t border-[#f1f5f9] px-4 sm:px-6 py-5">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xs font-extrabold text-[#94a3b8] uppercase tracking-widest mb-3">Business Overview</h3>
                      <p className="text-sm text-[#475569] leading-relaxed mb-4">
                        {businessDetails?.about || businessDetails?.description || 'No description provided.'}
                      </p>
                      {businessDetails?.ownerName && (
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] text-[#d97706] flex items-center justify-center text-xs font-black">
                            {businessDetails.ownerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide mb-0 m-0">Owner / Contact Person</p>
                            <p className="text-sm font-bold text-[#0f172a] m-0">{businessDetails.ownerName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#94a3b8] uppercase tracking-widest mb-3">Company Details</h3>
                      <div className="space-y-2.5">
                        {estYear && (
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">Year of Establishment</span><span className="font-bold text-[#0f172a]">{estYear}</span></div>
                        )}
                        {businessDetails?.annualTurnover && (
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">Annual Turnover</span><span className="font-bold text-[#0f172a]">₹{Number(businessDetails.annualTurnover).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        )}
                        {businessDetails?.monthlyProductionCapacity && (
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">Monthly Production</span><span className="font-bold text-[#0f172a]">{Number(businessDetails.monthlyProductionCapacity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} units</span></div>
                        )}
                        {gstRegistered && (
                          <div className="flex justify-between gap-3 text-sm"><span className="text-[#64748b]">GST</span><span className="text-xs font-bold text-[#059669]">Registered ✓</span></div>
                        )}
                        {businessDetails?.fssaiLicenseNumber && (
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">FSSAI License</span><span className="font-bold text-[#0f172a]">{businessDetails.fssaiLicenseNumber}</span></div>
                        )}
                        {businessDetails?.isWomenEntrepreneur && (
                          <div className="flex items-center gap-2 mt-1">
                            <Award size={14} className="text-[#7c3aed]" />
                            <span className="text-sm text-[#7c3aed] font-semibold">Women-led Enterprise</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">

            {/* Contact Card */}
            <div className="bg-white rounded-[14px] border border-[#eef2f6] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-[#f1f5f9]">
                <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Contact Supplier</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {/* {businessDetails?.email && <InfoRow icon={<Mail size={14} />} text={businessDetails.email} href={`mailto:${businessDetails.email}`} />} */}
                {location && <InfoRow icon={<MapPin size={14} />} text={location + (businessDetails?.pinCode ? ` - ${businessDetails.pinCode}` : '')} />}
                {businessDetails?.website && <InfoRow icon={<Globe size={14} />} text={businessDetails.website.replace(/^https?:\/\//, '')} href={businessDetails.website} />}
              </div>
              <div className="px-5 pb-4">
                <p className="text-[11px] text-[#94a3b8] m-0 text-center">Select a product below to enquire</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-[14px] border border-[#eef2f6] shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-5">
              <h3 className="text-xs font-extrabold text-[#94a3b8] uppercase tracking-widest mb-3 m-0">Trust & Verifications</h3>
              <div className="space-y-2.5">
                {verifiedByAdmin && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#ecfdf5] flex items-center justify-center shrink-0"><ShieldCheck size={14} className="text-[#059669]" /></div>
                    <div><p className="font-bold text-[#0f172a] m-0 text-xs">AMJSTAR Verified</p><p className="text-[#64748b] text-[11px] m-0">Identity & KYC verified</p></div>
                  </div>
                )}
                {gstRegistered && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#f0fdf4] flex items-center justify-center shrink-0"><CheckCircle size={14} className="text-[#16a34a]" /></div>
                    <div><p className="font-bold text-[#0f172a] m-0 text-xs">GST Registered</p><p className="text-[#64748b] text-[11px] m-0">Valid GSTIN on record</p></div>
                  </div>
                )}
                {businessDetails?.isWomenEntrepreneur && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#f5f3ff] flex items-center justify-center shrink-0"><Award size={14} className="text-[#7c3aed]" /></div>
                    <div><p className="font-bold text-[#0f172a] m-0 text-xs">Women-led Enterprise</p><p className="text-[#64748b] text-[11px] m-0">Certified by AMJSTAR</p></div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#fff7ed] flex items-center justify-center shrink-0"><Store size={14} className="text-[#d97706]" /></div>
                  <div><p className="font-bold text-[#0f172a] m-0 text-xs">Active Supplier</p><p className="text-[#64748b] text-[11px] m-0">Member since {new Date(createdAt).getFullYear()}</p></div>
                </div>
              </div>
            </div>

            {/* Share Store Card */}
            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-[14px] p-5 text-white">
              <p className="text-sm font-bold mb-1 m-0">Share this Store</p>
              <p className="text-xs text-white/60 mb-3 m-0">Help others discover this supplier</p>
              <button
                onClick={() => setShareData({
                  url: storeUrl,
                  title: businessName,
                  subtitle: 'Verified Wholesale Store on AMJSTAR',
                  text: `Explore wholesale products from ${businessName} on AMJSTAR.`,
                  imageUrl: supplier?.logo || supplier?.banner?.desktop,
                })}
                className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold py-2.5 rounded-[8px] hover:bg-white/20 transition-all cursor-pointer"
              >
                <Share2 size={13} /> Share on Social Media
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-[#94a3b8] m-0">
                Powered by <Link to="/" className="font-bold text-[#e65c00] no-underline hover:underline">AMJSTAR</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicStoreFront;
