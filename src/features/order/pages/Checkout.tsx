import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCart } from '@/features/buyer/store/cart.slice';
import apiClient from '@/api/client';
import {
  ShoppingBag, MapPin, Plus, Truck, ArrowLeft,
  CheckCircle, Package, AlertCircle, X,
  ChevronRight, Receipt, Handshake, FileText
} from 'lucide-react';
import { addressApi } from '@/features/buyer/services/address.api';
import { calculateGST, priceWithoutGST } from '@/shared/utils/calculateGST';
import { pincodeToState, normaliseState, getShippingZone } from '@/shared/utils/pincodeToState';

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  supplierId: string;
  imageUrl?: string;
  moq: number;
  gstRate?: number;
  gstIncluded?: boolean;
  supplierState?: string;
  shippingRates?: { local: number; regional: number; national: number };
}

interface CheckoutContentProps {
  buyNowItem?: CheckoutItem;
  onBack?: () => void;
  onOrderPlaced?: () => void;
}

export const CheckoutContent: React.FC<CheckoutContentProps> = ({ buyNowItem, onBack, onOrderPlaced }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user) as any;

  const items: CheckoutItem[] = buyNowItem ? [buyNowItem] : (cartItems as CheckoutItem[]);
  const isBuyNow = !!buyNowItem;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrders, setPlacedOrders] = useState<any[] | null>(null);
  const [showDealPanel, setShowDealPanel] = useState(false);
  const [dealPayMethod, setDealPayMethod] = useState<'direct' | 'amjstar'>('direct');
  const [dealAck, setDealAck] = useState(false);

  // Fetch saved addresses; fall back to profile address if none saved yet
  useEffect(() => {
    addressApi.getAddresses().then(data => {
      let all: any[] = data;
      if (all.length === 0 && user?.address?.city) {
        all = [{
          _id: 'profile-address',
          fullName: user.name || '',
          phone: user.phone || '',
          pincode: user.address.pincode || '',
          state: user.address.state || '',
          city: user.address.city || '',
          houseNo: user.address.fullAddress || '',
          area: '',
          isDefault: true,
        }];
      }
      setAddresses(all);
      const def = all.find((a: any) => a.isDefault) || all[0];
      if (def) setSelectedAddressId(def._id);
    }).catch(() => {});
  }, []);

  const selectedAddress = addresses.find(a => a._id === selectedAddressId) || addresses[0];
  const buyerState = selectedAddress?.pincode ? pincodeToState(selectedAddress.pincode) : null;

  // GST + shipping — same logic as Cart.tsx
  const financials = items.reduce((acc, item) => {
    const rate = item.gstRate ?? 18;
    const qty = item.quantity;
    let basePerUnit: number;
    let gstPerUnit: number;
    if (item.gstIncluded) {
      basePerUnit = priceWithoutGST(item.price, rate);
      gstPerUnit = item.price - basePerUnit;
    } else {
      basePerUnit = item.price;
      gstPerUnit = calculateGST(item.price, rate);
    }
    acc.subtotal += basePerUnit * qty;
    if (rate > 0) {
      const gstAmt = gstPerUnit * qty;
      if (buyerState && item.supplierState) {
        const isIntra = normaliseState(item.supplierState) === buyerState;
        if (isIntra) {
          acc.cgstSgst[rate] = (acc.cgstSgst[rate] || 0) + gstAmt;
        } else {
          acc.igst[rate] = (acc.igst[rate] || 0) + gstAmt;
        }
      } else {
        acc.igst[rate] = (acc.igst[rate] || 0) + gstAmt;
      }
    }
    return acc;
  }, { subtotal: 0, cgstSgst: {} as Record<number, number>, igst: {} as Record<number, number> });

  const totalGst = [...Object.values(financials.cgstSgst), ...Object.values(financials.igst)].reduce((s, v) => s + v, 0);

  // Shipping: one charge per unique supplier
  const shippingBySupplierId = Object.fromEntries(
    Object.entries(
      items.reduce((acc, item) => {
        if (!acc[item.supplierId]) acc[item.supplierId] = item;
        return acc;
      }, {} as Record<string, CheckoutItem>)
    ).map(([sid, item]) => {
      if (!buyerState || !item.supplierState || !item.shippingRates) return [sid, null];
      const zone = getShippingZone(buyerState, item.supplierState);
      return [sid, { zone, cost: item.shippingRates[zone] }];
    })
  );
  const totalShipping = buyerState
    ? Object.values(shippingBySupplierId).reduce((s, v) => s + (v?.cost ?? 0), 0)
    : 0;

  const taxableAmount = financials.subtotal;
  const grandTotal = taxableAmount + totalGst + totalShipping;

  const handlePlaceOrder = async (paymentMethod: 'direct') => {
    if (!selectedAddress) { setError('Please add a delivery address.'); return; }
    setPlacing(true); setError(null);
    try {
      const addressSnapshot = {
        fullName:    selectedAddress.fullName,
        phone:       selectedAddress.phone,
        pincode:     selectedAddress.pincode,
        state:       selectedAddress.state,
        city:        selectedAddress.city,
        fullAddress: [selectedAddress.houseNo, selectedAddress.area].filter(Boolean).join(', '),
      };

      const res = await apiClient.post('/orders/direct', {
        items,
        paymentMethod,
        buyNow: isBuyNow,
        addressSnapshot,
        shippingCost: totalShipping,
      });

      const orders = res.data.orders || [];
      if (!isBuyNow) dispatch(clearCart());
      setPlacedOrders(orders);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (placedOrders) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center max-w-[480px] mx-auto">
        <div className="w-20 h-20 rounded-full bg-[#ecfdf5] flex items-center justify-center">
          <CheckCircle size={40} className="text-[#059669]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#0f172a] m-0 mb-2">Order Placed!</h2>
          <p className="text-sm text-[#64748b] m-0">
            {placedOrders.length === 1
              ? `Order #${placedOrders[0].orderNumber} has been placed successfully.`
              : `${placedOrders.length} orders placed: ${placedOrders.map(o => `#${o.orderNumber}`).join(', ')}`}
          </p>
        </div>

        <div className="w-full bg-[#f8fafc] border border-[#eef2f6] rounded-[12px] p-5 text-left">
          <div className="flex items-start gap-3 mb-3">
            <Handshake size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#0f172a] m-0">Direct Payment to Supplier</p>
              <p className="text-xs text-[#64748b] m-0 mt-0.5">Coordinate payment directly with your supplier</p>
            </div>
          </div>
          {selectedAddress && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#0f172a] m-0">{selectedAddress.fullName}</p>
                <p className="text-xs text-[#64748b] m-0 mt-0.5">
                  {[selectedAddress.houseNo, selectedAddress.area, selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full">
          {placedOrders.map(order => order._id && (
            <a
              key={order._id}
              href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/api/orders/${order._id}/po-download`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-[#059669] text-[#059669] font-bold text-sm rounded-[10px] no-underline hover:bg-[#f0fdf4] transition-colors"
            >
              <FileText size={16} /> Download PO {order.poNumber ? `(${order.poNumber})` : ''}
            </a>
          ))}
          <button
            onClick={() => { if (onOrderPlaced) onOrderPlaced(); else navigate('/profile?tab=orders'); }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-[10px] border-none cursor-pointer hover:opacity-90"
          >
            <Package size={16} /> Track My Orders <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <ShoppingBag size={48} className="text-[#cbd5e1]" />
        <h2 className="text-base font-extrabold text-[#0f172a] m-0">Nothing to checkout</h2>
        <p className="text-sm text-[#64748b] m-0">Add items to your cart first.</p>
        <button
          className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90"
          onClick={() => onBack ? onBack() : navigate('/profile?tab=cart')}
        >
          Go to Cart
        </button>
      </div>
    );
  }

  // ── Main checkout ────────────────────────────────────────────────────────
  return (
    <div>
      <button
        className="flex items-center gap-2 text-sm text-[#64748b] bg-transparent border-none cursor-pointer hover:text-[#0f172a] p-0 mb-6"
        onClick={() => onBack ? onBack() : navigate(-1)}
      >
        <ArrowLeft size={16} /> Back to Cart
      </button>

      <div className="flex gap-6 items-start max-lg:flex-col">
        {/* ── Left column ── */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Invoice table */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
              <Receipt size={18} className="text-primary" />
              <h2 className="text-base font-extrabold text-[#0f172a] m-0">
                Invoice — {items.length} item{items.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-5 py-2.5 bg-[#f8fafc] border-b border-[#eef2f6] text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider max-sm:hidden">
              <span>Product</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Amount</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-[#f1f5f9]">
              {items.map((item, idx) => {
                const lineTotal = item.price * item.quantity;
                return (
                  <div key={item.productId || idx} className="px-5 py-4 flex gap-4 items-start">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        className="w-14 h-14 object-cover rounded-[8px] border border-[#f1f5f9] shrink-0 max-sm:w-10 max-sm:h-10"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0f172a] m-0 leading-snug">{item.name}</p>
                      <p className="text-xs text-[#94a3b8] m-0 mt-0.5">MOQ: {item.moq} {item.unit}</p>
                      {/* Mobile-only price */}
                      <div className="sm:hidden mt-1 flex items-center gap-3 text-sm">
                        <span className="text-[#475569]">₹{item.price.toLocaleString('en-IN')} × {item.quantity}</span>
                        <span className="font-bold text-[#0f172a]">= ₹{lineTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    {/* Desktop price columns */}
                    <div className="hidden sm:grid grid-cols-[80px_90px_90px] gap-3 text-sm text-right shrink-0">
                      <span className="text-[#475569]">₹{item.price.toLocaleString('en-IN')}</span>
                      <span className="text-[#475569]">{item.quantity} {item.unit}</span>
                      <span className="font-bold text-[#0f172a]">₹{lineTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tax breakdown */}
            <div className="px-5 py-4 bg-[#f8fafc] border-t border-[#eef2f6] flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-[#475569]">
                <span>Taxable Amount</span>
                <span>₹{Math.round(taxableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* CGST + SGST (intra-state) */}
              {Object.entries(financials.cgstSgst).map(([rateStr, amt]) => {
                const rate = Number(rateStr);
                const half = rate / 2;
                const halfAmt = Math.round(amt / 2);
                return (
                  <React.Fragment key={`intra-${rate}`}>
                    <div className="flex justify-between text-[#475569]">
                      <span>CGST @{half}%</span>
                      <span>₹{halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>SGST @{half}%</span>
                      <span>₹{halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* IGST (inter-state) */}
              {Object.entries(financials.igst).map(([rateStr, amt]) => (
                <div key={`igst-${rateStr}`} className="flex justify-between text-[#475569]">
                  <span>IGST @{rateStr}%</span>
                  <span>₹{Math.round(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}

              {/* Shipping */}
              <div className="flex justify-between text-[#475569]">
                <span>Shipping</span>
                <span className={totalShipping === 0 ? 'text-[#059669] font-semibold' : ''}>
                  {!buyerState ? '—' : totalShipping === 0 ? 'Free' : `₹${totalShipping.toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-[#e2e8f0]">
                <span className="font-extrabold text-[#0f172a] text-base">Grand Total</span>
                <span className="font-extrabold text-[#0f172a] text-base">
                  ₹{Math.round(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0f172a] m-0">
                <MapPin size={18} className="text-primary" /> Delivery Address
              </h2>
              <button
                className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0"
                onClick={() => navigate('/profile?tab=addresses')}
              >
                Manage Addresses
              </button>
            </div>

            {addresses.length === 0 ? (
              <div
                className="border-2 border-dashed border-[#e2e8f0] rounded-[8px] p-5 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate('/profile?tab=addresses')}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-primary"><Plus size={16} /> Add Delivery Address</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {addresses.map(addr => (
                  <label
                    key={addr._id}
                    className={`flex items-start gap-3 p-4 rounded-[10px] border cursor-pointer transition-all ${
                      selectedAddressId === addr._id
                        ? 'border-primary bg-[#fff7ed] shadow-[0_0_0_3px_rgba(230,92,0,0.08)]'
                        : 'border-[#e2e8f0] hover:border-[#e65c00]/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr._id}
                      checked={selectedAddressId === addr._id}
                      onChange={() => setSelectedAddressId(addr._id)}
                      className="mt-1 accent-[#e65c00]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#0f172a] m-0">{addr.fullName}</p>
                      <p className="text-xs text-[#64748b] m-0 mt-0.5">{addr.phone}</p>
                      <p className="text-xs text-[#64748b] m-0 mt-0.5 leading-relaxed">
                        {[addr.houseNo, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: payment ── */}
        <div className="w-[300px] max-lg:w-full shrink-0 flex flex-col gap-4 sticky top-6">

          {/* Mini summary */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-3">Summary</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-[#475569]">
                <span>Subtotal</span><span>₹{Math.round(taxableAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>GST</span><span>₹{Math.round(totalGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>Shipping</span>
                <span className={totalShipping === 0 ? 'text-[#059669] font-semibold' : ''}>
                  {!buyerState ? '—' : totalShipping === 0 ? 'Free' : `₹${totalShipping.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-[#0f172a] text-base pt-2.5 border-t border-[#f1f5f9] mt-1">
                <span>Total</span><span>₹{Math.round(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment options */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Payment Method</h3>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-xs mb-4">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              onClick={() => setShowDealPanel(true)}
              disabled={!selectedAddress}
              className="w-full flex items-center gap-3 p-4 bg-[#f0fdf4] border-2 border-[#86efac] rounded-[10px] text-left cursor-pointer hover:border-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-10 h-10 rounded-[8px] bg-white border border-[#86efac] flex items-center justify-center shrink-0 group-hover:border-[#22c55e]">
                <Handshake size={18} className="text-[#16a34a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#15803d] m-0">Confirm Deal</p>
                <p className="text-xs text-[#64748b] m-0">Choose your payment method</p>
              </div>
              <ChevronRight size={16} className="text-[#16a34a] shrink-0" />
            </button>

            {!selectedAddress && (
              <p className="text-xs text-[#dc2626] mt-3 m-0 text-center">Add a delivery address above to place order</p>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] text-[#1e40af] text-xs">
            <Truck size={14} className="shrink-0 mt-0.5" />
            <span>Standard delivery · 5–7 business days{totalShipping === 0 && buyerState ? ' · Free shipping' : ''}</span>
          </div>
        </div>
      </div>

      {/* Deal confirmation panel — rendered via portal so parent overflow/transform can't break centering */}
      {showDealPanel && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => { setShowDealPanel(false); setDealAck(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-[16px] w-full max-w-[440px] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.2)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Choose how you'll pay</h3>
              <button
                onClick={() => { setShowDealPanel(false); setDealAck(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f1f5f9] border-none cursor-pointer text-[#64748b] hover:bg-[#e2e8f0]"
              >
                <X size={14} />
              </button>
            </div>

            {/* Direct Payment option */}
            <button
              onClick={() => setDealPayMethod('direct')}
              className={`w-full text-left mb-2 p-3 rounded-[10px] border-2 cursor-pointer transition-colors ${dealPayMethod === 'direct' ? 'border-[#059669] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex-none ${dealPayMethod === 'direct' ? 'border-[#059669] bg-[#059669]' : 'border-[#cbd5e1]'}`} />
                <span className="text-sm font-bold text-[#0f172a]">Direct Payment to Supplier</span>
              </div>
              <p className="text-xs text-[#64748b] m-0 mt-1.5 ml-[22px] leading-relaxed">
                You pay the supplier directly (UPI / bank / cash). Phone numbers unlock so you can coordinate.
              </p>
            </button>

            {/* AMJSTAR Escrow — coming soon */}
            <div className="w-full mb-3 p-3 rounded-[10px] border border-dashed border-[#e2e8f0] bg-[#fafafa] opacity-70 cursor-not-allowed">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#cbd5e1] shrink-0 flex-none" />
                <span className="text-sm font-bold text-[#94a3b8]">Pay Through AMJSTAR (Escrow)</span>
                <span className="text-[9px] font-bold text-[#d97706] bg-[#fffbeb] border border-[#fcd34d] px-1.5 py-0.5 rounded-full ml-auto">COMING SOON</span>
              </div>
              <p className="text-xs text-[#94a3b8] m-0 mt-1.5 ml-[22px] leading-relaxed">
                AMJSTAR holds your payment safely until you confirm delivery. Launching soon.
              </p>
            </div>

            {/* Acknowledgement */}
            {dealPayMethod === 'direct' && (
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dealAck}
                  onChange={e => setDealAck(e.target.checked)}
                  className="mt-0.5 accent-[#059669] shrink-0"
                />
                <span className="text-xs text-[#475569] leading-relaxed">
                  I understand that payment is handled <strong>directly between me and the supplier</strong>, and AMJSTAR is not responsible for the payment or its settlement.
                </span>
              </label>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDealPanel(false); setDealAck(false); }}
                className="flex-1 py-2.5 text-sm font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[10px] cursor-pointer hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                disabled={placing || (dealPayMethod === 'direct' && !dealAck)}
                onClick={() => { setShowDealPanel(false); handlePlaceOrder('direct'); }}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[10px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {placing ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" />
                  </svg>
                ) : 'Confirm & Generate'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Standalone page wrapper (kept so /checkout URL still works via the redirect)
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNowItem;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-white border-b border-[#f1f5f9]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-5 flex items-center gap-3">
          <ShoppingBag size={22} className="text-primary" />
          <h1 className="text-lg font-extrabold text-[#0f172a] m-0">Checkout</h1>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        <CheckoutContent
          buyNowItem={buyNowItem}
          onBack={() => navigate(-1)}
          onOrderPlaced={() => navigate('/profile?tab=orders')}
        />
      </div>
    </div>
  );
};

export default Checkout;
