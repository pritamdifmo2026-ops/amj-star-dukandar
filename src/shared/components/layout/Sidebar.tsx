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
  brandColor = '#0284c7'
}) => {
  const navigate = useNavigate();
  const [showSoonModal, setShowSoonModal] = React.useState(false);
  const [soonFeature, setSoonFeature] = React.useState('');
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
      className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}
      data-open={isSidebarOpen}
      style={{ '--brand-color': brandColor } as React.CSSProperties}
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrand} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          ) : (
            LogoIcon && <LogoIcon size={20} />
          )}
          <span>{title}</span>
        </div>
        <button className={styles.toggleBtn} onClick={onToggle}>
          {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
        <button className={styles.mobileCloseBtn} onClick={onToggle}>
          <X size={20} />
        </button>
      </div>

      <nav className={styles.sidebarNav}>
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`${activeTab === item.id ? styles.active : ''} ${item.comingSoon ? styles.disabledLink : ''}`}
              onClick={() => handleTabClick(item)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {footerMenu.length > 0 && (
          <>
            <div className={styles.navDivider}>Future Features</div>
            {footerMenu.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${activeTab === item.id ? styles.active : ''} ${item.comingSoon ? styles.disabledLink : ''}`}
                  onClick={() => handleTabClick(item)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className={styles.sidebarFooter}>
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
