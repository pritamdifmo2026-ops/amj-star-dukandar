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
} from '@/store/slices/cart.slice';
import type { CartItem } from '@/store/slices/cart.slice';
import { ROUTES } from '@/shared/constants/routes';
import styles from './Cart.module.css';

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
      <div className={styles.container}>
        <div className={styles.emptyCart}>
          <ShoppingBag size={64} color="#cbd5e1" />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to={ROUTES.PRODUCT_LIST} className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Cart</h1>
      <p className={styles.subtitle}>{user?.name?.toLowerCase().replace(' ', '') || 'buddykartstore'}</p>

      <div className={styles.cartContent}>
        <div className={styles.itemsSection}>
          <div className={styles.sectionHeader}>
            <h3>Total Items: {cartItems.length}</h3>
          </div>

          <div className={styles.itemsList}>
            {cartItems.map((item) => {
              const mrp = Math.round(item.price * 1.1); // Dummy 10% discount
              const discountPercent = Math.round(((mrp - item.price) / mrp) * 100);

              return (
                <div key={item.productId} className={styles.cartItem}>
                  <img 
                    src={item.imageUrl || 'https://via.placeholder.com/150'} 
                    alt={item.name} 
                    className={styles.itemImage} 
                  />
                  <div className={styles.itemDetails}>
                    <h2 className={styles.itemName}>{item.name}</h2>
                    <p className={styles.itemSku}>{item.productId.substring(0, 15)}...</p>
                    <p className={styles.variantAvailable}>Variant available</p>
                    
                    <div className={styles.specifications}>
                      <span className={styles.specsTitle}><Box size={14} /> Specifications:</span>
                      <div className={styles.tags}>
                        <span className={styles.tag}>Color: Black</span>
                        <span className={styles.tag}>Size: S</span>
                      </div>
                    </div>

                    <div className={styles.priceRow}>
                      <div className={styles.priceCol}>
                        <span className={styles.priceLabel}>MRP</span>
                        <span className={styles.mrp}>₹{mrp}</span>
                      </div>
                      <div className={styles.priceCol}>
                        <span className={styles.priceLabel}>Selling Price</span>
                        <span className={styles.sellingPrice}>₹{item.price}</span>
                      </div>
                      <div className={styles.priceCol}>
                        <span className={styles.priceLabel}>Discount</span>
                        <span className={styles.discountPercent}>{discountPercent}% OFF</span>
                      </div>
                    </div>

                    <div className={styles.variantBadge}>Variant Item</div>
                  </div>

                  <div className={styles.itemActions}>
                    <div className={styles.quantitySelector}>
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button className={styles.buyNowBtn} onClick={() => handleBuyNowSingle(item)}>
                      <CreditCard size={16} /> Buy Now
                    </button>
                    <button 
                      className={styles.deleteBtn}
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

        <div className={styles.summarySection}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          
          <div className={styles.summaryRow}>
            <span>Total MRP</span>
            <span>₹{Math.round(totalMRP)}</span>
          </div>
          
          <div className={styles.summaryRow}>
            <span>Total Discount</span>
            <span className={styles.discount}>-₹{Math.round(totalDiscount)}</span>
          </div>

          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total Amount</span>
            <span>₹{Math.round(totalAmount)}</span>
          </div>

          <div className={styles.totalItemsInfo}>
            <Box size={14} /> Total Items: {cartItems.length}
          </div>

          <button className={styles.checkoutBtn} onClick={handleCheckout}>
            <ShoppingCart size={20} /> Buy All ({cartItems.length} items) <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
