import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  Trash2, Plus, Minus, CreditCard,
  ArrowRight, ShoppingBag, Box, ShoppingCart
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

  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty < 1) return;
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShoppingBag size={64} className="text-[#cbd5e1]" />
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0">Your cart is empty</h2>
          <p className="text-[#64748b] m-0">Looks like you haven't added anything to your cart yet.</p>
          <Link to={ROUTES.PRODUCT_LIST} className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-[8px] no-underline hover:opacity-90 transition-opacity">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">My Cart</h1>
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
                <div key={item.productId} className="bg-white border border-[#eef2f6] rounded-[12px] p-5 flex gap-4 max-sm:flex-col">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/150'}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-[8px] border border-[#f1f5f9] shrink-0"
                  />
                  <div className="flex-1 flex flex-col gap-2">
                    <h2 className="text-base font-extrabold text-[#0f172a] m-0">{item.name}</h2>
                    <p className="text-xs text-[#94a3b8] m-0">{item.productId.substring(0, 15)}...</p>
                    <p className="text-xs text-[#64748b] m-0">Variant available</p>

                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <Box size={14} className="text-[#94a3b8]" />
                      <span className="font-semibold">Specifications:</span>
                      <span className="bg-[#f1f5f9] px-2 py-0.5 rounded-full">color: black</span>
                      <span className="bg-[#f1f5f9] px-2 py-0.5 rounded-full">size: s</span>
                    </div>

                    <div className="flex items-center gap-6 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#94a3b8] uppercase tracking-wide">MRP</span>
                        <span className="text-sm line-through text-[#94a3b8]">₹{mrp}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#94a3b8] uppercase tracking-wide">Selling Price</span>
                        <span className="text-base font-extrabold text-[#0f172a]">₹{item.price}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#94a3b8] uppercase tracking-wide">Discount</span>
                        <span className="text-sm font-bold text-[#059669]">{discountPercent}%</span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-primary bg-[#fff7ed] px-2.5 py-0.5 rounded-full self-start">Variant Item</span>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center border border-[#e2e8f0] rounded-[8px] overflow-hidden">
                      <button
                        className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-[#f8fafc] border-none cursor-pointer bg-white"
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-[#0f172a] border-x border-[#e2e8f0]">{item.quantity}</span>
                      <button
                        className="w-8 h-8 flex items-center justify-center text-[#475569] hover:bg-[#f8fafc] border-none cursor-pointer bg-white"
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold text-xs rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={handleCheckout}
                    >
                      <CreditCard size={14} /> Buy Now
                    </button>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626] border-none cursor-pointer hover:bg-[#fee2e2]"
                      onClick={() => handleRemove(item.productId)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-[320px] max-lg:w-full bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sticky top-6">
          <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">Order Summary</h2>

          <div className="flex justify-between text-sm text-[#475569] mb-3">
            <span>Total MRP</span>
            <span>₹{Math.round(totalMRP)}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-[#475569]">Total Discount</span>
            <span className="text-[#059669] font-semibold">-₹{Math.round(totalDiscount)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-[#0f172a] pt-3 border-t border-[#f1f5f9] mb-4">
            <span>Total Amount</span>
            <span>₹{Math.round(totalAmount)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#64748b] mb-5">
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
