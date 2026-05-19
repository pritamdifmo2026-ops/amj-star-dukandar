const fs = require('fs');

const cssMap = {
  header: 'sticky top-0 z-[1000] bg-[oklch(0.98_0.01_80)]',
  topStrip: 'bg-[oklch(0.98_0.01_80)] border-b border-slate-200 py-[2px]',
  container: 'max-w-[1280px] mx-auto px-8 flex justify-between items-center',
  helpline: 'text-[9px] text-slate-500 flex items-center gap-[6px]',
  topLinks: 'flex items-center gap-3',
  topLink: 'text-[9px] text-slate-500 no-underline hover:text-[var(--color-primary)]',
  sep: 'text-slate-200',
  navbar: 'bg-white py-1 border-b border-slate-200',
  logo: '',
  actions: 'flex items-center gap-4',
  guestNav: 'flex items-center gap-5 max-lg:hidden',
  navLink: 'text-[10px] font-medium text-slate-900 no-underline transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 hover:text-[var(--color-primary)]',
  navIcon: 'text-[var(--color-primary)]',
  joinBtn: 'bg-[#BB461E] text-white py-1.5 px-[18px] rounded-full no-underline font-semibold text-[11px] transition-all duration-200 ml-2 hover:opacity-90 hover:-translate-y-[1px]',
  cartIcon: 'relative text-slate-900 flex items-center cursor-pointer',
  cartBadge: 'absolute -top-2 -right-2.5 bg-[var(--color-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white',
  menuToggle: 'hidden bg-transparent border-none text-slate-900 max-lg:block',
  catBar: 'bg-white border-b border-slate-200 relative max-lg:hidden',
  categoryNav: 'flex items-center gap-5 flex-1',
  catItemWrapper: 'relative py-1 group',
  catLinkMain: 'flex items-center gap-1.5 text-slate-500 no-underline text-[11px] font-semibold transition-colors duration-200 whitespace-nowrap group-hover:text-[var(--color-primary)]',
  subDropdown: 'absolute top-full left-0 min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-2 z-[100] opacity-0 invisible translate-y-2.5 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0',
  subLink: 'block py-2 px-3 text-slate-900 no-underline text-xs rounded-md transition-all duration-200 hover:bg-slate-50 hover:text-[var(--color-primary)] hover:pl-4',
  promoLinks: 'flex items-center gap-6 border-l border-slate-200 pl-6',
  promoLink: 'text-[11px] font-medium text-slate-900 no-underline whitespace-nowrap hover:text-[var(--color-primary)]',
  userMenu: 'relative cursor-pointer flex items-center gap-2 max-lg:hidden',
  userName: 'font-semibold text-slate-900 text-[11px]',
  dropdown: 'absolute top-full right-0 mt-2 bg-white border border-[rgba(226,232,240,0.8)] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.03)] min-w-[155px] p-1.5 z-[1000] origin-top-right animate-in fade-in zoom-in duration-200',
  dropdownItem: 'flex items-center gap-2.5 w-full py-2.5 px-3 text-left border-none bg-transparent text-slate-900 no-underline text-xs font-[550] rounded-md cursor-pointer transition-all duration-200 hover:bg-[rgba(217,79,0,0.05)] hover:text-[var(--color-primary)] group',
  dropdownIcon: 'text-slate-500 transition-colors duration-200 shrink-0 group-hover:text-[var(--color-primary)]',
  mobileMenuWrapper: 'fixed inset-0 bg-black/50 z-[2000] transition-all duration-300',
  mobileMenu: 'absolute top-0 right-0 bottom-0 w-[300px] bg-white transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col',
  mobileHeader: 'p-6 border-b border-slate-200 flex justify-between items-center',
  mobileUser: 'flex items-center gap-3',
  mobileAvatar: 'w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-lg',
  mobileUserInfo: 'flex flex-col',
  mobileUserName: 'font-semibold text-sm text-slate-900',
  mobileUserRole: 'text-xs text-slate-500 capitalize',
  mobileLogo: 'h-8',
  closeMenuBtn: 'bg-transparent border-none text-slate-900',
  mobileContent: 'flex-1 overflow-y-auto p-6',
  menuSection: 'mb-8',
  sectionLabel: 'text-xs font-bold uppercase text-slate-400 tracking-widest mb-4',
  mobileLink: 'flex items-center gap-3 py-3 text-slate-900 no-underline font-medium active:text-[var(--color-primary)]',
  mobileSubList: 'flex flex-col',
  mobileSubLink: 'pl-9 !text-xs !text-slate-500 active:!text-[var(--color-primary)]',
  mobileDivider: 'border-t border-slate-200 my-6',
  mobileFooter: 'p-6 border-t border-slate-200',
  signOutBtn: 'w-full flex items-center justify-center gap-2 p-3.5 bg-red-100 text-red-500 border-none rounded-md font-semibold'
};

let content = fs.readFileSync('d:/AMJ_Store/amjstar-frontend/src/features/landing/components/Navbar.tsx', 'utf8');

// replace dynamic styles properly
content = content.replace(/className={\`\\\$\\{styles\\.mobileMenuWrapper\\} \\\$\\{mobileOpen \\? styles\\.open : ''\\}\`}/g, 'className={`fixed inset-0 bg-black/50 z-[2000] transition-all duration-300 ${mobileOpen ? \\'opacity-100 visible\\' : \\'opacity-0 invisible\\'}`}');
content = content.replace(/className={\`\\\$\\{styles\\.mobileLink\\} \\\$\\{styles\\.mobileSubLink\\}\`}/g, 'className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium pl-9 !text-xs !text-slate-500 active:!text-[var(--color-primary)]"');
content = content.replace(/<div className={styles\\.catBar}>\\s*<div className={styles\\.container}>/g, '<div className="bg-white border-b border-slate-200 relative max-lg:hidden">\\n        <div className="max-w-[1280px] mx-auto px-8 flex items-center gap-6 overflow-visible">');

// general replacement
for (const [key, value] of Object.entries(cssMap)) {
  const regex = new RegExp(`className={styles\\.${key}}`, 'g');
  if (value === '') {
    content = content.replace(regex, '');
  } else {
    content = content.replace(regex, `className="${value}"`);
  }
}

// Check if any styles. remains
if (content.includes('styles.')) {
  console.log('WARNING: Some styles were not replaced');
  console.log(content.match(/styles\\.[a-zA-Z0-9_]+/g));
}

// Remove import styles
content = content.replace(/import styles from '\\.\\/Navbar\\.module\\.css';\\n/g, '');

content = content.replace(/className="absolute top-0 right-0 bottom-0 w-\\[300px\\] bg-white transition-transform duration-300 ease-\\[cubic-bezier\\(0\\.4,0,0\\.2,1\\)\\] flex flex-col"/, 'className={`absolute top-0 right-0 bottom-0 w-[300px] bg-white transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${mobileOpen ? \\'translate-x-0\\' : \\'translate-x-full\\'}`}');

fs.writeFileSync('d:/AMJ_Store/amjstar-frontend/src/features/landing/components/Navbar.tsx', content);
