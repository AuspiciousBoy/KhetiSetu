import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Store, Menu } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-on-background w-full overflow-x-hidden">
      {/* Deep Forest Sidebar (Persistent on desktop, slide-over drawer on mobile) */}
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
        {/* Top Minimal Bar */}
        <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-30 border-b border-surface-variant px-3 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-primary hover:bg-surface-variant transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest font-label-md truncate">
              KhetiSetu Console
            </span>
            <span className="text-surface-variant hidden sm:inline">•</span>
            <Badge variant="success" className="text-[10px] sm:text-[11px] hidden sm:inline-flex shrink-0">
              Live Network Active
            </Badge>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/marketplace"
              className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-secondary" />
              <span className="hidden sm:inline">View Marketplace</span>
              <span className="sm:hidden">Market</span>
            </Link>

            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-xs border border-outline-variant/30 hover:border-primary transition-colors"
              title="My Profile"
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content Area */}
        <main className="p-3 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
