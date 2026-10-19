import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface-container w-full rounded-t-[40px] mt-24 border-t border-outline-variant/30">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-margin-mobile md:px-margin-desktop py-16 max-w-container-max mx-auto">
        {/* Brand & Mission Column */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
          <span className="font-display font-bold text-2xl uppercase tracking-tight text-primary">
            KHETISETU
          </span>
          <p className="text-sm text-secondary font-medium max-w-xs">
            "Khet Se Bazaar Tak, Ek Hi Setu."
          </p>
          <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            An AI-Assisted Digital Agricultural Ecosystem empowering Indian farmers with verified post-harvest quality, transparent APMC market intelligence, and direct consumer/B2B connectivity.
          </p>
        </div>

        {/* Link Columns */}
        <div className="col-span-1 md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              Ecosystem
            </h4>
            <Link to="/marketplace" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              B2C Marketplace
            </Link>
            <Link to="/marketplace?type=b2b" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              B2B Bulk Procurement
            </Link>
            <Link to="/market-prices" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Mandi Indexing
            </Link>
            <Link to="/weather" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Agro-Meteorology
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              AI Technology
            </h4>
            <Link to="/ai-assistant" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Kheti AI Advisor
            </Link>
            <Link to="/farmer/batches" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Quality Assessment
            </Link>
            <Link to="/farmer/market" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Smart Market Recommender
            </Link>
            <Link to="/marketplace" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Batch Traceability
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              Trust & Security
            </h4>
            <span className="text-xs text-on-surface-variant">OWASP API Security</span>
            <span className="text-xs text-on-surface-variant">Argon2id Vault</span>
            <span className="text-xs text-on-surface-variant">Traceable Produce</span>
            <span className="text-xs text-on-surface-variant">Immutable Audit Trails</span>
          </div>

          {/* Local Conditions Widget matching code.html */}
          <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary font-label-md">
              Local Conditions
            </p>
            <div className="bg-surface-container-high rounded-[16px] p-3.5 flex items-center gap-3 border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[28px]">
                sunny
              </span>
              <div>
                <span className="font-display font-bold text-xl text-primary block leading-none mb-1">
                  28°C
                </span>
                <span className="text-[11px] font-medium text-on-surface-variant block">
                  Pune, Maharashtra • Clear
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant/20 px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
        <p>© 2026 KhetiSetu Digital Agro Ecosystem. Stewardship Through Precision.</p>
        <p className="font-mono text-[11px]">System Status: Production Grade Active</p>
      </div>
    </footer>
  );
};

export default Footer;
