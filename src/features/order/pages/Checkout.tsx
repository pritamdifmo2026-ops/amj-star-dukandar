import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import {
  ShoppingBag, MapPin, Plus,
  Truck, ArrowLeft
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { addressApi } from '@/shared/services/address.api';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useAppSelector((state) => state.cart.items);
  const [addresses, setAddresses] = useState<any[]>([]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await addressApi.getAddresses();
        setAddresses(data);
      } catch (error) {
        console.error('Failed to fetch addresses', error);
      }
    };
    fetchAddresses();
  }, []);

  const handleContinue = () => {
    if (!defaultAddress) {
      alert('Please add a delivery address.');
      return;
    }
    navigate(ROUTES.PAYMENT);
  };

  const cardCls = "bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]";
  const cardTitleCls = "flex items-center gap-2 text-base font-extrabold text-[#0f172a] m-0 mb-5";

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className={cardCls + " text-center p-16"}>
          <ShoppingBag size={64} className="text-[#cbd5e1] mx-auto mb-5" />
          <h2 className="text-xl font-extrabold text-[#0f172a] m-0 mb-2">Your cart is empty</h2>
          <p className="text-sm text-[#64748b] m-0 mb-5">Please add items to your cart before checking out.</p>
          <button
            className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate(ROUTES.PRODUCT_LIST)}
          >
            Browse Products
          </button>
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
        <ArrowLeft size={18} /> Back to Cart
      </button>
      <h1 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Complete your order</h1>
      <p className="text-sm text-[#64748b] m-0 mb-7">Review your items and select delivery details</p>

      <div className="flex gap-6 items-start max-lg:flex-col">
        <div className="flex-1 flex flex-col gap-5">
          <div className={cardCls}>
            <h2 className={cardTitleCls}>
              <ShoppingBag size={20} /> Order Items ({cartItems.length})
            </h2>
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => {
                const mrp = Math.round(item.price * 1.15);
                const discount = Math.round(((mrp - item.price) / mrp) * 100);
                return (
                  <div key={item.productId} className="flex items-start gap-4 pb-4 border-b border-[#f1f5f9] last:border-0 last:pb-0">
                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-[8px] border border-[#eef2f6] shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-[#0f172a] m-0 mb-1">{item.name}</h3>
                      <span className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">size: M</span>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs line-through text-[#94a3b8]">₹{mrp}</span>
                        <span className="text-base font-extrabold text-[#0f172a]">₹{item.price}</span>
                        <span className="text-xs font-bold text-[#059669]">{discount}% off</span>
                      </div>
                      <p className="text-xs text-[#64748b] m-0 mt-1">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cardCls}>
            {defaultAddress ? (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#0f172a]">Deliver to: {defaultAddress.fullName}, {defaultAddress.pincode}</span>
                  <button
                    className="text-xs font-bold text-primary bg-transparent border border-primary rounded-full px-2.5 py-0.5 cursor-pointer hover:bg-[#fff7ed]"
                    onClick={() => navigate(`${ROUTES.ADDRESSES}?redirect=${ROUTES.CHECKOUT}`)}
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-[#64748b] m-0 mt-1">{defaultAddress.houseNo}, {defaultAddress.area}, {defaultAddress.city}, {defaultAddress.state}</p>
              </div>
            ) : (
              <>
                <h2 className={cardTitleCls}>
                  <MapPin size={20} /> Delivery Address
                </h2>
                <div
                  className="border-2 border-dashed border-[#e2e8f0] rounded-[8px] p-6 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`${ROUTES.ADDRESSES}?redirect=${ROUTES.CHECKOUT}`)}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-primary">
                    <Plus size={18} /> Add New Address
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-[320px] max-lg:w-full bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sticky top-6">
          <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">Order Summary</h2>

          <div className="flex justify-between text-sm text-[#475569] mb-3">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#475569] mb-3">
            <span>Shipping</span>
            <span>₹{shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-start font-extrabold text-base text-[#0f172a] pt-3 border-t border-[#f1f5f9] mb-5">
            <div>
              <div>Total</div>
              <div className="text-[10px] font-normal text-[#94a3b8] uppercase tracking-wide">Inclusive of all taxes</div>
            </div>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <div className="flex items-start gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 mb-5 text-sm text-[#475569]">
            <Truck size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#0f172a]">Delivery Estimate</div>
              <div className="text-xs text-[#64748b] mt-0.5">Standard Shipping • 5-7 business days</div>
            </div>
          </div>

          <button
            className="w-full py-3 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
