import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'FARMER';

  // Role-specific Navigation Items
  const getNavItems = () => {
    switch (role) {
      case 'FARMER':
        return [
          { name: 'Dashboard', path: '/farmer/dashboard', icon: 'grid_view' },
          { name: 'Produce Batches', path: '/farmer/batches', icon: 'inventory_2' },
          { name: 'My Listings', path: '/farmer/listings', icon: 'storefront' },
          { name: 'Farm Orders', path: '/farmer/orders', icon: 'receipt_long' },
          { name: 'Market Intelligence', path: '/farmer/market', icon: 'trending_up' },
          { name: 'Weather Advisories', path: '/farmer/weather', icon: 'partly_cloudy_day' },
          { name: 'Kheti AI Doctor', path: '/farmer/ai', icon: 'psychiatry' },
        ];
      case 'BUSINESS':
        return [
          { name: 'Dashboard', path: '/business/dashboard', icon: 'grid_view' },
          { name: 'Bulk Marketplace', path: '/marketplace?type=b2b', icon: 'pallet' },
          { name: 'Bulk Purchase Orders', path: '/business/orders', icon: 'shopping_bag' },
          { name: 'Mandi Trends', path: '/farmer/market', icon: 'monitoring' },
        ];
      case 'ADMIN':
        return [
          { name: 'Overview', path: '/admin/dashboard', icon: 'analytics' },
          { name: 'User Management', path: '/admin/users', icon: 'group' },
          { name: 'Product Moderation', path: '/admin/products', icon: 'verified' },
          { name: 'Logistics Fleet', path: '/admin/logistics', icon: 'local_shipping' },
          { name: 'Audit Security Logs', path: '/admin/audit', icon: 'shield' },
        ];
      case 'CONSUMER':
      default:
        return [
          { name: 'Marketplace', path: '/marketplace', icon: 'storefront' },
          { name: 'My Cart', path: '/consumer/cart', icon: 'shopping_cart' },
          { name: 'My Orders', path: '/consumer/orders', icon: 'receipt_long' },
          { name: 'Produce Traceability', path: '/marketplace', icon: 'qr_code_scanner' },
          { name: 'Kheti AI Assistant', path: '/farmer/ai', icon: 'smart_toy' },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-primary text-on-primary min-h-screen flex flex-col justify-between p-6 shrink-0 grain-overlay border-r border-outline-variant/20 relative z-20">
      <div>
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-[12px] bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">psychiatry</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-on-primary">
              KHETISETU
            </h1>
            <p className="text-[10px] text-on-primary-container tracking-wider uppercase font-medium">
              {role} PORTAL
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.endsWith('/dashboard')}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-surface/15 text-on-primary shadow-sm font-semibold'
                    : 'text-on-primary/70 hover:text-on-primary hover:bg-surface/10'
                }`
              }
            >
              {/* Monolinear icon encased in circular tile per DESIGN.md */}
              <div className="w-8 h-8 rounded-full bg-surface-container/15 flex items-center justify-center text-on-primary shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
              </div>
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer Card */}
      <div className="pt-6 border-t border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary font-bold flex items-center justify-center text-sm shrink-0">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-on-primary truncate">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-on-primary-container truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-error-container hover:bg-surface/10 rounded-[8px] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
