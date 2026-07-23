# Complete AMJSTAR API Reference

This document is auto-generated to include all available API endpoints across the backend modules.

## Module: `address`
* **`GET`** `/api/address/`
* **`POST`** `/api/address/`
* **`PUT`** `/api/address/:id`
* **`DELETE`** `/api/address/:id`
* **`PATCH`** `/api/address/:id/default`

## Module: `admin`
* **`POST`** `/api/admin/change-password`
* **`GET`** `/api/admin/stats`
* **`GET`** `/api/admin/suppliers/pending`
* **`GET`** `/api/admin/suppliers/all`
* **`GET`** `/api/admin/suppliers/:id/products`
* **`PATCH`** `/api/admin/suppliers/:id/verify`
* **`PATCH`** `/api/admin/suppliers/:id/commission-rate`
* **`PATCH`** `/api/admin/suppliers/:id/auto-live`
* **`PATCH`** `/api/admin/suppliers/:id/complete-upgrade`
* **`GET`** `/api/admin/suppliers/:id/billing-history`
* **`GET`** `/api/admin/pending-upgrades`
* **`GET`** `/api/admin/supplier-plans`
* **`GET`** `/api/admin/products/pending`
* **`GET`** `/api/admin/products/all`
* **`PATCH`** `/api/admin/products/:id/verify`
* **`GET`** `/api/admin/resellers/pending`
* **`GET`** `/api/admin/resellers/all`
* **`PATCH`** `/api/admin/resellers/:id/verify`
* **`GET`** `/api/admin/users`
* **`PATCH`** `/api/admin/users/:id/status`
* **`GET`** `/api/admin/earnings`
* **`GET`** `/api/admin/supplier-performance`
* **`GET`** `/api/admin/disputes`
* **`PATCH`** `/api/admin/disputes/:id/validate`
* **`PATCH`** `/api/admin/disputes/:id/reject`
* **`GET`** `/api/admin/suppliers/:userId/frozen-orders`
* **`POST`** `/api/admin/orders/:orderId/unfreeze`
* **`GET`** `/api/admin/platform-settings`
* **`PUT`** `/api/admin/platform-settings`
* **`GET`** `/api/admin/withdrawals`
* **`PATCH`** `/api/admin/withdrawals/:id/process`
* **`GET`** `/api/admin/sub-admins`
* **`POST`** `/api/admin/sub-admins`
* **`PATCH`** `/api/admin/sub-admins/:id`
* **`DELETE`** `/api/admin/sub-admins/:id`

## Module: `auth`
* **`POST`** `/api/auth/send-otp`
* **`POST`** `/api/auth/verify-otp`
* **`POST`** `/api/auth/admin-login`
* **`POST`** `/api/auth/select-role`
* **`POST`** `/api/auth/change-phone/verify`
* **`POST`** `/api/auth/logout`

## Module: `banner`
* **`GET`** `/api/banner/active`
* **`POST`** `/api/banner/`
* **`GET`** `/api/banner/`
* **`PUT`** `/api/banner/:id`
* **`DELETE`** `/api/banner/:id`

## Module: `buyer`
* **`GET`** `/api/buyer/account-overview`
* **`PUT`** `/api/buyer/business-profile`
* **`PUT`** `/api/buyer/requirement`

## Module: `cart`
* **`GET`** `/api/cart/`
* **`POST`** `/api/cart/add`
* **`PUT`** `/api/cart/update`
* **`DELETE`** `/api/cart/:productId`

## Module: `category`
* **`GET`** `/api/category/`
* **`POST`** `/api/category/`
* **`PATCH`** `/api/category/:id`
* **`PATCH`** `/api/category/:id/certifications`
* **`DELETE`** `/api/category/:id`
* **`POST`** `/api/category/:categoryId/subcategories`
* **`PATCH`** `/api/category/subcategories/:subId`
* **`DELETE`** `/api/category/subcategories/:subId`

## Module: `certification`
* **`GET`** `/api/certification/`
* **`POST`** `/api/certification/`
* **`PATCH`** `/api/certification/:id`
* **`DELETE`** `/api/certification/:id`

## Module: `chat`
* **`GET`** `/api/chat/unread-count`
* **`POST`** `/api/chat/conversation`
* **`GET`** `/api/chat/conversations`
* **`DELETE`** `/api/chat/conversations/:conversationId`
* **`GET`** `/api/chat/messages/:conversationId`

## Module: `enquiry`
* **`POST`** `/api/enquiry/`
* **`GET`** `/api/enquiry/`
* **`GET`** `/api/enquiry/count/new`
* **`PATCH`** `/api/enquiry/:id/read`
* **`POST`** `/api/enquiry/:id/reply`

## Module: `geocode`
* **`GET`** `/api/geocode/reverse`

## Module: `meeting-request`
* **`POST`** `/api/meeting-request/`
* **`GET`** `/api/meeting-request/mine`
* **`GET`** `/api/meeting-request/`
* **`PATCH`** `/api/meeting-request/:id/schedule`
* **`PATCH`** `/api/meeting-request/:id/cancel`
* **`PATCH`** `/api/meeting-request/:id/complete`

## Module: `notification`
* **`GET`** `/api/notification/`
* **`PATCH`** `/api/notification/read-all`
* **`PATCH`** `/api/notification/:id/read`

## Module: `order`
* **`POST`** `/api/order/direct`
* **`GET`** `/api/order/`
* **`GET`** `/api/order/supplier`
* **`GET`** `/api/order/supplier/active-count`
* **`GET`** `/api/order/supplier/report`
* **`GET`** `/api/order/supplier/reviews`
* **`PATCH`** `/api/order/:id/pack`
* **`PATCH`** `/api/order/:id/dispatch`
* **`PATCH`** `/api/order/:id/mark-delivered`
* **`PATCH`** `/api/order/:id/confirm-delivery`
* **`POST`** `/api/order/:id/review`
* **`POST`** `/api/order/:id/dispute`
* **`GET`** `/api/order/:orderId/dispute`
* **`PATCH`** `/api/order/disputes/:id/supplier-resolve`
* **`PATCH`** `/api/order/disputes/:id/buyer-confirm`
* **`PATCH`** `/api/order/disputes/:id/reopen`
* **`PATCH`** `/api/order/disputes/:id/return-shipment`
* **`PATCH`** `/api/order/disputes/:id/pickup-tracking`
* **`PATCH`** `/api/order/disputes/:id/confirm-handover`
* **`PATCH`** `/api/order/disputes/:id/return-received`
* **`PATCH`** `/api/order/disputes/:id/dispatch-replacement`
* **`PATCH`** `/api/order/disputes/:id/confirm-exchange`
* **`PATCH`** `/api/order/disputes/:id/report-replacement`
* **`GET`** `/api/order/:id/po-download`
* **`GET`** `/api/order/:id`

## Module: `page`
* **`GET`** `/api/page/:slug`
* **`PUT`** `/api/page/:slug`

## Module: `partnership`
* **`POST`** `/api/partnership/request`
* **`GET`** `/api/partnership/my-requests`
* **`PUT`** `/api/partnership/customization/:partnershipId`
* **`GET`** `/api/partnership/incoming-requests`
* **`POST`** `/api/partnership/respond/:partnershipId`
* **`GET`** `/api/partnership/partners`

## Module: `payment`
* **`POST`** `/api/payment/create-order`
* **`POST`** `/api/payment/verify`

## Module: `product`
* **`GET`** `/api/product/`
* **`GET`** `/api/product/suggestions`
* **`POST`** `/api/product/`
* **`PATCH`** `/api/product/:id`
* **`DELETE`** `/api/product/:id`
* **`GET`** `/api/product/my-products`
* **`GET`** `/api/product/wallet-check`
* **`GET`** `/api/product/:id`
* **`PATCH`** `/api/product/:id/live-update`
* **`PATCH`** `/api/product/:id/seller-toggle`
* **`PATCH`** `/api/product/:id/verify`

## Module: `quotation`
* **`GET`** `/api/quotation/buyer`
* **`GET`** `/api/quotation/`
* **`POST`** `/api/quotation/`
* **`GET`** `/api/quotation/:id`
* **`POST`** `/api/quotation/:id/accept`
* **`POST`** `/api/quotation/:id/reject`
* **`POST`** `/api/quotation/:id/counter`
* **`POST`** `/api/quotation/:id/accept-counter`
* **`POST`** `/api/quotation/:id/reject-counter`
* **`POST`** `/api/quotation/:id/cancel`
* **`DELETE`** `/api/quotation/:id`
* **`PATCH`** `/api/quotation/:id`

## Module: `requirement`
* **`POST`** `/api/requirement/`
* **`GET`** `/api/requirement/my`
* **`GET`** `/api/requirement/`
* **`PATCH`** `/api/requirement/:id/status`
* **`PATCH`** `/api/requirement/:id/assign`
* **`PATCH`** `/api/requirement/:id/recommend`
* **`POST`** `/api/requirement/:id/send-mail`

## Module: `reseller`
* **`GET`** `/api/reseller/public/:slug` *(public — storefront profile + visible products)*
* **`POST`** `/api/reseller/public/:slug/lead` *(public — submit a buyer lead)*
* **`POST`** `/api/reseller/onboard`
* **`POST`** `/api/reseller/upload-doc`
* **`GET`** `/api/reseller/me`
* **`PUT`** `/api/reseller/profile`
* **`PUT`** `/api/reseller/storefront` *(save banner/theme/announcement)*
* **`GET`** `/api/reseller/leads`
* **`PATCH`** `/api/reseller/leads/:id`
* **`GET`** `/api/reseller/orders` *(orders attributed via `Order.resellerId`)*

## Module: `supplier`
* **`POST`** `/api/supplier/onboard`
* **`POST`** `/api/supplier/select-tier`
* **`GET`** `/api/supplier/plans`
* **`POST`** `/api/supplier/subscription/order`
* **`POST`** `/api/supplier/subscription/verify`
* **`POST`** `/api/supplier/upgrade/order`
* **`POST`** `/api/supplier/upgrade/verify`
* **`POST`** `/api/supplier/kyc`
* **`POST`** `/api/supplier/upload-doc`
* **`POST`** `/api/supplier/draft`
* **`GET`** `/api/supplier/me`
* **`GET`** `/api/supplier/billing-preview`
* **`GET`** `/api/supplier/billing-history`
* **`GET`** `/api/supplier/subscription-payments`
* **`POST`** `/api/supplier/reapply`
* **`PATCH`** `/api/supplier/own-shipping`
* **`POST`** `/api/supplier/send-verification-email`
* **`POST`** `/api/supplier/request-email-change`
* **`GET`** `/api/supplier/verify-email-change`
* **`POST`** `/api/supplier/request-phone-change`
* **`POST`** `/api/supplier/verify-phone-change`
* **`GET`** `/api/supplier/public/:id`
* **`GET`** `/api/supplier/verified`
* **`GET`** `/api/supplier/featured`
* **`GET`** `/api/supplier/shipping-zones`
* **`PUT`** `/api/supplier/shipping-zones`
* **`GET`** `/api/supplier/banks`
* **`POST`** `/api/supplier/banks`
* **`PUT`** `/api/supplier/banks/:id`
* **`DELETE`** `/api/supplier/banks/:id`
* **`PATCH`** `/api/supplier/banks/:id/set-primary`
* **`PATCH`** `/api/supplier/admin/:id/verify`

## Module: `ticket`
* **`POST`** `/api/ticket/create`
* **`GET`** `/api/ticket/`
* **`POST`** `/api/ticket/:id/reply`
* **`PATCH`** `/api/ticket/:id/status`

## Module: `upload`
* **`POST`** `/api/upload/image`
* **`POST`** `/api/upload/doc`
* **`POST`** `/api/upload/images`

## Module: `user`
* **`GET`** `/api/user/me`
* **`PUT`** `/api/user/profile`
* **`POST`** `/api/user/send-verification-email`
* **`GET`** `/api/user/verify-email`
* **`PATCH`** `/api/user/fcm-token`

## Module: `wallet`
* **`GET`** `/api/wallet/`
* **`GET`** `/api/wallet/transactions`
* **`POST`** `/api/wallet/topup/order`
* **`POST`** `/api/wallet/topup/verify`
* **`POST`** `/api/wallet/withdraw`
* **`GET`** `/api/wallet/withdrawals`

## Module: `wishlist`
* **`GET`** `/api/wishlist/`
* **`POST`** `/api/wishlist/toggle`
* **`DELETE`** `/api/wishlist/`

