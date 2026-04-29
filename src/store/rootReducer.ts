import authReducer from './slices/auth.slice';
import cartReducer from './slices/cart.slice';
import uiReducer from './slices/ui.slice';
import wishlistReducer from './slices/wishlist.slice';
import supplierReducer from './slices/supplier.slice';
import resellerReducer from './slices/reseller.slice';
import { combineReducers } from '@reduxjs/toolkit';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  ui: uiReducer,
  wishlist: wishlistReducer,
  supplier: supplierReducer,
  reseller: resellerReducer,
});

export default rootReducer;
