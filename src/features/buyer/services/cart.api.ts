import api from '@/api/client';

export const cartApi = {
  getCart: () => api.get('/cart'),
  addToCart: (item: any) => api.post('/cart/add', item),
  updateQuantity: (productId: string, quantity: number) => 
    api.put('/cart/update', { productId, quantity }),
  removeFromCart: (productId: string) => api.delete(`/cart/${productId}`),
};
