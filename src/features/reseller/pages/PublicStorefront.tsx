import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Store, MapPin, Globe, Mail, ShieldCheck, ChevronDown, ChevronUp,
  Package, Calendar, TrendingUp, Award, Building2, ArrowUpRight,
  Factory, Star, CheckCircle, Share2, Copy, Check,
  LayoutGrid, List, X, Instagram, Facebook, Twitter, PhoneCall, Send, ShoppingBag, CheckCircle2
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import resellerService, { type PublicStoreData } from '../services/reseller.service';
import { useAppSelector } from '@/store/hooks';

type StoreProduct = PublicStoreData['products'][number];

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
const PublicStorefront: React.FC = () => {
  const { slug: routeSlug, idOrSlug } = useParams<{ slug?: string; idOrSlug?: string }>();
  const slug = routeSlug || idOrSlug || '';
  const navigate = useNavigate();

  const [data, setData] = useState<PublicStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showShareModal, setShowShareModal] = useState(false);

  // Lead form state
  const [leadProduct, setLeadProduct] = useState<StoreProduct | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ customerName: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Auth and Checkout State
  const isAuthenticated = useAppSelector((state: any) => state.auth.isAuthenticated);
  const authUser = useAppSelector((state: any) => state.auth.user);
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<StoreProduct | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({ 
    quantity: 1, 
    address: { fullAddress: '', city: '', state: '', pincode: '' } 
  });
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');

  const storeUrl = window.location.href;

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const storeData = await resellerService.getPublicStore(slug);
        setData(storeData);
      } catch (error) {
        console.error('Failed to load store', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchStore();
  }, [slug]);

  const store = data?.store;
  const products = data?.products || [];
  const themeColor = store?.storefront?.themeColor || '#e65c00';
  const storeName = store?.storeName || 'Reseller Store';

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
    return ['All', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() =>
    activeCategory === 'All' ? products : products.filter((p: any) => p.category === activeCategory),
    [products, activeCategory]
  );

  const openLeadModal = (product: StoreProduct | null) => {
    setLeadProduct(product);
    setLeadError('');
    setLeadSuccess(false);
    setShowLeadModal(true);
  };

  const submitLead = async () => {
    setLeadError('');
    if (!leadForm.customerName.trim() || !leadForm.phone.trim()) {
      setLeadError('Please enter your name and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      await resellerService.submitStoreLead(slug, {
        customerName: leadForm.customerName,
        phone: leadForm.phone,
        email: leadForm.email || undefined,
        message: leadForm.message || undefined,
        partnershipId: leadProduct?.partnershipId,
        productName: leadProduct?.name,
      });
      setLeadSuccess(true);
      setLeadForm({ customerName: '', phone: '', email: '', message: '' });
    } catch (err: any) {
      setLeadError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCheckoutModal = (product: StoreProduct) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setCheckoutProduct(product);
    setCheckoutForm({
      quantity: product.moq || 1,
      address: authUser?.address || { fullAddress: '', city: '', state: '', pincode: '' }
    });
    setCheckoutError('');
    setCheckoutSuccess('');
    setShowCheckoutModal(true);
  };

  const submitCheckout = async () => {
    setCheckoutError('');
    if (!checkoutForm.address.fullAddress.trim() || !checkoutForm.address.city.trim() || !checkoutForm.address.pincode.trim()) {
      setCheckoutError('Please provide a complete delivery address.');
      return;
    }
    if (checkoutForm.quantity < (checkoutProduct?.moq || 1)) {
      setCheckoutError(`Minimum order quantity is ${checkoutProduct?.moq || 1}`);
      return;
    }
    setSubmitting(true);
    try {
      await resellerService.submitStoreOrder(slug, {
        partnershipId: checkoutProduct?.partnershipId,
        quantity: checkoutForm.quantity,
        addressSnapshot: checkoutForm.address,
      });
      setCheckoutSuccess('Order placed successfully! The reseller will process it shortly.');
    } catch (err: any) {
      setCheckoutError(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton />;

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center px-4">
        <div className="bg-white rounded-[20px] border border-[#eef2f6] p-12 shadow-sm max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#fef2f2] flex items-center justify-center mx-auto mb-5">
            <Store size={36} className="text-[#fca5a5]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0f172a] mb-2">Store Not Found</h1>
          <p className="text-sm text-[#64748b] mb-6">This storefront doesn't exist or isn't live yet. It may still be under review.</p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/')}>← Back to AMJSTAR</Button>
        </div>
      </div>
    );
  }

  const initials = storeName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'RS';
  const location = [store.city, store.state].filter(Boolean).join(', ');
  const yearsActive = store.createdAt ? `${new Date().getFullYear() - new Date(store.createdAt).getFullYear()} yrs` : null;

  return (
    <div className="min-h-screen bg-[#f1f5f9] overflow-x-hidden">

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          url={storeUrl}
          name={storeName}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* ── Banner ──────────────────────────────────────────────── */}
      <div className="relative h-[170px] sm:h-[200px] md:h-[240px] overflow-hidden" style={{ backgroundColor: themeColor }}>
        {store.storefront?.bannerImage ? (
          <img src={store.storefront.bannerImage} alt={`${storeName} banner`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/20 mix-blend-overlay" />
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />
            <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          </>
        )}

        <div className="absolute top-4 left-4 lg:left-8">
          <Link to="/" className="text-white font-extrabold text-lg tracking-tight no-underline hover:text-white/80 transition-colors drop-shadow-md">AMJSTAR</Link>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="absolute top-4 right-4 lg:right-8 flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-white/30 transition-all cursor-pointer max-[360px]:px-2 shadow-sm"
        >
          <Share2 size={13} /> Share Store
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 lg:px-8">

        {/* Identity Card */}
        <div className="bg-white rounded-[16px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(0,0,0,0.06)] -mt-16 mb-5 relative z-10 overflow-hidden">
          <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${themeColor}, #f59e0b)` }} />
          <div className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
            <div className="w-[72px] h-[72px] md:w-[96px] md:h-[96px] rounded-[14px] overflow-hidden shrink-0 shadow-sm border-2" style={{ borderColor: themeColor }}>
              {store.profileImage ? (
                <img src={store.profileImage} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-black text-white select-none" style={{ backgroundColor: themeColor }}>
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#0f172a] m-0 leading-tight break-words">{storeName}</h1>
                <span className="inline-flex items-center gap-1 bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <ShieldCheck size={11} /> Verified AMJSTAR Reseller
                </span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#64748b] font-medium mb-3">
                {location && <span className="flex items-center gap-1"><MapPin size={12} />{location}</span>}
                {store.createdAt && <span className="flex items-center gap-1"><Calendar size={12} />Joined {new Date(store.createdAt).getFullYear()}</span>}
              </div>
              <p className="text-sm text-[#475569] leading-relaxed line-clamp-2 m-0">
                {store.storefront?.announcement || store.profileDescription || 'A curated selection of verified products.'}
              </p>
            </div>
            <div className="sm:self-center flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => openLeadModal(null)}
                className="flex items-center justify-center gap-1.5 text-white text-sm font-bold px-5 py-2.5 rounded-[10px] transition-all cursor-pointer border-none shadow-sm hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                <PhoneCall size={15} /> Contact Reseller
              </button>
              <button
                onClick={() => setShowShareModal(true)}
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
          {yearsActive && yearsActive !== '0 yrs' && <StatPill icon={<Building2 size={17} />} label="In Business" value={yearsActive} />}
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
                    className={`w-8 h-8 flex items-center justify-center rounded-[7px] border transition-all cursor-pointer ${viewMode === mode ? 'text-white' : 'bg-white text-[#94a3b8] border-[#e2e8f0]'}`}
                    style={viewMode === mode ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
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
                    className={`text-xs font-bold whitespace-nowrap px-3.5 py-1.5 rounded-full border cursor-pointer transition-all ${activeCategory === cat ? 'text-white shadow-sm' : 'bg-white text-[#475569] border-[#e2e8f0]'}`}
                    style={activeCategory === cat ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
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
                    <div key={product.partnershipId} className="flex flex-col bg-white rounded-[12px] border border-[#eef2f6] overflow-hidden transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] group">
                      <div className="relative aspect-[4/3] sm:aspect-square bg-[#f8fafc] overflow-hidden cursor-pointer" onClick={() => openCheckoutModal(product)}>
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
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
                          <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase tracking-wide bg-white/90 border px-1.5 py-0.5 rounded-full backdrop-blur-sm" style={{ color: themeColor, borderColor: themeColor }}>
                            {product.category}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
                        <h3 className="text-[11px] sm:text-xs font-semibold text-[#0f172a] m-0 line-clamp-2 leading-[1.45] flex-1 mb-2">
                          {product.name}
                        </h3>
                        <div className="flex items-baseline justify-between mb-3">
                          <span className="text-xs sm:text-sm font-extrabold" style={{ color: themeColor }}>
                            ₹{(product.price || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-medium">
                            MOQ: {product.moq || 1} {product.unit}
                          </span>
                        </div>
                        </div>
                        <div className="flex flex-col gap-1.5 w-full mt-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); openCheckoutModal(product); }}
                            className="w-full text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 rounded-[8px] text-white hover:opacity-90 transition-all cursor-pointer border-none shadow-sm"
                            style={{ backgroundColor: themeColor }}
                          >
                            Buy Now
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openLeadModal(product); }}
                            className="w-full text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 rounded-[8px] bg-[#fff7ed] text-[#e65c00] border border-[#fed7aa] hover:bg-[#e65c00] hover:text-white transition-all cursor-pointer"
                          >
                            For Bulk Purchase
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredProducts.map((product: any) => (
                    <div
                      key={product.partnershipId}
                      className="bg-white rounded-[12px] border border-[#eef2f6] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all"
                    >
                      <div className="w-16 h-16 max-[520px]:w-14 max-[520px]:h-14 rounded-[8px] overflow-hidden bg-[#f1f5f9] shrink-0 cursor-pointer" onClick={() => openCheckoutModal(product)}>
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#94a3b8]"><Package size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {product.category && <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 m-0" style={{ color: themeColor }}>{product.category}</p>}
                        <h3 className="text-sm font-bold text-[#0f172a] m-0 truncate">{product.name}</h3>
                        <p className="text-xs text-[#64748b] mt-0.5 m-0">MOQ: {product.moq || 1} {product.unit}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <p className="text-base font-extrabold m-0" style={{ color: themeColor }}>₹{(product.price || 0).toLocaleString('en-IN')}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={(e) => { e.stopPropagation(); openCheckoutModal(product); }} className="text-[11px] font-bold text-white px-4 py-1.5 rounded-[6px] cursor-pointer hover:opacity-90 transition-all border-none shadow-sm" style={{ backgroundColor: themeColor }}>Buy Now</button>
                          <button onClick={(e) => { e.stopPropagation(); openLeadModal(product); }} className="text-[11px] font-bold bg-[#fff7ed] text-[#e65c00] border border-[#fed7aa] px-3 py-1.5 rounded-[6px] cursor-pointer hover:bg-[#e65c00] hover:text-white transition-all">For Bulk Purchase</button>
                        </div>
                      </div>
                    </div>
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
                  <span className="text-sm font-extrabold text-[#0f172a]">About the Store</span>
                </div>
                <span className="text-[#94a3b8]">{isAboutOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
              </button>

              {isAboutOpen && (
                <div className="border-t border-[#f1f5f9] px-4 sm:px-6 py-5">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xs font-extrabold text-[#94a3b8] uppercase tracking-widest mb-3">Store Overview</h3>
                      <p className="text-sm text-[#475569] leading-relaxed mb-4">
                        {store.profileDescription || 'No description provided.'}
                      </p>
                      {store.fullName && (
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] text-[#d97706] flex items-center justify-center text-xs font-black">
                            {store.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide mb-0 m-0">Store Owner</p>
                            <p className="text-sm font-bold text-[#0f172a] m-0">{store.fullName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#94a3b8] uppercase tracking-widest mb-3">Store Details</h3>
                      <div className="space-y-2.5">
                        {store.createdAt && (
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">Joined AMJSTAR</span><span className="font-bold text-[#0f172a]">{new Date(store.createdAt).getFullYear()}</span></div>
                        )}
                        {location && (
                          <div className="flex justify-between text-sm"><span className="text-[#64748b]">Location</span><span className="font-bold text-[#0f172a]">{location}</span></div>
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
                <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Contact Reseller</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {location && <InfoRow icon={<MapPin size={14} />} text={location} />}
                <button
                  onClick={() => openLeadModal(null)}
                  className="w-full flex items-center justify-center gap-2 text-white text-xs font-bold py-2.5 rounded-[8px] transition-all cursor-pointer border-none shadow-sm hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  <PhoneCall size={14} /> Send an Enquiry
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-[14px] border border-[#eef2f6] shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-5">
              <h3 className="text-xs font-extrabold text-[#94a3b8] uppercase tracking-widest mb-3 m-0">Trust & Verifications</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#ecfdf5] flex items-center justify-center shrink-0"><ShieldCheck size={14} className="text-[#059669]" /></div>
                  <div><p className="font-bold text-[#0f172a] m-0 text-xs">AMJSTAR Verified</p><p className="text-[#64748b] text-[11px] m-0">Identity & KYC verified</p></div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#fff7ed] flex items-center justify-center shrink-0"><Store size={14} className="text-[#d97706]" /></div>
                  <div><p className="font-bold text-[#0f172a] m-0 text-xs">Active Reseller</p><p className="text-[#64748b] text-[11px] m-0">Member since {store.createdAt ? new Date(store.createdAt).getFullYear() : 'Now'}</p></div>
                </div>
              </div>
            </div>

            {/* Share Store Card */}
            <div className="rounded-[14px] p-5 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] relative overflow-hidden" style={{ backgroundColor: themeColor }}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <p className="text-sm font-bold mb-1 m-0">Share this Store</p>
                <p className="text-xs text-white/80 mb-3 m-0">Help others discover this reseller</p>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white/20 border border-white/30 text-white text-xs font-bold py-2.5 rounded-[8px] hover:bg-white/30 transition-all cursor-pointer backdrop-blur-sm"
                >
                  <Share2 size={13} /> Share on Social Media
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-[#94a3b8] m-0">
                Powered by <Link to="/" className="font-bold no-underline hover:underline" style={{ color: themeColor }}>AMJSTAR</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lead / Contact modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowLeadModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 m-0">Contact {storeName}</h3>
                {leadProduct && <span className="text-xs text-gray-500">Enquiring about: {leadProduct.name}</span>}
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border-none bg-transparent cursor-pointer" onClick={() => setShowLeadModal(false)}>
                <X size={18} />
              </button>
            </div>

            {leadSuccess ? (
              <div className="p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 size={30} />
                </div>
                <h4 className="text-lg font-extrabold text-gray-900 m-0">Enquiry Sent!</h4>
                <p className="text-sm text-gray-500 m-0">{storeName} has received your details and will contact you shortly.</p>
                <button onClick={() => setShowLeadModal(false)} className="px-6 py-2 rounded-lg text-white font-bold cursor-pointer border-none mt-2" style={{ backgroundColor: themeColor }}>Done</button>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    value={leadForm.customerName}
                    onChange={e => setLeadForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Email (optional)</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Message (optional)</label>
                  <textarea
                    value={leadForm.message}
                    onChange={e => setLeadForm(f => ({ ...f, message: e.target.value }))}
                    rows={3}
                    maxLength={2000}
                    placeholder="Quantity needed, questions, delivery location..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {leadError && <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{leadError}</div>}

                <button onClick={submitLead} disabled={submitting} className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-lg font-bold cursor-pointer border-none disabled:opacity-70 mt-2" style={{ backgroundColor: themeColor }}>
                  <Send size={15} /> {submitting ? 'Sending...' : 'Send Enquiry'}
                </button>
                <p className="text-[10px] text-gray-400 text-center m-0">Your details are shared only with this reseller.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Complete Purchase" maxWidth="md">
        {checkoutSuccess ? (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 size={32}/></div>
            <h3 className="text-xl font-bold text-gray-900 m-0">Order Placed!</h3>
            <p className="text-gray-500 m-0 text-sm">{checkoutSuccess}</p>
            <Button onClick={() => setShowCheckoutModal(false)} className="mt-4 w-full" style={{ backgroundColor: themeColor }}>Continue Shopping</Button>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="flex gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                <img src={checkoutProduct?.images?.[0]} alt={checkoutProduct?.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 m-0 text-sm line-clamp-2">{checkoutProduct?.name}</h4>
                <p className="font-extrabold m-0 mt-1.5 text-lg" style={{ color: themeColor }}>₹{checkoutProduct?.price?.toLocaleString('en-IN')} <span className="text-xs text-gray-500 font-normal">/ {checkoutProduct?.unit}</span></p>
                <p className="text-[10px] text-gray-500 m-0 mt-0.5">MOQ: {checkoutProduct?.moq} {checkoutProduct?.unit}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Quantity ({checkoutProduct?.unit})</label>
                <input
                  type="number"
                  min={checkoutProduct?.moq || 1}
                  value={checkoutForm.quantity}
                  onChange={e => setCheckoutForm(f => ({ ...f, quantity: parseInt(e.target.value) || f.quantity }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Delivery Address</label>
                <div className="space-y-2.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <input type="text" placeholder="Full Address (Street, House No)" value={checkoutForm.address.fullAddress} onChange={e => setCheckoutForm(f => ({ ...f, address: { ...f.address, fullAddress: e.target.value } }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input type="text" placeholder="City" value={checkoutForm.address.city} onChange={e => setCheckoutForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                    <input type="text" placeholder="State" value={checkoutForm.address.state} onChange={e => setCheckoutForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <input type="text" placeholder="Pincode" value={checkoutForm.address.pincode} onChange={e => setCheckoutForm(f => ({ ...f, address: { ...f.address, pincode: e.target.value } }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
              </div>
            </div>

            {checkoutError && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600"/>{checkoutError}</div>}

            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex justify-between items-end mb-4 bg-[#f8fafc] p-4 rounded-lg border border-gray-100">
                <span className="text-sm font-bold text-gray-600">Total Amount</span>
                <span className="text-2xl font-black text-gray-900">₹{((checkoutProduct?.price || 0) * checkoutForm.quantity).toLocaleString('en-IN')}</span>
              </div>
              <button 
                onClick={submitCheckout} 
                disabled={submitting} 
                className="w-full py-3.5 rounded-lg text-white font-bold cursor-pointer border-none disabled:opacity-70 transition-opacity flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                <ShoppingBag size={18} /> {submitting ? 'Processing...' : 'Place Direct Order'}
              </button>
              <p className="text-[10px] font-medium text-gray-400 text-center mt-3 mb-0">Payment and delivery will be coordinated directly with {storeName}.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PublicStorefront;
