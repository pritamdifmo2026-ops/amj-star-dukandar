import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toast } from 'react-hot-toast';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import {
  User, Package, MapPin, CreditCard, Settings, Bell, Heart,
  X, Mail, Phone, ShoppingBag,
  LogOut, ChevronRight, Star, Clock, Check, MessageCircle,
  Plus, Trash2, Edit2, CheckCircle2, BookUser
} from 'lucide-react';
import { setCredentials, logout } from '@/features/auth/store/auth.slice';
import authService from '@/features/auth/services/auth.service';
import ProductCard from '@/features/product/components/ProductCard';
import ChatInbox from '@/features/chat/components/ChatInbox';
import { useSocket } from '@/shared/contexts/SocketContext';
import { chatApi } from '@/features/chat/services/chat.api';
import adminService from '@/features/admin/services/admin.service';
import { compressImage } from '@/shared/utils/compressImage';
import { Camera, Loader2 } from 'lucide-react';
import OrderList from '../components/OrderList';
import { orderApi } from '@/features/order/services/order.api';
import Navbar from '@/features/landing/components/Navbar';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import AccountOverviewSection from '../components/AccountOverviewSection';
import { addressApi } from '@/features/buyer/services/address.api';

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";
const HELPLINE_NUMBER = '9034440673';
const PAYMENT_HELPLINE_NUMBER = '9034440659';
const emptyAddressForm = {
  fullName: '',
  phone: '',
  pincode: '',
  state: '',
  city: '',
  houseNo: '',
  area: '',
  isDefault: false,
};

const Profile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user) as any;
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const dispatch = useAppDispatch();

  if (user?.role === 'admin' || user?.role === 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', message: '' });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const memberSince = 'January 2024';
  const isEmailVerified = user?.isEmailVerified || false;
  const { socket } = useSocket();
  const [totalUnread, setTotalUnread] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
  const profileAddress = user?.address?.city ? {
    _id: 'profile-address',
    fullName: user?.name || 'Saved Address',
    phone: user?.phone || '',
    pincode: user.address.pincode,
    state: user.address.state,
    city: user.address.city,
    houseNo: user.address.fullAddress || '',
    area: '',
    isDefault: addresses.length === 0,
    isProfileAddress: true,
  } : null;
  const primaryAddress = defaultAddress || profileAddress;

  const addressList = addresses.length > 0
    ? addresses
    : profileAddress
      ? [profileAddress]
      : [];

  const formatAddressLine = (addr: any) => {
    const firstLine = [addr.houseNo, addr.area].filter(Boolean).join(', ');
    const secondLine = [addr.city, addr.state].filter(Boolean).join(', ');
    return { firstLine, secondLine: [secondLine, addr.pincode].filter(Boolean).join(' - ') };
  };

  const fetchUnreadCount = async () => {
    try {
      const conversations = await chatApi.getConversations();
      const count = conversations.reduce((acc: number, conv: any) => {
        const userId = user?.id;
        const unread = userId ? (conv.unreadCount?.[userId] || 0) : 0;
        return acc + unread;
      }, 0);
      setTotalUnread(count);
    } catch (err) {
      console.error('Failed to fetch unread count for profile badge');
    }
  };

  React.useEffect(() => {
    if (user) fetchUnreadCount();
  }, [user]);

  React.useEffect(() => {
    if (!socket) return;
    const handleNewMsg = () => fetchUnreadCount();
    socket.on('new_notification', handleNewMsg);
    return () => { socket.off('new_notification', handleNewMsg); };
  }, [socket]);

  const fetchOrderCount = async () => {
    try {
      const res = await orderApi.list();
      setOrderCount(res.data?.length ?? 0);
    } catch (err) {
      console.error('Failed to fetch order count');
    }
  };

  React.useEffect(() => {
    if (user) fetchOrderCount();
  }, [user]);

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const data = await addressApi.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to fetch addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const validateAddressForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!addressForm.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!/^\d{10}$/.test(addressForm.phone)) nextErrors.phone = 'Enter a valid 10-digit phone number';
    if (!/^\d{6}$/.test(addressForm.pincode)) nextErrors.pincode = 'Enter a valid 6-digit pincode';
    if (!addressForm.state.trim()) nextErrors.state = 'State is required';
    if (!addressForm.city.trim()) nextErrors.city = 'City is required';
    if (!addressForm.houseNo.trim()) nextErrors.houseNo = 'House/building is required';
    if (!addressForm.area.trim()) nextErrors.area = 'Area/street is required';
    setAddressErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateAddressField = (field: string, value: string | boolean) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const resetAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setAddressErrors({});
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddressForm()) return;
    setAddressSubmitting(true);
    try {
      if (editingAddressId) {
        await addressApi.updateAddress(editingAddressId, addressForm);
        toast.success('Address updated');
      } else {
        await addressApi.addAddress(addressForm);
        toast.success('Address added');
      }
      await fetchAddresses();
      resetAddressForm();
    } catch (err) {
      toast.error('Failed to save address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleAddressEdit = (addr: any) => {
    if (addr.isProfileAddress) {
      toast('Use Add Another Address to save this in your address book.');
      return;
    }
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      pincode: addr.pincode || '',
      state: addr.state || '',
      city: addr.city || '',
      houseNo: addr.houseNo || '',
      area: addr.area || '',
      isDefault: !!addr.isDefault,
    });
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
    setAddressErrors({});
  };

  const handleSetPrimaryAddress = async (addr: any) => {
    if (addr.isProfileAddress) {
      toast('This is already shown as your primary profile address.');
      return;
    }
    try {
      await addressApi.setDefault(addr._id);
      await fetchAddresses();
      toast.success('Primary address updated');
    } catch (err) {
      toast.error('Failed to update primary address');
    }
  };

  const handleAddressDelete = async (addr: any) => {
    if (addr.isProfileAddress) {
      toast('Profile address cannot be deleted here.');
      return;
    }
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressApi.deleteAddress(addr._id);
      await fetchAddresses();
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    try {
      const compressed = await compressImage(file, 400, 0.85);
      const imageUrl = await adminService.uploadImage(compressed);
      const response = await authService.updateProfile({ avatar: imageUrl });
      dispatch(setCredentials({ user: response.user }));
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      toast.error('Failed to update profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async () => {
    if (user) {
      try {
        const payload: any = {};
        if (editName && editName.trim().length >= 2) payload.name = editName.trim();
        if (editEmail && editEmail.trim().length > 0) {
          if (!/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/.test(editEmail.trim())) {
            toast.error('Please enter a valid email address');
            return;
          }
          payload.email = editEmail.trim();
        }
        const response = await authService.updateProfile(payload);
        dispatch(setCredentials({ user: response.user }));
        setIsEditingInfo(false);
        if (editEmail !== user.email && editEmail) {
          toast.success(`Verification email sent to ${editEmail}. Please check your inbox.`);
        }
      } catch (err) {
        toast.error('Failed to update profile.');
      }
    }
  };

  const handleSendVerifyEmail = async () => {
    setIsSendingEmail(true);
    try {
      await authService.sendVerificationEmail();
      toast.success('Verification email sent! Please check your inbox.');
    } catch (err) {
      toast.error('Failed to send verification email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleEnquirySubmit = async () => {
    if (!enquiryForm.name.trim() || !enquiryForm.phone.trim() || !enquiryForm.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setEnquirySubmitting(true);
    try {
      await adminService.submitEnquiry(enquiryForm);
      toast.success('Our team will contact you soon!');
      setEnquiryForm(prev => ({ ...prev, message: '' }));
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Account Overview', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package, badge: orderCount },
    { id: 'messages', label: 'Enquiries', icon: MessageCircle, badge: totalUnread },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistItems.length },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'contactus', label: 'Contact Us', icon: MessageCircle },
  ];













  const AvatarContent = () => (
    <>
      {isUploadingAvatar ? (
        <Loader2 className="animate-spin text-white/70" size={24} />
      ) : user?.avatar ? (
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl font-extrabold">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
      )}
    </>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 bg-[#f8fafc] max-lg:flex-col">
        <aside className="w-[260px] max-lg:w-full bg-white border-r border-[#eef2f6] flex flex-col shrink-0 max-lg:border-r-0 max-lg:border-b">
          <div className="flex items-center justify-between p-5 border-b border-[#f1f5f9] max-lg:py-3 max-lg:px-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 max-lg:w-9 max-lg:h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base max-lg:text-sm font-extrabold">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0f172a] m-0">{user?.name?.split(' ')[0] || 'Guest'}</h4>
                <p className="text-xs text-[#64748b] m-0 capitalize">{user?.role || 'Buyer'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="hidden max-lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#dc2626] bg-[#fef2f2] border-none rounded-[6px] cursor-pointer hover:bg-[#fee2e2] transition-colors"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 max-lg:flex max-lg:overflow-x-auto max-lg:py-0 max-lg:border-b max-lg:border-[#eef2f6] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full max-lg:w-auto shrink-0 flex items-center justify-between max-lg:justify-center px-5 py-3 max-lg:py-3.5 max-lg:px-4 text-sm transition-colors border-none cursor-pointer ${activeTab === item.id ? 'bg-[#fef2f2] max-lg:bg-transparent text-primary font-bold border-r-4 max-lg:border-r-0 max-lg:border-b-2 border-primary' : 'bg-transparent text-[#475569] hover:bg-[#f8fafc] max-lg:hover:bg-transparent font-semibold'}`}
                >
                  <div className="flex items-center gap-3 max-lg:gap-2">
                    <Icon size={18} className={activeTab === item.id ? 'text-primary' : 'text-[#94a3b8]'} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center max-lg:ml-2">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : (
                    <ChevronRight size={16} className={`max-lg:hidden ${activeTab === item.id ? 'text-primary' : 'text-[#cbd5e1]'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </aside>
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <>
              <div className="relative bg-gradient-to-r from-[#9a2f0c] via-[#BC461E] to-[#c0622a] px-8 pt-8 pb-16 max-sm:px-5 max-sm:pt-7 max-sm:pb-14 shadow-md">
                {/* Decorative blobs — contained, won't clip avatar */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                <div className="flex items-center gap-6 max-sm:gap-4 relative z-10">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 max-sm:w-16 max-sm:h-16 rounded-full bg-[#BC461E] text-white flex items-center justify-center overflow-hidden border-[3px] border-white/70 shadow-lg">
                      <AvatarContent />
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center cursor-pointer shadow border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors">
                      <Camera size={13} className="text-[#475569]" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                    </label>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h1 className="text-lg font-extrabold text-white m-0 truncate max-sm:text-base">{user?.name || 'Valued Partner'}</h1>
                      {isEmailVerified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full shrink-0">
                          <Check size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white/80 mb-3 flex-wrap">
                      <span>Buyer Account</span>
                      <span className="w-1 h-1 rounded-full bg-white/50" />
                      <span>Member since {memberSince}</span>
                    </div>
                    <div className="flex items-center gap-5 max-sm:gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <Mail size={12} className="text-white/50 shrink-0" />
                        <span className="truncate">{user?.email || 'Not provided'}</span>
                        {!isEmailVerified && user?.email && (
                          <button
                            className="shrink-0 text-[10px] font-bold text-[#fbbf24] bg-transparent border border-[#fbbf24] rounded-full px-2 py-0.5 cursor-pointer hover:bg-[#fbbf24]/10"
                            onClick={handleSendVerifyEmail}
                            disabled={isSendingEmail}
                          >
                            {isSendingEmail ? 'Sending…' : 'Verify'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <Phone size={12} className="text-white/50 shrink-0" />
                        <span>{user?.phone || 'Not provided'}</span>
                        <button
                          className="text-[10px] font-bold text-white/40 bg-transparent border-none cursor-pointer hover:text-white p-0 transition-colors"
                          onClick={() => toast('Phone update coming soon.')}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 max-sm:px-4 -mt-8 relative z-20">
                <div className="grid grid-cols-4 gap-3 mb-6 max-sm:grid-cols-2">
                  {[
                    { icon: <ShoppingBag size={20} />, value: orderCount, label: 'Orders' },
                    { icon: <Heart size={20} />, value: wishlistItems.length, label: 'Wishlist' },
                    { icon: <Star size={20} />, value: 0, label: 'Reviews' },
                    { icon: <Clock size={20} />, value: 0, label: 'Pending' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-[#eef2f6] rounded-[14px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#fff7ed] rounded-[8px] flex items-center justify-center text-primary shrink-0">{stat.icon}</div>
                      <div>
                        <div className="text-xl font-extrabold text-[#0f172a] leading-none">{stat.value}</div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 max-w-[1000px] mx-auto">
                <div className="grid grid-cols-2 gap-5 mb-8 max-lg:grid-cols-1">
                <div className="bg-white border border-[#eef2f6] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Personal Information</h3>
                    {!isEditingInfo ? (
                      <button className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0" onClick={() => setIsEditingInfo(true)}>Edit Profile</button>
                    ) : (
                      <div className="flex gap-2">
                        <button className="text-xs font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5 cursor-pointer hover:bg-[#f1f5f9] transition-colors" onClick={() => setIsEditingInfo(false)}>Cancel</button>
                        <button className="text-xs font-bold text-white bg-primary border-none rounded-[6px] px-3 py-1.5 cursor-pointer hover:opacity-90 transition-opacity" onClick={handleSaveInfo}>Save</button>
                      </div>
                    )}
                  </div>
                  {!isEditingInfo ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-[#fff7ed] flex items-center justify-center shrink-0 mt-0.5 text-primary"><User size={15} /></div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider m-0">Full Name</p>
                          <p className="text-sm text-[#0f172a] font-medium m-0 mt-0.5">{user?.name || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-[#fff7ed] flex items-center justify-center shrink-0 mt-0.5 text-primary"><Mail size={15} /></div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider m-0">Email Address</p>
                          <p className="text-sm text-[#0f172a] font-medium m-0 mt-0.5">{user?.email || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-[#fff7ed] flex items-center justify-center shrink-0 mt-0.5 text-primary"><Phone size={15} /></div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider m-0">Phone Number</p>
                          <p className="text-sm text-[#0f172a] font-medium m-0 mt-0.5">{user?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Full Name</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} placeholder="Enter full name" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Email Address</label>
                        <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} placeholder="Enter email" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#eef2f6] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Default Delivery Address</h3>
                    <button onClick={() => setActiveTab('addresses')} className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0">Manage Addresses</button>
                  </div>
                  {primaryAddress ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#0f172a] m-0 mb-1">{primaryAddress.fullName}</h4>
                        {primaryAddress.phone && <p className="text-xs text-[#64748b] m-0 mb-3">{primaryAddress.phone}</p>}
                        <div className="flex items-start gap-2 text-sm text-[#475569]">
                          <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                          <p className="m-0 leading-relaxed">
                            {[primaryAddress.houseNo, primaryAddress.area].filter(Boolean).join(', ')}
                            <br />
                            {[primaryAddress.city, primaryAddress.state, primaryAddress.pincode].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                      <MapPin size={24} className="text-[#94a3b8]" />
                      <p className="text-sm text-[#64748b] m-0">No default address set.</p>
                    </div>
                  )}
                </div>
              </div>
              <AccountOverviewSection />
            </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="p-6 max-w-[1000px] mx-auto">
              <OrderList />
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="h-full">
              <ChatInbox />
            </div>
          )}

          {activeTab === 'wishlist' && (
          <div className="py-6">
            <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">My Wishlist ({wishlistItems.length})</h3>
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-2">
                {wishlistItems.map((item) => (
                  <ProductCard key={item.id} product={item} variant="wishlist" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">Your wishlist is empty.</p>
            )}
          </div>
        )}

          {/* Phone UI placeholder */}
          {activeTab === 'addresses' && (
          <div className="py-6">
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] m-0">My Addresses</h3>
                <p className="text-sm text-[#64748b] m-0 mt-1">Choose the primary address shown on your account overview.</p>
              </div>
              {!showAddressForm && (
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setEditingAddressId(null);
                    setAddressForm({
                      ...emptyAddressForm,
                      fullName: user?.name || '',
                      phone: user?.phone || '',
                      isDefault: addresses.length === 0,
                    });
                    setShowAddressForm(true);
                  }}
                >
                  <Plus size={16} /> Add Another Address
                </button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddressSubmit} className="bg-white border border-[#eef2f6] rounded-[12px] p-5 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-extrabold text-[#0f172a] m-0">{editingAddressId ? 'Edit Address' : 'Add Address'}</h4>
                  <button type="button" onClick={resetAddressForm} className="bg-transparent border-none text-[#64748b] hover:text-[#0f172a] p-0">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  {[
                    { field: 'fullName', label: 'Full Name', placeholder: 'Enter full name' },
                    { field: 'phone', label: 'Phone Number', placeholder: '10-digit mobile number', numeric: true, maxLen: 10 },
                    { field: 'pincode', label: 'Pincode', placeholder: '6-digit pincode', numeric: true, maxLen: 6 },
                    { field: 'state', label: 'State', placeholder: 'State' },
                    { field: 'city', label: 'City', placeholder: 'City' },
                    { field: 'houseNo', label: 'House / Building', placeholder: 'House no. or building' },
                  ].map(({ field, label, placeholder, numeric, maxLen }) => (
                    <div key={field}>
                      <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">{label}</label>
                      <input
                        value={(addressForm as any)[field]}
                        placeholder={placeholder}
                        maxLength={maxLen}
                        onChange={e => updateAddressField(field, numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        className={`${inputCls} ${addressErrors[field] ? 'border-[#dc2626] bg-[#fef2f2]' : ''}`}
                      />
                      {addressErrors[field] && <p className="text-xs text-[#dc2626] mt-1 mb-0">{addressErrors[field]}</p>}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">Area / Street / Sector</label>
                  <textarea
                    rows={3}
                    value={addressForm.area}
                    placeholder="Area details"
                    onChange={e => updateAddressField('area', e.target.value)}
                    className={`${inputCls} resize-y ${addressErrors.area ? 'border-[#dc2626] bg-[#fef2f2]' : ''}`}
                  />
                  {addressErrors.area && <p className="text-xs text-[#dc2626] mt-1 mb-0">{addressErrors.area}</p>}
                </div>

                <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer my-4">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={e => updateAddressField('isDefault', e.target.checked)}
                    className="accent-primary"
                  />
                  Make this my primary address
                </label>

                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {addressSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            )}

            {addressesLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#64748b]">
                <Loader2 size={16} className="animate-spin text-primary" /> Loading addresses...
              </div>
            ) : addressList.length === 0 ? (
              <div className="bg-white border border-[#eef2f6] rounded-[12px] p-10 flex flex-col items-center text-center gap-3">
                <BookUser size={36} className="text-[#94a3b8]" />
                <h4 className="text-base font-extrabold text-[#0f172a] m-0">No addresses found</h4>
                <p className="text-sm text-[#64748b] m-0">Add an address to use it as your primary delivery address.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
                {addressList.map(addr => {
                  const lines = formatAddressLine(addr);
                  const isPrimary = addr._id === primaryAddress?._id;
                  return (
                    <div
                      key={addr._id}
                      className={`bg-white rounded-[12px] p-5 ${isPrimary ? 'border-2 border-primary shadow-[0_0_0_4px_rgba(217,79,0,0.08)]' : 'border border-[#eef2f6]'}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-[#0f172a] m-0">{addr.fullName}</h4>
                          {addr.phone && <p className="text-xs text-[#64748b] m-0 mt-0.5">{addr.phone}</p>}
                        </div>
                        {isPrimary && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} /> Primary
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2 text-sm text-[#475569] mb-4">
                        <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                        <p className="m-0 leading-relaxed">
                          {lines.firstLine && <>{lines.firstLine}<br /></>}
                          {lines.secondLine}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        {!isPrimary && !addr.isProfileAddress && (
                          <button onClick={() => handleSetPrimaryAddress(addr)} className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0">
                            Set Primary
                          </button>
                        )}
                        <button onClick={() => handleAddressEdit(addr)} className="flex items-center gap-1.5 text-xs font-bold text-[#475569] bg-transparent border-none cursor-pointer hover:text-primary p-0">
                          <Edit2 size={13} /> Edit
                        </button>
                        {!addr.isProfileAddress && (
                          <button onClick={() => handleAddressDelete(addr)} className="flex items-center gap-1.5 text-xs font-bold text-[#dc2626] bg-transparent border-none cursor-pointer hover:underline p-0">
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}


          {activeTab === 'contactus' && (
            <div className="py-6 max-w-[560px]">
              <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Contact Us</h3>
              <p className="text-sm text-[#64748b] mb-6">Have a question or need help? Fill in the form and our team will reach out to you.</p>
              <a
                href={`tel:${HELPLINE_NUMBER}`}
                className="flex items-center gap-3 bg-[#fff7ed] border border-[#fed7aa] rounded-[12px] px-4 py-3 mb-4 text-[#0f172a] no-underline hover:bg-[#ffedd5] transition-colors"
              >
                <span className="w-9 h-9 rounded-[8px] bg-white text-primary flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider">Buyer Helpline</span>
                  <span className="block text-sm font-extrabold">{HELPLINE_NUMBER}</span>
                </span>
              </a>
              <a
                href={`tel:${PAYMENT_HELPLINE_NUMBER}`}
                className="flex items-center gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[12px] px-4 py-3 mb-4 text-[#0f172a] no-underline hover:bg-[#dcfce7] transition-colors"
              >
                <span className="w-9 h-9 rounded-[8px] bg-white text-[#16a34a] flex items-center justify-center shrink-0">
                  <CreditCard size={18} />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider">For Payment Issues Queries</span>
                  <span className="block text-sm font-extrabold">{PAYMENT_HELPLINE_NUMBER}</span>
                </span>
              </a>
              <div className="bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={enquiryForm.name}
                    onChange={e => setEnquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    className={inputCls}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Phone *</label>
                  <input
                    type="text"
                    value={enquiryForm.phone}
                    onChange={e => setEnquiryForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                    className={inputCls}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={enquiryForm.email}
                    onChange={e => setEnquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    className={inputCls}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Your Query *</label>
                  <textarea
                    value={enquiryForm.message}
                    onChange={e => setEnquiryForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={5}
                    className={inputCls + ' resize-y'}
                    placeholder="Describe your problem, question, or enquiry..."
                  ></textarea>
                  <button
                    type="button"
                    onClick={handleEnquirySubmit}
                    className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {enquirySubmitting ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                  <Modal
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    title="Sign Out"
                    footer={
                      <>
                        <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleLogout}>Sign Out</Button>
                      </>
                    }
                  >
                    Are you sure you want to sign out of your account?
                  </Modal>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
