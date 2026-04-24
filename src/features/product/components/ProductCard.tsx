import React from 'react';
import { Link } from 'react-router-dom';

import { Heart } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cart.slice';
import { toggleWishlist } from '@/store/slices/wishlist.slice';
import { ROUTES } from '@/shared/constants/routes';
import type { Product } from '../types';
import Button from '@/shared/components/ui/Button';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  variant?: 'default' | 'wishlist';
}

const ProductCard: React.FC<Props> = ({ product, variant = 'default' }) => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const isWishlisted = wishlistItems.some(item => item.id === product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(
      addToCart({
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
            size={20} 
            fill={isWishlisted ? 'var(--color-primary)' : 'none'} 
            color={isWishlisted ? 'var(--color-primary)' : '#888'} 
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
          <p className={styles.price}>{product.price.toLocaleString('en-IN')}</p>
          <p className={styles.moq}>MOQ: {product.minOrderQty} {product.unit}</p>
        </div>
        <p className={styles.supplier}>{product.supplierName}</p>
      </div>
      {variant !== 'wishlist' && (
        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddToCart}
            className={styles.cartBtn}
          >
            Add to Cart
          </Button>
        </div>
      )}
    </Link>
  );
};

export default ProductCard;
