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
        <label htmlFor={inputId} className="text-sm font-medium text-body">
          {label}
        </label>
      )}
      <div className={[
        'flex items-center border bg-cream rounded-[4px] transition-colors duration-150',
        'focus-within:border-primary',
        error ? 'border-error' : 'border-border',
      ].join(' ')}>
        {leftIcon && <span className="flex items-center px-2 text-muted">{leftIcon}</span>}
        <input
          id={inputId}
          className="flex-1 border-none outline-none bg-transparent px-2.5 py-2 text-base text-heading placeholder:text-muted"
          {...rest}
        />
        {rightIcon && <span className="flex items-center px-2 text-muted">{rightIcon}</span>}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {!error && helperText && <p className="text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default Input;
