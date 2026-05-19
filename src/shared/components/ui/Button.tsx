import React from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  block?: boolean;
}

const variantMap: Record<Variant, string> = {
  primary: 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:enabled:bg-[var(--color-primary-dark)] hover:enabled:border-[var(--color-primary-dark)]',
  secondary: 'bg-[#1A3C5E] text-white border-[#1A3C5E] rounded-full hover:enabled:bg-[#142f4a] hover:enabled:-translate-y-px',
  outline: 'bg-transparent text-[var(--color-primary)] border-[var(--color-primary)] hover:enabled:bg-[var(--color-primary)] hover:enabled:text-white',
  ghost: 'bg-transparent text-slate-500 border-transparent hover:enabled:bg-slate-100',
  danger: 'bg-[var(--color-error)] text-white border-[var(--color-error)] hover:enabled:bg-[#a02020]',
};

const sizeMap: Record<Size, string> = {
  sm: 'py-1.5 px-4 text-[13px] font-bold',
  md: 'py-2 px-[18px] text-base rounded-sm',
  lg: 'py-[11px] px-6 text-lg rounded-sm',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  block = false,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const isBlock = block || fullWidth;
  const classes = [
    'inline-flex items-center justify-center gap-1.5 font-sans font-medium border border-transparent cursor-pointer transition-[background,color,border-color] duration-150 whitespace-nowrap disabled:opacity-55 disabled:cursor-not-allowed',
    variantMap[variant],
    sizeMap[size],
    isBlock ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="inline-block w-[14px] h-[14px] border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
