import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Skeleton } from '../components/ui/Skeleton';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Skeleton className="h-32 w-96" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Smart cross-role redirects for consumer/business shared functionality
    if (location.pathname.startsWith('/consumer/orders') && user?.role === 'BUSINESS') {
      const redirectPath = location.pathname.replace('/consumer/orders', '/business/orders');
      return <Navigate to={redirectPath} replace />;
    }
    if (location.pathname.startsWith('/business/orders') && user?.role === 'CONSUMER') {
      const redirectPath = location.pathname.replace('/business/orders', '/consumer/orders');
      return <Navigate to={redirectPath} replace />;
    }
    if (location.pathname.startsWith('/consumer/dashboard') && user?.role === 'BUSINESS') {
      return <Navigate to="/business/dashboard" replace />;
    }
    if (location.pathname.startsWith('/business/dashboard') && user?.role === 'CONSUMER') {
      return <Navigate to="/consumer/dashboard" replace />;
    }
    if (user?.role === 'FARMER' && (location.pathname.startsWith('/consumer/') || location.pathname.startsWith('/business/'))) {
      if (location.pathname.includes('/orders')) {
        return <Navigate to="/farmer/orders" replace />;
      }
      return <Navigate to="/farmer/dashboard" replace />;
    }

    const roleDashboard =
      user?.role === 'BUSINESS'
        ? '/business/dashboard'
        : user?.role === 'FARMER'
        ? '/farmer/dashboard'
        : user?.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/consumer/dashboard';

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-error" />
        </div>
        <h2 className="font-display font-bold text-2xl text-primary mb-2">
          {t('common.accessDenied')}
        </h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">
          {t('common.unauthorizedRoleMessage', { role: user?.role })}
        </p>
        <button
          onClick={() => window.location.href = roleDashboard}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t('common.goToDashboard')}
        </button>
      </div>
    );
  }

  return children;
};
