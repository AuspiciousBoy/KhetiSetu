import React from 'react';
import { PackageSearch, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

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
  icon,
  title,
  description,
  action,
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('common.noData');
  const displayDescription = description || t('marketplace.noProduceDesc');

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-low rounded-[24px] border border-surface-variant my-4">
      <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-secondary mb-4">
        {icon ? (
          typeof icon === 'string' ? (
            <PackageSearch className="w-8 h-8 text-secondary" />
          ) : (
            icon
          )
        ) : (
          <PackageSearch className="w-8 h-8 text-secondary" />
        )}
      </div>
      <h3 className="font-display font-semibold text-lg text-primary mb-1">{displayTitle}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm mb-6">{displayDescription}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const ErrorState = ({
  title,
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('errorBoundary.title');
  const displayMessage = message || t('errorBoundary.message');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-error-container/20 rounded-[24px] border border-error/20 my-4 text-on-surface">
      <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error mb-3">
        <AlertTriangle className="w-6 h-6 text-error" />
      </div>
      <h4 className="font-display font-semibold text-primary mb-1">{displayTitle}</h4>
      <p className="text-xs text-on-surface-variant max-w-sm mb-4">{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-primary underline hover:text-primary-container"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  );
};
