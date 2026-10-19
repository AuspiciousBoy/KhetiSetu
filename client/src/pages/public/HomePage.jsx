import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ai-assistant?prompt=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section matching code.html */}
      <section className="relative w-full min-h-[75vh] flex flex-col justify-center px-margin-mobile md:px-margin-desktop py-16 bg-surface overflow-hidden">
        {/* Farmland Background Texture with Blur */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <img
            alt="Farmland Landscape"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600"
          />
          <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 max-w-container-max mx-auto w-full flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-3/4">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary font-label-md mb-3 block">
              "Khet Se Bazaar Tak, Ek Hi Setu."
            </span>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-primary mb-6 max-w-3xl tracking-tight leading-tight">
              The Future of Indian Farming is Grounded in Intelligence.
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl font-normal leading-relaxed mb-4">
              Connecting farmers directly to consumers, wholesale mandis, AI-assisted post-harvest quality assessment, and transparent pricing.
            </p>

            {/* Interactive Search Console Card directly reproducing code.html */}
            <div className="bg-surface p-4 sm:p-5 rounded-[24px] max-w-2xl soil-shadow flex flex-col gap-4 border border-surface-variant mt-6">
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-3 bg-surface-container rounded-lg px-4 py-3 border focus-within:border-primary border-transparent transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[24px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What agricultural advice or produce do you need today?"
                  className="w-full bg-transparent border-none focus:ring-0 text-base text-on-surface placeholder:text-on-surface-variant/70 outline-none"
                />
                <button
                  type="submit"
                  className="bg-primary text-on-primary p-2.5 rounded-[10px] flex-shrink-0 hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </form>

              {/* Quick Action Chips matching code.html */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/farmer/batches"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">psychiatry</span>
                  Diagnose Crop Quality
                </Link>
                <Link
                  to="/weather"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">partly_cloudy_day</span>
                  Check Weather
                </Link>
                <Link
                  to="/marketplace"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                  Buy / Sell Produce
                </Link>
                <Link
                  to="/market-prices"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  Mandi Prices & Trends
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Section reproducing code.html */}
      <section className="py-20 md:py-[100px] px-margin-mobile md:px-margin-desktop bg-background max-w-container-max mx-auto">
        <div className="mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
            Intelligent Ecosystem
          </h2>
          <p className="text-base text-on-surface-variant mt-2 max-w-xl">
            Precision farm-to-market tools engineered for the modern steward of the land.
          </p>
        </div>

        {/* 12-Column Bento Grid matching code.html */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter auto-rows-[250px]">
          {/* AI Produce Quality Assessor (Large 8-col Bento Tile) */}
          <div className="col-span-1 md:col-span-8 row-span-2 bg-surface-container-low rounded-[24px] border border-surface-variant p-8 flex flex-col justify-between overflow-hidden relative group grain-overlay soil-shadow">
            <div className="relative z-10 md:w-3/5">
              <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center mb-6 border border-surface-tint/20">
                <span className="material-symbols-outlined text-primary text-[24px]">eco</span>
              </div>
              <h3 className="font-display font-semibold text-2xl text-primary mb-2">
                AI Post-Harvest Quality Doctor
              </h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Upload photos of freshly harvested produce for instantaneous shelf-life estimation, defect analysis, and Grade-A commercial classification before dispatching to mandis.
              </p>

              <ul className="flex flex-col gap-2.5 mb-8">
                <li className="flex items-center gap-2.5 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                  Visual Blemish & Decay Identification
                </li>
                <li className="flex items-center gap-2.5 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                  Estimated Shelf-Life Projection (Ventilated vs Cooled)
                </li>
                <li className="flex items-center gap-2.5 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                  APMC Commercial Grade Verification
                </li>
                <li className="flex items-center gap-2.5 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                  Visual Estimate Only — Transparent Food Safety Disclaimers
                </li>
              </ul>

              <Link to="/farmer/batches">
                <Button variant="primary" size="md">
                  Start Quality Assessment
                  <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                </Button>
              </Link>
            </div>

            {/* Floating Visual Accent Card from code.html */}
            <div className="absolute bottom-6 right-6 z-20 bg-surface/95 backdrop-blur-md p-3.5 rounded-[16px] border border-surface-variant soil-shadow flex items-center gap-3 hidden sm:flex">
              <div className="w-12 h-12 rounded-[10px] overflow-hidden border border-outline-variant/30 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=200"
                  className="w-full h-full object-cover"
                  alt="Produce thumbnail"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                  Recent Scan • Batch #TOM-A101
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs font-bold text-primary">
                    Grade-A Prime Quality (94%)
                  </span>
                </div>
              </div>
            </div>

            {/* Macro Background Image Slice */}
            <div
              className="absolute right-0 bottom-0 w-2/5 h-full opacity-60 pointer-events-none hidden md:block"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>
          </div>

          {/* Soil & Farm Metrics (Small 4-col Bento Tile with Deep Forest bg from code.html) */}
          <div className="col-span-1 md:col-span-4 row-span-1 bg-primary text-on-primary rounded-[24px] p-6 flex flex-col justify-between grain-overlay soil-shadow">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-surface/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[20px]">layers</span>
                </div>
                <span className="bg-surface-tint/30 px-2 py-0.5 rounded-[4px] text-[11px] font-bold text-on-primary">
                  Farm Region • Pune
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">
                Ecosystem Health
              </h3>
              <p className="text-xs text-on-primary/70">Traceable harvests registered on platform</p>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-display font-bold text-4xl text-secondary-fixed">
                100%
              </span>
              <span className="text-xs text-on-primary/70 mb-1">Verified Farm Gate Batches</span>
            </div>
          </div>

          {/* Market Intelligence Tile (Small 4-col Bento Tile) */}
          <div className="col-span-1 md:col-span-4 row-span-1 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 flex flex-col justify-between soil-shadow">
            <div>
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center mb-4 text-secondary">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-primary mb-1">
                Market Price Analytics
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Weighted Moving Average algorithmic price predictions & transparent mandi net-return rankings.
              </p>
            </div>

            <Link
              to="/market-prices"
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1 mt-4"
            >
              View Mandi Trends
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {/* Marketplace B2C & B2B (6-col Bento Tile) */}
          <div className="col-span-1 md:col-span-6 row-span-1 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 flex flex-col justify-between soil-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Direct Commerce</span>
                <h3 className="font-display font-semibold text-xl text-primary mt-1">
                  B2C & B2B Dual Marketplace
                </h3>
                <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm">
                  Households order fresh seasonal harvest crates; retailers and food processors procure bulk lots with server-authoritative stock protection.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
              </div>
            </div>
            <Link to="/marketplace" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              Explore Active Produce <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {/* Smart Logistics & Delivery Fleet (6-col Bento Tile) */}
          <div className="col-span-1 md:col-span-6 row-span-1 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 flex flex-col justify-between soil-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Transport Network</span>
                <h3 className="font-display font-semibold text-xl text-primary mt-1">
                  Traceable Cold-Chain Logistics
                </h3>
                <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm">
                  Dedicated agricultural vehicle fleet (mini-trucks, reefers) with chronological delivery state-machine progression and real-time tracking.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
            </div>
            <Link to="/marketplace" className="text-xs font-semibold text-secondary flex items-center gap-1 hover:underline">
              Track Dispatches <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
