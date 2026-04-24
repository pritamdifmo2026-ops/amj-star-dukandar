import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../features/product/types';

interface WishlistState {
  items: Product[];
}

const savedWishlist = localStorage.getItem('wishlist');
const initialState: WishlistState = {

  items: savedWishlist ? (JSON.parse(savedWishlist) as Product[]) : [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist(state, action: PayloadAction<Product>) {
      const existsIndex = state.items.findIndex(item => item.id === action.payload.id);
      if (existsIndex >= 0) {
        state.items.splice(existsIndex, 1);
      } else {
        state.items.push(action.payload);
      }
      localStorage.setItem('wishlist', JSON.stringify(state.items));
    },
  },
});

export const { toggleWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
