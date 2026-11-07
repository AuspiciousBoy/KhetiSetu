import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AgriWeatherBar from '../../components/agri/AgriWeatherBar';
import FarmProfitCalculator from '../../components/agri/FarmProfitCalculator';

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
      {/* Hero Section matching code.html with authentic farmland texture */}
      <section className="relative w-full min-h-[72vh] flex flex-col justify-center px-margin-mobile md:px-margin-desktop py-14 sm:py-16 bg-surface overflow-hidden">
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
          <div className="w-full md:w-4/5 lg:w-3/4">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary font-label-md mb-3 block">
              "Khet Se Bazaar Tak, Ek Hi Setu."
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary mb-5 max-w-3xl tracking-tight leading-tight">
              The Modern Digital Agricultural Ecosystem for India's Growers.
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl font-normal leading-relaxed mb-6">
              Connecting farmers directly to consumers, wholesale mandis, AI-assisted produce quality grading, and transparent pricing with zero middleman deductions.
            </p>

            {/* Interactive Search Console Card directly reproducing code.html */}
            <div className="bg-surface p-4 sm:p-5 rounded-[24px] max-w-2xl soil-shadow flex flex-col gap-4 border border-surface-variant">
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-3 bg-surface-container rounded-lg px-4 py-3 border focus-within:border-primary border-transparent transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[24px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask crop advice, check mandi price or find harvest produce..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base text-on-surface placeholder:text-on-surface-variant/70 outline-none"
                />
                <button
                  type="submit"
                  className="bg-primary text-on-primary p-2.5 rounded-[10px] flex-shrink-0 hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </form>

              {/* Quick Action Chips */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/farmer/batches"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">psychiatry</span>
                  Diagnose Crop Quality
                </Link>
                <Link
                  to="/market-prices"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  Mandi Live Prices
                </Link>
                <Link
                  to="/weather"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">partly_cloudy_day</span>
                  Agro-Weather
                </Link>
                <Link
                  to="/ai-assistant"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Ask Kheti AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Field Microclimate & Spraying Advisory Banner */}
      <section className="px-margin-mobile md:px-margin-desktop -mt-6 mb-8 max-w-container-max mx-auto relative z-20">
        <AgriWeatherBar />
      </section>

      {/* Interactive Net Realization Calculator (FBN / Indigo Ag Style) */}
      <section className="py-12 px-margin-mobile md:px-margin-desktop bg-background max-w-container-max mx-auto">
        <FarmProfitCalculator />
      </section>

      {/* Bento Grid Feature Section reproducing code.html */}
      <section className="py-12 md:py-16 px-margin-mobile md:px-margin-desktop bg-background max-w-container-max mx-auto">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary font-mono block mb-1">
            Platform Capabilities
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-primary">
            Precision Agricultural Ecosystem
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5 max-w-xl">
            Practical, field-tested digital tools engineered for farmers, agribusinesses, and consumers.
          </p>
        </div>

        {/* 12-Column Bento Grid matching code.html */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter auto-rows-[250px]">
          {/* AI Produce Quality Assessor (Large 8-col Bento Tile) */}
          <div className="col-span-1 md:col-span-8 row-span-2 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group grain-overlay soil-shadow">
            <div className="relative z-10 md:w-3/5">
              <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center mb-5 border border-surface-tint/20">
                <span className="material-symbols-outlined text-primary text-[24px]">eco</span>
              </div>
              <h3 className="font-display font-semibold text-2xl text-primary mb-2">
                AI Post-Harvest Quality Doctor
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant mb-5 leading-relaxed">
                Upload photos of freshly harvested produce for instantaneous shelf-life estimation, defect analysis, and Grade-A commercial classification before dispatching to mandis.
              </p>

              <ul className="flex flex-col gap-2 mb-6">
                <li className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  Visual Blemish, Decay & Sunscald Detection
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  Estimated Shelf-Life Projection (Ambient vs Cold-Chain)
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  Standard APMC Grade-A/B/C Commercial Verification
                </li>
              </ul>

              <Link to="/farmer/batches">
                <Button variant="primary" size="md">
                  Start Quality Assessment
                  <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                </Button>
              </Link>
            </div>

            {/* Floating Visual Accent Card */}
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
              className="absolute right-0 bottom-0 w-2/5 h-full opacity-40 pointer-events-none hidden md:block"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>
          </div>

          {/* Soil & Farm Metrics (Small 4-col Bento Tile) */}
          <div className="col-span-1 md:col-span-4 row-span-1 bg-primary text-on-primary rounded-[24px] p-6 flex flex-col justify-between grain-overlay soil-shadow">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-surface/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[20px]">layers</span>
                </div>
                <span className="bg-surface-tint/30 px-2 py-0.5 rounded-[4px] text-[11px] font-bold text-on-primary">
                  Farm Region • Maharashtra
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">
                Batch Traceability
              </h3>
              <p className="text-xs text-on-primary/70">Verified farm gate batches with tamper-resistant QR codes</p>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-display font-bold text-4xl text-secondary-fixed">
                100%
              </span>
              <span className="text-xs text-on-primary/70 mb-1">Direct Farm Gate Origin</span>
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
                Deterministic Weighted Moving Average (WMA) algorithmic forecasts & mandi net realization rankings.
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
