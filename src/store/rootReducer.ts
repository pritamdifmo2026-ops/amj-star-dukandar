import authReducer from './slices/auth.slice';
import cartReducer from './slices/cart.slice';
import uiReducer from './slices/ui.slice';
import wishlistReducer from './slices/wishlist.slice';
import { combineReducers } from '@reduxjs/toolkit';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  ui: uiReducer,
  wishlist: wishlistReducer,
});

export default rootReducer;
