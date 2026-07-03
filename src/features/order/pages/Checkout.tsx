import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCart } from '@/features/buyer/store/cart.slice';
import apiClient from '@/api/client';
import {
  ShoppingBag, MapPin, Plus, Truck, ArrowLeft,
  CheckCircle, Package, AlertCircle, Wallet, CreditCard,
  ChevronRight, Receipt
} from 'lucide-react';
import { addressApi } from '@/features/buyer/services/address.api';

const GST_RATE = 0.18;

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  supplierId: string;
  imageUrl?: string;
  moq: number;
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


  const items: CheckoutItem[] = buyNowItem ? [buyNowItem] : (cartItems as CheckoutItem[]);
  const isBuyNow = !!buyNowItem;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrders, setPlacedOrders] = useState<any[] | null>(null);

  // Fetch addresses
  useEffect(() => {
    addressApi.getAddresses().then(data => {
      setAddresses(data);
      const def = data.find((a: any) => a.isDefault) || data[0];
      if (def) setSelectedAddressId(def._id);
    }).catch(() => {});
  }, []);

  const selectedAddress = addresses.find(a => a._id === selectedAddressId) || addresses[0];

  // Financials
  const taxableAmount  = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const gstAmount      = Math.round(taxableAmount * GST_RATE * 100) / 100;
  const grandTotal     = taxableAmount + gstAmount;

  const handlePlaceOrder = async (paymentMethod: 'cod') => {
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
            <Truck size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#0f172a] m-0">Cash on Delivery</p>
              <p className="text-xs text-[#64748b] m-0 mt-0.5">Pay when your order arrives · 5–7 business days</p>
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
          <button
            onClick={() => { if (onOrderPlaced) onOrderPlaced(); else navigate('/profile?tab=orders'); }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-[10px] border-none cursor-pointer hover:opacity-90"
          >
            <Package size={16} /> Track My Orders <ChevronRight size={15} />
          </button>
          <button
            onClick={() => navigate('/products')}
            className="w-full text-sm text-[#64748b] bg-transparent border border-[#e2e8f0] rounded-[10px] py-2.5 cursor-pointer hover:border-primary hover:text-primary transition-colors"
          >
            Continue Shopping
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
                <span>₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>IGST @ 18%</span>
                <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-[#e2e8f0]">
                <span className="font-extrabold text-[#0f172a] text-base">Grand Total</span>
                <span className="font-extrabold text-[#0f172a] text-base">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-[#94a3b8] m-0">* GST @ 18% (IGST) applicable as per current tax regulations.</p>
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
                <span>Subtotal</span><span>₹{taxableAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>GST (18%)</span><span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>Shipping</span><span className="text-[#059669] font-semibold">Free</span>
              </div>
              <div className="flex justify-between font-extrabold text-[#0f172a] text-base pt-2.5 border-t border-[#f1f5f9] mt-1">
                <span>Total</span><span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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

            {/* COD */}
            <button
              onClick={() => handlePlaceOrder('cod')}
              disabled={placing || !selectedAddress}
              className="w-full flex items-center gap-3 p-4 bg-[#f0fdf4] border-2 border-[#86efac] rounded-[10px] mb-3 text-left cursor-pointer hover:border-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-10 h-10 rounded-[8px] bg-white border border-[#86efac] flex items-center justify-center shrink-0 group-hover:border-[#22c55e]">
                <Wallet size={18} className="text-[#16a34a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#15803d] m-0">
                  {placing ? 'Placing order...' : 'Cash on Delivery'}
                </p>
                <p className="text-xs text-[#64748b] m-0">Pay when your order arrives</p>
              </div>
              {!placing && <ChevronRight size={16} className="text-[#16a34a] shrink-0" />}
              {placing && (
                <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" />
                </svg>
              )}
            </button>

            {/* Online (coming soon) */}
            <div className="w-full flex items-center gap-3 p-4 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[10px] opacity-60 cursor-not-allowed">
              <div className="w-10 h-10 rounded-[8px] bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0">
                <CreditCard size={18} className="text-[#94a3b8]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#94a3b8] m-0">Online Payment</p>
                <p className="text-xs text-[#94a3b8] m-0">UPI / Card · Coming soon</p>
              </div>
              <span className="text-[10px] font-bold bg-[#e2e8f0] text-[#64748b] px-2 py-0.5 rounded-full shrink-0">SOON</span>
            </div>

            {!selectedAddress && (
              <p className="text-xs text-[#dc2626] mt-3 m-0 text-center">Add a delivery address above to place order</p>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] text-[#1e40af] text-xs">
            <Truck size={14} className="shrink-0 mt-0.5" />
            <span>Standard delivery · 5–7 business days · Free shipping</span>
          </div>
        </div>
      </div>
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
