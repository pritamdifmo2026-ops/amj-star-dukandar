import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toast } from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User, Package, MapPin, CreditCard, Settings, Bell, Heart,
  X, Mail, Phone, ShoppingBag,
  LogOut, ChevronRight, Star, Clock, Check, MessageCircle
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

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";

const Profile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const dispatch = useAppDispatch();

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

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddrCity, setEditAddrCity] = useState(user?.address?.city || '');
  const [editAddrState, setEditAddrState] = useState(user?.address?.state || '');
  const [editAddrPincode, setEditAddrPincode] = useState(user?.address?.pincode || '');
  const [editAddrFull, setEditAddrFull] = useState(user?.address?.fullAddress || '');

  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', message: '' });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const memberSince = 'January 2024';
  const isEmailVerified = user?.isEmailVerified || false;
  const { socket } = useSocket();
  const [totalUnread, setTotalUnread] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const handleSaveAddress = async () => {
    if (!editAddrCity.trim() || !editAddrState.trim() || !/^\d{6}$/.test(editAddrPincode.trim())) {
      toast.error('City, State and a valid 6-digit Pincode are required');
      return;
    }
    try {
      const response = await authService.updateProfile({
        address: {
          city: editAddrCity.trim(),
          state: editAddrState.trim(),
          pincode: editAddrPincode.trim(),
          fullAddress: editAddrFull.trim() || undefined,
        },
      });
      dispatch(setCredentials({ user: response.user }));
      setIsEditingAddress(false);
      toast.success('Address saved!');
    } catch {
      toast.error('Failed to save address');
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

  const handleSendPhoneOtp = () => {
    if (newPhone.length >= 10) setShowOtpInput(true);
    else toast.error('Please enter a valid 10-digit phone number');
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

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp === '123456' && user) {
      try {
        const response = await authService.updateProfile({ phone: newPhone });
        dispatch(setCredentials({ user: response.user }));
        setIsChangingPhone(false);
        setShowOtpInput(false);
        setNewPhone('');
        setPhoneOtp('');
        toast.success('Phone number updated successfully!');
      } catch (err) {
        toast.error('Failed to update phone number.');
      }
    } else {
      toast.error('Invalid OTP. Please use 123456 for testing.');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Account Overview', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package, badge: orderCount },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: totalUnread },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistItems.length },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'contactus', label: 'Contact Us', icon: MessageCircle },
  ];

  const currentMenuItem = menuItems.find(i => i.id === activeTab);
  const CurrentIcon = currentMenuItem?.icon;

  const AvatarContent = () => (
    <>
      {isUploadingAvatar ? (
        <Loader2 className="animate-spin text-[#94a3b8]" size={28} />
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

        <nav className="flex-1 py-2 max-lg:flex max-lg:overflow-x-auto max-lg:py-1 max-lg:px-4 max-lg:scrollbar-none max-lg:gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all text-sm whitespace-nowrap max-lg:px-4 max-lg:py-2.5 max-lg:gap-1.5 max-lg:rounded-t-[8px] ${
                  isActive 
                    ? 'bg-[#fff7ed] text-primary font-bold border-r-2 border-primary max-lg:border-r-0 max-lg:border-b-2' 
                    : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] font-medium'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} className="shrink-0 max-lg:w-4 max-lg:h-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-1">{item.badge}</span>
                )}
                <ChevronRight size={15} className="text-[#d1d5db] max-lg:hidden" />
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#f1f5f9] max-lg:hidden">
          <div onClick={() => setShowLogoutModal(true)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[#dc2626] cursor-pointer rounded-[8px] hover:bg-[#fef2f2] transition-colors">
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      <main className={`flex-1 min-w-0 flex flex-col ${activeTab === 'messages' ? 'overflow-hidden' : 'overflow-auto'}`}>
        {activeTab === 'overview' && (
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
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/60 mb-3">
                  <span className="capitalize font-semibold text-white/80">{user?.role || 'Buyer'} Account</span>
                  <span>·</span>
                  <span>Member since {memberSince}</span>
                </div>
                <div className="flex flex-col gap-1">
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
                      onClick={() => setIsChangingPhone(true)}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages tab fills remaining height directly — no padding wrapper */}
        {activeTab === 'messages' && (
          <div className="flex-1 min-h-0">
            <ChatInbox />
          </div>
        )}

        <div className={`px-8 pt-5 max-sm:px-4 ${activeTab === 'messages' ? 'hidden' : ''}`}>
          {activeTab === 'overview' && (
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
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-5 mb-8 max-lg:grid-cols-1">
              <div className="bg-white border border-[#eef2f6] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Personal Information</h3>
                  {!isEditingInfo ? (
                    <button className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0" onClick={() => setIsEditingInfo(true)}>Edit Profile</button>
                  ) : (
                    <div className="flex gap-2">
                      <button className="text-xs font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5 cursor-pointer hover:bg-[#f1f5f9]" onClick={() => setIsEditingInfo(false)}>Cancel</button>
                      <button className="text-xs font-bold text-white bg-primary rounded-[6px] px-3 py-1.5 border-none cursor-pointer hover:opacity-90" onClick={handleSaveInfo}>Save</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">Full Name</label>
                    {isEditingInfo ? (
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
                    ) : (
                      <p className="text-sm text-[#0f172a] font-medium m-0">{user?.name || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">Email</label>
                    {isEditingInfo ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => {
                          let val = e.target.value.toLowerCase().replace(/[^a-z0-9@.]/g, '');
                          val = val.replace(/[@.]{2,}/g, m => m[0]);
                          if (val.startsWith('.') || val.startsWith('@')) val = val.slice(1);
                          setEditEmail(val);
                        }}
                        className={inputCls}
                      />
                    ) : (
                      <p className="text-sm text-[#0f172a] font-medium m-0">{user?.email || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#eef2f6] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Default Delivery Address</h3>
                  {!isEditingAddress ? (
                    <button className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0"
                      onClick={() => {
                        setEditAddrCity(user?.address?.city || '');
                        setEditAddrState(user?.address?.state || '');
                        setEditAddrPincode(user?.address?.pincode || '');
                        setEditAddrFull(user?.address?.fullAddress || '');
                        setIsEditingAddress(true);
                      }}>
                      {user?.address?.city ? 'Edit' : 'Add Address'}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button className="text-xs font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] px-3 py-1.5 cursor-pointer hover:bg-[#f1f5f9]" onClick={() => setIsEditingAddress(false)}>Cancel</button>
                      <button className="text-xs font-bold text-white bg-primary rounded-[6px] px-3 py-1.5 border-none cursor-pointer hover:opacity-90" onClick={handleSaveAddress}>Save</button>
                    </div>
                  )}
                </div>
                {!isEditingAddress ? (
                  user?.address?.city ? (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                      <div className="text-sm text-[#475569]">
                        {user.address.fullAddress && <p className="m-0 text-[#0f172a] font-medium">{user.address.fullAddress}</p>}
                        <p className="m-0">{[user.address.city, user.address.state].filter(Boolean).join(', ')} – {user.address.pincode}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                      <MapPin size={15} className="shrink-0" />
                      <span>No address saved yet. Add one so suppliers can quote shipping accurately.</span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">City *</label>
                        <input type="text" value={editAddrCity} onChange={e => setEditAddrCity(e.target.value)} className={inputCls} placeholder="e.g. Mumbai" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">State *</label>
                        <input type="text" value={editAddrState} onChange={e => setEditAddrState(e.target.value)} className={inputCls} placeholder="e.g. Maharashtra" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">Pincode *</label>
                      <input type="text" value={editAddrPincode} onChange={e => setEditAddrPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputCls} placeholder="6-digit pincode" maxLength={6} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">Full Address <span className="font-normal">(optional)</span></label>
                      <textarea rows={2} value={editAddrFull} onChange={e => setEditAddrFull(e.target.value)} className={inputCls + ' resize-none'} placeholder="Street / Building / Area…" />
                    </div>
                  </div>
                )}
              </div>
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

          {activeTab === 'orders' && (
            <div className="py-6">
              <OrderList />
            </div>
          )}

          {activeTab === 'contactus' && (
            <div className="py-6 max-w-[560px]">
              <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Contact Us</h3>
              <p className="text-sm text-[#64748b] mb-6">Have a question or need help? Fill in the form and our team will reach out to you.</p>
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
                  />
                </div>
                <button
                  onClick={handleEnquirySubmit}
                  disabled={enquirySubmitting}
                  className="w-full py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                >
                  {enquirySubmitting ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'wishlist' && activeTab !== 'messages' && activeTab !== 'orders' && activeTab !== 'contactus' && currentMenuItem && (
            <div className="flex flex-col items-center gap-4 py-20 text-center text-[#94a3b8]">
              {CurrentIcon && <CurrentIcon size={52} strokeWidth={1.5} />}
              <h3 className="text-xl font-extrabold text-[#0f172a] m-0">{currentMenuItem.label}</h3>
              <p className="text-sm text-[#64748b] m-0 max-w-[400px]">This section is coming soon. We're working hard to bring you a great experience.</p>
            </div>
          )}
        </div>
      </main>

      {isChangingPhone && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 flex items-center justify-center px-4" onClick={() => { setIsChangingPhone(false); setShowOtpInput(false); }}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[400px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold text-[#0f172a] m-0">{showOtpInput ? 'Verify OTP' : 'Change Phone Number'}</h3>
              <button onClick={() => { setIsChangingPhone(false); setShowOtpInput(false); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#475569] border-none cursor-pointer bg-transparent">
                <X size={18} />
              </button>
            </div>
            {!showOtpInput ? (
              <div>
                <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">New Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  className={inputCls + " mb-4"}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
                <button onClick={handleSendPhoneOtp} className="w-full py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90">
                  Send OTP
                </button>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5">Enter OTP sent to {newPhone}</label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  className={inputCls + " mb-4"}
                  placeholder="Enter 123456"
                  maxLength={6}
                />
                <button onClick={handleVerifyPhoneOtp} className="w-full py-2.5 bg-primary text-white font-bold text-sm rounded-[8px] border-none cursor-pointer hover:opacity-90">
                  Verify & Update
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

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
  );
};

export default Profile;
