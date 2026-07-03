import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Trash2, Plus, Minus, ShoppingBag, ShoppingCart, ArrowRight } from 'lucide-react';
import {
  removeFromCartAsync,
  updateQuantityAsync,
  fetchCart,
} from '@/features/buyer/store/cart.slice';
import { ROUTES } from '@/shared/constants/routes';

export const CartContent: React.FC = () => {
  const cartItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [dispatch, user]);

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleQty = (productId: string, newQty: number, moq = 1, stock?: number) => {
    if (newQty < moq) return;
    if (stock !== undefined && newQty > stock) return;
    dispatch(updateQuantityAsync({ productId, quantity: newQty }));
  };

  const handleRemove = (productId: string) => dispatch(removeFromCartAsync(productId));

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
          to="/products"
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
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-[#475569]">
              <span>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
              <span>₹{Math.round(totalAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-extrabold text-[#0f172a] pt-3 mt-1 border-t border-[#f1f5f9] text-base">
              <span>Total</span>
              <span>₹{Math.round(totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button
            className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleCheckout}
          >
            <ShoppingCart size={16} /> Buy Now <ArrowRight size={15} />
          </button>
          <Link
            to="/products"
            className="mt-3 w-full flex items-center justify-center text-xs text-[#64748b] no-underline hover:text-primary transition-colors"
          >
            Continue Shopping
          </Link>
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
