import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import {
  User, Package, MapPin, CreditCard, Settings, Bell, Heart,
  X, Mail, Phone, ShoppingBag,
  LogOut, ChevronRight, Star, Clock, Check, MessageCircle
} from 'lucide-react';
import { setCredentials } from '@/store/slices/auth.slice';
import authService from '@/features/auth/services/auth.service';
import ProductCard from '@/features/product/components/ProductCard';
import ChatInbox from '@/features/chat/components/ChatInbox';
import { useSocket } from '@/shared/contexts/SocketContext';
import { chatApi } from '@/shared/services/chat.api';
import adminService from '@/features/admin/services/admin.service';
import { Camera, Loader2 } from 'lucide-react';
import OrderList from '../components/OrderList';
import { orderApi } from '@/shared/services/order.api';

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";

const Profile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const dispatch = useAppDispatch();

  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  const [isSendingEmail, setIsSendingEmail] = useState(false);
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
      const orders = await orderApi.getOrders();
      setOrderCount(orders.length);
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
      const imageUrl = await adminService.uploadImage(file);
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

  const handleSendPhoneOtp = () => {
    if (newPhone.length >= 10) setShowOtpInput(true);
    else toast.error('Please enter a valid 10-digit phone number');
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
    <div className="flex min-h-screen bg-[#f8fafc] max-lg:flex-col">
      <aside className="w-[260px] max-lg:w-full bg-white border-r border-[#eef2f6] flex flex-col shrink-0 max-lg:border-r-0 max-lg:border-b">
        <div className="flex items-center gap-3 p-5 border-b border-[#f1f5f9]">
          <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-extrabold">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0f172a] m-0">{user?.name?.split(' ')[0] || 'Guest'}</h4>
            <p className="text-xs text-[#64748b] m-0 capitalize">{user?.role || 'Buyer'}</p>
          </div>
        </div>

        <nav className="flex-1 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors text-sm ${isActive ? 'bg-[#fff7ed] text-primary font-bold border-r-2 border-primary' : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] font-medium'}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>
                )}
                <ChevronRight size={15} className="text-[#d1d5db]" />
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#f1f5f9]">
          <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[#dc2626] cursor-pointer rounded-[8px] hover:bg-[#fef2f2] transition-colors">
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] px-8 pt-8 pb-16 max-sm:px-4">
          <div className="flex items-end gap-5 max-sm:flex-col max-sm:items-start">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center overflow-hidden border-4 border-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <AvatarContent />
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md border border-[#e2e8f0] hover:bg-[#f8fafc]">
                <Camera size={16} className="text-[#475569]" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
              </label>
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-extrabold text-white m-0">{user?.name || 'Valued Partner'}</h1>
                {isEmailVerified && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full">
                    <Check size={12} /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs text-[#94a3b8] mb-2">
                <span className="capitalize font-semibold text-[#e2e8f0]">{user?.role || 'Buyer'} Account</span>
                <span>Member since {memberSince}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                  <Mail size={14} className="text-[#94a3b8]" />
                  <span>{user?.email || 'Not provided'}</span>
                  {!isEmailVerified && user?.email && (
                    <button
                      className="text-xs font-bold text-[#fbbf24] bg-transparent border border-[#fbbf24] rounded-full px-2 py-0.5 cursor-pointer hover:bg-[#fffbeb] hover:text-[#92400e]"
                      onClick={handleSendVerifyEmail}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? 'Sending...' : 'Verify'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                  <Phone size={14} className="text-[#94a3b8]" />
                  <span>{user?.phone || 'Not provided'}</span>
                  <button
                    className="text-xs font-bold text-[#94a3b8] bg-transparent border-none cursor-pointer hover:text-white p-0"
                    onClick={() => setIsChangingPhone(true)}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 -mt-8 max-sm:px-4">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-4 gap-4 mb-6 max-sm:grid-cols-2">
              {[
                { icon: <ShoppingBag size={22} />, value: orderCount, label: 'Orders' },
                { icon: <Heart size={22} />, value: wishlistItems.length, label: 'Wishlist' },
                { icon: <Star size={22} />, value: 0, label: 'Reviews' },
                { icon: <Clock size={22} />, value: 0, label: 'Pending' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-[#eef2f6] rounded-[12px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#fff7ed] rounded-[8px] flex items-center justify-center text-primary shrink-0">{stat.icon}</div>
                  <div>
                    <div className="text-xl font-extrabold text-[#0f172a]">{stat.value}</div>
                    <div className="text-xs text-[#94a3b8]">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-5 mb-8 max-lg:grid-cols-1">
              <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
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

              <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Default Address</h3>
                  <button className="text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0">Manage</button>
                </div>
                <div className="text-sm text-[#475569]">
                  <p className="font-bold text-[#0f172a] m-0 mb-1">Primary Address</p>
                  <p className="m-0">123 Trade Center, Mumbai, India</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="py-6">
              <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">My Wishlist ({wishlistItems.length})</h3>
              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
                  {wishlistItems.map((item) => (
                    <ProductCard key={item.id} product={item} variant="wishlist" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">Your wishlist is empty.</p>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div style={{ height: 'calc(100vh - 120px)', minHeight: '600px', margin: '-20px' }}>
              <ChatInbox />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="py-6">
              <OrderList />
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'wishlist' && activeTab !== 'messages' && activeTab !== 'orders' && currentMenuItem && (
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
  );
};

export default Profile;
