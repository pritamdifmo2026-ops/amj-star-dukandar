import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi } from '@/features/buyer/services/cart.api';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  supplierId: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk('cart/fetch', async () => {
  try {
    const response = await cartApi.getCart();
    console.log('fetchCart response:', response.data);
    return response.data.items || [];
  } catch (error) {
    console.error('fetchCart error:', error);
    throw error;
  }
});

export const addToCartAsync = createAsyncThunk('cart/add', async (item: CartItem) => {
  try {
    const response = await cartApi.addToCart(item);
    console.log('addToCart response:', response.data);
    return response.data.items || [];
  } catch (error) {
    console.error('addToCart error:', error);
    throw error;
  }
});

export const updateQuantityAsync = createAsyncThunk(
  'cart/update',
  async ({ productId, quantity }: { productId: string; quantity: number }) => {
    const response = await cartApi.updateQuantity(productId, quantity);
    return response.data.items;
  }
);

export const removeFromCartAsync = createAsyncThunk('cart/remove', async (productId: string) => {
  const response = await cartApi.removeFromCart(productId);
  return response.data.items;
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(updateQuantityAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
