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
} from '@/store/slices/cart.slice';
import type { CartItem } from '@/store/slices/cart.slice';
import { ROUTES } from '@/shared/constants/routes';

const Cart: React.FC = () => {
  const cartItems = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const totalMRP = cartItems.reduce((acc, item) => acc + (item.price * 1.1) * item.quantity, 0); // Dummy MRP
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalDiscount = totalMRP - totalAmount;

  React.useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
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
    // Navigate to checkout or process order
    navigate(ROUTES.CHECKOUT);
  };

  const handleBuyNowSingle = (item: CartItem) => {
    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=/cart`);
      return;
    }
    navigate(ROUTES.CHECKOUT, { state: { buyNowItem: item } });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto my-8 px-5 font-sans text-gray-900 max-sm:px-3 max-sm:my-5">
        <div className="text-center py-12 px-6 bg-white border border-slate-200/80 rounded-xl shadow-sm">
          <ShoppingBag size={64} color="#cbd5e1" className="mx-auto" />
          <h2 className="text-xl font-extrabold mt-3">Your cart is empty</h2>
          <p className="text-slate-500 my-2 mb-4 text-sm">Looks like you haven't added anything to your cart yet.</p>
          <Link to={ROUTES.PRODUCT_LIST} className="inline-block bg-gradient-to-br from-[#D94F00] to-[#B84300] text-white py-2.5 px-5 rounded-lg font-semibold text-sm shadow-[0_4px_10px_rgba(217,79,0,0.2)]">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto my-8 px-5 font-sans text-gray-900 max-sm:px-3 max-sm:my-5">
      <div className="flex items-start gap-4 mb-6">
        <button className="flex items-center gap-1.5 bg-transparent border border-slate-200 text-slate-500 font-semibold text-sm cursor-pointer py-2 px-3 rounded-lg transition-all duration-200 mt-0.5 hover:bg-slate-100 hover:text-gray-900 hover:border-slate-300" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex flex-col">
          <h1 className="text-[1.75rem] font-extrabold text-gray-900 mb-1 max-sm:text-2xl">My Cart</h1>
          <p className="text-slate-500 text-sm">{user?.name?.toLowerCase().replace(' ', '') || 'buddykartstore'}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start max-md:grid-cols-1 max-md:gap-5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm max-sm:p-3 max-sm:rounded-lg">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-[0.95rem] text-slate-600 font-bold">Total Items: {cartItems.length}</h3>
          </div>

          <div className="flex flex-col">
            {cartItems.map((item) => {
              const mrp = Math.round(item.price * 1.1); // Dummy 10% discount
              const discountPercent = Math.round(((mrp - item.price) / mrp) * 100);

              return (
                <div key={item.productId} className="grid grid-cols-[100px_1fr_auto] gap-5 py-4 border-b border-slate-200/80 items-center last:border-b-0 max-sm:grid-cols-[70px_1fr] max-sm:grid-rows-[auto_auto] max-sm:gap-x-3 max-sm:gap-y-2.5">
                  <img 
                    src={item.imageUrl || 'https://via.placeholder.com/150'} 
                    alt={item.name} 
                    className="w-[100px] h-[100px] object-contain rounded-lg bg-slate-50 border border-slate-200/60 max-sm:w-[70px] max-sm:h-[70px] max-sm:col-start-1 max-sm:row-start-1" 
                  />
                  <div className="flex flex-col items-start text-left max-sm:col-start-2 max-sm:row-start-1 max-sm:w-full">
                    <h2 className="text-[1.05rem] font-bold text-gray-900 mb-0.5 leading-snug max-sm:text-[0.95rem]">{item.name}</h2>
                    <p className="text-xs text-slate-400 mb-1">{item.productId.substring(0, 15)}...</p>
                    <p className="text-xs text-[#D94F00] mb-2 font-semibold max-sm:mb-1.5">Variant available</p>
                    
                    <div className="flex items-center gap-2 mb-3 max-sm:mb-2 max-sm:gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 max-sm:text-[0.7rem]"><Box size={14} /> Specifications:</span>
                      <div className="flex gap-1.5">
                        <span className="bg-slate-50 border border-slate-200 py-0.5 px-1.5 rounded text-[0.7rem] font-semibold text-slate-600 max-sm:text-[0.65rem] max-sm:py-px max-sm:px-1">Color: Black</span>
                        <span className="bg-slate-50 border border-slate-200 py-0.5 px-1.5 rounded text-[0.7rem] font-semibold text-slate-600 max-sm:text-[0.65rem] max-sm:py-px max-sm:px-1">Size: S</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-2 bg-slate-50 py-2 px-3 rounded-md border border-slate-100 max-sm:bg-transparent max-sm:border-none max-sm:p-0 max-sm:mb-1 max-sm:gap-2.5 max-sm:flex-wrap">
                      <div className="flex flex-col items-start max-sm:flex-row max-sm:items-center max-sm:gap-1">
                        <span className="text-[0.65rem] uppercase tracking-wider text-slate-500 mb-0.5 max-sm:hidden">MRP</span>
                        <span className="line-through text-slate-400 text-sm font-medium max-sm:text-xs">₹{mrp}</span>
                      </div>
                      <div className="flex flex-col items-start max-sm:flex-row max-sm:items-center max-sm:gap-1">
                        <span className="text-[0.65rem] uppercase tracking-wider text-slate-500 mb-0.5 max-sm:hidden">Selling Price</span>
                        <span className="text-base font-extrabold text-gray-900 max-sm:text-[0.95rem]">₹{item.price}</span>
                      </div>
                      <div className="flex flex-col items-start max-sm:flex-row max-sm:items-center max-sm:gap-1">
                        <span className="text-[0.65rem] uppercase tracking-wider text-slate-500 mb-0.5 max-sm:hidden">Discount</span>
                        <span className="text-green-500 text-sm font-bold max-sm:text-xs">{discountPercent}% OFF</span>
                      </div>
                    </div>

                    <div className="inline-block bg-orange-50 border border-orange-100 py-0.5 px-1.5 rounded text-[0.7rem] text-orange-700 font-semibold mt-0.5 max-sm:text-[0.65rem] max-sm:py-px max-sm:px-1">Variant Item</div>
                  </div>

                  <div className="flex items-center gap-2.5 max-sm:col-span-2 max-sm:row-start-2 max-sm:flex-row max-sm:justify-between max-sm:mt-1 max-sm:bg-slate-50 max-sm:py-2 max-sm:px-3 max-sm:rounded-lg max-sm:border max-sm:border-slate-100">
                    <div className="flex items-center bg-white rounded-md p-[3px] border border-slate-200 max-sm:p-0.5">
                      <button 
                        className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 cursor-pointer text-slate-500 transition-all duration-200 hover:bg-[#D94F00]/5 hover:text-[#D94F00] max-sm:w-6 max-sm:h-6 max-sm:rounded"
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900 max-sm:w-5 max-sm:text-xs">{item.quantity}</span>
                      <button 
                        className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 cursor-pointer text-slate-500 transition-all duration-200 hover:bg-[#D94F00]/5 hover:text-[#D94F00] max-sm:w-6 max-sm:h-6 max-sm:rounded"
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button className="bg-[#D94F00] text-white border-none py-2 px-3.5 rounded-md font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-250 shadow-[0_4px_8px_rgba(217,79,0,0.15)] h-[34px] hover:bg-[#bf4500] hover:-translate-y-px hover:shadow-[0_6px_12px_rgba(217,79,0,0.2)] max-sm:h-[30px] max-sm:px-2 max-sm:text-[0.7rem] max-sm:gap-1 max-sm:ml-auto" onClick={() => handleBuyNowSingle(item)}>
                      <CreditCard size={16} /> Buy Now
                    </button>
                    <button 
                      className="text-red-500 bg-red-50 border border-red-100 w-[34px] h-[34px] rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-100 max-sm:w-[30px] max-sm:h-[30px]"
                      onClick={() => handleRemove(item.productId)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 h-fit sticky top-[90px] shadow-sm max-sm:p-4 max-sm:rounded-lg">
          <h2 className="text-[1.1rem] font-extrabold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="flex justify-between mb-3 text-sm font-medium text-slate-600">
            <span>Total MRP</span>
            <span>₹{Math.round(totalMRP)}</span>
          </div>
          
          <div className="flex justify-between mb-3 text-sm font-medium text-slate-600">
            <span>Total Discount</span>
            <span className="text-green-500">-₹{Math.round(totalDiscount)}</span>
          </div>

          <div className="flex justify-between mt-4 pt-4 border-t border-slate-100 font-bold text-base text-gray-900">
            <span>Total Amount</span>
            <span>₹{Math.round(totalAmount)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
            <Box size={14} /> Total Items: {cartItems.length}
          </div>

          <button className="w-full bg-gradient-to-br from-[#D94F00] to-[#B84300] text-white border-none py-3 px-4 rounded-lg text-[13.5px] font-bold mt-4 cursor-pointer flex items-center justify-center gap-2 transition-all duration-250 shadow-[0_6px_12px_rgba(217,79,0,0.2)] hover:bg-[#bf4500] hover:-translate-y-px hover:shadow-[0_8px_16px_rgba(217,79,0,0.3)]" onClick={handleCheckout}>
            <ShoppingCart size={20} /> Buy All ({cartItems.length} items) <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

