import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Store, MapPin, Globe, Mail, Phone, ShieldCheck, ChevronDown, ChevronUp,
  Package, Calendar, TrendingUp, Award, Building2, ArrowUpRight,
  Factory, Star, CheckCircle, MessageCircle, Share2, Copy, Check,
  LayoutGrid, List, X, Instagram, Facebook, Twitter,
} from 'lucide-react';
import api from '@/api/client';
import Button from '@/shared/components/ui/Button';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/shared/constants/routes';

/* ─── Share Modal ────────────────────────────────────────────────────── */
const ShareModal: React.FC<{ url: string; name: string; onClose: () => void }> = ({ url, name, onClose }) => {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`Check out ${name} on AMJSTAR!`);

  const platforms = [
    {
      label: 'WhatsApp',
      color: '#25d366',
      bg: '#dcfce7',
      textColor: '#15803d',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#25d366"/><path d="M22.5 9.5C20.8 7.8 18.5 6.9 16 6.9c-5.1 0-9.2 4.1-9.2 9.2 0 1.6.4 3.2 1.2 4.6L6.8 25.2l4.6-1.2c1.3.7 2.8 1.1 4.3 1.1 5.1 0 9.2-4.1 9.2-9.2 0-2.5-.9-4.8-2.4-6.4zm-6.5 14.1c-1.4 0-2.7-.4-3.9-1l-.3-.2-3 .8.8-2.9-.2-.3c-.7-1.2-1.1-2.5-1.1-3.9 0-4.2 3.4-7.5 7.5-7.5 2 0 3.9.8 5.3 2.2 1.4 1.4 2.2 3.3 2.2 5.3.2 4.2-3.2 7.5-7.3 7.5zm4.1-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.2-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.4 0-.2 0-.3-.1-.5-.1-.2-.5-1.3-.7-1.7-.2-.4-.4-.3-.5-.3-.1 0-.3 0-.5 0s-.5.1-.7.3c-.2.2-.9.9-.9 2.1 0 1.3.9 2.5 1.1 2.7.1.2 1.9 2.9 4.5 4 .6.3 1.1.4 1.5.5.6.2 1.2.1 1.6-.1.5-.3.8-.7.9-1.2.1-.3.1-.6 0-.8l-.2-.2z" fill="white"/></svg>
      ),
    },
    {
      label: 'Instagram',
      color: '#e1306c',
      bg: '#fce7f3',
      textColor: '#be185d',
      href: `https://www.instagram.com/`,
      note: '(copy link & paste in bio)',
      icon: <Instagram size={20} className="text-[#e1306c]" />,
    },
    {
      label: 'Facebook',
      color: '#1877f2',
      bg: '#dbeafe',
      textColor: '#1d4ed8',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook size={20} className="text-[#1877f2]" />,
    },
    {
      label: 'X (Twitter)',
      color: '#14171a',
      bg: '#f1f5f9',
      textColor: '#0f172a',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: <Twitter size={20} className="text-[#0f172a]" />,
    },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[3px] p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Share this Store</h3>
            <p className="text-xs text-[#94a3b8] m-0 mt-0.5">Spread the word about {name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:bg-[#e2e8f0] transition-colors cursor-pointer border-none"
          >
            <X size={15} />
          </button>
        </div>

        {/* platform buttons */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          {platforms.map(p => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-3 rounded-[12px] no-underline border border-[#e2e8f0] hover:scale-[1.02] active:scale-[0.98] transition-transform"
              style={{ background: p.bg }}
            >
              <span className="shrink-0">{p.icon}</span>
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight" style={{ color: p.textColor }}>{p.label}</span>
                {p.note && <span className="text-[10px] text-[#94a3b8] leading-tight block">{p.note}</span>}
              </div>
            </a>
          ))}
        </div>

        {/* copy link */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-3 py-2.5">
            <span className="text-xs text-[#475569] truncate flex-1 font-mono">{url}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-bold text-[#e65c00] bg-white border border-[#fed7aa] px-2.5 py-1.5 rounded-[7px] cursor-pointer hover:bg-[#fff7ed] transition-colors shrink-0 whitespace-nowrap"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Storefront Product Card (Enquire Now variant) ─────────────────── */
const StorefrontProductCard: React.FC<{ product: any }> = ({ product }) => {
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
        <h3 className="text-[11px] sm:text-xs font-semibold text-[#0f172a] m-0 line-clamp-2 leading-[1.45] flex-1 mb-2">
          {product.name}
        </h3>
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs sm:text-sm font-extrabold text-[#0f172a]">
            ₹{(product.price || product.basePrice || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-medium">
            MOQ: {product.minOrderQty || product.moq} {product.unit}
          </span>
        </div>
        <button
          onClick={handleEnquire}
          className="w-full text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 rounded-[8px] bg-[#fff7ed] text-[#e65c00] border border-[#fed7aa] hover:bg-[#e65c00] hover:text-white transition-all cursor-pointer"
        >
          Enquire Now
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
  const id = routeId || idOrSlug;

  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showShareModal, setShowShareModal] = useState(false);

  const storeUrl = window.location.href;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, productsRes] = await Promise.all([
          api.get(`/supplier/public/${id}`),
          api.get(`/products?supplierId=${id}`),
        ]);
        setSupplier(profileRes.data.supplier);
        setProducts(productsRes.data.products || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load storefront');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

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

  const { businessName, businessDetails, verifiedByAdmin, tier, createdAt } = supplier;
  const estYear = businessDetails?.yearOfEstablishment;
  const initials = businessName?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '??';
  const location = [businessDetails?.city, businessDetails?.state].filter(Boolean).join(', ');
  const yearsActive = estYear && !isNaN(Number(estYear))
    ? `${new Date().getFullYear() - Number(estYear)} yrs`
    : null;

  return (
    <div className="min-h-screen bg-[#f1f5f9] overflow-x-hidden">

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          url={storeUrl}
          name={businessName}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* ── Banner ──────────────────────────────────────────────── */}
      <div className="relative h-[170px] sm:h-[200px] md:h-[240px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#e65c00]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(230,92,0,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,160,50,0.2) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="absolute top-4 left-4 lg:left-8">
          <Link to="/" className="text-white/90 font-extrabold text-lg tracking-tight no-underline hover:text-white transition-colors">AMJSTAR</Link>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="absolute top-4 right-4 lg:right-8 flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer max-[360px]:px-2"
        >
          <Share2 size={13} /> Share Store
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 lg:px-8">

        {/* Identity Card */}
        <div className="bg-white rounded-[16px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(0,0,0,0.06)] -mt-16 mb-5 relative z-10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#e65c00] to-[#f59e0b] w-full" />
          <div className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
            <div className="w-[72px] h-[72px] md:w-[96px] md:h-[96px] rounded-[14px] bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] border-2 border-[#fed7aa] flex items-center justify-center text-2xl md:text-3xl font-black text-[#d97706] shrink-0 shadow-sm select-none">
              {initials}
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
                {businessDetails?.gstin && <span className="flex items-center gap-1 text-[#059669]"><CheckCircle size={12} />GST Registered</span>}
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
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center gap-1.5 bg-[#f1f5f9] text-[#475569] text-sm font-bold px-3 py-2.5 rounded-[10px] hover:bg-[#e2e8f0] transition-colors border-none cursor-pointer max-sm:w-11"
              >
                <Share2 size={14} />
              </button>
              <a
                href={businessDetails?.email ? `mailto:${businessDetails.email}` : '#'}
                className="flex items-center justify-center gap-2 bg-[#e65c00] hover:bg-[#c2410c] text-white text-sm font-bold px-4 py-2.5 rounded-[10px] transition-colors no-underline flex-1 sm:flex-none"
              >
                <MessageCircle size={15} /> Contact Supplier
              </a>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          <StatPill icon={<Package size={17} />} label="Products Listed" value={`${products.length} Product${products.length !== 1 ? 's' : ''}`} />
          {yearsActive && <StatPill icon={<Building2 size={17} />} label="In Business" value={yearsActive} />}
          {businessDetails?.annualTurnover && (
            <StatPill icon={<TrendingUp size={17} />} label="Annual Turnover" value={`₹${Number(businessDetails.annualTurnover).toLocaleString('en-IN')}`} />
          )}
          {businessDetails?.monthlyProductionCapacity && (
            <StatPill icon={<Factory size={17} />} label="Monthly Capacity" value={`${Number(businessDetails.monthlyProductionCapacity).toLocaleString()} units`} />
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
                  {filteredProducts.map((product: any) => (
                    <StorefrontProductCard key={product.id || product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredProducts.map((product: any) => (
                    <Link
                      key={product.id || product._id}
                      to={`/products/${product.id || product._id}`}
                      className="bg-white rounded-[12px] border border-[#eef2f6] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 no-underline hover:border-[#e65c00]/30 hover:shadow-[0_2px_12px_rgba(230,92,0,0.08)] transition-all"
                    >
                      <div className="w-16 h-16 max-[520px]:w-14 max-[520px]:h-14 rounded-[8px] overflow-hidden bg-[#f1f5f9] shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#94a3b8]"><Package size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {product.category && <p className="text-[10px] font-bold uppercase text-[#e65c00] tracking-wide mb-0.5 m-0">{product.category}</p>}
                        <h3 className="text-sm font-bold text-[#0f172a] m-0 truncate">{product.name}</h3>
                        <p className="text-xs text-[#64748b] mt-0.5 m-0">MOQ: {product.minOrderQty || product.moq} {product.unit}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-[#0f172a] m-0">₹{(product.price || product.basePrice || 0).toLocaleString('en-IN')}</p>
                        <span className="text-xs text-[#e65c00] font-bold">Enquire →</span>
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
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">Annual Turnover</span><span className="font-bold text-[#0f172a]">₹{Number(businessDetails.annualTurnover).toLocaleString('en-IN')}</span></div>
                        )}
                        {businessDetails?.monthlyProductionCapacity && (
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">Monthly Production</span><span className="font-bold text-[#0f172a]">{Number(businessDetails.monthlyProductionCapacity).toLocaleString()} units</span></div>
                        )}
                        {businessDetails?.gstin && (
                          <div className="flex justify-between gap-3 text-sm max-sm:flex-col max-sm:gap-1"><span className="text-[#64748b]">GSTIN</span><span className="font-mono text-xs font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded break-all">{businessDetails.gstin}</span></div>
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
                {supplier.phone && <InfoRow icon={<Phone size={14} />} text={supplier.phone} href={`tel:${supplier.phone}`} />}
                {businessDetails?.email && <InfoRow icon={<Mail size={14} />} text={businessDetails.email} href={`mailto:${businessDetails.email}`} />}
                {location && <InfoRow icon={<MapPin size={14} />} text={location + (businessDetails?.pinCode ? ` - ${businessDetails.pinCode}` : '')} />}
                {businessDetails?.website && <InfoRow icon={<Globe size={14} />} text={businessDetails.website.replace(/^https?:\/\//, '')} href={businessDetails.website} />}
              </div>
              <div className="px-5 pb-5">
                <a
                  href={businessDetails?.email ? `mailto:${businessDetails.email}` : '#'}
                  className="block text-center bg-[#e65c00] hover:bg-[#c2410c] text-white text-sm font-bold py-2.5 rounded-[10px] no-underline transition-colors"
                >
                  Send Enquiry
                </a>
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
                {businessDetails?.gstin && (
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
                onClick={() => setShowShareModal(true)}
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
