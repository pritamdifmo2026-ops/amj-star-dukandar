import React, { useState, useEffect, useRef } from 'react';
import {
  Package, Building, Tag, CheckCircle, Clock, XCircle, AlertCircle,
  Eye, EyeOff, Edit3, BarChart2, ChevronRight, X, TrendingUp,
  ShoppingCart, Percent, DollarSign, Info, Sparkles
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';
import styles from './ResellerMyProducts.module.css';

interface ProductRequest {
  _id: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  product?: {
    _id: string;
    name: string;
    basePrice: number;
    images?: string[];
    description?: string;
    moq?: number;
    category?: string;
  };
  supplier?: {
    businessName: string;
  };
  // Reseller customizations stored locally (would be persisted to backend in full impl)
  customTitle?: string;
  customDescription?: string;
  highlights?: string[];
  sellingPrice?: number;
  visible?: boolean;
  views?: number;
  orders?: number;
}

const ResellerMyProducts: React.FC = () => {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [drawerProduct, setDrawerProduct] = useState<ProductRequest | null>(null);
  const [drawerTab, setDrawerTab] = useState<'pricing' | 'customize' | 'info' | 'performance'>('pricing');

  // Drawer form state
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editMarginPct, setEditMarginPct] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHighlights, setEditHighlights] = useState('');
  const [saving, setSaving] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  // Sync drawer form when product changes
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
      // Hydrate with defaults (using 0 for analytics until backend supports it)
      const hydrated = (data.requests || []).map((r: ProductRequest) => ({
        ...r,
        sellingPrice: r.sellingPrice || r.product?.basePrice || 0,
        visible: r.visible === true,
        views: r.views || 0,
        orders: r.orders || 0,
      }));
      setRequests(hydrated);
    } catch (err) {
      console.error('Failed to fetch my products', err);
    } finally {
      setLoading(false);
    }
  };

  const updateLocal = (id: string, patch: Partial<ProductRequest>) => {
    setRequests(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r));
    if (drawerProduct?._id === id) {
      setDrawerProduct(prev => prev ? { ...prev, ...patch } : prev);
    }
  };

  const toggleVisibility = async (req: ProductRequest) => {
    const newVisible = !req.visible;
    // Optimistic UI update
    updateLocal(req._id, { visible: newVisible });
    try {
      await resellerService.updateProductCustomization(req._id, { visible: newVisible });
    } catch (error) {
      console.error('Failed to update visibility', error);
      // Revert if failed
      updateLocal(req._id, { visible: !newVisible });
    }
  };

  const openDrawer = (req: ProductRequest, tab: typeof drawerTab = 'pricing') => {
    setDrawerProduct(req);
    setDrawerTab(tab);
  };

  const closeDrawer = () => setDrawerProduct(null);

  // Pricing calculations
  const getBasePrice = () => drawerProduct?.product?.basePrice || 0;
  const getSellingPrice = () => parseFloat(editSellingPrice) || getBasePrice();
  const getMargin = () => getSellingPrice() - getBasePrice();
  const getMarginPct = () => getBasePrice() > 0 ? ((getMargin() / getBasePrice()) * 100).toFixed(1) : '0';

  const onSellingPriceChange = (v: string) => {
    setEditSellingPrice(v);
    const sp = parseFloat(v) || 0;
    const base = getBasePrice();
    if (base > 0) setEditMarginPct(String(Math.round(((sp - base) / base) * 100)));
  };

  const onMarginPctChange = (v: string) => {
    setEditMarginPct(v);
    const pct = parseFloat(v) || 0;
    const base = getBasePrice();
    setEditSellingPrice(String(Math.round(base * (1 + pct / 100))));
  };

  const saveDrawer = async () => {
    if (!drawerProduct) return;
    setSaving(true);
    const highlights = editHighlights.split('\n').filter(h => h.trim());
    const patch: Partial<ProductRequest> = {
      sellingPrice: parseFloat(editSellingPrice),
      customTitle: editTitle,
      customDescription: editDesc,
      highlights,
    };
    
    // Optimistic update
    updateLocal(drawerProduct._id, patch);

    try {
      // Persist to backend
      await resellerService.updateProductCustomization(drawerProduct._id, patch);
    } catch (error) {
      console.error('Failed to save customizations', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
      closeDrawer();
    }
  };

  const approvedProducts = requests.filter(r => r.status === 'APPROVED');
  const pendingOrRejectedProducts = requests.filter(r => r.status === 'PENDING' || r.status === 'REJECTED');
  const pendingCount = pendingOrRejectedProducts.filter(p => p.status === 'PENDING').length;

  const conversionRate = (req: ProductRequest) => {
    if (!req.views || req.views === 0) return '0%';
    return ((( req.orders || 0) / req.views) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your product control panel...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Product Control Panel</h2>
          <p>Set pricing, manage visibility, and customize how your products appear to buyers.</p>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'approved' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Active in Storefront
          <span className={styles.badge}>{approvedProducts.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Requests & Status
          {pendingCount > 0 && <span className={styles.pendingBadge}>{pendingCount}</span>}
        </button>
      </div>

      {/* ── APPROVED: Product Control Panel ── */}
      {activeTab === 'approved' && (
        <div className={styles.grid}>
          {approvedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <Package size={48} />
              <h3>No approved products yet</h3>
              <p>Go to Browse Products, find something to sell, and request it from the supplier.</p>
            </div>
          ) : (
            approvedProducts.map(req => {
              const base = req.product?.basePrice || 0;
              const selling = req.sellingPrice || base;
              const margin = selling - base;
              const conv = conversionRate(req);

              return (
                <div key={req._id} className={`${styles.card} ${!req.visible ? styles.cardHidden : ''}`}>
                  {/* Image */}
                  <div className={styles.imageContainer}>
                    {req.product?.images?.[0] ? (
                      <img src={req.product.images[0]} alt={req.customTitle || req.product.name} />
                    ) : (
                      <div className={styles.placeholderImage}><Package size={40} /></div>
                    )}
                    <div className={styles.statusBadgeApproved}><CheckCircle size={12} /> Active</div>
                    {!req.visible && <div className={styles.hiddenOverlay}><EyeOff size={20} /> Hidden</div>}
                  </div>

                  <div className={styles.cardContent}>
                    <h3 className={styles.productName}>{req.customTitle || req.product?.name}</h3>

                    {/* Pricing Summary */}
                    <div className={styles.pricingRow}>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Supplier</span>
                        <span className={styles.priceValue}>₹{base}</span>
                      </div>
                      <ChevronRight size={14} className={styles.arrow} />
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Your Price</span>
                        <span className={`${styles.priceValue} ${styles.yourPrice}`}>₹{selling}</span>
                      </div>
                      <div className={styles.marginChip}>
                        <TrendingUp size={12} />+₹{margin}
                      </div>
                    </div>

                    {/* Performance micro-stats */}
                    <div className={styles.microStats}>
                      <span><Eye size={12} /> {req.views} views</span>
                      <span><ShoppingCart size={12} /> {req.orders} orders</span>
                      <span><Percent size={12} /> {conv}</span>
                    </div>

                    {/* Actions */}
                    <div className={styles.cardActions}>
                      <button
                        className={`${styles.actionBtn} ${!req.visible ? styles.actionBtnOff : ''}`}
                        onClick={() => toggleVisibility(req)}
                        title={req.visible ? 'Hide from storefront' : 'Show in storefront'}
                      >
                        {req.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        {req.visible ? 'Visible' : 'Hidden'}
                      </button>
                      <button className={styles.actionBtn} onClick={() => openDrawer(req, 'pricing')}>
                        <Tag size={14} /> Pricing
                      </button>
                      <button className={styles.actionBtn} onClick={() => openDrawer(req, 'customize')}>
                        <Edit3 size={14} /> Customize
                      </button>
                      <button className={styles.actionBtn} onClick={() => openDrawer(req, 'performance')}>
                        <BarChart2 size={14} /> Stats
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── PENDING / REJECTED ── */}
      {activeTab === 'pending' && (
        <div className={styles.list}>
          {pendingOrRejectedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={48} />
              <h3>No pending requests</h3>
              <p>You haven't made any requests recently.</p>
            </div>
          ) : (
            pendingOrRejectedProducts.map(req => (
              <div key={req._id} className={styles.requestItem}>
                <div className={styles.reqProduct}>
                  {req.product?.images?.[0] ? (
                    <img src={req.product.images[0]} alt={req.product.name} className={styles.reqImg} />
                  ) : (
                    <div className={styles.reqPlaceholder}>IMG</div>
                  )}
                  <div>
                    <h4>{req.product?.name}</h4>
                    <span className={styles.reqSupplier}><Building size={12} /> {req.supplier?.businessName}</span>
                    {req.product?.basePrice && (
                      <span className={styles.reqPrice}>₹{req.product.basePrice}</span>
                    )}
                  </div>
                </div>
                <div className={styles.reqStatus}>
                  {req.status === 'PENDING' ? (
                    <span className={styles.statusPending}><Clock size={16} /> Waiting for supplier approval</span>
                  ) : (
                    <div className={styles.rejectedContainer}>
                      <span className={styles.statusRejected}><XCircle size={16} /> Rejected by Supplier</span>
                      {req.rejectionReason && (
                        <div className={styles.rejectionReason}>
                          <AlertCircle size={12} /> {req.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══ DRAWER ══ */}
      {drawerProduct && (
        <>
          <div className={styles.drawerBackdrop} onClick={closeDrawer} />
          <div className={styles.drawer} ref={drawerRef}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 className={styles.drawerTitle}>{drawerProduct.customTitle || drawerProduct.product?.name}</h3>
                <p className={styles.drawerSub}>{drawerProduct.supplier?.businessName}</p>
              </div>
              <button className={styles.drawerClose} onClick={closeDrawer}><X size={20} /></button>
            </div>

            <div className={styles.drawerTabs}>
              {(['pricing', 'customize', 'info', 'performance'] as const).map(t => (
                <button
                  key={t}
                  className={`${styles.drawerTab} ${drawerTab === t ? styles.drawerTabActive : ''}`}
                  onClick={() => setDrawerTab(t)}
                >
                  {t === 'pricing' && <><DollarSign size={14} /> Pricing</>}
                  {t === 'customize' && <><Sparkles size={14} /> Customize</>}
                  {t === 'info' && <><Info size={14} /> Product Info</>}
                  {t === 'performance' && <><BarChart2 size={14} /> Performance</>}
                </button>
              ))}
            </div>

            <div className={styles.drawerBody}>

              {/* ── Pricing Tab ── */}
              {drawerTab === 'pricing' && (
                <div className={styles.pricingPanel}>
                  <div className={styles.priceDisplay}>
                    <div className={styles.priceBlock}>
                      <label>Supplier Price</label>
                      <span className={styles.supplierPriceVal}>₹{getBasePrice()}</span>
                      <small>Fixed. Your cost.</small>
                    </div>
                    <div className={styles.priceArrow}>→</div>
                    <div className={`${styles.priceBlock} ${styles.priceBlockHighlight}`}>
                      <label>Your Price</label>
                      <span className={styles.yourPriceVal}>₹{getSellingPrice()}</span>
                      <small>Buyer sees this</small>
                    </div>
                    <div className={`${styles.priceBlock} ${styles.priceBlockMargin}`}>
                      <label>Your Margin</label>
                      <span className={styles.marginVal}>+₹{getMargin().toFixed(0)}</span>
                      <small>{getMarginPct()}% profit</small>
                    </div>
                  </div>

                  <div className={styles.priceInputs}>
                    <div className={styles.inputGroup}>
                      <label>Set Selling Price (₹)</label>
                      <div className={styles.inputPrefix}>
                        <span>₹</span>
                        <input
                          type="number"
                          value={editSellingPrice}
                          onChange={e => onSellingPriceChange(e.target.value)}
                          min={getBasePrice()}
                          placeholder="e.g. 130"
                        />
                      </div>
                      <small>Minimum: ₹{getBasePrice()} (supplier price)</small>
                    </div>
                    <div className={styles.inputDivider}>OR</div>
                    <div className={styles.inputGroup}>
                      <label>Set Margin %</label>
                      <div className={styles.inputPrefix}>
                        <input
                          type="number"
                          value={editMarginPct}
                          onChange={e => onMarginPctChange(e.target.value)}
                          min={0}
                          placeholder="e.g. 30"
                        />
                        <span>%</span>
                      </div>
                      <small>Adjusts your selling price automatically</small>
                    </div>
                  </div>

                  <div className={styles.marginCalculator}>
                    <div className={styles.calcRow}>
                      <span>Supplier Price</span><span>₹{getBasePrice()}</span>
                    </div>
                    <div className={styles.calcRow}>
                      <span>Your Selling Price</span><span>₹{getSellingPrice()}</span>
                    </div>
                    <div className={`${styles.calcRow} ${styles.calcRowTotal}`}>
                      <span>Your Margin</span>
                      <span className={styles.calcMargin}>+₹{getMargin().toFixed(0)} ({getMarginPct()}%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Customize Tab ── */}
              {drawerTab === 'customize' && (
                <div className={styles.customizePanel}>
                  <div className={styles.inputGroup}>
                    <label>Product Title <span className={styles.optional}>(optional override)</span></label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder={drawerProduct.product?.name}
                    />
                    <small>Change how this product appears in your storefront</small>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Description Tweak <span className={styles.optional}>(optional)</span></label>
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      rows={4}
                      placeholder="Describe this product for your customers..."
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Highlight Points <span className={styles.optional}>(one per line)</span></label>
                    <textarea
                      value={editHighlights}
                      onChange={e => setEditHighlights(e.target.value)}
                      rows={4}
                      placeholder={"Premium quality fabric\nWash-resistant dye\nBulk discount available"}
                    />
                    <small>These appear as bullet points on your product listing — help you sell better!</small>
                  </div>
                </div>
              )}

              {/* ── Info Tab (Read-only) ── */}
              {drawerTab === 'info' && (
                <div className={styles.infoPanel}>
                  <div className={styles.infoRow}>
                    <label>Supplier</label>
                    <span>{drawerProduct.supplier?.businessName || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>Base / Cost Price</label>
                    <span>₹{drawerProduct.product?.basePrice || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>Minimum Order Qty (MOQ)</label>
                    <span>{drawerProduct.product?.moq || '1'} units</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>Category</label>
                    <span>{drawerProduct.product?.category || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>Supplier Price</label>
                    <span>₹{drawerProduct.product?.basePrice}</span>
                  </div>
                  <div className={styles.infoNote}>
                    <Info size={14} />
                    <span>Supplier info is internal only — buyers will not see this.</span>
                  </div>
                </div>
              )}

              {/* ── Performance Tab ── */}
              {drawerTab === 'performance' && (
                <div className={styles.perfPanel}>
                  <div className={styles.perfGrid}>
                    <div className={styles.perfCard}>
                      <Eye size={24} className={styles.perfIcon} />
                      <h4>{drawerProduct.views || 0}</h4>
                      <span>Total Views</span>
                    </div>
                    <div className={styles.perfCard}>
                      <ShoppingCart size={24} className={styles.perfIcon} />
                      <h4>{drawerProduct.orders || 0}</h4>
                      <span>Orders Placed</span>
                    </div>
                    <div className={styles.perfCard}>
                      <Percent size={24} className={styles.perfIcon} />
                      <h4>{conversionRate(drawerProduct)}</h4>
                      <span>Conversion Rate</span>
                    </div>
                    <div className={styles.perfCard}>
                      <TrendingUp size={24} className={styles.perfIcon} />
                      <h4>₹{((drawerProduct.orders || 0) * (drawerProduct.sellingPrice! - (drawerProduct.product?.basePrice || 0))).toFixed(0)}</h4>
                      <span>Est. Margin Earned</span>
                    </div>
                  </div>
                  <div className={styles.perfNote}>
                    <BarChart2 size={14} />
                    <span>Performance data reflects the last 30 days. Analytics are updated daily.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer with save */}
            {(drawerTab === 'pricing' || drawerTab === 'customize') && (
              <div className={styles.drawerFooter}>
                <button className={styles.cancelBtn} onClick={closeDrawer}>Cancel</button>
                <Button onClick={saveDrawer} loading={saving}>Save Changes</Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ResellerMyProducts;
