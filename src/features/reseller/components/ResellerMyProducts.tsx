import React, { useState, useEffect, useRef } from 'react';
import { Package, Building, Tag, CheckCircle, Clock, XCircle, AlertCircle, Eye, EyeOff, Edit3, BarChart2, ChevronRight, X, TrendingUp, ShoppingCart, Percent, DollarSign, Info, Sparkles } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';

interface ProductRequest {
  _id: string; status: 'APPROVED' | 'PENDING' | 'REJECTED'; rejectionReason?: string;
  product?: { _id: string; name: string; basePrice: number; images?: string[]; description?: string; moq?: number; category?: string; };
  supplier?: { businessName: string; };
  customTitle?: string; customDescription?: string; highlights?: string[];
  sellingPrice?: number; visible?: boolean; views?: number; orders?: number;
}

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] bg-[#f8fafc] outline-none focus:border-primary";
const tabBtnCls = (active: boolean) => `px-5 py-2.5 text-sm font-bold border-b-2 cursor-pointer transition-all flex items-center gap-2 ${active ? 'border-primary text-primary' : 'border-transparent text-[#64748b] hover:text-[#1e293b]'}`;

const ResellerMyProducts: React.FC = () => {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [drawerProduct, setDrawerProduct] = useState<ProductRequest | null>(null);
  const [drawerTab, setDrawerTab] = useState<'pricing' | 'customize' | 'info' | 'performance'>('pricing');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editMarginPct, setEditMarginPct] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHighlights, setEditHighlights] = useState('');
  const [saving, setSaving] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchMyProducts(); }, []);

  useEffect(() => {
    if (drawerProduct) {
      const base = drawerProduct.product?.basePrice || 0;
      const selling = drawerProduct.sellingPrice || base;
      setEditSellingPrice(String(selling));
      const margin = base > 0 ? Math.round(((selling - base) / base) * 100) : 0;
      setEditMarginPct(String(margin));
      setEditTitle(drawerProduct.customTitle || drawerProduct.product?.name || '');
      setEditDesc(drawerProduct.customDescription || drawerProduct.product?.description || '');
      setEditHighlights((drawerProduct.highlights || []).join('\n'));
    }
  }, [drawerProduct]);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const data = await resellerService.getRequests();
      const hydrated = (data.requests || []).map((r: ProductRequest) => ({ ...r, sellingPrice: r.sellingPrice || r.product?.basePrice || 0, visible: r.visible === true, views: r.views || 0, orders: r.orders || 0 }));
      setRequests(hydrated);
    } catch (err) { console.error('Failed to fetch my products', err); }
    finally { setLoading(false); }
  };

  const updateLocal = (id: string, patch: Partial<ProductRequest>) => {
    setRequests(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r));
    if (drawerProduct?._id === id) setDrawerProduct(prev => prev ? { ...prev, ...patch } : prev);
  };

  const toggleVisibility = async (req: ProductRequest) => {
    const newVisible = !req.visible;
    updateLocal(req._id, { visible: newVisible });
    try { await resellerService.updateProductCustomization(req._id, { visible: newVisible }); }
    catch { updateLocal(req._id, { visible: !newVisible }); }
  };

  const openDrawer = (req: ProductRequest, tab: typeof drawerTab = 'pricing') => { setDrawerProduct(req); setDrawerTab(tab); };
  const closeDrawer = () => setDrawerProduct(null);

  const getBasePrice = () => drawerProduct?.product?.basePrice || 0;
  const getSellingPrice = () => parseFloat(editSellingPrice) || getBasePrice();
  const getMargin = () => getSellingPrice() - getBasePrice();
  const getMarginPct = () => getBasePrice() > 0 ? ((getMargin() / getBasePrice()) * 100).toFixed(1) : '0';

  const onSellingPriceChange = (v: string) => { setEditSellingPrice(v); const sp = parseFloat(v) || 0; const base = getBasePrice(); if (base > 0) setEditMarginPct(String(Math.round(((sp - base) / base) * 100))); };
  const onMarginPctChange = (v: string) => { setEditMarginPct(v); const pct = parseFloat(v) || 0; const base = getBasePrice(); setEditSellingPrice(String(Math.round(base * (1 + pct / 100)))); };

  const saveDrawer = async () => {
    if (!drawerProduct) return;
    setSaving(true);
    const highlights = editHighlights.split('\n').filter(h => h.trim());
    const patch: Partial<ProductRequest> = { sellingPrice: parseFloat(editSellingPrice), customTitle: editTitle, customDescription: editDesc, highlights };
    updateLocal(drawerProduct._id, patch);
    try { await resellerService.updateProductCustomization(drawerProduct._id, patch); }
    catch { alert('Failed to save changes. Please try again.'); }
    finally { setSaving(false); closeDrawer(); }
  };

  const approvedProducts = requests.filter(r => r.status === 'APPROVED');
  const pendingOrRejectedProducts = requests.filter(r => r.status === 'PENDING' || r.status === 'REJECTED');
  const pendingCount = pendingOrRejectedProducts.filter(p => p.status === 'PENDING').length;
  const conversionRate = (req: ProductRequest) => !req.views || req.views === 0 ? '0%' : (((req.orders || 0) / req.views) * 100).toFixed(1) + '%';

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#64748b]">
      <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
      <p className="text-sm">Loading your product control panel...</p>
    </div>
  );

  return (
    <div>
      <header className="mb-5">
        <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Product Control Panel</h2>
        <p className="text-sm text-[#64748b] m-0">Set pricing, manage visibility, and customize how your products appear to buyers.</p>
      </header>

      <div className="flex border-b border-[#eef2f6] mb-6">
        <button className={tabBtnCls(activeTab === 'approved')} onClick={() => setActiveTab('approved')}>
          Active in Storefront
          <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{approvedProducts.length}</span>
        </button>
        <button className={tabBtnCls(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
          Requests &amp; Status
          {pendingCount > 0 && <span className="bg-[#dc2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
        </button>
      </div>

      {activeTab === 'approved' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {approvedProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-20 text-[#64748b]">
              <Package size={48} strokeWidth={1.5} />
              <h3 className="text-lg font-bold text-[#1e293b] m-0">No approved products yet</h3>
              <p className="text-sm text-center m-0">Go to Browse Products, find something to sell, and request it from the supplier.</p>
            </div>
          ) : approvedProducts.map(req => {
            const base = req.product?.basePrice || 0;
            const selling = req.sellingPrice || base;
            const margin = selling - base;
            return (
              <div key={req._id} className={`bg-white rounded-[12px] border overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex flex-col transition-all ${!req.visible ? 'opacity-60 border-[#e2e8f0]' : 'border-[#eef2f6] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]'}`}>
                <div className="relative">
                  {req.product?.images?.[0] ? (
                    <img src={req.product.images[0]} alt={req.customTitle || req.product.name} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]"><Package size={40} /></div>
                  )}
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#ecfdf5] text-[#059669] text-[10px] font-bold px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Active</span>
                  {!req.visible && <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center text-white font-bold text-sm gap-2"><EyeOff size={18} /> Hidden</div>}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="text-sm font-bold text-[#0f172a] m-0 line-clamp-2">{req.customTitle || req.product?.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center"><span className="text-[10px] text-[#94a3b8]">Supplier</span><span className="text-xs font-bold">₹{base}</span></div>
                    <ChevronRight size={12} className="text-[#94a3b8]" />
                    <div className="flex flex-col items-center"><span className="text-[10px] text-[#94a3b8]">Your Price</span><span className="text-xs font-bold text-primary">₹{selling}</span></div>
                    <span className="flex items-center gap-0.5 bg-[#ecfdf5] text-[#059669] text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto"><TrendingUp size={10} />+₹{margin}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#94a3b8]">
                    <span className="flex items-center gap-0.5"><Eye size={10} /> {req.views} views</span>
                    <span className="flex items-center gap-0.5"><ShoppingCart size={10} /> {req.orders} orders</span>
                    <span className="flex items-center gap-0.5"><Percent size={10} /> {conversionRate(req)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-auto">
                    <button className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-[6px] text-xs font-semibold border cursor-pointer transition-colors ${req.visible ? 'bg-[#ecfdf5] text-[#059669] border-[#6ee7b7]' : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'}`} onClick={() => toggleVisibility(req)}>
                      {req.visible ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Hidden</>}
                    </button>
                    <button className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-[6px] text-xs font-semibold border border-[#e2e8f0] bg-[#f8fafc] text-[#475569] cursor-pointer hover:border-primary hover:text-primary" onClick={() => openDrawer(req, 'pricing')}>
                      <Tag size={12} /> Pricing
                    </button>
                    <button className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-[6px] text-xs font-semibold border border-[#e2e8f0] bg-[#f8fafc] text-[#475569] cursor-pointer hover:border-primary hover:text-primary" onClick={() => openDrawer(req, 'customize')}>
                      <Edit3 size={12} /> Customize
                    </button>
                    <button className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-[6px] text-xs font-semibold border border-[#e2e8f0] bg-[#f8fafc] text-[#475569] cursor-pointer hover:border-primary hover:text-primary" onClick={() => openDrawer(req, 'performance')}>
                      <BarChart2 size={12} /> Stats
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="flex flex-col gap-3">
          {pendingOrRejectedProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-[#64748b]">
              <Clock size={48} strokeWidth={1.5} />
              <h3 className="text-lg font-bold text-[#1e293b] m-0">No pending requests</h3>
              <p className="text-sm m-0">You haven't made any requests recently.</p>
            </div>
          ) : pendingOrRejectedProducts.map(req => (
            <div key={req._id} className="bg-white border border-[#eef2f6] rounded-[10px] p-4 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-sm:flex-col max-sm:items-start">
              <div className="flex items-center gap-3 flex-1">
                {req.product?.images?.[0] ? (
                  <img src={req.product.images[0]} alt={req.product.name} className="w-14 h-14 rounded-[8px] object-cover border border-[#f1f5f9] shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-[8px] bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] shrink-0">IMG</div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-0.5">{req.product?.name}</h4>
                  <span className="flex items-center gap-1 text-xs text-[#64748b]"><Building size={11} /> {req.supplier?.businessName}</span>
                  {req.product?.basePrice && <span className="text-xs font-bold text-primary mt-0.5 block">₹{req.product.basePrice}</span>}
                </div>
              </div>
              <div>
                {req.status === 'PENDING' ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-[#fff7ed] text-[#c2410c] px-3 py-1.5 rounded-full"><Clock size={13} /> Waiting for supplier approval</span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-[#fef2f2] text-[#dc2626] px-3 py-1.5 rounded-full"><XCircle size={13} /> Rejected by Supplier</span>
                    {req.rejectionReason && (
                      <div className="flex items-start gap-1 text-xs text-[#64748b] bg-[#f8fafc] px-3 py-2 rounded-[6px]">
                        <AlertCircle size={12} className="shrink-0 mt-0.5" /> {req.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerProduct && (
        <>
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-40" onClick={closeDrawer} />
          <div ref={drawerRef} className="fixed top-0 right-0 h-full w-[400px] max-sm:w-full bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.12)] z-50 flex flex-col overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-[#eef2f6]">
              <div>
                <h3 className="text-base font-bold text-[#0f172a] m-0">{drawerProduct.customTitle || drawerProduct.product?.name}</h3>
                <p className="text-xs text-[#64748b] m-0 mt-0.5">{drawerProduct.supplier?.businessName}</p>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569] border-none cursor-pointer hover:bg-[#e2e8f0]" onClick={closeDrawer}><X size={18} /></button>
            </div>

            <div className="flex border-b border-[#eef2f6]">
              {(['pricing', 'customize', 'info', 'performance'] as const).map(t => (
                <button key={t} className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${drawerTab === t ? 'border-primary text-primary' : 'border-transparent text-[#64748b] hover:text-[#1e293b]'}`} onClick={() => setDrawerTab(t)}>
                  {t === 'pricing' && <><DollarSign size={13} /> Pricing</>}
                  {t === 'customize' && <><Sparkles size={13} /> Customize</>}
                  {t === 'info' && <><Info size={13} /> Info</>}
                  {t === 'performance' && <><BarChart2 size={13} /> Stats</>}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {drawerTab === 'pricing' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Supplier Price', val: `₹${getBasePrice()}`, sub: 'Fixed. Your cost.', cls: 'bg-[#f8fafc]' },
                      { label: 'Your Price', val: `₹${getSellingPrice()}`, sub: 'Buyer sees this', cls: 'bg-[#fff7ed] border border-[#fed7aa]' },
                      { label: 'Your Margin', val: `+₹${getMargin().toFixed(0)}`, sub: `${getMarginPct()}% profit`, cls: 'bg-[#ecfdf5]' },
                    ].map(({ label, val, sub, cls }) => (
                      <div key={label} className={`${cls} rounded-[10px] p-3 text-center`}>
                        <label className="text-[10px] text-[#94a3b8] font-bold block mb-1">{label}</label>
                        <span className="text-base font-extrabold text-[#0f172a] block">{val}</span>
                        <small className="text-[10px] text-[#64748b]">{sub}</small>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#475569]">Set Selling Price (₹)</label>
                      <div className="flex items-center border border-[#e2e8f0] rounded-[8px] overflow-hidden bg-[#f8fafc] focus-within:border-primary">
                        <span className="px-3 py-2.5 text-sm text-[#94a3b8] border-r border-[#e2e8f0]">₹</span>
                        <input className="flex-1 border-none outline-none px-3 py-2.5 text-sm bg-transparent" type="number" value={editSellingPrice} onChange={e => onSellingPriceChange(e.target.value)} min={getBasePrice()} placeholder="e.g. 130" />
                      </div>
                      <small className="text-xs text-[#94a3b8]">Minimum: ₹{getBasePrice()} (supplier price)</small>
                    </div>
                    <div className="text-center text-xs font-bold text-[#94a3b8]">— OR —</div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#475569]">Set Margin %</label>
                      <div className="flex items-center border border-[#e2e8f0] rounded-[8px] overflow-hidden bg-[#f8fafc] focus-within:border-primary">
                        <input className="flex-1 border-none outline-none px-3 py-2.5 text-sm bg-transparent" type="number" value={editMarginPct} onChange={e => onMarginPctChange(e.target.value)} min={0} placeholder="e.g. 30" />
                        <span className="px-3 py-2.5 text-sm text-[#94a3b8] border-l border-[#e2e8f0]">%</span>
                      </div>
                      <small className="text-xs text-[#94a3b8]">Adjusts your selling price automatically</small>
                    </div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[10px] p-4 flex flex-col gap-2 text-sm">
                    {[['Supplier Price', `₹${getBasePrice()}`], ['Your Selling Price', `₹${getSellingPrice()}`]].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[#475569]"><span>{k}</span><span>{v}</span></div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t border-[#e2e8f0] text-[#059669]">
                      <span>Your Margin</span><span>+₹{getMargin().toFixed(0)} ({getMarginPct()}%)</span>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'customize' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Product Title <span className="text-[#94a3b8] font-normal">(optional override)</span></label>
                    <input className={inputCls} type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder={drawerProduct.product?.name} />
                    <small className="text-xs text-[#94a3b8]">Change how this product appears in your storefront</small>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Description Tweak <span className="text-[#94a3b8] font-normal">(optional)</span></label>
                    <textarea className={`${inputCls} resize-none`} value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} placeholder="Describe this product for your customers..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#475569]">Highlight Points <span className="text-[#94a3b8] font-normal">(one per line)</span></label>
                    <textarea className={`${inputCls} resize-none`} value={editHighlights} onChange={e => setEditHighlights(e.target.value)} rows={4} placeholder={"Premium quality fabric\nWash-resistant dye\nBulk discount available"} />
                    <small className="text-xs text-[#94a3b8]">These appear as bullet points on your product listing.</small>
                  </div>
                </div>
              )}

              {drawerTab === 'info' && (
                <div className="flex flex-col gap-3">
                  {[
                    ['Supplier', drawerProduct.supplier?.businessName || '—'],
                    ['Base / Cost Price', `₹${drawerProduct.product?.basePrice || '—'}`],
                    ['Minimum Order Qty (MOQ)', `${drawerProduct.product?.moq || '1'} units`],
                    ['Category', drawerProduct.product?.category || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2.5 border-b border-[#f1f5f9] text-sm">
                      <label className="text-[#94a3b8] font-semibold">{label}</label>
                      <span className="font-bold text-[#1e293b]">{val}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 bg-[#f8fafc] rounded-[8px] px-3 py-2.5 text-xs text-[#64748b] mt-2">
                    <Info size={13} className="shrink-0 mt-0.5" />
                    <span>Supplier info is internal only — buyers will not see this.</span>
                  </div>
                </div>
              )}

              {drawerTab === 'performance' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Eye size={22} />, val: drawerProduct.views || 0, label: 'Total Views' },
                      { icon: <ShoppingCart size={22} />, val: drawerProduct.orders || 0, label: 'Orders Placed' },
                      { icon: <Percent size={22} />, val: conversionRate(drawerProduct), label: 'Conversion Rate' },
                      { icon: <TrendingUp size={22} />, val: `₹${((drawerProduct.orders || 0) * ((drawerProduct.sellingPrice || 0) - (drawerProduct.product?.basePrice || 0))).toFixed(0)}`, label: 'Est. Margin Earned' },
                    ].map(({ icon, val, label }) => (
                      <div key={label} className="bg-[#f8fafc] rounded-[10px] p-4 flex flex-col items-center gap-2 text-center border border-[#eef2f6]">
                        <div className="text-primary">{icon}</div>
                        <h4 className="text-xl font-extrabold text-[#0f172a] m-0">{val}</h4>
                        <span className="text-xs text-[#64748b]">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 bg-[#f8fafc] rounded-[8px] px-3 py-2.5 text-xs text-[#64748b]">
                    <BarChart2 size={13} className="shrink-0 mt-0.5" />
                    <span>Performance data reflects the last 30 days. Analytics are updated daily.</span>
                  </div>
                </div>
              )}
            </div>

            {(drawerTab === 'pricing' || drawerTab === 'customize') && (
              <div className="flex gap-3 p-4 border-t border-[#eef2f6]">
                <button className="flex-1 px-4 py-2.5 bg-white border border-[#e2e8f0] text-[#475569] font-semibold text-sm rounded-[8px] cursor-pointer hover:bg-[#f8fafc]" onClick={closeDrawer}>Cancel</button>
                <Button onClick={saveDrawer} loading={saving} className="flex-1">Save Changes</Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ResellerMyProducts;
