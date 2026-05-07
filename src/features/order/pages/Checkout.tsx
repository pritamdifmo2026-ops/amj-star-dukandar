import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { 
  ShoppingBag, MapPin, Plus, 
  Truck, ArrowLeft
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { addressApi } from '@/shared/services/address.api';
import styles from './Checkout.module.css';

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

  if (cartItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '60px' }}>
          <ShoppingBag size={64} color="#cbd5e1" style={{ margin: '0 auto 20px' }} />
          <h2>Your cart is empty</h2>
          <p>Please add items to your cart before checking out.</p>
          <button 
            className={styles.placeOrderBtn} 
            style={{ width: 'auto', margin: '20px auto 0' }}
            onClick={() => navigate(ROUTES.PRODUCT_LIST)}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#64748b', marginBottom: '16px' }}>
          <ArrowLeft size={18} /> Back to Cart
        </button>
        <h1>Complete your order</h1>
        <p>Review your items and select delivery details</p>
      </div>

      <div className={styles.checkoutLayout}>
        <div className={styles.mainSection}>
          {/* Order Items Section */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <ShoppingBag size={20} /> Order Items ({cartItems.length})
            </h2>
            <div className={styles.itemList}>
              {cartItems.map((item) => {
                const mrp = Math.round(item.price * 1.15);
                const discount = Math.round(((mrp - item.price) / mrp) * 100);
                
                return (
                  <div key={item.productId} className={styles.orderItem}>
                    <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
                    <div className={styles.itemInfo}>
                      <h3>{item.name}</h3>
                      <span className={styles.itemVariant}>size: M</span>
                      <div className={styles.itemPriceRow}>
                        <span className={styles.oldPrice}>₹{mrp}</span>
                        <span className={styles.currentPrice}>₹{item.price}</span>
                        <span className={styles.discountLabel}>{discount}% off</span>
                      </div>
                      <p className={styles.itemQty}>Quantity : {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className={styles.card}>
            {defaultAddress ? (
              <div className={styles.addressCompact}>
                <div className={styles.addressLine1}>
                  <strong>Deliver to: </strong> {defaultAddress.fullName}, {defaultAddress.pincode}
                  <button className={styles.changeBtn} onClick={() => navigate(`${ROUTES.ADDRESSES}?redirect=${ROUTES.CHECKOUT}`)}>
                    Change
                  </button>
                </div>
                <p className={styles.addressLine2}>
                  {defaultAddress.houseNo}, {defaultAddress.area}, {defaultAddress.city}, {defaultAddress.state}
                </p>
              </div>
            ) : (
              <>
                <h2 className={styles.cardTitle}>
                  <MapPin size={20} /> Delivery Address
                </h2>
                <div 
                  className={styles.addressPlaceholder} 
                  onClick={() => navigate(`${ROUTES.ADDRESSES}?redirect=${ROUTES.CHECKOUT}`)}
                >
                  <div className={styles.addAddressText}>
                    <Plus size={20} color="#D94F00" /> Add New Address
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.summarySection}>
          <h2 className={styles.paymentTitle}>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>₹{shipping.toFixed(2)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <div>
              Total
              <span className={styles.totalSubtext}>Inclusive of all taxes</span>
            </div>
            <span>₹{total.toFixed(2)}</span>
          </div>


          <div className={styles.deliveryEstimate}>
            <Truck size={18} />
            <div>
              <strong>Delivery Estimate</strong>
              <p>Standard Shipping • 5-7 business days</p>
            </div>
          </div>

          <button className={styles.placeOrderBtn} onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
