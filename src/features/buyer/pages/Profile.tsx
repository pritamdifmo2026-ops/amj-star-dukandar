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
import styles from './Profile.module.css';

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
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarAvatar}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div className={styles.sidebarUserInfo}>
            <h4>{user?.name?.split(' ')[0] || 'Guest'}</h4>
            <p>{user?.role || 'Buyer'}</p>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`${styles.sidebarItem} ${activeTab === item.id ? styles.active : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
                <ChevronRight size={16} className={styles.chevron} />
              </div>
            );
          })}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>
      <main className={styles.mainContent}>
        {activeTab === 'overview' && (
          <div className={styles.profileCover}>
            <div className={styles.coverGradient}></div>
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>
                  {isUploadingAvatar ? (
                    <Loader2 className={styles.spinner} />
                  ) : user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                  <label className={styles.avatarEditOverlay}>
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
              <div className={styles.userInfo}>
                <div className={styles.nameSection}>
                  <h1>{user?.name || 'Valued Partner'}</h1>
                  {isEmailVerified && (
                    <span className={styles.verifiedBadge}>
                      <Check size={14} style={{ marginRight: '4px' }} /> Verified
                    </span>
                  )}
                </div>
                <div className={styles.userMeta}>
                  <span className={styles.roleTag}>{user?.role || 'Buyer'} Account</span>
                  <span className={styles.memberSince}>Member since {memberSince}</span>
                </div>
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <Mail size={16} />
                    <span>{user?.email || 'Not provided'}</span>
                    {!isEmailVerified && user?.email && (
                      <button
                        className={styles.verifyEmailBtn}
                        onClick={handleSendVerifyEmail}
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                  </div>
                  <div className={styles.contactItem}>
                    <Phone size={16} />
                    <span>{user?.phone || 'Not provided'}</span>
                    <button className={styles.editContactBtn} onClick={() => setIsChangingPhone(true)}>Update</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <ShoppingBag size={24} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>{orderCount}</span>
                <span className={styles.statLabel}>Orders</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <Heart size={24} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>{wishlistItems.length}</span>
                <span className={styles.statLabel}>Wishlist</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <Star size={24} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Reviews</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <Clock size={24} className={styles.statIcon} />
              <div>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Pending</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className={styles.overviewContent}>
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Personal Information</h3>
                {!isEditingInfo ? (
                  <button className={styles.editButton} onClick={() => setIsEditingInfo(true)}>Edit Profile</button>
                ) : (
                  <div className={styles.editActions}>
                    <button className={styles.cancelBtn} onClick={() => setIsEditingInfo(false)}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSaveInfo}>Save</button>
                  </div>
                )}
              </div>
              <div className={styles.infoFields}>
                <div className={styles.infoField}>
                  <label>Full Name</label>
                  {isEditingInfo ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={styles.editInput} />
                  ) : (
                    <p>{user?.name || 'Not provided'}</p>
                  )}
                </div>
                <div className={styles.infoField}>
                  <label>Email</label>
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
                      className={styles.editInput} 
                    />
                  ) : (
                    <p>{user?.email || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Default Address</h3>
                <button className={styles.manageBtn}>Manage</button>
              </div>
              <div className={styles.addressBox}>
                <p className={styles.addressName}>Primary Address</p>
                <p>123 Trade Center, Mumbai, India</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className={styles.wishlistTab}>
            <div className={styles.wishlistHeader}>
              <h3>My Wishlist ({wishlistItems.length})</h3>
            </div>
            {wishlistItems.length > 0 ? (
              <div className={styles.wishlistGrid}>
                {wishlistItems.map((item) => (
                  <ProductCard key={item.id} product={item} variant="wishlist" />
                ))}
              </div>
            ) : (
              <p>Your wishlist is empty.</p>
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
          <div className={styles.placeholderCard}>
            {CurrentIcon && <CurrentIcon size={48} strokeWidth={1.5} />}
            <h3>{currentMenuItem.label}</h3>
            <p>This section is coming soon. We're working hard to bring you a great experience.</p>
          </div>
        )}
      </main>

      {/* Change Phone Modal with OTP logic */}
      {isChangingPhone && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{showOtpInput ? 'Verify OTP' : 'Change Phone Number'}</h3>
              <button onClick={() => { setIsChangingPhone(false); setShowOtpInput(false); }} className={styles.closeBtn}><X size={20} /></button>
            </div>
            {!showOtpInput ? (
              <div className={styles.modalBody}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>New Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  className={styles.editInput}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  style={{ width: '100%', marginBottom: '16px' }}
                />
                <button onClick={handleSendPhoneOtp} className={styles.modalPrimaryBtn} style={{ width: '100%' }}>Send OTP</button>
              </div>
            ) : (
              <div className={styles.modalBody}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter OTP sent to {newPhone}</label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  className={styles.editInput}
                  placeholder="Enter 123456"
                  maxLength={6}
                  style={{ width: '100%', marginBottom: '16px' }}
                />
                <button onClick={handleVerifyPhoneOtp} className={styles.modalPrimaryBtn} style={{ width: '100%' }}>Verify & Update</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
