import React from 'react';
import { ChevronLeft, Menu, LogOut, X, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessageModal from '@/shared/components/ui/MessageModal';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
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
  user?: { name?: string; email?: string; avatar?: string };
  profile?: { fullName?: string; businessName?: string; storeName?: string };
  theme?: 'default' | 'admin' | 'dark';
  /** Hide the profile/sign-out footer on mobile — set when the page's mobile header already has its own avatar dropdown with sign-out, to avoid showing it twice. */
  hideFooterOnMobile?: boolean;
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
  theme = 'default',
  hideFooterOnMobile = false,
}) => {
  const navigate = useNavigate();
  const [showSoonModal, setShowSoonModal] = React.useState(false);
  const [soonFeature, setSoonFeature] = React.useState('');

  const displayName = profile?.businessName || profile?.storeName || profile?.fullName || user?.name || 'User';
  const displayEmail = user?.email || (profile as any)?.user?.email || (profile as any)?.businessDetails?.email || 'user@amjstar.com';

  const handleTabClick = (item: MenuItem) => {
    if (item.disabled || item.comingSoon) {
      if (item.comingSoon) {
        setSoonFeature(item.label);
        setShowSoonModal(true);
      }
      return;
    }
    if (item.action) item.action();
    else onTabChange(item.id);
  };

  const isAdmin = theme === 'admin';

  return (
    <aside
      className={[
        'flex flex-col fixed h-screen top-0 left-0 z-[1000]',
        'overflow-y-auto scrollbar-none py-10 px-5',
        'transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'border-r border-white/[0.03] shadow-[4px_0_24px_rgba(0,0,0,0.05)]',
        isAdmin ? 'bg-[#020617] border-r-[rgba(230,92,0,0.1)]' : 'bg-slate-900',
        isSidebarOpen ? 'w-[280px]' : 'w-24',
        // mobile: hidden off-screen, shown when open
        'max-lg:!w-[280px] max-lg:left-[-280px] max-lg:data-[open=true]:left-0 max-lg:data-[open=true]:shadow-none max-lg:shadow-none',
      ].filter(Boolean).join(' ')}
      data-open={isSidebarOpen}
      style={{ '--brand-color': brandColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className={[
        'flex mb-14',
        isSidebarOpen ? 'items-center justify-between px-2' : 'flex-col items-center gap-4',
      ].join(' ')}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <div className={[
            'w-[52px] h-[52px] rounded-full flex items-center justify-center p-2',
            'shadow-[0_8px_16px_rgba(0,0,0,0.2)] transition-transform duration-300',
            isAdmin
              ? 'bg-transparent shadow-[0_0_20px_rgba(230,92,0,0.2)]'
              : 'bg-transparent',
          ].join(' ')}>
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              LogoIcon && <LogoIcon size={24} />
            )}
          </div>
          <span className={[
            'text-base font-extrabold tracking-tight whitespace-nowrap transition-all',
            isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none',
            isAdmin
              ? 'bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent'
              : 'text-slate-100',
          ].join(' ')}>
            {title}
          </span>
        </div>

        {/* Desktop toggle */}
        <button
          className="max-lg:hidden shrink-0 bg-white/5 border border-white/10 text-slate-400 w-8 h-8 rounded-[10px] cursor-pointer flex items-center justify-center transition-all hover:bg-white/10 hover:text-primary hover:border-white/30"
          onClick={onToggle}
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>

        {/* Mobile close */}
        <button
          className="hidden max-lg:flex bg-none border-none text-slate-400 p-2 cursor-pointer"
          onClick={onToggle}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-10 flex-1">
        <div className="flex flex-col gap-2">
          {menu.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                className={[
                  'flex items-center gap-4 px-4 py-[14px] rounded-[8px] border-none cursor-pointer',
                  'text-[0.85rem] font-semibold text-left whitespace-nowrap transition-all duration-300',
                  !isSidebarOpen && 'justify-center !p-[14px]',
                  isActive
                    ? 'text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.2)]'
                    : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:translate-x-1',
                  item.comingSoon && 'opacity-40 cursor-not-allowed',
                ].filter(Boolean).join(' ')}
                style={isActive ? { backgroundColor: brandColor } : {}}
              >
                <div className="relative flex items-center justify-center w-6 h-6 transition-transform">
                  <Icon size={18} className={isActive ? 'scale-110' : ''} />
                  {!isSidebarOpen && item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                {isSidebarOpen && <span className="flex-1">{item.label}</span>}
                {isSidebarOpen && item.badge && item.badge > 0 && (
                  <span className="text-[10px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {footerMenu.length > 0 && (
          <div className="flex flex-col gap-2">
            {isSidebarOpen && (
              <div className="text-[0.7rem] font-extrabold uppercase text-slate-500 ml-4 mb-2 tracking-widest opacity-60">
                Advanced
              </div>
            )}
            {footerMenu.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item)}
                  className={[
                    'flex items-center gap-4 px-4 py-[14px] rounded-[8px] border-none cursor-pointer',
                    'text-[0.85rem] font-semibold text-left whitespace-nowrap transition-all duration-300',
                    !isSidebarOpen && 'justify-center !p-[14px]',
                    isActive
                      ? 'text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.2)]'
                      : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:translate-x-1',
                    item.comingSoon && 'opacity-40 cursor-not-allowed',
                  ].filter(Boolean).join(' ')}
                  style={isActive ? { backgroundColor: brandColor } : {}}
                >
                  <div className={['flex items-center justify-center w-6 h-6 transition-transform', isActive && 'scale-110'].filter(Boolean).join(' ')}>
                    <Icon size={18} />
                  </div>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={['mt-auto pt-8 flex flex-col gap-6', hideFooterOnMobile && 'max-lg:hidden'].filter(Boolean).join(' ')}>
        <div className={['flex items-center gap-4 px-2', !isSidebarOpen && 'justify-center px-0'].join(' ')}>
          <div className="w-11 h-11 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-[8px] flex items-center justify-center font-extrabold text-slate-100 flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {isSidebarOpen && (
            <div className="min-w-0">
              <p className="text-[0.8rem] font-bold text-slate-100 m-0 truncate">{displayName}</p>
              <p className="text-[0.75rem] text-slate-500 m-0 truncate">{displayEmail}</p>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={[
            'flex items-center gap-4 w-full px-4 py-[14px] rounded-[8px]',
            'border border-red-500/10 bg-red-500/5 text-red-400 cursor-pointer',
            'text-[0.8rem] font-bold transition-all duration-300',
            'hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_8px_16px_rgba(239,68,68,0.25)] hover:-translate-y-0.5',
            !isSidebarOpen && 'justify-center !p-[14px]',
          ].filter(Boolean).join(' ')}
        >
          <LogOut size={18} />
          {isSidebarOpen && <span>Sign Out</span>}
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
