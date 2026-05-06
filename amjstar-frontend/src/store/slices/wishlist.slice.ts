import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../features/product/types';
import { wishlistApi } from '../../features/buyer/services/wishlist.api';
import { logout } from './auth.slice';

interface WishlistState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.getWishlist();
      return response.data.products; // Returns the populated products array
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

export const toggleWishlistItem = createAsyncThunk(
  'wishlist/toggle',
  async (product: Product, { rejectWithValue }) => {
    try {
      const productId = product.id || (product as any)._id;
      const response = await wishlistApi.toggleWishlist(productId);
      return response.data.products; // Returns the updated populated products array
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update wishlist');
    }
  }
);

const mapWishlistProducts = (products: any[]): Product[] => {
  return (products || []).map(p => {
    const finalId = p.id || p._id || (p as any)._id || (p as any).id;
    return {
      ...p,
      id: finalId ? String(finalId) : ''
    };
  }).filter(p => p.id && p.id !== 'undefined');
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistState(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.items = mapWishlistProducts(action.payload);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Toggle Wishlist - Optimistic Update
      .addCase(toggleWishlistItem.pending, (state, action) => {
        const product = action.meta.arg;
        const currentProductId = product.id || (product as any)._id;
        if (!currentProductId) return;

        const exists = state.items.some(item => {
          const itemId = item.id || (item as any)._id;
          return itemId === currentProductId;
        });
        
        if (exists) {
          // Optimistically remove
          state.items = state.items.filter(item => {
            const itemId = item.id || (item as any)._id;
            return itemId !== currentProductId;
          });
        } else {
          // Optimistically add
          state.items.push(product);
        }
      })
      .addCase(toggleWishlistItem.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.items = mapWishlistProducts(action.payload);
      })
      .addCase(toggleWishlistItem.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Clear on logout
      .addCase(logout, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearWishlistState } = wishlistSlice.actions;
export default wishlistSlice.reducer;
