import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Package, MapPin, CreditCard, Settings, Bell, Heart, 
  X, Mail, Phone, ShoppingBag, 
  LogOut, ChevronRight, Star, Clock
} from 'lucide-react';
import { setCredentials } from '@/store/slices/auth.slice';
import authService from '@/features/auth/services/auth.service';
import ProductCard from '@/features/product/components/ProductCard';
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

  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const orderCount = 0;
  const memberSince = 'January 2024';
  const isEmailVerified = user?.isEmailVerified || false;

  const handleSaveInfo = async () => {
    if (user) {
      try {
        const response = await authService.updateProfile({
          name: editName,
          email: editEmail
        });
        dispatch(setCredentials({ user: response.user }));
        setIsEditingInfo(false);
        if (editEmail !== user.email && editEmail) {
          alert(`Verification email sent to ${editEmail}. Please check your inbox.`);
        }
      } catch (err) {
        alert('Failed to update profile.');
      }
    }
  };

  const handleSendVerifyEmail = async () => {
    setIsSendingEmail(true);
    try {
      await authService.sendVerificationEmail();
      alert('Verification email sent! Please check your inbox.');
    } catch (err) {
      alert('Failed to send verification email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (newPhone.length >= 10 && user) {
      try {
        const response = await authService.updateProfile({ phone: newPhone });
        dispatch(setCredentials({ user: response.user }));
        setIsChangingPhone(false);
        setNewPhone('');
        alert('Phone number updated successfully!');
      } catch (err) {
        alert('Failed to update phone number.');
      }
    } else {
      alert('Please enter a valid 10-digit phone number');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Account Overview', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package, badge: orderCount },
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
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
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
        <div className={styles.profileCover}>
          <div className={styles.coverGradient}></div>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.nameSection}>
                <h1>{user?.name || 'Valued Partner'}</h1>
                {isEmailVerified && (
                  <span className={styles.verifiedBadge}>Verified</span>
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
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={styles.editInput} />
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

        {/* Placeholder for other tabs */}
        {activeTab !== 'overview' && activeTab !== 'wishlist' && currentMenuItem && (
          <div className={styles.placeholderCard}>
            {CurrentIcon && <CurrentIcon size={48} strokeWidth={1.5} />}
            <h3>{currentMenuItem.label}</h3>
            <p>This section is coming soon. We're working hard to bring you a great experience.</p>
          </div>
        )}
      </main>

      {isChangingPhone && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Update Phone</h3>
              <button onClick={() => setIsChangingPhone(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            <input 
              type="tel" 
              value={newPhone} 
              onChange={(e) => setNewPhone(e.target.value)} 
              className={styles.editInput} 
              placeholder="Enter number" 
            />
            <button onClick={handleUpdatePhone} className={styles.modalPrimaryBtn}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;