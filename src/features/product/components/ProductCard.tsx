import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cart.slice';
import { ROUTES } from '@/shared/constants/routes';
import type { Product } from '../types';
import Button from '@/shared/components/ui/Button';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const dispatch = useDispatch();

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
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>No Image</div>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.category}>{product.category}</p>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.priceRow}>
          <p className={styles.price}>{product.price.toLocaleString('en-IN')}</p>
          <p className={styles.moq}>MOQ: {product.minOrderQty} {product.unit}</p>
        </div>
        <p className={styles.supplier}>{product.supplierName}</p>
      </div>
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
    </Link>
  );
};

export default ProductCard;
