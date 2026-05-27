import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  Trash2, Plus, Minus, CreditCard,
  ArrowRight, ShoppingBag, Box, ShoppingCart, ArrowLeft
} from 'lucide-react';
import {
  removeFromCartAsync,
  updateQuantityAsync,
  fetchCart
} from '@/features/buyer/store/cart.slice';
import { ROUTES } from '@/shared/constants/routes';

const Cart: React.FC = () => {
  const cartItems = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const totalMRP = cartItems.reduce((acc, item) => acc + (item.price * 1.1) * item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalDiscount = totalMRP - totalAmount;

  React.useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [dispatch, user]);

  const handleUpdateQty = (productId: string, newQty: number, moq: number = 1, stock?: number) => {
    if (newQty < moq) return;
    if (stock !== undefined && newQty > stock) return;
    dispatch(updateQuantityAsync({ productId, quantity: newQty }));
  };

  const handleRemove = (productId: string) => {
    dispatch(removeFromCartAsync(productId));
  };

  const handleCheckout = () => {
    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=/cart`);
      return;
    }
    navigate(ROUTES.CHECKOUT);
  };

  const handleBuyNowSingle = (item: any) => {
    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=/cart`);
      return;
    }
    navigate(ROUTES.CHECKOUT, { state: { buyNowItem: item } });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShoppingBag size={56} className="text-[#cbd5e1]" />
          <h2 className="text-xl font-extrabold text-[#0f172a] m-0">Your cart is empty</h2>
          <p className="text-sm text-[#64748b] m-0">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-xs rounded-[8px] no-underline hover:opacity-90 transition-opacity">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 max-w-[1200px] mx-auto">
      <button
        className="flex items-center gap-2 text-sm text-[#64748b] bg-transparent border-none cursor-pointer hover:text-[#0f172a] p-0 mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-xl font-extrabold text-[#0f172a] m-0 mb-1">My Cart</h1>
      <p className="text-sm text-[#64748b] m-0 mb-6">{user?.name?.toLowerCase().replace(' ', '') || 'buddykartstore'}</p>

      <div className="flex gap-6 items-start max-lg:flex-col">
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white border border-[#eef2f6] rounded-[12px] px-5 py-4">
            <h3 className="text-sm font-bold text-[#0f172a] m-0">Total Items: {cartItems.length}</h3>
          </div>

          <div className="flex flex-col gap-3">
            {cartItems.map((item) => {
              const mrp = Math.round(item.price * 1.1);
              const discountPercent = Math.round(((mrp - item.price) / mrp) * 100);

              return (
                <div key={item.productId} className="bg-white border border-[#eef2f6] rounded-[12px] p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                  {/* Top content (Image + Info) */}
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/150'}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-[8px] border border-[#f1f5f9] shrink-0"
                    />
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <h2 className="text-sm font-extrabold text-[#0f172a] m-0 leading-snug">{item.name}</h2>
                      <p className="text-[10px] text-[#94a3b8] m-0">{item.productId.substring(0, 15)}...</p>
                      <p className="text-[10px] text-[#64748b] m-0">Variant available</p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#475569] mt-0.5">
                        <Box size={12} className="text-[#94a3b8] shrink-0" />
                        <span className="bg-[#f1f5f9] px-2 py-0.5 rounded-full">color: black</span>
                        <span className="bg-[#f1f5f9] px-2 py-0.5 rounded-full">size: s</span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-[#94a3b8] uppercase tracking-wide">MRP</span>
                          <span className="text-xs line-through text-[#94a3b8]">₹{mrp}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-[#94a3b8] uppercase tracking-wide">Selling Price</span>
                          <span className="text-sm font-extrabold text-[#0f172a]">₹{item.price}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-[#94a3b8] uppercase tracking-wide">Discount</span>
                          <span className="text-xs font-bold text-[#059669]">{discountPercent}%</span>
                        </div>
                      </div>

                      <span className="text-[9px] font-bold text-primary bg-[#fff7ed] px-2 py-0.5 rounded-full self-start mt-1.5">Variant Item</span>
                    </div>
                  </div>

                  {/* Actions & Quantity Controls */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 mt-3 pt-3 border-t border-[#f1f5f9] sm:mt-0 sm:pt-0 sm:border-t-0 shrink-0">
                    <div className="flex items-center border border-[#e2e8f0] rounded-[8px] overflow-hidden bg-white shadow-sm">
                      <button
                        className={`w-8 h-8 flex items-center justify-center border-none transition-colors ${item.quantity <= (item.moq || 1) ? 'text-[#cbd5e1] bg-[#f8fafc] cursor-not-allowed' : 'text-[#475569] hover:bg-[#f8fafc] cursor-pointer bg-white'}`}
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1, item.moq)}
                        disabled={item.quantity <= (item.moq || 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-[#0f172a] border-x border-[#e2e8f0]">{item.quantity}</span>
                      <button
                        className={`w-8 h-8 flex items-center justify-center border-none transition-colors ${item.stock !== undefined && item.quantity >= item.stock ? 'text-[#cbd5e1] bg-[#f8fafc] cursor-not-allowed' : 'text-[#475569] hover:bg-[#f8fafc] cursor-pointer bg-white'}`}
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1, item.moq, item.stock)}
                        disabled={item.stock !== undefined && item.quantity >= item.stock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold text-xs rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleBuyNowSingle(item)}
                      >
                        <CreditCard size={14} /> Buy Now
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626] border-none cursor-pointer hover:bg-[#fee2e2] transition-colors"
                        onClick={() => handleRemove(item.productId)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-[320px] max-lg:w-full bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sticky top-6">
          <h2 className="text-sm font-extrabold text-[#0f172a] m-0 mb-5">Order Summary</h2>

          <div className="flex justify-between text-xs text-[#475569] mb-3">
            <span>Total MRP</span>
            <span>₹{Math.round(totalMRP)}</span>
          </div>
          <div className="flex justify-between text-xs mb-3">
            <span className="text-[#475569]">Total Discount</span>
            <span className="text-[#059669] font-semibold">-₹{Math.round(totalDiscount)}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-3 border-t border-[#f1f5f9] mb-4">
            <span>Total Amount</span>
            <span>₹{Math.round(totalAmount)}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#64748b] mb-5">
            <Box size={14} /> Total Items: {cartItems.length}
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleCheckout}
          >
            <ShoppingCart size={18} /> Buy All ({cartItems.length} items) <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
