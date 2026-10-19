import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-background text-on-background">
      {/* Deep Forest Sidebar with Grain Texture */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Minimal Bar */}
        <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-surface-variant px-6 sm:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest font-label-md">
              KhetiSetu Console
            </span>
            <span className="text-surface-variant">•</span>
            <Badge variant="success" className="text-[11px]">
              Live Network Active
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/marketplace"
              className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              View Marketplace
            </Link>

            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-xs border border-outline-variant/30">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Area */}
        <main className="p-6 sm:p-10 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
