import React from 'react';

const Card = ({
  children,
  variant = 'default',
  grain = false,
  className = '',
  onClick,
  ...props
}) => {
  const variants = {
    default:
      'bg-surface-container-low border border-surface-variant text-on-surface soil-shadow',
    primary:
      'bg-primary text-on-primary soil-shadow',
    surface:
      'bg-surface border border-surface-variant soil-shadow',
    high:
      'bg-surface-container-high border border-outline-variant/30',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-[24px] p-6 transition-all duration-200 ${grain ? 'grain-overlay' : ''} ${
        variants[variant] || variants.default
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
