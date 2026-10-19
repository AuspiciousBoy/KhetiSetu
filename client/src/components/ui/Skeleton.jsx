import React from 'react';

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-surface-variant/70 rounded-[12px] ${className}`}
        />
      ))}
    </>
  );
};

export const EmptyState = ({
  icon = 'inventory_2',
  title = 'No items found',
  description = 'There are currently no records to display.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-low rounded-[24px] border border-surface-variant my-4">
      <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-secondary mb-4">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="font-display font-semibold text-lg text-primary mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const ErrorState = ({
  title = 'Unable to load content',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-error-container/20 rounded-[24px] border border-error/20 my-4 text-on-surface">
      <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error mb-3">
        <span className="material-symbols-outlined text-[24px]">warning</span>
      </div>
      <h4 className="font-display font-semibold text-primary mb-1">{title}</h4>
      <p className="text-xs text-on-surface-variant max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-primary underline hover:text-primary-container"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
