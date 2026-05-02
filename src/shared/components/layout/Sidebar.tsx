import React from 'react';
import {
  ChevronLeft,
  Menu,
  LogOut,
  X,
  type LucideIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import MessageModal from '@/shared/components/ui/MessageModal';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action?: () => void;
  route?: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

interface SidebarProps {
  title: string;
  logoIcon?: LucideIcon;
  logoSrc?: string;
  menu: MenuItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onToggle: () => void;
  footerMenu?: MenuItem[];
  brandColor?: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  profile?: {
    fullName?: string;
    businessName?: string;
    storeName?: string;
  };
  theme?: 'default' | 'admin' | 'dark';
}

const Sidebar: React.FC<SidebarProps> = ({
  title,
  logoIcon: LogoIcon,
  logoSrc,
  menu,
  activeTab,
  onTabChange,
  onLogout,
  isSidebarOpen,
  onToggle,
  footerMenu = [],
  brandColor = '#0284c7',
  user,
  profile,
  theme = 'default'
}) => {
  const navigate = useNavigate();
  const [showSoonModal, setShowSoonModal] = React.useState(false);
  const [soonFeature, setSoonFeature] = React.useState('');

  const displayName = profile?.businessName || profile?.storeName || profile?.fullName || user?.name || 'User';
  const displayEmail = user?.email || 'user@amjstar.com';

  const handleTabClick = (item: MenuItem) => {
    if (item.disabled || item.comingSoon) {
      if (item.comingSoon) {
        setSoonFeature(item.label);
        setShowSoonModal(true);
      }
      return;
    }

    if (item.action) {
      item.action();
    } else {
      onTabChange(item.id);
    }
  };

  return (
    <aside
      className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''} ${styles[theme]}`}
      data-open={isSidebarOpen}
      style={{ '--brand-color': brandColor } as React.CSSProperties}
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrand} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className={styles.logoWrapper}>
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className={styles.logoImg} />
            ) : (
              LogoIcon && <LogoIcon size={24} />
            )}
          </div>
          <span className={styles.brandTitle}>{title}</span>
        </div>
        <button className={styles.toggleBtn} onClick={onToggle}>
          {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
        <button className={styles.mobileCloseBtn} onClick={onToggle}>
          <X size={20} />
        </button>
      </div>

      <nav className={styles.sidebarNav}>
        <div className={styles.navSection}>
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`${activeTab === item.id ? styles.active : ''} ${item.comingSoon ? styles.disabledLink : ''}`}
                onClick={() => handleTabClick(item)}
              >
                <div className={styles.iconBox}><Icon size={18} /></div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {footerMenu.length > 0 && (
          <div className={styles.navSection}>
            <div className={styles.navDivider}>Advanced</div>
            {footerMenu.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${activeTab === item.id ? styles.active : ''} ${item.comingSoon ? styles.disabledLink : ''}`}
                  onClick={() => handleTabClick(item)}
                >
                  <div className={styles.iconBox}><Icon size={18} /></div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{displayName}</p>
            <p className={styles.userEmail}>{displayEmail}</p>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      <MessageModal 
        isOpen={showSoonModal}
        onClose={() => setShowSoonModal(false)}
        title="Coming Soon"
        message={`${soonFeature} is currently under development. Stay tuned!`}
        type="info"
      />
    </aside>
  );
};

export default Sidebar;
