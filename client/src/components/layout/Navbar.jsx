import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Sparkles,
  Search,
  LayoutDashboard,
  Menu,
  X,
  User,
  LogOut,
  TrendingUp,
  Store,
  CloudSun,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'FARMER':
        return '/farmer/dashboard';
      case 'BUSINESS':
        return '/business/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'CONSUMER':
      default:
        return '/consumer/dashboard';
    }
  };

  return (
    <nav className="bg-surface/95 backdrop-blur-md sticky top-0 w-full z-50 border-b border-outline-variant/30 transition-all duration-200 ease-in-out">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 max-w-container-max mx-auto">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-display font-bold text-xl tracking-tight uppercase text-primary flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-[#fdf9f0] shadow-sm group-hover:bg-[#124b37] transition-colors">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-primary leading-none text-lg">
                {t('common.appName')}
              </span>
              <span className="text-[9px] font-sans font-medium tracking-wider text-secondary uppercase leading-none mt-0.5">
                {t('common.tagline')}
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex gap-6 items-center">
            <Link
              to="/marketplace"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-secondary/70" />
              {t('nav.marketplace')}
            </Link>
            <Link
              to="/market-prices"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-secondary/70" />
              {t('nav.mandiAnalytics')}
            </Link>
            <Link
              to="/weather"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md flex items-center gap-1.5"
            >
              <CloudSun className="w-4 h-4 text-secondary/70" />
              {t('nav.weatherAdvisories')}
            </Link>
            <Link
              to="/ai-assistant"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>{t('nav.khetiAi')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </Link>
          </div>
        </div>

        {/* Right Search, Language Selector & Profile Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center bg-surface-container rounded-full px-3.5 py-1.5 border border-surface-variant focus-within:border-primary transition-colors"
          >
            <Search className="w-4 h-4 text-on-surface-variant mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="bg-transparent border-none p-0 focus:ring-0 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/70 w-28 lg:w-44 outline-none"
            />
          </form>

          {/* Website-Wide Language Selector */}
          <LanguageSwitcher />

          {/* User Status / Action Buttons */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link to={getDashboardPath()}>
                <Button variant="primary" size="sm" className="hidden sm:inline-flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.dashboard')}
                </Button>
              </Link>

              <Badge variant="warning" className="hidden sm:inline-flex">
                {user.role}
              </Badge>

              <div className="relative group">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 flex items-center justify-center text-primary font-bold text-xs"
                >
                  {user.fullName ? user.fullName[0].toUpperCase() : <User className="w-4 h-4" />}
                </button>
                <div className="absolute right-0 top-11 w-52 bg-surface rounded-[16px] border border-surface-variant p-2 soil-shadow hidden group-hover:block z-50">
                  <div className="px-3 py-2 border-b border-surface-variant/60">
                    <p className="text-xs font-semibold text-primary truncate">{user.fullName}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-on-surface hover:bg-surface-container rounded-[8px]"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-secondary" />
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-error hover:bg-error-container/30 rounded-[8px]"
                  >
                    <LogOut className="w-3.5 h-3.5 text-error" />
                    {t('nav.signOut')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  {t('nav.signIn')}
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-low px-6 py-4 border-t border-surface-variant flex flex-col gap-3">
          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-secondary" />
            {t('nav.marketplace')}
          </Link>
          <Link
            to="/market-prices"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4 text-secondary" />
            {t('nav.mandiAnalytics')}
          </Link>
          <Link
            to="/weather"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface flex items-center gap-2"
          >
            <CloudSun className="w-4 h-4 text-secondary" />
            {t('nav.weatherAdvisories')}
          </Link>
          <Link
            to="/ai-assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-secondary" />
            {t('nav.khetiAi')}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
