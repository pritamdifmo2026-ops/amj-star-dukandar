import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addToCartAsync } from '@/features/buyer/store/cart.slice';
import { toggleWishlistItem } from '@/features/buyer/store/wishlist.slice';
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
    e.preventDefault(); e.stopPropagation();
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`); return; }
    if (currentProductId) dispatch(toggleWishlistItem(product));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInCart) { navigate(ROUTES.CART); return; }
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=/products`); return; }
    dispatch(addToCartAsync({
      productId: currentProductId, name: product.name, price: product.price,
      quantity: product.minOrderQty, unit: product.unit, supplierId: product.supplierId, imageUrl: product.imageUrl,
    }));
  };

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL.replace(':id', currentProductId)}
      className="flex flex-col bg-white rounded-[var(--radius-lg)] border border-border overflow-hidden no-underline transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] h-full hover:-translate-y-2 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)] hover:border-primary group"
    >
      <div className="relative aspect-square bg-[#f8f8f8] overflow-hidden">
        <button
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface border-none flex items-center justify-center cursor-pointer z-10 shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-transform hover:scale-110"
          onClick={handleToggleWishlist}
          aria-label="Add to wishlist"
        >
          <Heart size={14} fill={isWishlisted ? '#e65c00' : 'none'} color={isWishlisted ? '#e65c00' : '#94a3b8'} />
        </button>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f1f5f9] text-[#94a3b8] text-sm">No Image</div>
        )}
      </div>
      <div className="p-2 flex-1 flex flex-col">
        {variant !== 'wishlist' && (
          <p className="text-[10px] font-bold uppercase text-primary mb-1.5 tracking-[0.05em]">{product.category}</p>
        )}
        <h3 className="text-xs font-semibold text-heading mb-1.5 line-clamp-2 leading-[1.4] flex-1">{product.name}</h3>
        <div className="flex justify-between items-baseline mb-1.5">
          <p className="font-display text-[15px] font-normal text-heading">₹{(product.price || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-muted">MOQ: {product.minOrderQty} {product.unit}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] text-body font-medium">{product.supplierName}</p>
          {product.isVerified && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#059669] bg-[#ecfdf5] px-1.5 py-0.5 rounded-full leading-none border border-[#a7f3d0]" title="Verified Supplier">
              <ShieldCheck size={10} /> Verified
            </span>
          )}
        </div>
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
