import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Package, MapPin, CreditCard, Settings, Shield, Bell, Heart, Edit2, Check, X } from 'lucide-react';
import { setCredentials } from '@/store/slices/auth.slice';
import authService from '@/features/auth/services/auth.service';
import styles from './Profile.module.css';
import ProductCard from '@/features/product/components/ProductCard';

const Profile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const dispatch = useAppDispatch();
  
  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Sync logic moved to RootLayout for global availability

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  // Phone Edit State
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  // Email Verification State
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSaveInfo = async () => {
    if (user) {
      try {
        const response = await authService.updateProfile({
          name: editName,
          email: editEmail
        });

        dispatch(setCredentials({
          user: response.user
        }));
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

  const handleSendPhoneOtp = () => {
    if (newPhone.length >= 10) {
      setShowOtpInput(true);
    } else {
      alert('Please enter a valid phone number');
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
        alert('Phone number updated successfully!');
      } catch (err) {
        alert('Failed to update phone number.');
      }
    } else {
      alert('Invalid OTP. Please use 123456 for testing.');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Account Overview', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
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
            </div>
          );
        })}
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Profile Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={styles.userInfo}>
            <h1>Hello, {user?.name || 'Valued Partner'}</h1>
            <p>{user?.phone || '+91 9999999999'}</p>
            <span className={styles.roleTag}>{user?.role || 'Buyer'} Account</span>
          </div>
        </div>

        {/* Dynamic Content Based on Tab */}
        {activeTab === 'overview' && (
          <>

            {/* Profile Info Grid */}
            <div className={styles.grid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}><User size={20} /> Personal Info</h3>
                  {!isEditingInfo ? (
                    <span className={styles.cardAction} onClick={() => {
                      setEditName(user?.name || '');
                      setEditEmail(user?.email || '');
                      setIsEditingInfo(true);
                    }}>Edit</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={styles.cardAction} onClick={() => setIsEditingInfo(false)} style={{ color: 'var(--text-muted)' }}>Cancel</span>
                      <span className={styles.cardAction} onClick={handleSaveInfo} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Save</span>
                    </div>
                  )}
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Full Name</span>
                  {isEditingInfo ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={styles.editInput} placeholder="Enter your name" />
                  ) : (
                    <span className={styles.infoValue}>{user?.name || 'Not provided'}</span>
                  )}
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Phone Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.infoValue}>{user?.phone || 'Not provided'}</span>
                    <button className={styles.editPhoneBtn} onClick={() => setIsChangingPhone(true)}>Change</button>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email</span>
                  {isEditingInfo ? (
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={styles.editInput} placeholder="Enter email" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.infoValue}>{user?.email || 'Not provided'}</span>
                      {user?.email && !user?.isEmailVerified && (
                        <button
                          className={styles.verifyBtn}
                          onClick={handleSendVerifyEmail}
                          disabled={isSendingEmail}
                        >
                          {isSendingEmail ? 'Sending...' : 'Verify?'}
                        </button>
                      )}
                      {user?.email && user?.isEmailVerified && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
                            <Check size={16} />
                          </span>
                          <button className={styles.editPhoneBtn} onClick={() => {
                            setEditName(user?.name || '');
                            setEditEmail(user?.email || '');
                            setIsEditingInfo(true);
                          }}>Change</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}><MapPin size={20} /> Default Address</h3>
                  <span className={styles.cardAction}>Manage</span>
                </div>
                <div style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  <p style={{ fontWeight: 500, color: 'var(--text)' }}>AMJ Star Logistics Hub</p>
                  <p>123 Trade Center, Block B</p>
                  <p>Andheri East, Mumbai</p>
                  <p>Maharashtra, 400069</p>
                  <p>India</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className={styles.tabContent}>
            <div className={styles.cardHeader} style={{ marginBottom: '24px' }}>
              <h3 className={styles.cardTitle}><Heart size={20} /> My Wishlist</h3>
            </div>
            {wishlistItems.length > 0 ? (
              <div className={styles.wishlistGrid}>
                {wishlistItems.map((item) => (
                  <ProductCard key={item.id} product={item} variant="wishlist" />
                ))}
              </div>
            ) : (
              <div className={styles.card}>
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Heart size={48} color="var(--border)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>You haven't saved any products yet.</p>
                  <Link to="/" className={styles.cardAction} style={{ marginTop: '16px', display: 'inline-block' }}>Browse Products</Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Placeholders for other tabs */}
        {activeTab !== 'overview' && activeTab !== 'wishlist' && (
          <div className={styles.card} style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Settings size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
            <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>This section is currently under construction.</p>
          </div>
        )}

      </main>

      {/* Change Phone Modal */}
      {isChangingPhone && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Change Phone Number</h3>
              <button onClick={() => { setIsChangingPhone(false); setShowOtpInput(false); }} className={styles.closeBtn}><X size={20} /></button>
            </div>
            {!showOtpInput ? (
              <div className={styles.modalBody}>
                <label>New Phone Number</label>
                <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))} className={styles.modalInput} placeholder="Enter new mobile number" maxLength={10} />
                <button onClick={handleSendPhoneOtp} className={styles.modalPrimaryBtn}>Send OTP</button>
              </div>
            ) : (
              <div className={styles.modalBody}>
                <label>Enter OTP sent to {newPhone}</label>
                <input type="text" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))} className={styles.modalInput} placeholder="123456" maxLength={6} />
                <button onClick={handleVerifyPhoneOtp} className={styles.modalPrimaryBtn}>Verify & Update</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
