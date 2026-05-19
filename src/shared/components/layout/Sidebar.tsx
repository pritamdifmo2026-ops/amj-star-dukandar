import React from 'react';
import {
  ChevronLeft,
  Menu,
  LogOut,
  X,
  type LucideIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  const adminBg = theme === 'admin' ? 'bg-[#020617] border-r border-[rgba(230,92,0,0.1)]' : '';

  return (
    <aside
      className={`${isSidebarOpen ? 'w-[280px]' : 'w-24'} bg-slate-900 text-white py-10 px-5 flex flex-col fixed h-screen left-0 top-0 z-[1000] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto scrollbar-none border-r border-white/[0.03] shadow-[4px_0_24px_rgba(0,0,0,0.05)] max-lg:!w-[280px] max-lg:data-[open=false]:-translate-x-full max-lg:data-[open=true]:translate-x-0 max-lg:shadow-[30px_0_60px_rgba(0,0,0,0.5)] ${adminBg}`}
      data-open={isSidebarOpen}
      style={{ '--brand-color': brandColor } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-14 px-2">
        <div className="flex items-center gap-4 no-underline cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-[52px] h-[52px] bg-[oklch(0.99_0.01_80)] rounded-md flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.2)] p-2 transition-transform duration-300">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              LogoIcon && <LogoIcon size={24} />
            )}
          </div>
          <span className={`text-base font-extrabold text-slate-50 tracking-[-0.02em] whitespace-nowrap transition-all duration-300 ${!isSidebarOpen ? 'opacity-0 w-0 pointer-events-none' : ''}`}>{title}</span>
        </div>
        <button
          className="bg-white/5 border border-white/10 text-slate-400 w-8 h-8 rounded-[10px] cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:text-[var(--brand-color)] hover:border-white/30 max-lg:hidden"
          onClick={onToggle}
        >
          {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
        <button
          className="hidden bg-none border-none text-slate-400 p-2 cursor-pointer max-lg:flex"
          onClick={onToggle}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`flex items-center gap-4 py-3.5 px-4 rounded-lg border-none text-[0.85rem] font-semibold text-left whitespace-nowrap relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  activeTab === item.id
                    ? 'text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.2)]'
                    : item.comingSoon
                    ? 'bg-transparent text-slate-400 opacity-40 cursor-not-allowed'
                    : 'bg-transparent text-slate-400 cursor-pointer hover:bg-white/5 hover:text-slate-100 hover:translate-x-1'
                } ${!isSidebarOpen ? 'justify-center px-3.5' : ''}`}
                style={activeTab === item.id ? { background: brandColor } : {}}
                onClick={() => handleTabClick(item)}
              >
                <div className={`flex items-center justify-center w-6 h-6 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : ''}`}>
                  <Icon size={18} />
                </div>
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {footerMenu.length > 0 && (
          <div className="flex flex-col gap-2">
            {isSidebarOpen && <div className="text-[0.7rem] font-extrabold uppercase text-slate-600 my-2 ml-4 tracking-[0.1em] opacity-60">Advanced</div>}
            {footerMenu.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`flex items-center gap-4 py-3.5 px-4 rounded-lg border-none text-[0.85rem] font-semibold text-left whitespace-nowrap relative transition-all duration-300 ${
                    activeTab === item.id
                      ? 'text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.2)]'
                      : item.comingSoon
                      ? 'bg-transparent text-slate-400 opacity-40 cursor-not-allowed'
                      : 'bg-transparent text-slate-400 cursor-pointer hover:bg-white/5 hover:text-slate-100 hover:translate-x-1'
                  } ${!isSidebarOpen ? 'justify-center px-3.5' : ''}`}
                  style={activeTab === item.id ? { background: brandColor } : {}}
                  onClick={() => handleTabClick(item)}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <Icon size={18} />
                  </div>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className="mt-auto pt-8 flex flex-col gap-6">
        <div className={`flex items-center gap-4 px-2 mb-2 ${!isSidebarOpen ? 'justify-center p-0' : ''}`}>
          <div className="w-11 h-11 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-lg flex items-center justify-center font-extrabold text-slate-100 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {isSidebarOpen && (
            <div className="min-w-0">
              <p className="text-[0.8rem] font-bold text-slate-50 m-0 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</p>
              <p className="text-[0.75rem] text-slate-500 m-0 whitespace-nowrap overflow-hidden text-ellipsis">{displayEmail}</p>
            </div>
          )}
        </div>
        <button
          className={`flex items-center gap-4 w-full py-3.5 px-4 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 cursor-pointer transition-all duration-300 text-[0.8rem] font-bold hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_8px_16px_rgba(239,68,68,0.25)] hover:-translate-y-0.5 ${!isSidebarOpen ? 'justify-center px-3.5' : ''}`}
          onClick={onLogout}
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
