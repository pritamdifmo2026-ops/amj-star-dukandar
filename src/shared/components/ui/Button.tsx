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

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary text-white border-primary hover:bg-primary-dark hover:border-primary-dark',
  secondary: 'bg-[#1A3C5E] text-white border-[#1A3C5E] rounded-full hover:bg-[#142f4a] hover:-translate-y-px',
  outline:   'bg-transparent text-primary border-primary hover:bg-primary hover:text-white',
  ghost:     'bg-transparent text-body border-transparent hover:bg-border-light',
  danger:    'bg-error text-white border-error hover:bg-[#a02020]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-[13px] font-bold',
  md: 'px-[18px] py-2 text-base rounded-[4px]',
  lg: 'px-6 py-[11px] text-lg rounded-[4px]',
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
  const classes = [
    'inline-flex items-center justify-center gap-1.5 font-medium border cursor-pointer',
    'transition-[background-color,color,border-color,transform] duration-150 whitespace-nowrap',
    'disabled:opacity-55 disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    (block || fullWidth) ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
