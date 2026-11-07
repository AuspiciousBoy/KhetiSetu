import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-error" />
        </div>
        <h2 className="font-display font-bold text-2xl text-primary mb-2">Access Restricted</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">
          Your current account role ({user?.role}) does not have administrative permissions to view this section.
        </p>
        <button
          onClick={() => window.history.back()}
          className="text-xs font-semibold text-primary underline"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  return children;
};
