import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Heart } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addToCartAsync } from '@/store/slices/cart.slice';
import { toggleWishlist } from '@/store/slices/wishlist.slice';
import { ROUTES } from '@/shared/constants/routes';
import type { Product } from '../types';
import Button from '@/shared/components/ui/Button';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  variant?: 'default' | 'wishlist';
  showAddToCart?: boolean;
}

const ProductCard: React.FC<Props> = ({ 
  product, 
  variant = 'default',
  showAddToCart = true 
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const cartItems = useAppSelector(state => state.cart.items);
  const isWishlisted = wishlistItems.some(item => item.id === product.id);
  const isInCart = cartItems.some(item => item.productId === product.id);
  const user = useAppSelector(state => state.auth.user);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isInCart) {
      navigate(ROUTES.CART);
      return;
    }

    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=/products`);
      return;
    }

    dispatch(
      addToCartAsync({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: product.minOrderQty,
        unit: product.unit,
        supplierId: product.supplierId,
        imageUrl: product.imageUrl,
      })
    );
  };

  return (
    <Link to={ROUTES.PRODUCT_DETAIL.replace(':id', product.id)} className={styles.card}>
      <div className={styles.imageWrap}>
        <button 
          className={`${styles.wishlistBtn} ${isWishlisted ? styles.active : ''}`} 
          onClick={handleToggleWishlist}
          aria-label="Add to wishlist"
        >
          <Heart 
            size={18} 
            fill={isWishlisted ? '#e65c00' : 'none'} 
            color={isWishlisted ? '#e65c00' : '#94a3b8'} 
          />
        </button>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>No Image</div>
        )}
      </div>
      <div className={styles.body}>
        {variant !== 'wishlist' && <p className={styles.category}>{product.category}</p>}
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.priceRow}>
          <p className={styles.price}>₹{product.price.toLocaleString('en-IN')}</p>
          <p className={styles.moq}>MOQ: {product.minOrderQty} {product.unit}</p>
        </div>
        <p className={styles.supplier}>{product.supplierName}</p>
      </div>
      {variant !== 'wishlist' && showAddToCart && (
        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddToCart}
            className={styles.cartBtn}
          >
            {isInCart ? 'Go to Cart' : 'Add to Cart'}
          </Button>
        </div>
      )}
    </Link>
  );
};

export default ProductCard;
