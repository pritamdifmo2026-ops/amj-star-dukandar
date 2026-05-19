import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addToCartAsync } from '@/store/slices/cart.slice';
import { toggleWishlistItem } from '@/store/slices/wishlist.slice';
import { ROUTES } from '@/shared/constants/routes';
import type { Product } from '../types';
import Button from '@/shared/components/ui/Button';

interface Props {
  product: Product;
  variant?: 'default' | 'wishlist';
  showAddToCart?: boolean;
}

const ProductCard: React.FC<Props> = ({ product, variant = 'default', showAddToCart = true }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const cartItems = useAppSelector(state => state.cart.items);
  const currentProductId = product.id || (product as any)._id;
  const isWishlisted = wishlistItems.some(item => {
    const itemId = String(item.id || (item as any)._id || '');
    const targetId = String(currentProductId || '');
    return itemId && targetId && itemId === targetId;
  });
  const isInCart = cartItems.some(item => item.productId === currentProductId);
  const user = useAppSelector(state => state.auth.user);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`); return; }
    if (currentProductId) dispatch(toggleWishlistItem(product));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInCart) { navigate(ROUTES.CART); return; }
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=/products`); return; }
    dispatch(addToCartAsync({ productId: currentProductId, name: product.name, price: product.price, quantity: product.minOrderQty, unit: product.unit, supplierId: product.supplierId, imageUrl: product.imageUrl }));
  };

  return (
    <Link to={ROUTES.PRODUCT_DETAIL.replace(':id', currentProductId)} className="flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden no-underline transition-all duration-300 h-full hover:-translate-y-2 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)] hover:border-[var(--color-primary)]">
      <div className="relative aspect-square bg-[#f8f8f8] overflow-hidden">
        <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border-none flex items-center justify-center cursor-pointer z-10 shadow-md transition-all duration-200 hover:scale-110" onClick={handleToggleWishlist} aria-label="Add to wishlist">
          <Heart size={14} fill={isWishlisted ? '#e65c00' : 'none'} color={isWishlisted ? '#e65c00' : '#94a3b8'} />
        </button>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">No Image</div>
        )}
      </div>
      <div className="p-2 flex-1 flex flex-col">
        {variant !== 'wishlist' && <p className="text-[10px] font-bold uppercase text-[var(--color-primary)] mb-1.5 tracking-wide">{product.category}</p>}
        <h3 className="text-xs font-semibold text-[var(--color-secondary)] mb-1.5 line-clamp-2 leading-snug flex-1">{product.name}</h3>
        <div className="flex justify-between items-baseline mb-1.5">
          <p className="text-[15px] text-[var(--color-text-primary)]">₹{(product.price || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">MOQ: {product.minOrderQty} {product.unit}</p>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">{product.supplierName}</p>
      </div>
      {showAddToCart && variant !== 'wishlist' && (
        <div className="px-2 pb-2">
          <Button variant="secondary" size="sm" onClick={handleAddToCart} className="w-full rounded-full text-[11px] font-semibold">
            {isInCart ? 'Go to Cart' : 'Add to Cart'}
          </Button>
        </div>
      )}
    </Link>
  );
};

export default ProductCard;
