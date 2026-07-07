import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Trash2, Plus, Minus, ShoppingBag, ShoppingCart, ArrowRight, Bookmark, MapPin } from 'lucide-react';
import {
  removeFromCartAsync,
  updateQuantityAsync,
  fetchCart,
} from '@/features/buyer/store/cart.slice';
import { toggleWishlistItem } from '@/features/buyer/store/wishlist.slice';
import { ROUTES } from '@/shared/constants/routes';
import { calculateGST, priceWithoutGST } from '@/shared/utils/calculateGST';
import { pincodeToState, normaliseState, getShippingZone } from '@/shared/utils/pincodeToState';
import { addressApi } from '@/features/buyer/services/address.api';

export const CartContent: React.FC = () => {
  const cartItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user) as any;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const buyerState = deliveryPincode.length === 6 ? pincodeToState(deliveryPincode) : null;

  React.useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [dispatch, user]);

  // Auto-fill delivery pincode from primary saved address (or profile address)
  React.useEffect(() => {
    if (!user) return;
    addressApi.getAddresses().then(data => {
      const primary = data.find((a: any) => a.isDefault) || data[0];
      if (primary?.pincode) {
        setDeliveryPincode(primary.pincode);
      } else if (user?.address?.pincode) {
        setDeliveryPincode(user.address.pincode);
      }
    }).catch(() => {
      if (user?.address?.pincode) setDeliveryPincode(user.address.pincode);
    });
  }, [user]);

  const gstSummary = cartItems.reduce((acc, item) => {
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
      // Determine intra vs inter state only when buyer pincode is known
      if (buyerState && item.supplierState) {
        const isIntra = normaliseState(item.supplierState) === buyerState;
        if (isIntra) {
          acc.cgstSgst[rate] = (acc.cgstSgst[rate] || 0) + gstAmt;
        } else {
          acc.igst[rate] = (acc.igst[rate] || 0) + gstAmt;
        }
      } else {
        // Pincode not entered yet — bucket as pending
        acc.pending[rate] = (acc.pending[rate] || 0) + gstAmt;
      }
    }
    return acc;
  }, {
    subtotal: 0,
    cgstSgst: {} as Record<number, number>,
    igst: {} as Record<number, number>,
    pending: {} as Record<number, number>,
  });

  const totalGst = [
    ...Object.values(gstSummary.cgstSgst),
    ...Object.values(gstSummary.igst),
    ...Object.values(gstSummary.pending),
  ].reduce((s, v) => s + v, 0);

  // Shipping: one charge per unique supplier, determined by zone
  const shippingBySupplierId = Object.fromEntries(
    Object.entries(
      cartItems.reduce((acc, item) => {
        if (!acc[item.supplierId]) acc[item.supplierId] = item;
        return acc;
      }, {} as Record<string, typeof cartItems[0]>)
    ).map(([sid, item]) => {
      if (!buyerState || !item.supplierState || !item.shippingRates) return [sid, null];
      const zone = getShippingZone(buyerState, item.supplierState);
      return [sid, { zone, cost: item.shippingRates[zone] }];
    })
  );
  const totalShipping = Object.values(shippingBySupplierId).reduce((s, v) => s + (v?.cost ?? 0), 0);
  const grandTotal = gstSummary.subtotal + totalGst + (buyerState ? totalShipping : 0);

  const handleQty = (productId: string, newQty: number, moq = 1, stock?: number) => {
    if (newQty < moq) return;
    if (stock !== undefined && newQty > stock) return;
    dispatch(updateQuantityAsync({ productId, quantity: newQty }));
  };

  const handleRemove = (productId: string) => dispatch(removeFromCartAsync(productId));

  const handleSaveForLater = (item: typeof cartItems[0]) => {
    dispatch(toggleWishlistItem({ id: item.productId, _id: item.productId, name: item.name, price: item.price } as any));
    dispatch(removeFromCartAsync(item.productId));
  };

  const uniqueSupplierCount = new Set(cartItems.map(i => i.supplierId)).size;
  const isMultiSupplier = uniqueSupplierCount > 1;

  const handleCheckout = () => {
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=/profile?tab=cart`); return; }
    navigate('/profile?tab=checkout');
  };


  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center">
          <ShoppingBag size={28} className="text-[#cbd5e1]" />
        </div>
        <h2 className="text-base font-extrabold text-[#0f172a] m-0">Your cart is empty</h2>
        <p className="text-sm text-[#64748b] m-0">Browse products and add items to get started.</p>
        <Link
          to="/"
          className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] no-underline hover:opacity-90 transition-opacity"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-start max-lg:flex-col">
      {/* Items */}
      <div className="flex-1 flex flex-col gap-3">
        {cartItems.map(item => {
          return (
            <div key={item.productId} className="bg-white border border-[#eef2f6] rounded-[14px] p-4 flex gap-4">
              <Link to={ROUTES.PRODUCT_DETAIL.replace(':id', item.productId)} className="shrink-0">
                <img
                  src={item.imageUrl || ''}
                  alt={item.name}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="w-20 h-20 object-cover rounded-[10px] border border-[#f1f5f9]"
                />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <Link
                  to={ROUTES.PRODUCT_DETAIL.replace(':id', item.productId)}
                  className="text-sm font-bold text-[#0f172a] no-underline hover:text-primary leading-snug line-clamp-2"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-[#94a3b8] m-0">MOQ: {item.moq} {item.unit}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-[#0f172a]">₹{item.price.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-[#94a3b8]">/ {item.unit || 'pcs'}</span>
                  {item.gstRate !== undefined && item.gstRate > 0 && (
                    <span className="text-[10px] font-semibold text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded-[4px]">
                      {item.gstIncluded ? `incl. ${item.gstRate}% GST` : `+${item.gstRate}% GST`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                <div className="flex items-center border border-[#e2e8f0] rounded-[8px] overflow-hidden bg-white">
                  <button
                    className={`w-8 h-8 flex items-center justify-center border-none bg-white transition-colors
                      ${item.quantity <= (item.moq || 1) ? 'text-[#cbd5e1] cursor-not-allowed' : 'text-[#475569] hover:bg-[#f8fafc] cursor-pointer'}`}
                    onClick={() => handleQty(item.productId, item.quantity - 1, item.moq)}
                    disabled={item.quantity <= (item.moq || 1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-[#0f172a] border-x border-[#e2e8f0] select-none">
                    {item.quantity}
                  </span>
                  <button
                    className={`w-8 h-8 flex items-center justify-center border-none bg-white transition-colors
                      ${item.stock !== undefined && item.quantity >= item.stock ? 'text-[#cbd5e1] cursor-not-allowed' : 'text-[#475569] hover:bg-[#f8fafc] cursor-pointer'}`}
                    onClick={() => handleQty(item.productId, item.quantity + 1, item.moq, item.stock)}
                    disabled={item.stock !== undefined && item.quantity >= item.stock}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 px-3 h-8 rounded-[7px] bg-[#f1f5f9] text-[#475569] border-none cursor-pointer hover:bg-[#e2e8f0] transition-colors text-[11px] font-semibold whitespace-nowrap"
                    onClick={() => handleSaveForLater(item)}
                    title="Save for Later"
                  >
                    <Bookmark size={13} /> Save for Later
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-[7px] bg-[#fef2f2] text-[#dc2626] border-none cursor-pointer hover:bg-[#fee2e2] transition-colors"
                    onClick={() => handleRemove(item.productId)}
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="w-[280px] max-lg:w-full sticky top-6">
        <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Order Summary</h2>

          {/* Delivery pincode input */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide block mb-1.5">
              Delivery Pincode
            </label>
            <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2 bg-white focus-within:border-primary transition-colors">
              <MapPin size={13} className="text-[#94a3b8] shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit pincode"
                value={deliveryPincode}
                onChange={e => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 border-none outline-none text-xs text-[#0f172a] bg-transparent placeholder:text-[#cbd5e1]"
              />
            </div>
            {deliveryPincode.length === 6 && (
              buyerState
                ? <p className="text-[11px] text-[#16a34a] mt-1 m-0">Delivering to: <span className="font-bold">{buyerState}</span></p>
                : <p className="text-[11px] text-[#dc2626] mt-1 m-0">Unrecognised pincode</p>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-[#475569]">
              <span>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} (excl. GST)</span>
              <span>₹{Math.round(gstSummary.subtotal).toLocaleString('en-IN')}</span>
            </div>

            {/* CGST + SGST lines (intra-state) */}
            {Object.entries(gstSummary.cgstSgst).map(([rateStr, gstAmt]) => {
              const rate = Number(rateStr);
              const half = rate / 2;
              const halfAmt = Math.round(gstAmt / 2);
              return (
                <React.Fragment key={`intra-${rate}`}>
                  <div className="flex justify-between text-[#64748b] text-xs">
                    <span>CGST @{half}%</span>
                    <span>₹{halfAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#64748b] text-xs">
                    <span>SGST @{half}%</span>
                    <span>₹{halfAmt.toLocaleString('en-IN')}</span>
                  </div>
                </React.Fragment>
              );
            })}

            {/* IGST lines (inter-state) */}
            {Object.entries(gstSummary.igst).map(([rateStr, gstAmt]) => (
              <div key={`igst-${rateStr}`} className="flex justify-between text-[#64748b] text-xs">
                <span>IGST @{rateStr}%</span>
                <span>₹{Math.round(gstAmt).toLocaleString('en-IN')}</span>
              </div>
            ))}

            {/* Pending (no pincode yet) */}
            {Object.entries(gstSummary.pending).map(([rateStr, gstAmt]) => (
              <div key={`gst-${rateStr}`} className="flex justify-between text-[#94a3b8] text-xs">
                <span>GST @{rateStr}% <span className="text-[10px]">(enter pincode)</span></span>
                <span>₹{Math.round(gstAmt).toLocaleString('en-IN')}</span>
              </div>
            ))}

            {/* Shipping */}
            {buyerState ? (
              Object.values(shippingBySupplierId).map((v, i) =>
                v ? (
                  <div key={i} className="flex justify-between text-[#64748b] text-xs">
                    <span>Shipping ({v.zone})</span>
                    <span>{v.cost === 0 ? <span className="text-[#16a34a] font-bold">Free</span> : `₹${v.cost.toLocaleString('en-IN')}`}</span>
                  </div>
                ) : null
              )
            ) : (
              <div className="flex justify-between text-[#94a3b8] text-xs">
                <span>Shipping <span className="text-[10px]">(enter pincode)</span></span>
                <span>—</span>
              </div>
            )}

            <div className="flex justify-between font-extrabold text-[#0f172a] pt-3 mt-1 border-t border-[#f1f5f9] text-base">
              <span>Total</span>
              <span>₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
            </div>
          </div>
          {isMultiSupplier && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-[#fffbeb] border border-[#fcd34d] rounded-[8px] text-xs text-[#92400e]">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>Your cart has items from <strong>multiple suppliers</strong>. Please checkout one supplier at a time — remove items from other suppliers first.</span>
            </div>
          )}
          <button
            disabled={isMultiSupplier}
            className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleCheckout}
          >
            <ShoppingCart size={16} /> Proceed to Checkout <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Cart: React.FC = () => (
  <div className="min-h-screen bg-[#f8fafc]">
    <div className="bg-white border-b border-[#f1f5f9]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-5 flex items-center gap-3">
        <ShoppingCart size={22} className="text-primary" />
        <h1 className="text-lg font-extrabold text-[#0f172a] m-0">My Cart</h1>
      </div>
    </div>
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
      <CartContent />
    </div>
  </div>
);

export default Cart;
