import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    // Primary: Deep Forest background, Off-White text, 12px radius
    primary:
      'bg-primary text-on-primary hover:bg-primary-container active:bg-primary shadow-sm hover:shadow',
    // Secondary: 1px Earth Brown border, Earth Brown text
    secondary:
      'border border-secondary text-secondary hover:bg-surface-container active:bg-surface-variant',
    // Accent / Terracotta
    tertiary:
      'bg-on-tertiary-container text-white hover:opacity-95 active:opacity-90',
    // Subtle / Ghost
    ghost:
      'text-on-surface-variant hover:text-primary hover:bg-surface-variant/50',
    // Destructive
    error:
      'bg-error text-on-error hover:bg-error/90',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-[8px] gap-1.5',
    md: 'text-sm font-medium px-5 py-2.5 rounded-[12px] gap-2',
    lg: 'text-base font-semibold px-7 py-3 rounded-[12px] gap-2.5',
    icon: 'p-2.5 rounded-[12px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin text-[18px]">
          progress_activity
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
