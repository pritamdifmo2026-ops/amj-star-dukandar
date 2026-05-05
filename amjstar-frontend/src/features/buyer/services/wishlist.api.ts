import api from '@/api/client';

export const wishlistApi = {
  getWishlist: () => api.get('/wishlist'),
  toggleWishlist: (productId: string) => api.post('/wishlist/toggle', { productId }),
  clearWishlist: () => api.delete('/wishlist'),
};
