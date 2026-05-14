import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/auth.slice';
import cartReducer from '@/features/buyer/store/cart.slice';
import wishlistReducer from '@/features/buyer/store/wishlist.slice';
import supplierReducer from '@/features/supplier/store/supplier.slice';
import resellerReducer from '@/features/reseller/store/reseller.slice';
import uiReducer from '@/shared/store/ui.slice';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  ui: uiReducer,
  wishlist: wishlistReducer,
  supplier: supplierReducer,
  reseller: resellerReducer,
});

export default rootReducer;
