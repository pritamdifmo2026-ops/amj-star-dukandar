import React, { useState, useEffect } from 'react';
import { Eye, Package, Copy, CheckCircle, Share2, ExternalLink, MessageCircle, Camera, TrendingUp, ToggleLeft, ToggleRight, Tag, ChevronRight, Sparkles, Globe, Palette, Upload, Megaphone } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setResellerProfile } from '../store/reseller.slice';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';

const sectionCls = "bg-white rounded-[10px] border border-[#eef2f6] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]";

const ResellerStorefront: React.FC = () => {
  const { profile } = useAppSelector(state => state.reseller);
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Storefront appearance settings
  const [bannerImage, setBannerImage] = useState(profile?.storefront?.bannerImage || '');
  const [themeColor, setThemeColor] = useState(profile?.storefront?.themeColor || '#e65c00');
  const [announcement, setAnnouncement] = useState(profile?.storefront?.announcement || '');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const storeName = profile?.storeName || 'My Store';
  const storeSlug = profile?.storeSlug ||
    (profile?.storeName || user?.name || 'reseller').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const storeUrl = `${window.location.origin}/store/${storeSlug}`;

  useEffect(() => { loadProducts(); }, []);

  useEffect(() => {
    setBannerImage(profile?.storefront?.bannerImage || '');
    setThemeColor(profile?.storefront?.themeColor || '#e65c00');
    setAnnouncement(profile?.storefront?.announcement || '');
  }, [profile?.storefront]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const data = await resellerService.uploadDoc(file);
      setBannerImage(data.url);
    } catch (err) { console.error('Banner upload failed', err); }
    finally { setUploadingBanner(false); e.target.value = ''; }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await resellerService.updateStorefrontSettings({ bannerImage, themeColor, announcement });
      if (profile) {
        dispatch(setResellerProfile({ ...profile, storefront: { bannerImage, themeColor, announcement } }));
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) { console.error('Failed to save storefront settings', err); }
    finally { setSavingSettings(false); }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await resellerService.getRequests();
      const approved = (data.requests || [])
        .filter((r: any) => r.status === 'APPROVED')
        .map((r: any) => ({ ...r, visible: r.visible === true, sellingPrice: r.sellingPrice || r.product?.basePrice || 0 }));
      setProducts(approved);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const toggleVisibility = async (id: string) => {
    const productToToggle = products.find(p => p._id === id);
    if (!productToToggle) return;
    const newVisible = !productToToggle.visible;
    setProducts(prev => prev.map(p => p._id === id ? { ...p, visible: newVisible } : p));
    try {
      await resellerService.updateProductCustomization(id, { visible: newVisible });
    } catch {
      setProducts(prev => prev.map(p => p._id === id ? { ...p, visible: !newVisible } : p));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const visibleProducts = products.filter(p => p.visible);
  const categories = [...new Set(products.map(p => p.product?.category).filter(Boolean))];

  return (
    <div className="flex flex-col gap-5">
      {/* Status Banner */}
      <div className="flex items-center justify-between bg-[#ecfdf5] border border-[#6ee7b7] rounded-[12px] p-5 max-sm:flex-col max-sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-[#10b981] rounded-full animate-pulse" />
          <div>
            <h2 className="text-base font-extrabold text-[#065f46] m-0 mb-0.5">Your Store is Live on AMJSTAR</h2>
            <p className="text-sm text-[#059669] m-0">Buyers can discover and purchase from your curated storefront</p>
          </div>
        </div>
        <a href={storeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#6ee7b7] text-[#059669] font-semibold text-sm rounded-[8px] no-underline hover:bg-[#d1fae5] transition-colors">
          <Eye size={16} /> View My Store <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-5 max-lg:grid-cols-1">
        {/* Left Column */}
        <div className="flex flex-col gap-5">
          {/* Store Preview Card */}
          <div className={sectionCls}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary text-white rounded-[10px] flex items-center justify-center text-xl font-extrabold shrink-0">
                {storeName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#0f172a] m-0">{storeName}</h3>
                <span className="text-xs text-[#64748b]">{profile?.fullName || user?.name}</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#6ee7b7] px-2 py-1 rounded-full">
                <Globe size={10} /> LIVE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 min-h-[100px]">
              {loading ? (
                <div className="col-span-3 flex items-center justify-center text-sm text-[#94a3b8]">Loading products...</div>
              ) : visibleProducts.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center gap-2 py-6 text-[#94a3b8]">
                  <Package size={32} />
                  <p className="text-xs text-center m-0">No visible products yet.<br />Toggle products on below.</p>
                </div>
              ) : (
                visibleProducts.slice(0, 6).map(req => (
                  <div key={req._id} className="flex flex-col rounded-[6px] overflow-hidden border border-[#f1f5f9]">
                    {req.product?.images?.[0] ? (
                      <img src={req.product.images[0]} alt={req.customTitle || req.product.name} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]"><Package size={18} /></div>
                    )}
                    <div className="p-1.5">
                      <span className="text-[10px] font-semibold text-[#1e293b] line-clamp-1 block">{req.customTitle || req.product?.name}</span>
                      <span className="text-[10px] font-bold text-primary">₹{req.sellingPrice}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#64748b] pt-3 border-t border-[#f1f5f9]">
              <span className="flex items-center gap-1"><Package size={12} /> {visibleProducts.length} products visible</span>
              <span className="flex items-center gap-1"><Tag size={12} /> {categories.length} categories</span>
            </div>
          </div>

          {/* Share Card */}
          <div className={sectionCls}>
            <div className="flex items-start gap-3 mb-4">
              <Share2 size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-0.5">Share Your Store</h4>
                <p className="text-xs text-[#64748b] m-0">Send this link to your network and let them buy directly from you</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 mb-4">
              <span className="flex-1 text-xs text-[#475569] truncate">{storeUrl}</span>
              <button className="flex items-center gap-1 text-xs font-bold text-primary shrink-0 bg-none border-none cursor-pointer" onClick={copyLink}>
                {copied ? <><CheckCircle size={14} className="text-[#059669]" /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a href={`https://wa.me/?text=Shop%20from%20my%20store%20on%20AMJSTAR%3A%20${encodeURIComponent(storeUrl)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25d366] text-white font-semibold text-xs rounded-[8px] no-underline hover:opacity-90 transition-opacity">
                <MessageCircle size={15} /> Share on WhatsApp
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-semibold text-xs rounded-[8px] no-underline hover:opacity-90 transition-opacity">
                <Camera size={15} /> Share on Instagram
              </a>
            </div>
          </div>

          {/* Appearance Settings Card */}
          <div className={sectionCls}>
            <div className="flex items-start gap-3 mb-4">
              <Palette size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-0.5">Storefront Appearance</h4>
                <p className="text-xs text-[#64748b] m-0">Customize your public store's banner, colour and announcement</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Banner Image</label>
                {bannerImage ? (
                  <div className="relative rounded-[8px] overflow-hidden border border-[#e2e8f0] mb-2">
                    <img src={bannerImage} alt="Store banner" className="w-full h-24 object-cover" />
                    <button
                      className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 text-[#dc2626] px-2 py-1 rounded border-none cursor-pointer"
                      onClick={() => setBannerImage('')}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-[#cbd5e1] rounded-[8px] text-xs font-semibold text-[#64748b] cursor-pointer hover:border-primary hover:text-primary transition-colors">
                  <Upload size={14} /> {uploadingBanner ? 'Uploading...' : bannerImage ? 'Replace Banner' : 'Upload Banner'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploadingBanner} />
                </label>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Theme Colour</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="w-10 h-10 rounded-[8px] border border-[#e2e8f0] cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#e2e8f0] rounded-[8px] text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5 flex items-center gap-1"><Megaphone size={11} /> Store Announcement</label>
                <textarea
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="e.g. Festive offer! Free delivery on bulk orders this month."
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-[8px] text-xs resize-none focus:outline-none focus:border-primary"
                />
              </div>

              <Button onClick={saveSettings} disabled={savingSettings || uploadingBanner} className="w-full flex items-center justify-center gap-2">
                {settingsSaved ? <><CheckCircle size={15} /> Saved!</> : savingSettings ? 'Saving...' : 'Save Layout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Package size={18} />, val: visibleProducts.length, label: 'Visible Products' },
              { icon: <Tag size={18} />, val: categories.length, label: 'Categories' },
              { icon: <TrendingUp size={18} />, val: profile?.subscriptionPlan || 'Standard', label: 'Your Plan' },
            ].map(({ icon, val, label }) => (
              <div key={label} className="bg-white border border-[#eef2f6] rounded-[10px] p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="text-primary shrink-0">{icon}</div>
                <div>
                  <h4 className="text-lg font-extrabold text-[#0f172a] m-0 leading-none">{val}</h4>
                  <span className="text-xs text-[#64748b]">{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Products List */}
          <div className={`${sectionCls} flex-1`}>
            <div className="mb-4">
              <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#0f172a] m-0 mb-0.5"><Sparkles size={15} className="text-primary" /> Products in Store</h4>
              <span className="text-xs text-[#64748b]">Toggle visibility, adjust margin, or reorder</span>
            </div>

            {loading ? (
              <div className="text-sm text-[#94a3b8] py-6 text-center">Loading...</div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-[#64748b]">
                <Package size={36} />
                <p className="text-sm text-center m-0">No approved products yet.<br />Browse products and request them from suppliers.</p>
                <Button variant="outline" onClick={() => window.location.href = '/reseller/dashboard?tab=browse'}>Browse Products</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {products.map(req => {
                  const base = req.product?.basePrice || 0;
                  const selling = req.sellingPrice || base;
                  const margin = selling - base;
                  return (
                    <div key={req._id} className={`flex items-center gap-3 p-3 rounded-[8px] border transition-all ${!req.visible ? 'opacity-50 bg-[#f8fafc] border-[#e2e8f0]' : 'bg-white border-[#eef2f6] hover:border-[#cbd5e1]'}`}>
                      <div className="w-10 h-10 rounded-[6px] overflow-hidden shrink-0">
                        {req.product?.images?.[0] ? (
                          <img src={req.product.images[0]} alt={req.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]"><Package size={14} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-[#1e293b] block truncate">{req.customTitle || req.product?.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#94a3b8] line-through">₹{base}</span>
                          <ChevronRight size={10} className="text-[#94a3b8]" />
                          <span className="text-[10px] font-bold text-primary">₹{selling}</span>
                          <span className="text-[10px] text-[#059669] font-semibold">+₹{margin}</span>
                        </div>
                      </div>
                      <button
                        className={`p-1 rounded border-none cursor-pointer transition-colors ${req.visible ? 'text-primary bg-[#fff7ed]' : 'text-[#94a3b8] bg-[#f1f5f9]'}`}
                        onClick={() => toggleVisibility(req._id)}
                        title={req.visible ? 'Hide from store' : 'Show in store'}
                      >
                        {req.visible ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResellerStorefront;
