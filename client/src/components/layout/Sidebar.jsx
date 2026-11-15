import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Sprout,
  LayoutDashboard,
  Boxes,
  Store,
  Receipt,
  TrendingUp,
  CloudSun,
  Sparkles,
  Package,
  ShoppingBag,
  Users,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ShoppingCart,
  QrCode,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const role = user?.role || 'FARMER';

  // Role-specific Navigation Items with translation keys
  const getNavItems = () => {
    switch (role) {
      case 'FARMER':
        return [
          { name: t('sidebar.overview'), path: '/farmer/dashboard', Icon: LayoutDashboard },
          { name: t('sidebar.batches'), path: '/farmer/batches', Icon: Boxes },
          { name: t('sidebar.listings'), path: '/farmer/listings', Icon: Store },
          { name: t('sidebar.orders'), path: '/farmer/orders', Icon: Receipt },
          { name: t('sidebar.marketIntel'), path: '/farmer/market', Icon: TrendingUp },
          { name: t('sidebar.weatherIntel'), path: '/farmer/weather', Icon: CloudSun },
          { name: t('sidebar.aiAssistant'), path: '/farmer/ai', Icon: Sparkles },
        ];
      case 'BUSINESS':
        return [
          { name: t('sidebar.overview'), path: '/business/dashboard', Icon: LayoutDashboard },
          { name: t('sidebar.procurement'), path: '/marketplace?type=b2b', Icon: Package },
          { name: t('sidebar.orders'), path: '/business/orders', Icon: ShoppingBag },
          { name: t('sidebar.marketIntel'), path: '/business/market', Icon: TrendingUp },
        ];
      case 'ADMIN':
        return [
          { name: t('sidebar.overview'), path: '/admin/dashboard', Icon: LayoutDashboard },
          { name: t('sidebar.userManagement'), path: '/admin/users', Icon: Users },
          { name: t('sidebar.systemHealth'), path: '/admin/products', Icon: CheckCircle2 },
          { name: t('sidebar.orders'), path: '/admin/logistics', Icon: Truck },
          { name: t('sidebar.auditLogs'), path: '/admin/audit', Icon: ShieldCheck },
        ];
      case 'CONSUMER':
      default:
        return [
          { name: t('nav.marketplace'), path: '/marketplace', Icon: Store },
          { name: t('nav.myOrders'), path: '/consumer/orders', Icon: Receipt },
          { name: t('footer.batchTraceability'), path: '/marketplace', Icon: QrCode },
          { name: t('nav.khetiAi'), path: '/farmer/ai', Icon: Sparkles },
        ];
    }
  };

  const navItems = getNavItems();

  const getPortalTitle = () => {
    switch (role) {
      case 'FARMER':
        return t('sidebar.portalFarmer');
      case 'BUSINESS':
        return t('sidebar.portalBusiness');
      case 'ADMIN':
        return t('sidebar.portalAdmin');
      case 'CONSUMER':
      default:
        return t('sidebar.portalConsumer');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full min-h-full">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to="/" onClick={onClose} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[12px] bg-[#0d3829] flex items-center justify-center text-emerald-300 border border-[#1b5c42]">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight text-white">
                {t('common.appName')}
              </h1>
              <p className="text-[10px] text-emerald-300/80 tracking-wider uppercase font-semibold font-mono">
                {getPortalTitle()}
              </p>
            </div>
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-full bg-[#0d3829] flex items-center justify-center text-emerald-300 hover:text-white"
              aria-label="Close Navigation Menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path.endsWith('/dashboard')}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-current shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Language Switcher & User Footer Card */}
      <div className="pt-6 border-t border-[#154633] flex flex-col gap-3">
        <div className="px-2">
          <LanguageSwitcher className="w-full" compact />
        </div>

        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-2 py-1.5 rounded-[12px] hover:bg-white/10 transition-colors group cursor-pointer"
          title={t('nav.profile') || 'View Profile'}
        >
          <div className="w-9 h-9 rounded-full bg-emerald-800 group-hover:bg-emerald-700 text-emerald-200 font-bold flex items-center justify-center text-xs shrink-0 transition-colors">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate transition-colors">
              {user?.fullName || t('common.farmerRole')}
            </p>
            <p className="text-[10px] text-emerald-400/70 truncate font-mono">
              {user?.email || 'authenticated'}
            </p>
          </div>
        </Link>

        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-950/40 rounded-[8px] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#08241a] text-[#fdf9f0] min-h-screen flex-col justify-between p-6 shrink-0 border-r border-[#154633] sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#08241a] text-[#fdf9f0] h-full p-6 z-10 shadow-2xl overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
