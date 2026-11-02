import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Presentational primitives shared by every Partner Hub view.
 *
 * These mirror the supplier/admin design language exactly — white cards on #f8fafc,
 * 12px radii, #e2e8f0 borders, uppercase micro-labels — so the hub reads as the same
 * product rather than a bolt-on.
 */

export const CARD = 'bg-white rounded-[12px] border border-[#e2e8f0]';
export const TH =
  'text-left px-4 py-3 text-[#475569] text-[11px] font-extrabold uppercase tracking-wider border-b border-[#e2e8f0] bg-[#f8fafc] whitespace-nowrap';
export const TD = 'px-4 py-3.5 border-b border-[#f1f5f9] text-xs text-[#334155] align-middle';

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => <div className={`${CARD} ${className}`}>{children}</div>;

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, actions }) => (
  <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#0f172a] text-white flex items-center justify-center">
          <Icon size={18} />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold text-[#0f172a] m-0 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-[#64748b] m-0 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const TONE_CLS: Record<Tone, string> = {
  success: 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]',
  warning: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
  danger: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]',
  info: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
  neutral: 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]',
  brand: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap ${TONE_CLS[tone]} ${className}`}
  >
    {children}
  </span>
);

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  onClick?: () => void;
  valueClassName?: string;
}> = ({ label, value, hint, icon: Icon, tone = 'neutral', onClick, valueClassName }) => {
  const clickable = typeof onClick === 'function';
  const valStr = typeof value === 'string' ? value : '';
  const isMoney = valStr.includes('₹') || valStr.includes('$');

  // Scale font size down for currency or long text so it never wraps awkwardly or overflows
  const defaultSizeCls = isMoney
    ? 'text-[15px] sm:text-[16px] font-extrabold tracking-tight'
    : typeof value === 'string' && value.length > 8
    ? 'text-[15px] sm:text-base font-extrabold tracking-tight'
    : 'text-xl font-extrabold';

  const finalValueCls = valueClassName || defaultSizeCls;

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`${CARD} p-3.5 sm:p-4 flex items-start gap-3 transition-all min-w-0 ${
        clickable ? 'cursor-pointer hover:border-[#cbd5e1] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]' : ''
      }`}
    >
      {Icon && (
        <span
          className={`shrink-0 w-9 h-9 rounded-[8px] border flex items-center justify-center ${TONE_CLS[tone]}`}
        >
          <Icon size={16} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0 truncate" title={label}>
          {label}
        </p>
        <p
          className={`${finalValueCls} text-[#0f172a] m-0 mt-1 leading-tight truncate`}
          title={valStr || undefined}
        >
          {value}
        </p>
        {hint && (
          <p className="text-[11px] text-[#94a3b8] m-0 mt-0.5 leading-snug truncate" title={hint}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
};

/** Horizontal pill filter used above every table in the hub. */
export const FilterTabs = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (next: T) => void;
}) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value || 'all'}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-[8px] border text-[11px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            active
              ? 'bg-[#0f172a] text-white border-[#0f172a]'
              : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1] hover:text-[#0f172a]'
          }`}
        >
          {opt.label}
          {opt.count !== undefined && opt.count > 0 && (
            <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-[#94a3b8]'}`}>{opt.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

/** Scroll container that keeps wide tables usable on a phone. */
export const TableWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto -mx-px">
    <table className="w-full border-collapse min-w-[680px]">{children}</table>
  </div>
);

export const InlineEmpty: React.FC<{ icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }> = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center gap-2 py-14 px-4 text-center">
    {Icon && (
      <span className="w-12 h-12 rounded-full bg-[#f1f5f9] text-[#94a3b8] flex items-center justify-center mb-1">
        <Icon size={22} />
      </span>
    )}
    <h3 className="text-sm font-extrabold text-[#0f172a] m-0">{title}</h3>
    {description && <p className="text-xs text-[#64748b] max-w-[380px] m-0 leading-relaxed">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#475569] mb-1.5">
    {children}
  </label>
);

export const inputCls =
  'w-full px-3 py-2.5 rounded-[8px] border border-[#e2e8f0] text-sm text-[#0f172a] bg-white outline-none transition-colors focus:border-[#0f172a] placeholder:text-[#94a3b8]';
