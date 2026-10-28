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
  moq: number;
  stock?: number;
  hsnCode?: string;
  gstRate?: number;
  gstIncluded?: boolean;
  supplierState?: string;
  shippingRates?: { local: number; regional: number; national: number };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const GUEST_CART_KEY = 'amj_guest_cart';

export const loadGuestCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveGuestCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save guest cart', err);
  }
};

const initialState: CartState = {
  items: typeof window !== 'undefined' ? loadGuestCart() : [],
  loading: false,
  error: null,
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { getState }) => {
  const state = getState() as any;
  const isAuthenticated = Boolean(state.auth?.isAuthenticated && state.auth?.user);

  if (!isAuthenticated) {
    return loadGuestCart();
  }

  // Merge any pending guest cart items into the authenticated user's cart
  const guestItems = loadGuestCart();
  if (guestItems.length > 0) {
    try {
      for (const item of guestItems) {
        await cartApi.addToCart(item);
      }
      localStorage.removeItem(GUEST_CART_KEY);
    } catch (error) {
      console.warn('Failed to merge guest cart items:', error);
    }
  }

  try {
    const response = await cartApi.getCart();
    return response.data.items || [];
  } catch (error) {
    console.error('fetchCart error:', error);
    throw error;
  }
});

export const addToCartAsync = createAsyncThunk('cart/add', async (item: CartItem, { getState }) => {
  const state = getState() as any;
  const isAuthenticated = Boolean(state.auth?.isAuthenticated && state.auth?.user);

  if (!isAuthenticated) {
    const current = loadGuestCart();
    const existingIndex = current.findIndex(i => i.productId === item.productId);
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = current.map((it, idx) =>
        idx === existingIndex ? { ...it, quantity: it.quantity + item.quantity } : it
      );
    } else {
      updated = [...current, item];
    }
    saveGuestCart(updated);
    return updated;
  }

  try {
    const response = await cartApi.addToCart(item);
    return response.data.items || [];
  } catch (error) {
    console.error('addToCart error:', error);
    throw error;
  }
});

export const updateQuantityAsync = createAsyncThunk(
  'cart/update',
  async ({ productId, quantity }: { productId: string; quantity: number }, { getState }) => {
    const state = getState() as any;
    const isAuthenticated = Boolean(state.auth?.isAuthenticated && state.auth?.user);

    if (!isAuthenticated) {
      const current = loadGuestCart();
      const updated = current.map(it => (it.productId === productId ? { ...it, quantity } : it));
      saveGuestCart(updated);
      return updated;
    }

    const response = await cartApi.updateQuantity(productId, quantity);
    return response.data.items;
  }
);

export const removeFromCartAsync = createAsyncThunk(
  'cart/remove',
  async (productId: string, { getState }) => {
    const state = getState() as any;
    const isAuthenticated = Boolean(state.auth?.isAuthenticated && state.auth?.user);

    if (!isAuthenticated) {
      const current = loadGuestCart();
      const updated = current.filter(it => it.productId !== productId);
      saveGuestCart(updated);
      return updated;
    }

    const response = await cartApi.removeFromCart(productId);
    return response.data.items;
  }
);

export const clearCartAsync = createAsyncThunk('cart/clearBackend', async (_, { getState }) => {
  const state = getState() as any;
  const isAuthenticated = Boolean(state.auth?.isAuthenticated && state.auth?.user);

  localStorage.removeItem(GUEST_CART_KEY);
  if (!isAuthenticated) {
    return [];
  }

  const response = await cartApi.clearCart();
  return response.data.items || [];
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart(state) {
      localStorage.removeItem(GUEST_CART_KEY);
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
      })
      .addCase(clearCartAsync.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
