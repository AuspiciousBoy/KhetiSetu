import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
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
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-display font-bold text-2xl tracking-tighter uppercase text-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-primary text-[28px]">
              psychiatry
            </span>
            <span>KHETISETU</span>
          </Link>

          <div className="hidden lg:flex gap-6 items-center">
            <Link
              to="/marketplace"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md"
            >
              Marketplace
            </Link>
            <Link
              to="/market-prices"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md"
            >
              Mandi Analytics
            </Link>
            <Link
              to="/weather"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md"
            >
              Weather Advisories
            </Link>
            <Link
              to="/ai-assistant"
              className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm font-label-md flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">
                auto_awesome
              </span>
              Kheti AI
            </Link>
          </div>
        </div>

        {/* Right Search & Profile Actions */}
        <div className="flex items-center gap-4">
          {/* Search Bar matching code.html */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center bg-surface-container-high rounded-full px-4 py-2 border border-transparent focus-within:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crops, mandis..."
              className="bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/70 w-36 lg:w-48 outline-none"
            />
          </form>

          {/* User Status / Action Buttons */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to={getDashboardPath()}>
                <Button variant="primary" size="sm" className="hidden sm:inline-flex">
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  Dashboard
                </Button>
              </Link>

              <Badge variant="warning" className="hidden sm:inline-flex">
                {user.role}
              </Badge>

              <div className="relative group">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 flex items-center justify-center text-primary font-bold text-sm"
                >
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </button>
                <div className="absolute right-0 top-12 w-48 bg-surface-container-lowest rounded-[16px] border border-surface-variant p-2 soil-shadow hidden group-hover:block z-50">
                  <div className="px-3 py-2 border-b border-surface-variant/60">
                    <p className="text-xs font-semibold text-primary truncate">{user.fullName}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  <Link
                    to={getDashboardPath()}
                    className="block px-3 py-2 text-xs text-on-surface hover:bg-surface-container rounded-[8px]"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs text-error hover:bg-error-container/30 rounded-[8px]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Join Free
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-low px-6 py-4 border-t border-surface-variant flex flex-col gap-3">
          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface"
          >
            Marketplace
          </Link>
          <Link
            to="/market-prices"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface"
          >
            Mandi Analytics
          </Link>
          <Link
            to="/weather"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface"
          >
            Weather Advisories
          </Link>
          <Link
            to="/ai-assistant"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-on-surface"
          >
            Kheti AI Assistant
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
