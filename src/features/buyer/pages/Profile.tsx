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

const Profile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const dispatch = useAppDispatch();

  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  // Phone Edit State (My logic)
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  // Email Verification State
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [orderCount, setOrderCount] = useState(0);
  const memberSince = 'January 2024';
  const isEmailVerified = user?.isEmailVerified || false;
  const { socket } = useSocket();
  const [totalUnread, setTotalUnread] = useState(0);

  // Fetch unread count for the sidebar badge
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
    if (user) {
      fetchUnreadCount();
    }
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
    if (user) {
      fetchOrderCount();
    }
  }, [user]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const imageUrl = await adminService.uploadImage(file);
      const response = await authService.updateProfile({ avatar: imageUrl });

      dispatch(setCredentials({
        user: response.user
      }));
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

        dispatch(setCredentials({
          user: response.user
        }));
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
    if (newPhone.length >= 10) {
      setShowOtpInput(true);
    } else {
      toast.error('Please enter a valid 10-digit phone number');
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp === '123456' && user) {
      try {
        const response = await authService.updateProfile({
          phone: newPhone
        });

        dispatch(setCredentials({
          user: response.user
        }));
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

  // Find current menu item for placeholder rendering
  const currentMenuItem = menuItems.find(i => i.id === activeTab);
  const CurrentIcon = currentMenuItem?.icon;

  return (
    <div className="max-w-[1200px] mx-auto mt-10 px-5 flex gap-6 max-lg:flex-col max-sm:px-3 max-sm:my-5">
      <aside className="w-[280px] shrink-0 bg-white border border-slate-200 rounded-md py-6 h-fit max-lg:w-full">
        <div className="flex items-center gap-3 px-5 pb-5 border-b border-slate-200 mb-4">
          <div className="w-12 h-12 bg-[#D94F00] text-white rounded-full flex items-center justify-center text-xl font-bold overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="text-base font-semibold text-[#0f172a] m-0">{user?.name?.split(' ')[0] || 'Guest'}</h4>
            <p className="text-[0.8rem] text-slate-500 m-0 mt-0.5">{user?.role || 'Buyer'}</p>
          </div>
        </div>
        <nav className="flex flex-col max-lg:flex-row max-lg:overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 py-3 px-5 text-slate-800 font-medium cursor-pointer transition-colors duration-200 hover:bg-[#D94F00]/10 max-lg:whitespace-nowrap ${activeTab === item.id ? 'bg-blue-50 text-[#D94F00]' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-[#D94F00] text-white text-[0.7rem] py-0.5 px-1.5 rounded-[10px] ml-auto">{item.badge}</span>
                )}
                <ChevronRight size={16} className="ml-auto text-slate-400 max-lg:hidden" />
              </div>
            );
          })}
        </nav>
        <div className="px-5 pt-5 border-t border-slate-200 mt-5">
          <div className="flex items-center gap-3 py-3 px-4 text-[#f85f06] rounded-lg cursor-pointer font-medium hover:bg-red-50">
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        {activeTab === 'overview' && (
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="h-[120px] bg-[#D94F00]"></div>
            <div className="px-6 pb-6 flex gap-6 -mt-[30px] max-md:flex-col max-md:items-center max-md:text-center">
              <div className="relative">
                <div className="w-[100px] h-[100px] bg-[#f3742a] text-white rounded-md flex items-center justify-center text-[2.5rem] font-bold border-4 border-white relative overflow-hidden group">
                  {isUploadingAvatar ? (
                    <Loader2 className="animate-spin" />
                  ) : user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Camera size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      hidden
                    />
                  </label>
                </div>
              </div>
              <div className="pt-10 flex-1 max-md:pt-4 max-md:flex max-md:flex-col max-md:items-center">
                <div className="flex items-center gap-3 mb-2 max-md:justify-center max-md:flex-wrap">
                  <h1 className="text-2xl m-0 text-slate-900">{user?.name || 'Valued Partner'}</h1>
                  {isEmailVerified && (
                    <span className="text-[0.75rem] text-green-600 bg-green-50 py-0.5 px-2 rounded-[10px] font-semibold flex items-center gap-1">
                      <Check size={14} /> Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mb-4 text-[0.85rem] max-md:justify-center max-md:flex-wrap">
                  <span className="text-[#D94F00] font-semibold">{user?.role || 'Buyer'} Account</span>
                  <span className="text-slate-500">Member since {memberSince}</span>
                </div>
                <div className="flex gap-6 text-[0.9rem] max-md:flex-col max-md:items-center max-md:gap-3">
                  <div className="flex items-center gap-2 max-md:justify-center">
                    <Mail size={16} />
                    <span>{user?.email || 'Not provided'}</span>
                    {!isEmailVerified && user?.email && (
                      <button
                        className="bg-[#D94F00]/10 border border-slate-200 py-1 px-2.5 rounded-md text-[0.75rem] cursor-pointer"
                        onClick={handleSendVerifyEmail}
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 max-md:justify-center">
                    <Phone size={16} />
                    <span>{user?.phone || 'Not provided'}</span>
                    <button className="bg-[#D94F00]/10 border border-slate-200 py-1 px-2.5 rounded-md text-[0.75rem] cursor-pointer" onClick={() => setIsChangingPhone(true)}>Update</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-3">
            <div className="bg-white p-5 border border-slate-200 rounded-md flex items-center gap-4 max-sm:p-4 max-sm:px-3 max-sm:gap-2 max-sm:flex-col max-sm:text-center max-sm:justify-center">
              <ShoppingBag size={24} className="text-[#D94F00]" />
              <div>
                <span className="text-2xl font-bold block max-sm:text-[1.25rem]">{orderCount}</span>
                <span className="text-[0.8rem] text-slate-500">Orders</span>
              </div>
            </div>
            <div className="bg-white p-5 border border-slate-200 rounded-md flex items-center gap-4 max-sm:p-4 max-sm:px-3 max-sm:gap-2 max-sm:flex-col max-sm:text-center max-sm:justify-center">
              <Heart size={24} className="text-[#D94F00]" />
              <div>
                <span className="text-2xl font-bold block max-sm:text-[1.25rem]">{wishlistItems.length}</span>
                <span className="text-[0.8rem] text-slate-500">Wishlist</span>
              </div>
            </div>
            <div className="bg-white p-5 border border-slate-200 rounded-md flex items-center gap-4 max-sm:p-4 max-sm:px-3 max-sm:gap-2 max-sm:flex-col max-sm:text-center max-sm:justify-center">
              <Star size={24} className="text-[#D94F00]" />
              <div>
                <span className="text-2xl font-bold block max-sm:text-[1.25rem]">0</span>
                <span className="text-[0.8rem] text-slate-500">Reviews</span>
              </div>
            </div>
            <div className="bg-white p-5 border border-slate-200 rounded-md flex items-center gap-4 max-sm:p-4 max-sm:px-3 max-sm:gap-2 max-sm:flex-col max-sm:text-center max-sm:justify-center">
              <Clock size={24} className="text-[#D94F00]" />
              <div>
                <span className="text-2xl font-bold block max-sm:text-[1.25rem]">0</span>
                <span className="text-[0.8rem] text-slate-500">Pending</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-md p-6">
              <div className="flex justify-between items-center mb-5 max-sm:flex-col max-sm:items-start max-sm:gap-3">
                <h3 className="text-[1.1rem] font-semibold m-0 flex items-center gap-2">Personal Information</h3>
                {!isEditingInfo ? (
                  <button className="bg-transparent border border-slate-200 py-1.5 px-3 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-blue-50" onClick={() => setIsEditingInfo(true)}>Edit Profile</button>
                ) : (
                  <div className="flex gap-2">
                    <button className="bg-white border border-slate-200 text-slate-500 py-1 px-3 rounded-md text-[0.85rem] cursor-pointer font-medium" onClick={() => setIsEditingInfo(false)}>Cancel</button>
                    <button className="bg-[#D94F00] text-white border-none py-1 px-3 rounded-md text-[0.85rem] cursor-pointer font-medium" onClick={handleSaveInfo}>Save</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                <div className="flex flex-col">
                  <label className="block text-[0.75rem] text-slate-500 mb-1">Full Name</label>
                  {isEditingInfo ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full py-2 px-3 border border-slate-200 rounded-md" />
                  ) : (
                    <p className="m-0 font-medium">{user?.name || 'Not provided'}</p>
                  )}
                </div>
                <div className="flex flex-col">
                  <label className="block text-[0.75rem] text-slate-500 mb-1">Email</label>
                  {isEditingInfo ? (
                    <input 
                      type="email" 
                      value={editEmail} 
                      onChange={(e) => {
                        let val = e.target.value.toLowerCase().replace(/[^a-z0-9@.]/g, '');
                        val = val.replace(/[@.]{2,}/g, (match) => match[0]);
                        if (val.startsWith('.') || val.startsWith('@')) val = val.slice(1);
                        setEditEmail(val);
                      }} 
                      className="w-full py-2 px-3 border border-slate-200 rounded-md" 
                    />
                  ) : (
                    <p className="m-0 font-medium">{user?.email || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-6">
              <div className="flex justify-between items-center mb-5 max-sm:flex-col max-sm:items-start max-sm:gap-3">
                <h3 className="text-[1.1rem] font-semibold m-0 flex items-center gap-2">Default Address</h3>
                <button className="bg-transparent border border-slate-200 py-1.5 px-3 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-blue-50">Manage</button>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-lg">
                <p className="font-semibold mb-1">Primary Address</p>
                <p className="text-[0.9rem] my-0.5">123 Trade Center, Mumbai, India</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <div className="flex justify-between mb-5">
              <h3 className="m-0 font-semibold text-lg">My Wishlist ({wishlistItems.length})</h3>
            </div>
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 max-sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                {wishlistItems.map((item) => (
                  <ProductCard key={item.id} product={item} variant="wishlist" />
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Your wishlist is empty.</p>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div style={{ height: 'calc(100vh - 120px)', minHeight: '600px', margin: '-20px' }}>
            <ChatInbox />
          </div>
        )}

        {activeTab === 'orders' && (
          <OrderList />
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'overview' && activeTab !== 'wishlist' && activeTab !== 'messages' && activeTab !== 'orders' && currentMenuItem && (
          <div className="bg-white border border-slate-200 rounded-md py-[60px] px-5 text-center">
            {CurrentIcon && <CurrentIcon size={48} strokeWidth={1.5} className="text-slate-300 mb-4 mx-auto" />}
            <h3 className="m-0 mb-2 text-[1.25rem]">{currentMenuItem.label}</h3>
            <p className="text-slate-500 m-0">This section is coming soon. We're working hard to bring you a great experience.</p>
          </div>
        )}
      </main>

      {/* Change Phone Modal with OTP logic */}
      {isChangingPhone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-white w-[400px] rounded-md p-6 max-w-[90vw]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="m-0 font-semibold">{showOtpInput ? 'Verify OTP' : 'Change Phone Number'}</h3>
              <button onClick={() => { setIsChangingPhone(false); setShowOtpInput(false); }} className="bg-transparent border-none cursor-pointer text-slate-500 flex items-center justify-center"><X size={20} /></button>
            </div>
            {!showOtpInput ? (
              <div>
                <label className="block mb-2 text-[0.9rem] text-slate-500">New Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md mb-4"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
                <button onClick={handleSendPhoneOtp} className="bg-[#D94F00] text-white border-none p-2.5 w-full rounded-md mt-4 cursor-pointer font-medium hover:bg-[#bf4500]">Send OTP</button>
              </div>
            ) : (
              <div>
                <label className="block mb-2 text-[0.9rem] text-slate-500">Enter OTP sent to {newPhone}</label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-2 px-3 border border-slate-200 rounded-md mb-4"
                  placeholder="Enter 123456"
                  maxLength={6}
                />
                <button onClick={handleVerifyPhoneOtp} className="bg-[#D94F00] text-white border-none p-2.5 w-full rounded-md mt-4 cursor-pointer font-medium hover:bg-[#bf4500]">Verify & Update</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
