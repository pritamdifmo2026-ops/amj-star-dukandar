import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  id,
  className = '',
  ...rest
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={['flex flex-col gap-1', fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-500">
          {label}
        </label>
      )}
      <div className={[
        'flex items-center border bg-[oklch(0.99_0.01_80)] rounded-sm transition-[border-color] duration-150 focus-within:border-[var(--color-primary)]',
        error ? 'border-[var(--color-error)]' : 'border-slate-300',
      ].join(' ')}>
        {leftIcon && <span className="flex items-center px-2 text-slate-400">{leftIcon}</span>}
        <input id={inputId} className="flex-1 border-none outline-none bg-transparent py-2 px-2.5 text-base text-slate-900 placeholder:text-slate-400" {...rest} />
        {rightIcon && <span className="flex items-center px-2 text-slate-400">{rightIcon}</span>}
      </div>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400">{helperText}</p>}
    </div>
  );
};

export default Input;
