import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  className = '',
  icon,
}) => {
  const variants = {
    // Standard chip: 4px rounded corners (Soft), Earth Brown text on Warm Beige
    default:
      'bg-surface-container text-secondary border border-surface-variant',
    success:
      'bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim/40',
    warning:
      'bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim/40',
    error:
      'bg-error-container text-on-error-container border border-error/20',
    primary:
      'bg-primary text-on-primary',
    info:
      'bg-surface-container-high text-primary font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold tracking-wide font-label-sm ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {icon && (
        typeof icon === 'string' ? null : icon
      )}
      {children}
    </span>
  );
};

export default Badge;
