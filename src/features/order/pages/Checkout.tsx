import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCartAsync } from '@/features/buyer/store/cart.slice';
import apiClient from '@/api/client';
import { useSocket } from '@/shared/contexts/SocketContext';
import { orderApi } from '@/features/order/services/order.api';
import { chatApi } from '@/features/chat/services/chat.api';
import {
  ShoppingBag, MapPin, Plus, Truck, ArrowLeft,
  CheckCircle, Package, AlertCircle, X,
  ChevronRight, Receipt, Handshake, FileText, Clock,
  Image as ImageIcon, MessageSquare
} from 'lucide-react';
import { addressApi } from '@/features/buyer/services/address.api';
import SignatureCanvas from 'react-signature-canvas';
import { removeWhiteBackground } from '@/shared/utils/removeBackground';
import { calculateGST, priceWithoutGST } from '@/shared/utils/calculateGST';
import { pincodeToState, normaliseState, getShippingZone } from '@/shared/utils/pincodeToState';
import Modal from '@/shared/components/ui/Modal';
import { ROUTES } from '@/shared/constants/routes';
import { indiaStates, stateCityMap } from '@/utils/indiaAddressData';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';

interface CheckoutItem {
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

interface CheckoutContentProps {
  buyNowItem?: CheckoutItem;
  onBack?: () => void;
  onOrderPlaced?: () => void;
}

const DELIVERY_TIMELINE_OPTIONS = [
  'Standard (5–7 business days)',
  'Within 3 days',
  'Within 7 days',
  'Within 15 days',
  'Within 30 days',
  'Flexible',
];

export const CheckoutContent: React.FC<CheckoutContentProps> = ({ buyNowItem, onBack, onOrderPlaced }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user) as any;

  const items: CheckoutItem[] = useMemo(() => {
    return buyNowItem ? [buyNowItem] : (cartItems as CheckoutItem[]);
  }, [buyNowItem, cartItems]);
  const isBuyNow = !!buyNowItem;

  useEffect(() => {
    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.CART)}`, { replace: true });
    }
  }, [user, navigate]);

  // Stock issue validation on checkout
  const checkoutStockIssues = useMemo(() => {
    return items.map(item => {
      const availableStock = item.stock ?? 0;
      if (item.stock !== undefined && availableStock <= 0) {
        return {
          name: item.name,
          availableStock: 0,
          requestedQty: item.quantity,
          type: 'OUT_OF_STOCK' as const,
        };
      }
      if (item.stock !== undefined && item.quantity > availableStock) {
        return {
          name: item.name,
          availableStock,
          requestedQty: item.quantity,
          type: 'INSUFFICIENT_STOCK' as const,
        };
      }
      return null;
    }).filter((issue): issue is NonNullable<typeof issue> => issue !== null);
  }, [items]);

  const hasCheckoutStockIssues = checkoutStockIssues.length > 0;

  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [selectedTransportation, setSelectedTransportation] = useState<string>('');
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<string>('');
  const [selectedDeliveryTimeline, setSelectedDeliveryTimeline] = useState<string>('Standard (5–7 business days)');

  const supplierId = items[0]?.supplierId;

  useEffect(() => {
    if (!supplierId) return;
    let active = true;
    apiClient.get(`/supplier/public/${supplierId}`).then(res => {
      if (!active) return;
      if (res.data?.supplier) {
        const s = res.data.supplier;
        setSupplierProfile(s);
        setSelectedTransportation(prev => prev || s.supportedTransportationTerms?.[0] || 'Ex. Factory');
        setSelectedPaymentTerm(prev => prev || s.supportedPaymentTerms?.[0] || '100% Advance');
      }
    }).catch(console.error);
    return () => { active = false; };
  }, [supplierId]);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    pincode: localStorage.getItem('amj_cart_pincode') || '',
    state: '',
    city: '',
    houseNo: '',
    area: '',
    isDefault: true,
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [savingAddress, setSavingAddress] = useState(false);

  const supplierIds = useMemo(() => {
    return Array.from(new Set(items.map(it => it.supplierId).filter(Boolean)));
  }, [items]);

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrders, setPlacedOrders] = useState<any[] | null>(null);
  const [showDealPanel, setShowDealPanel] = useState(false);
  const [dealPayMethod, setDealPayMethod] = useState<'direct' | 'amjstar'>('direct');
  const [dealAck, setDealAck] = useState(false);
  const sigCanvas = React.useRef<any>(null);
  const [signatureMode, setSignatureMode] = useState<'upload' | 'draw'>('draw');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [isChangingSignature, setIsChangingSignature] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(null);

  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiatedPrices, setNegotiatedPrices] = useState<Record<string, number>>({});

  const { socket } = useSocket();
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '');

  // Listen for supplier approval in real-time
  useEffect(() => {
    if (!placedOrders || placedOrders.length === 0) return;

    const checkUpdates = async () => {
      let changed = false;
      const newOrders = await Promise.all(placedOrders.map(async o => {
        if (o.status === 'pending_approval') {
          try {
            const freshRes: any = await orderApi.detail(o._id);
            const fresh = freshRes.data || freshRes;
            if (fresh.status !== 'pending_approval') {
              changed = true;
              return fresh;
            }
          } catch (e) { }
        }
        return o;
      }));
      if (changed) {
        setPlacedOrders(newOrders);
      }
    };

    // Socket listener (fast path)
    const handleOrderUpdate = (update: any) => {
      const matchedOrder = placedOrders.find(o => o._id === update.orderId);
      if (matchedOrder && update.status === 'pending') {
        checkUpdates();
      }
    };

    if (socket) {
      socket.on('order_update', handleOrderUpdate);
    }

    // Polling fallback (robust path)
    const interval = setInterval(() => {
      const needsPolling = placedOrders.some(o => o.status === 'pending_approval');
      if (needsPolling) checkUpdates();
    }, 5000);

    return () => {
      if (socket) socket.off('order_update', handleOrderUpdate);
      clearInterval(interval);
    };
  }, [socket, placedOrders]);


  // Fetch saved addresses; load guest address if unauthenticated or merge if just logged in
  useEffect(() => {
    const loadAddresses = async () => {
      let all: any[] = [];
      if (user) {
        try {
          const data = await addressApi.getAddresses();
          all = Array.isArray(data) ? data : [];
        } catch { }
        if (all.length === 0 && user?.address?.city) {
          all = [{
            _id: 'profile-address',
            fullName: user.name || '',
            phone: user.phone || '',
            pincode: user.address.pincode || '',
            state: user.address.state || '',
            city: user.address.city || '',
            houseNo: user.address.fullAddress || '',
            area: '',
            isDefault: true,
          }];
        }
      }

      // Check for saved guest address in localStorage
      try {
        const guestSaved = localStorage.getItem('amj_guest_address');
        if (guestSaved) {
          const parsed = JSON.parse(guestSaved);
          if (parsed && parsed.pincode) {
            const alreadyExists = all.some(a => a.pincode === parsed.pincode && a.houseNo === parsed.houseNo);
            if (!alreadyExists) {
              all = [parsed, ...all];
              if (user) {
                // If user is now logged in, quietly persist to backend
                addressApi.addAddress({
                  fullName: parsed.fullName,
                  phone: parsed.phone,
                  pincode: parsed.pincode,
                  state: parsed.state,
                  city: parsed.city,
                  houseNo: parsed.houseNo,
                  area: parsed.area,
                  isDefault: all.length === 1,
                }).catch(() => {});
              }
            }
          }
        }
      } catch { }

      setAddresses(all);
      const def = all.find((a: any) => a.isDefault) || all[0];
      if (def) setSelectedAddressId(def._id);
    };

    loadAddresses();
  }, [user]);

  // Restore guest signature if exists
  useEffect(() => {
    if (!tempSignature) {
      const savedGuestSig = localStorage.getItem('amj_guest_signature');
      if (savedGuestSig) {
        setTempSignature(savedGuestSig);
      }
    }
  }, []);

  // Restore checkout draft and auto-trigger pending actions on login
  useEffect(() => {
    const draftStr = localStorage.getItem('amj_checkout_draft');
    if (!draftStr) return;

    try {
      const draft = JSON.parse(draftStr);
      if (!draft) return;

      if (draft.transportation) setSelectedTransportation(draft.transportation);
      if (draft.paymentTerm) setSelectedPaymentTerm(draft.paymentTerm);
      if (draft.deliveryTimeline) setSelectedDeliveryTimeline(draft.deliveryTimeline);

      if (draft.signature && !tempSignature) {
        setTempSignature(draft.signature);
        if (user && !user.savedSignature) {
          apiClient.put('/user/profile', { savedSignature: draft.signature }).then(res => {
            if (res.data?.user) {
              import('@/features/auth/store/auth.slice').then(({ setCredentials }) => {
                dispatch(setCredentials({ user: res.data.user }));
              });
            }
          }).catch(() => {});
        }
      }

      if (user && draft.action) {
        const pendingAction = draft.action;
        draft.action = null; // Clear so it only triggers once
        localStorage.setItem('amj_checkout_draft', JSON.stringify(draft));

        if (pendingAction === 'confirm') {
          toast.success('Welcome back! Confirm your order details.');
          setShowDealPanel(true);
        } else if (pendingAction === 'negotiate') {
          if (user.gstin) {
            toast.success('Welcome back! Propose your negotiation prices.');
            const initPrices: Record<string, number> = {};
            items.forEach(it => { initPrices[it.productId] = it.price; });
            setNegotiatedPrices(initPrices);
            setShowNegotiationModal(true);
          } else {
            toast.error('GST number required for price negotiation. You can buy at listed price or update your profile.');
          }
        }
      }
    } catch (e) {
      console.error('Failed reading checkout draft', e);
    }
  }, [user, items]);

  const handlePincodeChange = (pincodeVal: string) => {
    const cleaned = pincodeVal.replace(/\D/g, '').slice(0, 6);
    const derivedState = pincodeToState(cleaned);
    setAddressForm(prev => ({
      ...prev,
      pincode: cleaned,
      state: derivedState || prev.state,
    }));
    if (addressErrors.pincode) {
      setAddressErrors(prev => {
        const next = { ...prev };
        delete next.pincode;
        return next;
      });
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!addressForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!/^\d{10}$/.test(addressForm.phone.replace(/\D/g, ''))) errors.phone = '10-digit mobile number required';
    if (!/^\d{6}$/.test(addressForm.pincode)) errors.pincode = '6-digit pincode required';
    if (!addressForm.state.trim()) errors.state = 'State is required';
    if (!addressForm.city.trim()) errors.city = 'City is required';
    if (!addressForm.houseNo.trim()) errors.houseNo = 'House / Building / Flat is required';
    if (!addressForm.area.trim()) errors.area = 'Area / Road / Landmark is required';

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    setSavingAddress(true);
    try {
      if (user) {
        const saved = await addressApi.addAddress({
          fullName: addressForm.fullName.trim(),
          phone: addressForm.phone.trim(),
          pincode: addressForm.pincode.trim(),
          state: addressForm.state.trim(),
          city: addressForm.city.trim(),
          houseNo: addressForm.houseNo.trim(),
          area: addressForm.area.trim(),
          isDefault: addresses.length === 0,
        });
        const updatedList = [saved, ...addresses];
        setAddresses(updatedList);
        setSelectedAddressId(saved._id);
        localStorage.removeItem('amj_guest_address');
      } else {
        const guestAddr = {
          _id: `guest_addr_${Date.now()}`,
          fullName: addressForm.fullName.trim(),
          phone: addressForm.phone.trim(),
          pincode: addressForm.pincode.trim(),
          state: addressForm.state.trim(),
          city: addressForm.city.trim(),
          houseNo: addressForm.houseNo.trim(),
          area: addressForm.area.trim(),
          isDefault: true,
        };
        localStorage.setItem('amj_guest_address', JSON.stringify(guestAddr));
        setAddresses(prev => [guestAddr, ...prev.filter(a => !a._id.startsWith('guest_addr_'))]);
        setSelectedAddressId(guestAddr._id);
      }
      setShowAddressModal(false);
      setError(null);
      toast.success('Delivery address saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const selectedAddress = addresses.find(a => a._id === selectedAddressId) || addresses[0];
  const buyerState = selectedAddress?.pincode ? pincodeToState(selectedAddress.pincode) : null;

  // GST + shipping — same logic as Cart.tsx
  const financials = items.reduce((acc, item) => {
    const rate = item.gstRate ?? 18;
    const qty = item.quantity;
    let basePerUnit: number;
    let gstPerUnit: number;
    if (item.gstIncluded) {
      basePerUnit = priceWithoutGST(item.price, rate);
      gstPerUnit = item.price - basePerUnit;
    } else {
      basePerUnit = item.price;
      gstPerUnit = calculateGST(item.price, rate);
    }
    acc.subtotal += basePerUnit * qty;
    if (rate > 0) {
      const gstAmt = gstPerUnit * qty;
      if (buyerState && item.supplierState) {
        const isIntra = normaliseState(item.supplierState) === buyerState;
        if (isIntra) {
          acc.cgstSgst[rate] = (acc.cgstSgst[rate] || 0) + gstAmt;
        } else {
          acc.igst[rate] = (acc.igst[rate] || 0) + gstAmt;
        }
      } else {
        acc.igst[rate] = (acc.igst[rate] || 0) + gstAmt;
      }
    }
    return acc;
  }, { subtotal: 0, cgstSgst: {} as Record<number, number>, igst: {} as Record<number, number> });

  const totalGst = [...Object.values(financials.cgstSgst), ...Object.values(financials.igst)].reduce((s, v) => s + v, 0);

  // Shipping: one charge per unique supplier
  const shippingBySupplierId = Object.fromEntries(
    Object.entries(
      items.reduce((acc, item) => {
        if (!acc[item.supplierId]) acc[item.supplierId] = item;
        return acc;
      }, {} as Record<string, CheckoutItem>)
    ).map(([sid, item]) => {
      if (!buyerState || !item.supplierState || !item.shippingRates) return [sid, null];
      const zone = getShippingZone(buyerState, item.supplierState);
      return [sid, { zone, cost: item.shippingRates[zone] }];
    })
  );
  const baseShippingCost = buyerState
    ? Object.values(shippingBySupplierId).reduce((s, v) => s + (v?.cost ?? 0), 0)
    : 0;

  const isFOR = selectedTransportation === 'FOR';
  const isExWorks = selectedTransportation === 'Ex. Factory' || selectedTransportation === 'Ex. Godown';
  const isThirdParty = selectedTransportation === 'Third-Party Courier';
  const totalShipping = (isFOR || isExWorks) ? 0 : baseShippingCost;
  const courierGST = isThirdParty ? (Math.round((totalShipping * 0.18) * 100) / 100) : 0;

  const taxableAmount = financials.subtotal;
  const grandTotal = taxableAmount + totalGst + totalShipping + courierGST;

  const handleNegotiateClick = () => {
    // 1. Check address
    if (!selectedAddress) {
      setError('Please add a delivery address.');
      setShowAddressModal(true);
      return;
    }

    // 2. Auto-capture signature if drawn/uploaded
    let currentSig = tempSignature || user?.savedSignature;
    if (!currentSig) {
      if (signatureMode === 'draw' && sigCanvas.current && !sigCanvas.current.isEmpty()) {
        try {
          currentSig = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        } catch {
          currentSig = sigCanvas.current.getCanvas().toDataURL('image/png');
        }
        setTempSignature(currentSig);
        if (!user) localStorage.setItem('amj_guest_signature', currentSig);
      } else if (signatureMode === 'upload' && uploadedSignature) {
        currentSig = uploadedSignature;
        setTempSignature(currentSig);
        if (!user) localStorage.setItem('amj_guest_signature', currentSig);
      }
    }

    // 3. GUEST CHECKOUT GATE: Send for login on this button click
    if (!user) {
      const draft = {
        action: 'negotiate',
        address: selectedAddress,
        signature: currentSig,
        transportation: selectedTransportation,
        paymentTerm: selectedPaymentTerm,
        deliveryTimeline: selectedDeliveryTimeline,
        buyNowItem: buyNowItem || null,
        timestamp: Date.now(),
      };
      localStorage.setItem('amj_checkout_draft', JSON.stringify(draft));
      if (currentSig) localStorage.setItem('amj_guest_signature', currentSig);
      toast('Please log in or create an account to negotiate prices', { icon: '🔐' });
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.CHECKOUT)}`);
      return;
    }

    // 4. Authenticated buyer: check GSTIN
    if (!user?.gstin) {
      toast.error('GST number required to start a price negotiation. You can buy at listed price or update your profile.');
      return;
    }

    setError(null);
    const initPrices: Record<string, number> = {};
    items.forEach(it => { initPrices[it.productId] = it.price; });
    setNegotiatedPrices(initPrices);
    setShowNegotiationModal(true);
  };

  const submitNegotiation = () => {
    setShowNegotiationModal(false);
    handlePlaceOrder('negotiate', negotiatedPrices);
  };

  useEffect(() => {
    if ((location.state as any)?.autoOpenNegotiate && selectedAddress && user?.gstin) {
      handleNegotiateClick();
    }
  }, [location.state, selectedAddress, user?.gstin]);

  const handlePlaceOrder = async (action: 'confirm' | 'negotiate', customPrices?: Record<string, number>) => {
    if (action === 'negotiate' && !user?.gstin) {
      toast.error('GST not available. You cannot use this feature.');
      return;
    }
    if (!selectedAddress) { setError('Please add a delivery address.'); return; }
    setPlacing(true); setError(null);
    try {
      const addressSnapshot = {
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        pincode: selectedAddress.pincode,
        state: selectedAddress.state,
        city: selectedAddress.city,
        fullAddress: [selectedAddress.houseNo, selectedAddress.area].filter(Boolean).join(', '),
      };

      const bySupplier: Record<string, typeof items> = {};
      for (const item of items) {
        if (!bySupplier[item.supplierId]) bySupplier[item.supplierId] = [];
        bySupplier[item.supplierId].push(item);
      }

      for (const [supplierId, supplierItems] of Object.entries(bySupplier)) {
        const cartItems = supplierItems.map(it => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          unit: it.unit,
          hsnCode: it.hsnCode || (it as any).hsnCode,
          gstRate: it.gstRate,
          imageUrl: it.imageUrl
        }));

        const conversation = await chatApi.getOrCreateConversation(
          supplierId,
          cartItems[0]?.productId,
          addressSnapshot,
          {
            transportationTerms: selectedTransportation,
            paymentTerms: selectedPaymentTerm,
            deliveryTimeline: selectedDeliveryTimeline,
            cartItems
          }
        );

        // Send chat message so that the enquiry is visible in the chat log immediately
        const shipTo = [
          addressSnapshot.fullAddress,
          addressSnapshot.city,
          addressSnapshot.state,
          addressSnapshot.pincode,
        ].filter(Boolean).join(', ');

        const itemsLines = items.map(it => {
          const p = customPrices && customPrices[it.productId] !== undefined ? customPrices[it.productId] : it.price;
          const gstText = it.gstRate !== undefined ? `, GST: ${it.gstRate}%` : '';
          if (customPrices && customPrices[it.productId] !== undefined && p !== it.price) {
            return `• ${it.name} (Qty: ${it.quantity} ${it.unit || 'pcs'}${gstText}) - Proposed: ₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Listed: ₹${it.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
          } else {
            return `• ${it.name} (Qty: ${it.quantity} ${it.unit || 'pcs'} @ ₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${gstText})`;
          }
        }).join('\n');

        const text = [
          `📦 ${action === 'negotiate' ? 'Negotiation Request (Bulk Inquiry)' : 'Order Request (Checkout)'}`,
          itemsLines,
          `Delivery Terms: ${selectedDeliveryTimeline}`,
          `Payment Terms: ${selectedPaymentTerm}`,
          `Transportation: ${selectedTransportation}`,
          shipTo ? `Ship to: ${shipTo}` : '',
        ].filter(Boolean).join('\n');

        if (socket) {
          socket.emit('join_conversation', conversation._id);
          const receiverId = conversation.supplierId;
          const images = items.map(it => it.imageUrl).filter(Boolean);
          socket.emit('send_message', {
            conversationId: conversation._id,
            text,
            receiverId,
            metadata: {
              imageUrl: images[0],
              images: images,
              deliveryTimeline: selectedDeliveryTimeline,
              paymentTerms: selectedPaymentTerm,
              transportationTerms: selectedTransportation,
              negotiationItems: items.map(it => ({
                productId: it.productId,
                name: it.name,
                quantity: it.quantity,
                price: customPrices && customPrices[it.productId] !== undefined ? customPrices[it.productId] : it.price,
                unit: it.unit,
                hsnCode: it.hsnCode || (it as any).hsnCode,
                gstRate: it.gstRate,
                imageUrl: it.imageUrl || (it as any).image,
                image: it.imageUrl || (it as any).image,
              }))
            }
          });
        }
      }

      if (!isBuyNow) dispatch(clearCartAsync());
      localStorage.removeItem('amj_checkout_draft');
      localStorage.removeItem('amj_guest_signature');
      localStorage.removeItem('amj_guest_address');
      localStorage.removeItem('amj_buynow_item');
      toast.success(action === 'negotiate' ? 'Negotiation started! You can chat with the supplier.' : 'Quote Request Sent! Negotiate terms with the supplier in the chat.');
      navigate('/profile?tab=messages');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to request quote.');
    } finally {
      setPlacing(false);
    }
  };

  const handleOpenDealPanel = () => {
    // 1. Auto-capture signature if drawn
    let currentSig = tempSignature || user?.savedSignature;
    if (!currentSig) {
      if (signatureMode === 'draw' && sigCanvas.current && !sigCanvas.current.isEmpty()) {
        try {
          currentSig = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        } catch {
          currentSig = sigCanvas.current.getCanvas().toDataURL('image/png');
        }
        setTempSignature(currentSig);
        if (!user) localStorage.setItem('amj_guest_signature', currentSig);
      } else if (signatureMode === 'upload' && uploadedSignature) {
        currentSig = uploadedSignature;
        setTempSignature(currentSig);
        if (!user) localStorage.setItem('amj_guest_signature', currentSig);
      }
    }

    // 2. Check address
    if (!selectedAddress) {
      setError('Please add a delivery address.');
      setShowAddressModal(true);
      return;
    }

    // 3. Check signature
    if (!currentSig) {
      setError('Please provide your Authorized Signature below.');
      return;
    }

    if (isChangingSignature) {
      setError('Please save or cancel your signature changes.');
      return;
    }

    // 4. GUEST CHECKOUT GATE: Send for login on this button click
    if (!user) {
      const draft = {
        action: 'confirm',
        address: selectedAddress,
        signature: currentSig,
        transportation: selectedTransportation,
        paymentTerm: selectedPaymentTerm,
        deliveryTimeline: selectedDeliveryTimeline,
        buyNowItem: buyNowItem || null,
        timestamp: Date.now(),
      };
      localStorage.setItem('amj_checkout_draft', JSON.stringify(draft));
      if (currentSig) localStorage.setItem('amj_guest_signature', currentSig);
      toast('Please log in or create an account to finalize your order', { icon: '🔐' });
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.CHECKOUT)}`);
      return;
    }

    setError(null);
    setShowDealPanel(true);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (placedOrders) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center max-w-[480px] mx-auto">
        <div className="w-20 h-20 rounded-full bg-[#ecfdf5] flex items-center justify-center">
          <CheckCircle size={40} className="text-[#059669]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#0f172a] m-0 mb-2">Order Requested!</h2>
          <p className="text-sm text-[#64748b] m-0">
            {placedOrders.length === 1
              ? `Order #${placedOrders[0].orderNumber} has been sent to the supplier for approval.`
              : `${placedOrders.length} orders requested: ${placedOrders.map(o => `#${o.orderNumber}`).join(', ')}`}
          </p>
        </div>

        <div className="w-full bg-[#f8fafc] border border-[#eef2f6] rounded-[12px] p-5 text-left">
          <div className="flex items-start gap-3 mb-3">
            <Handshake size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#0f172a] m-0">Direct Payment to Supplier</p>
              <p className="text-xs text-[#64748b] m-0 mt-0.5">Coordinate payment directly with your supplier</p>
            </div>
          </div>
          {selectedAddress && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#0f172a] m-0">{selectedAddress.fullName}</p>
                <p className="text-xs text-[#64748b] m-0 mt-0.5">
                  {[selectedAddress.houseNo, selectedAddress.area, selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full">
          {placedOrders.every(o => o.status === 'pending_approval') && (
            <div className="bg-[#fff7ed] border border-[#fdba74] p-3 rounded-[10px] text-left mb-2">
              <p className="text-xs text-[#c2410c] m-0 font-semibold mb-1 flex items-center gap-1.5"><Clock size={14} /> Awaiting Supplier Approval</p>
              <p className="text-[10px] text-[#ea580c] m-0">The supplier must review and approve this order before the official Purchase Order is generated.</p>
            </div>
          )}
          {placedOrders.some(o => o.poNumber) && placedOrders.map(order => order.poNumber && (
            <a
              key={order._id}
              href={`${apiBase}/api/orders/${order._id}/po-download`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#f0fdf4] border-2 border-[#059669] text-[#059669] font-bold text-sm rounded-[10px] no-underline hover:bg-[#dcfce7] transition-colors"
            >
              <FileText size={16} /> Download PO {order.poNumber ? `(${order.poNumber})` : ''}
            </a>
          ))}
          <button
            onClick={() => { if (onOrderPlaced) onOrderPlaced(); else navigate('/profile?tab=orders'); }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-[10px] border-none cursor-pointer hover:opacity-90"
          >
            <Package size={16} /> Track My Orders <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <ShoppingBag size={48} className="text-[#cbd5e1]" />
        <h2 className="text-base font-extrabold text-[#0f172a] m-0">Nothing to checkout</h2>
        <p className="text-sm text-[#64748b] m-0">Add items to your cart first.</p>
        <button
          className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90"
          onClick={() => onBack ? onBack() : navigate(ROUTES.CART)}
        >
          Go to Cart
        </button>
      </div>
    );
  }

  // ── Main checkout ────────────────────────────────────────────────────────
  return (
    <div>
      <button
        className="flex items-center gap-2 text-sm text-[#64748b] bg-transparent border-none cursor-pointer hover:text-[#0f172a] p-0 mb-6"
        onClick={() => onBack ? onBack() : navigate(ROUTES.CART)}
      >
        <ArrowLeft size={16} /> Back to Cart
      </button>

      <div className="flex gap-6 items-start max-lg:flex-col">
        {/* ── Left column ── */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Multi-Seller Warning Banner */}
          {supplierIds.length > 1 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-[12px] flex items-start gap-3 text-amber-900 text-xs">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm m-0 text-amber-950">Multiple Sellers in Your Order ({supplierIds.length} Sellers)</p>
                <p className="m-0 mt-1 text-[#78350f] leading-relaxed">
                  Your cart contains products from {supplierIds.length} different sellers. When you proceed, separate Purchase Orders and enquiry threads will be generated for each seller to maintain direct transparency and delivery coordination.
                </p>
              </div>
            </div>
          )}

          {/* Invoice table */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
              <Receipt size={18} className="text-primary" />
              <h2 className="text-base font-extrabold text-[#0f172a] m-0">
                Invoice — {items.length} item{items.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {/* Commercial Terms Selection */}
            <div className="px-5 py-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
              <h3 className="text-sm font-bold text-[#0f172a] mb-3">Commercial Terms</h3>
              <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Transportation Method</label>
                  <select
                    value={selectedTransportation}
                    onChange={(e) => setSelectedTransportation(e.target.value)}
                    className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm text-[#0f172a] outline-none bg-white focus:border-primary"
                  >
                    {supplierProfile?.supportedTransportationTerms?.length > 0 ? (
                      supplierProfile.supportedTransportationTerms.map((t: string) => (
                        <option key={t} value={t}>{t}</option>
                      ))
                    ) : (
                      <option value="Ex. Factory">Ex. Factory</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Payment Terms</label>
                  <select
                    value={selectedPaymentTerm}
                    onChange={(e) => setSelectedPaymentTerm(e.target.value)}
                    className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm text-[#0f172a] outline-none bg-white focus:border-primary"
                  >
                    {supplierProfile?.supportedPaymentTerms?.length > 0 ? (
                      supplierProfile.supportedPaymentTerms.map((t: string) => (
                        <option key={t} value={t}>{t}</option>
                      ))
                    ) : (
                      <option value="100% Advance">100% Advance</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Delivery Terms</label>
                  <select
                    value={selectedDeliveryTimeline}
                    onChange={(e) => setSelectedDeliveryTimeline(e.target.value)}
                    className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm text-[#0f172a] outline-none bg-white focus:border-primary"
                  >
                    {DELIVERY_TIMELINE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-[1fr_80px_90px_90px] gap-3 px-5 py-2.5 bg-[#f8fafc] border-b border-[#eef2f6] text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider max-sm:hidden">
              <span>Product</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Amount</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-[#f1f5f9]">
              {items.map((item, idx) => {
                const lineTotal = item.price * item.quantity;
                return (
                  <div key={item.productId || idx} className="px-5 py-4 flex gap-4 items-start">
                    {(item.imageUrl || (item as any).image) ? (
                      <img
                        src={item.imageUrl || (item as any).image}
                        alt={item.name}
                        onError={e => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Product';
                        }}
                        className="w-14 h-14 object-cover rounded-[8px] border border-[#f1f5f9] shrink-0 max-sm:w-10 max-sm:h-10"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] flex items-center justify-center shrink-0 max-sm:w-10 max-sm:h-10">
                        <Package size={20} className="text-[#94a3b8]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0f172a] m-0 leading-snug">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <p className="text-xs text-[#94a3b8] m-0">MOQ: {item.moq} {item.unit}</p>
                        <span className="text-[10px] font-semibold text-[#0369a1] bg-[#e0f2fe] border border-[#bae6fd] px-1.5 py-0.5 rounded-[4px]">
                          GST({item.gstRate ?? 18}%)
                        </span>
                      </div>
                      {/* Mobile-only price */}
                      <div className="sm:hidden mt-1 flex items-center gap-3 text-sm">
                        <span className="text-[#475569]">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {item.quantity}</span>
                        <span className="font-bold text-[#0f172a]">= ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    {/* Desktop price columns */}
                    <div className="hidden sm:grid grid-cols-[80px_90px_90px] gap-3 text-sm text-right shrink-0">
                      <span className="text-[#475569]">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[#475569]">{item.quantity} {item.unit}</span>
                      <span className="font-bold text-[#0f172a]">₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tax breakdown */}
            <div className="px-5 py-4 bg-[#f8fafc] border-t border-[#eef2f6] flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-[#475569]">
                <span>Taxable Amount</span>
                <span>₹{(Math.round((taxableAmount) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* CGST + SGST (intra-state) */}
              {Object.entries(financials.cgstSgst).map(([rateStr, amt]) => {
                const rate = Number(rateStr);
                const half = rate / 2;
                const halfAmt = (Math.round((amt / 2) * 100) / 100);
                return (
                  <React.Fragment key={`intra-${rate}`}>
                    <div className="flex justify-between text-[#475569]">
                      <span>CGST @{half}%</span>
                      <span>₹{halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>SGST @{half}%</span>
                      <span>₹{halfAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* IGST (inter-state) */}
              {Object.entries(financials.igst).map(([rateStr, amt]) => (
                <div key={`igst-${rateStr}`} className="flex justify-between text-[#475569]">
                  <span>IGST @{rateStr}%</span>
                  <span>₹{(Math.round((amt) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}

              {/* Shipping */}
              <div className="flex justify-between text-[#475569]">
                <span>Shipping {isFOR ? '(FOR - Included)' : ''}</span>
                <span className={totalShipping === 0 ? 'text-[#059669] font-semibold' : ''}>
                  {!buyerState ? '—' : totalShipping === 0 ? 'Free' : `₹${totalShipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>

              {isThirdParty && courierGST > 0 && (
                <div className="flex justify-between text-[#0369a1]">
                  <span>Courier GST @ 18%</span>
                  <span>₹{courierGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2.5 border-t border-[#e2e8f0]">
                <span className="font-extrabold text-[#0f172a] text-base">Grand Total</span>
                <span className="font-extrabold text-[#0f172a] text-base">
                  ₹{(Math.round((grandTotal) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0f172a] m-0">
                <MapPin size={18} className="text-primary" /> Delivery Address
              </h2>
              <div className="flex items-center gap-3">
                {user && (
                  <button
                    type="button"
                    className="text-xs font-bold text-[#64748b] bg-transparent border-none cursor-pointer hover:underline p-0"
                    onClick={() => navigate('/profile?tab=addresses')}
                  >
                    Manage
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0 flex items-center gap-1"
                  onClick={() => setShowAddressModal(true)}
                >
                  <Plus size={14} /> Add New Address
                </button>
              </div>
            </div>

            {addresses.length === 0 ? (
              <div
                className="border-2 border-dashed border-[#e2e8f0] rounded-[8px] p-5 flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-[#f8fafc]"
                onClick={() => setShowAddressModal(true)}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-primary"><Plus size={16} /> Add Delivery Address</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {addresses.map(addr => (
                  <label
                    key={addr._id}
                    className={`flex items-start gap-3 p-4 rounded-[10px] border cursor-pointer transition-all ${selectedAddressId === addr._id
                      ? 'border-primary bg-[#fff7ed] shadow-[0_0_0_3px_rgba(230,92,0,0.08)]'
                      : 'border-[#e2e8f0] hover:border-[#e65c00]/30'
                      }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr._id}
                      checked={selectedAddressId === addr._id}
                      onChange={() => setSelectedAddressId(addr._id)}
                      className="mt-1 accent-[#e65c00]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#0f172a] m-0">{addr.fullName}</p>
                      <p className="text-xs text-[#64748b] m-0 mt-0.5">{addr.phone}</p>
                      <p className="text-xs text-[#64748b] m-0 mt-0.5 leading-relaxed">
                        {[addr.houseNo, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Signature Block */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0f172a] m-0 mb-1">
              Authorized Signature
            </h2>
            <p className="text-[11px] text-[#64748b] m-0 mb-4">Required to generate a legally binding Purchase Order.</p>

            {!isChangingSignature && (tempSignature || user?.savedSignature) ? (
              <div className="flex flex-col items-center gap-3">
                <div className="border border-[#e2e8f0] rounded-[8px] p-4 flex justify-center bg-white w-full max-w-[360px] h-[100px]">
                  <img src={tempSignature || user?.savedSignature} alt="Your Signature" className="max-w-full max-h-full object-contain" />
                </div>
                <button
                  onClick={() => setIsChangingSignature(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer bg-transparent border-none"
                >
                  Change Signature
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full max-w-[500px]">
                <div className="flex justify-center gap-4 border-b border-[#e2e8f0] pb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="radio" checked={signatureMode === 'draw'} onChange={() => setSignatureMode('draw')} />
                    Draw Signature
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="radio" checked={signatureMode === 'upload'} onChange={() => setSignatureMode('upload')} />
                    Upload Image
                  </label>
                </div>
                <p className="text-xs text-[#64748b] m-0 mb-1 italic">Note: Draw clearly or upload a photo of your signature on plain white paper.</p>

                <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden bg-white relative flex justify-center w-full">
                  {signatureMode === 'draw' ? (
                    <div className="w-full flex flex-col items-center bg-white overflow-x-auto">
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        backgroundColor="white"
                        canvasProps={{ width: 498, height: 200, className: 'cursor-crosshair bg-white block' }}
                      />
                      <button type="button" onClick={() => sigCanvas.current?.clear()} className="absolute bottom-2 right-2 text-[10px] text-gray-500 hover:text-gray-700 bg-white shadow px-2 py-1 rounded border-none cursor-pointer z-10">
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 w-full flex flex-col items-center bg-white">
                      <input
                        type="file"
                        accept="image/*"
                        className="text-xs"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              if (ev.target?.result) {
                                const processed = await removeWhiteBackground(ev.target.result as string);
                                setUploadedSignature(processed);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {uploadedSignature && (
                        <div className="mt-3 border border-[#e2e8f0] p-2 bg-white rounded flex justify-center h-[100px] w-full max-w-[360px]">
                          <img src={uploadedSignature} alt="Uploaded" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {isChangingSignature && (
                    <button onClick={() => setIsChangingSignature(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer">
                      Cancel
                    </button>
                  )}
                  <button
                    disabled={isChangingSignature && (signatureMode === 'upload' ? !uploadedSignature : false)} // basic disable
                    onClick={async () => {
                      let sigData = '';
                      if (signatureMode === 'upload' && uploadedSignature) {
                        sigData = uploadedSignature;
                      } else if (signatureMode === 'draw' && sigCanvas.current && !sigCanvas.current.isEmpty()) {
                        try {
                          sigData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
                        } catch (e) {
                          sigData = sigCanvas.current.getCanvas().toDataURL('image/png');
                        }
                      }

                      if (!sigData) {
                        toast.error('Please provide a signature');
                        return;
                      }

                      if (!user) {
                        setTempSignature(sigData);
                        localStorage.setItem('amj_guest_signature', sigData);
                        setIsChangingSignature(false);
                        toast.success('Signature saved for this order');
                        return;
                      }

                      try {
                        const loadingToast = toast.loading('Saving signature...');
                        const res = await apiClient.put('/user/profile', { savedSignature: sigData });

                        import('@/features/auth/store/auth.slice').then(({ setCredentials }) => {
                          dispatch(setCredentials({ user: res.data.user }));
                        });

                        setTempSignature(sigData);
                        setIsChangingSignature(false);
                        toast.success('Signature saved for this and future orders', { id: loadingToast });
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to save signature');
                      }
                    }}
                    className="px-4 py-2 bg-[#b44b1c] hover:bg-[#9c3e14] text-white font-bold rounded-[8px] cursor-pointer border-none transition-colors"
                  >
                    Save Signature
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={showNegotiationModal} onClose={() => setShowNegotiationModal(false)} title="Negotiate Order Prices" widthClass="w-[90%] max-w-[600px]">
          <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
            {items.map(it => {
              const currentVal = negotiatedPrices[it.productId] ?? it.price;
              const minVal = Math.max(1, Math.floor(it.price * 0.5));
              return (
                <div key={it.productId} className="flex flex-col gap-3 p-4 border border-[#e2e8f0] rounded-[10px] bg-white">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-bold text-[#0f172a] text-[15px]">{it.name}</span>
                    <span className="text-sm font-semibold text-[#475569] whitespace-nowrap">Listed: ₹{it.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between text-[11px] text-[#64748b] font-medium px-1">
                        <span>₹{minVal.toLocaleString('en-IN')} (50%)</span>
                        <span className="text-[#0ea5e9] font-bold text-xs border border-[#0ea5e9]/30 bg-[#f0f9ff] px-2 py-0.5 rounded-full">Proposed: ₹{currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span>₹{it.price.toLocaleString('en-IN')}</span>
                      </div>
                      <input
                        type="range"
                        min={minVal}
                        max={it.price}
                        step={0.5}
                        value={currentVal}
                        onChange={e => setNegotiatedPrices(prev => ({ ...prev, [it.productId]: Number(e.target.value) }))}
                        className="w-full accent-[#0ea5e9] h-2 bg-[#e2e8f0] rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-5 border-t border-[#e2e8f0] flex justify-end gap-3">
            <button
              onClick={() => setShowNegotiationModal(false)}
              className="px-5 py-2.5 text-sm font-semibold text-[#475569] bg-white border border-[#cbd5e1] rounded-[8px] cursor-pointer hover:bg-[#f8fafc] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitNegotiation}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#0ea5e9] border-none rounded-[8px] cursor-pointer hover:bg-[#0284c7] transition-colors flex items-center gap-2 shadow-sm shadow-[#0ea5e9]/20"
            >
              <MessageSquare size={16} /> Send for Negotiation
            </button>
          </div>
        </Modal>

        {/* ── Right column: payment ── */}
        <div className="w-[300px] max-lg:w-full shrink-0 flex flex-col gap-4 sticky top-6">

          {/* Mini summary */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-3">Summary</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-[#475569]">
                <span>Subtotal</span><span>₹{(Math.round((taxableAmount) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {(() => {
                const rates = Array.from(new Set(items.map(i => i.gstRate ?? 18)));
                if (rates.length === 1) {
                  return (
                    <div className="flex justify-between text-[#475569]">
                      <span>GST({rates[0]}%)</span>
                      <span>₹{(Math.round((totalGst) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  );
                }
                const byRate: Record<number, number> = {};
                items.forEach(it => {
                  const r = it.gstRate ?? 18;
                  const base = it.gstIncluded ? priceWithoutGST(it.price, r) : it.price;
                  const tax = (it.gstIncluded ? (it.price - base) : calculateGST(it.price, r)) * it.quantity;
                  byRate[r] = (byRate[r] || 0) + tax;
                });
                return Object.entries(byRate).map(([r, val]) => (
                  <div key={r} className="flex justify-between text-[#475569]">
                    <span>GST({r}%)</span>
                    <span>₹{(Math.round(val * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ));
              })()}
              <div className="flex justify-between text-[#475569]">
                <span>Shipping {isFOR ? '(FOR)' : isExWorks ? `(${selectedTransportation})` : ''}</span>
                <span className={totalShipping === 0 ? 'text-[#059669] font-semibold' : ''}>
                  {!buyerState ? '—' : totalShipping === 0 ? 'Free' : `₹${totalShipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>
              {isThirdParty && courierGST > 0 && (
                <div className="flex justify-between text-[#0369a1]">
                  <span>Courier GST @ 18%</span>
                  <span>₹{courierGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-[#0f172a] text-base pt-2.5 border-t border-[#f1f5f9] mt-1">
                <span>Total</span><span>₹{(Math.round((grandTotal) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment options */}
          <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Payment Method</h3>



            {/* Stock Issue Message */}
            {hasCheckoutStockIssues && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-[8px] flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <AlertCircle size={15} className="text-red-600 shrink-0" />
                  <span>Stock Issue Detected</span>
                </div>
                <ul className="m-0 pl-4 space-y-1 text-xs text-red-600">
                  {checkoutStockIssues.map((issue, idx) => (
                    <li key={idx}>
                      {issue.type === 'OUT_OF_STOCK' ? (
                        <span><strong>{issue.name}</strong> is currently out of stock.</span>
                      ) : (
                        <span><strong>{issue.name}</strong>: Only {issue.availableStock} in stock, but you requested {issue.requestedQty}.</span>
                      )}
                    </li>
                  ))}
                </ul>
                <span className="text-[11px] text-red-500 italic">
                  Please return to your cart to update or remove these items before completing your order.
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-[8px] flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 m-0">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleNegotiateClick}
                disabled={placing || hasCheckoutStockIssues}
                className="flex-1 flex items-center justify-center gap-2 p-4 bg-white border-2 border-[#3b82f6] hover:bg-[#eff6ff] rounded-[10px] text-[#2563eb] font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <MessageSquare size={18} />
                Negotiate Order
              </button>
              <button
                onClick={handleOpenDealPanel}
                disabled={placing || hasCheckoutStockIssues}
                className="flex-[1.2] flex items-center gap-3 p-4 bg-[#f0fdf4] border-2 border-[#86efac] rounded-[10px] text-left cursor-pointer hover:border-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
              >
                <div className="w-10 h-10 rounded-[8px] bg-white border border-[#86efac] flex items-center justify-center shrink-0 group-hover:border-[#22c55e]">
                  <Handshake size={18} className="text-[#16a34a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#15803d] m-0 truncate">Buy at Listed Price</p>
                  <p className="text-[11px] text-[#64748b] m-0 truncate">Sign & Request PO</p>
                </div>
                <ChevronRight size={16} className="text-[#16a34a] shrink-0 hidden sm:block" />
              </button>
            </div>

            {!selectedAddress && (
              <p className="text-xs text-[#dc2626] mt-3 m-0 text-center">Add a delivery address above to request quotation</p>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] text-[#1e40af] text-xs">
            <Truck size={14} className="shrink-0 mt-0.5" />
            <span>Standard delivery · 5–7 business days{totalShipping === 0 && buyerState ? ' · Free shipping' : ''}</span>
          </div>
        </div>
      </div>

      {/* Deal confirmation panel — rendered via portal so parent overflow/transform can't break centering */}
      {showDealPanel && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => { setShowDealPanel(false); setDealAck(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-[16px] w-full max-w-[440px] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.2)] max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Review Order Details</h3>
                <p className="text-[11px] text-[#64748b] m-0 mt-0.5">Please confirm details before generating PO.</p>
              </div>
              <button
                onClick={() => { setShowDealPanel(false); setDealAck(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f1f5f9] border-none cursor-pointer text-[#64748b] hover:bg-[#e2e8f0]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar pb-2">
              {/* Product Details */}
              <div className="flex flex-col gap-1.5 mb-5">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Product Details</p>
                <div className="flex flex-col gap-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 text-[11px] text-[#334155]">
                      <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[#e2e8f0]">
                        {(item.imageUrl || (item as any).image) ? (
                          <img
                            src={item.imageUrl || (item as any).image}
                            alt={item.name}
                            onError={e => {
                              (e.target as HTMLImageElement).onerror = null;
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Product';
                            }}
                            className="w-10 h-10 object-cover rounded-[6px] border border-[#cbd5e1]"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#e2e8f0] rounded-[6px] flex items-center justify-center shrink-0 border border-[#cbd5e1]">
                            <ImageIcon size={16} className="text-[#94a3b8]" />
                          </div>
                        )}
                        <span className="font-semibold text-sm text-[#0f172a]">{item.name}</span>
                      </div>
                      <div className="flex justify-between text-[#64748b]">
                        <span>Quantity</span>
                        <span>{item.quantity} {item.unit}</span>
                      </div>
                      <div className="flex justify-between text-[#64748b]">
                        <span>Unit Price</span>
                        <span>₹{item.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-[#0369a1]">
                        <span>GST</span>
                        <span className="font-semibold">GST({item.gstRate ?? 18}%)</span>
                      </div>
                      <div className="flex justify-between text-[#64748b] mt-1 pt-1 border-t border-[#e2e8f0]">
                        <span>Subtotal</span>
                        <span className="font-semibold text-[#0f172a]">₹{(item.quantity * item.price)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex flex-col gap-1.5 mb-5">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Order Summary</p>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 text-[11px] text-[#334155] flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Taxable Amount</span>
                    <span>₹{(Math.round((taxableAmount) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {totalGst > 0 && (() => {
                    const rates = Array.from(new Set(items.map(i => i.gstRate ?? 18)));
                    if (rates.length === 1) {
                      return (
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">GST({rates[0]}%)</span>
                          <span>₹{(Math.round((totalGst) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      );
                    }
                    const byRate: Record<number, number> = {};
                    items.forEach(it => {
                      const r = it.gstRate ?? 18;
                      const base = it.gstIncluded ? priceWithoutGST(it.price, r) : it.price;
                      const tax = (it.gstIncluded ? (it.price - base) : calculateGST(it.price, r)) * it.quantity;
                      byRate[r] = (byRate[r] || 0) + tax;
                    });
                    return Object.entries(byRate).map(([r, val]) => (
                      <div key={r} className="flex justify-between text-[#0369a1]">
                        <span>GST({r}%)</span>
                        <span>₹{(Math.round(val * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ));
                  })()}
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Shipping Cost {isExWorks ? `(${selectedTransportation})` : ''}</span>
                    <span>{totalShipping === 0 ? 'Free' : `₹${(Math.round((totalShipping) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                  </div>
                  {isThirdParty && courierGST > 0 && (
                    <div className="flex justify-between text-[#0369a1]">
                      <span>Courier GST @ 18%</span>
                      <span>₹{courierGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 mt-0.5 border-t border-[#e2e8f0] font-extrabold text-sm text-[#0f172a]">
                    <span>Grand Total</span>
                    <span>₹{(Math.round((grandTotal) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Commercial Terms Summary */}
              <div className="flex flex-col gap-1.5 mb-5">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Commercial Terms</p>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 text-[11px] text-[#334155] flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Delivery Terms</span>
                    <span className="font-semibold text-[#0f172a]">{selectedDeliveryTimeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Payment Terms</span>
                    <span className="font-semibold text-[#0f172a]">{selectedPaymentTerm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Transportation</span>
                    <span className="font-semibold text-[#0f172a]">{selectedTransportation}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Payment Method</p>
                {/* Direct Payment option */}
                <button
                  onClick={() => setDealPayMethod('direct')}
                  className={`w-full text-left mb-2 p-3 rounded-[10px] border-2 cursor-pointer transition-colors ${dealPayMethod === 'direct' ? 'border-[#059669] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex-none ${dealPayMethod === 'direct' ? 'border-[#059669] bg-[#059669]' : 'border-[#cbd5e1]'}`} />
                    <span className="text-sm font-bold text-[#0f172a]">Direct Payment to Supplier</span>
                  </div>
                  <p className="text-xs text-[#64748b] m-0 mt-1.5 ml-[22px] leading-relaxed">
                    You pay the supplier directly (UPI / bank / cash). Phone numbers unlock so you can coordinate.
                  </p>
                </button>

                {/* AMJSTAR Escrow — coming soon */}
                <div className="w-full mb-3 p-3 rounded-[10px] border border-dashed border-[#e2e8f0] bg-[#fafafa] opacity-70 cursor-not-allowed">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[#cbd5e1] shrink-0 flex-none" />
                    <span className="text-sm font-bold text-[#94a3b8]">Pay Through AMJSTAR (Escrow)</span>
                    <span className="text-[9px] font-bold text-[#d97706] bg-[#fffbeb] border border-[#fcd34d] px-1.5 py-0.5 rounded-full ml-auto">COMING SOON</span>
                  </div>
                  <p className="text-xs text-[#94a3b8] m-0 mt-1.5 ml-[22px] leading-relaxed">
                    AMJSTAR holds your payment safely until you confirm delivery. Launching soon.
                  </p>
                </div>

                {/* Acknowledgement */}
                {dealPayMethod === 'direct' && (
                  <label className="flex items-start gap-2 mt-4 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dealAck}
                      onChange={e => setDealAck(e.target.checked)}
                      className="mt-0.5 accent-[#059669] shrink-0"
                    />
                    <span className="text-xs text-[#475569] leading-relaxed">
                      I confirm the details above are correct and I wish to generate a legally binding Purchase Order.
                      <span className="block mt-1">
                        I understand that payment is handled <strong>directly between me and the supplier</strong>, and AMJSTAR is not responsible for the payment or its settlement.
                      </span>
                    </span>
                  </label>
                )}

              </div> {/* End Payment Method container */}
            </div> {/* End Scroll container */}

            <div className="flex gap-3 mt-4 pt-4 border-t border-[#e2e8f0] shrink-0">
              <button
                onClick={() => { setShowDealPanel(false); setDealAck(false); }}
                className="flex-1 py-2.5 text-sm font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[10px] cursor-pointer hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                disabled={placing || (dealPayMethod === 'direct' && !dealAck)}
                onClick={() => { setShowDealPanel(false); handlePlaceOrder('confirm'); }}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[10px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {placing ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" />
                  </svg>
                ) : 'Checkout'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Add Delivery Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Add Delivery Address"
        widthClass="w-[90%] max-w-[540px]"
      >
        <form onSubmit={handleSaveAddress} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Receiver or Company Name"
                value={addressForm.fullName}
                onChange={e => {
                  setAddressForm(prev => ({ ...prev, fullName: e.target.value }));
                  if (addressErrors.fullName) setAddressErrors(prev => { const n = { ...prev }; delete n.fullName; return n; });
                }}
                className={`w-full border ${addressErrors.fullName ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary`}
              />
              {addressErrors.fullName && <p className="text-[11px] text-red-600 m-0 mt-0.5">{addressErrors.fullName}</p>}
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={addressForm.phone}
                onChange={e => {
                  setAddressForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }));
                  if (addressErrors.phone) setAddressErrors(prev => { const n = { ...prev }; delete n.phone; return n; });
                }}
                className={`w-full border ${addressErrors.phone ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary`}
              />
              {addressErrors.phone && <p className="text-[11px] text-red-600 m-0 mt-0.5">{addressErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block mb-1">
                Pincode *
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="6 digits"
                value={addressForm.pincode}
                onChange={e => handlePincodeChange(e.target.value)}
                className={`w-full border ${addressErrors.pincode ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary`}
              />
              {addressErrors.pincode && <p className="text-[11px] text-red-600 m-0 mt-0.5">{addressErrors.pincode}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block mb-1">
                State *
              </label>
              <select
                value={addressForm.state}
                onChange={e => {
                  const newState = e.target.value;
                  setAddressForm(prev => ({ ...prev, state: newState, city: '' }));
                  if (addressErrors.state) setAddressErrors(prev => { const n = { ...prev }; delete n.state; return n; });
                }}
                className={`w-full border ${addressErrors.state ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary bg-white`}
              >
                <option value="">Select State</option>
                {indiaStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {addressErrors.state && <p className="text-[11px] text-red-600 m-0 mt-0.5">{addressErrors.state}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block mb-1">
                City / District *
              </label>
              {addressForm.state && stateCityMap[addressForm.state]?.length ? (
                <select
                  value={addressForm.city}
                  onChange={e => {
                    setAddressForm(prev => ({ ...prev, city: e.target.value }));
                    if (addressErrors.city) setAddressErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                  }}
                  className={`w-full border ${addressErrors.city ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary bg-white`}
                >
                  <option value="">Select City</option>
                  {stateCityMap[addressForm.state].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="City name"
                  value={addressForm.city}
                  onChange={e => {
                    setAddressForm(prev => ({ ...prev, city: e.target.value }));
                    if (addressErrors.city) setAddressErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                  }}
                  className={`w-full border ${addressErrors.city ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary`}
                />
              )}
              {addressErrors.city && <p className="text-[11px] text-red-600 m-0 mt-0.5">{addressErrors.city}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block mb-1">
              Flat / House / Building / Warehouse *
            </label>
            <input
              type="text"
              placeholder="e.g. Unit 4B, Shreeji Industrial Complex"
              value={addressForm.houseNo}
              onChange={e => {
                setAddressForm(prev => ({ ...prev, houseNo: e.target.value }));
                if (addressErrors.houseNo) setAddressErrors(prev => { const n = { ...prev }; delete n.houseNo; return n; });
              }}
              className={`w-full border ${addressErrors.houseNo ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary`}
            />
            {addressErrors.houseNo && <p className="text-[11px] text-red-600 m-0 mt-0.5">{addressErrors.houseNo}</p>}
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-[#64748b] tracking-wider block mb-1">
              Area / Street / Sector / Landmark *
            </label>
            <input
              type="text"
              placeholder="e.g. GIDC Phase 2, Near Ring Road"
              value={addressForm.area}
              onChange={e => {
                setAddressForm(prev => ({ ...prev, area: e.target.value }));
                if (addressErrors.area) setAddressErrors(prev => { const n = { ...prev }; delete n.area; return n; });
              }}
              className={`w-full border ${addressErrors.area ? 'border-red-500 bg-red-50' : 'border-[#cbd5e1]'} rounded-[8px] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-primary`}
            />
            {addressErrors.area && <p className="text-[11px] text-red-600 m-0 mt-0.5">{addressErrors.area}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setShowAddressModal(false)}
              className="px-4 py-2 text-sm font-semibold text-[#64748b] bg-white border border-[#cbd5e1] rounded-[8px] hover:bg-[#f8fafc] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAddress}
              className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-[8px] border-none hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {savingAddress ? 'Saving...' : 'Save Delivery Address'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Standalone page wrapper for /checkout route
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = (location.state as any)?.buyNowItem || (() => {
    try {
      const saved = localStorage.getItem('amj_buynow_item');
      return saved ? JSON.parse(saved) : undefined;
    } catch { return undefined; }
  })();

  useEffect(() => {
    if ((location.state as any)?.buyNowItem) {
      localStorage.setItem('amj_buynow_item', JSON.stringify((location.state as any).buyNowItem));
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8">
        <CheckoutContent
          buyNowItem={buyNowItem}
          onBack={() => navigate(ROUTES.CART)}
          onOrderPlaced={() => navigate('/profile?tab=orders')}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
