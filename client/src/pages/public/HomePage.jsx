import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CloudSun,
  Store,
  Leaf,
  CheckCircle2,
  Layers,
  Truck,
  Sprout,
  Building2,
  ShoppingBag,
  Award,
  BadgePercent,
  Check,
  QrCode,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import AgriWeatherBar from '../../components/agri/AgriWeatherBar';
import FarmProfitCalculator from '../../components/agri/FarmProfitCalculator';
import { useTranslation } from '../../i18n/LanguageContext';

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const FEATURED_PRODUCE = [
    {
      id: 'prod-1',
      name: t('profitCalculator.crops.onion'),
      grade: 'Grade-A Prime',
      origin: 'Lasalgaon Cluster, MH',
      price: '₹26/kg',
      unit: 'Bulk & Crate',
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=500',
      harvested: t('home.harvestedYesterday'),
      shelfLife: '35-45 Days',
    },
    {
      id: 'prod-2',
      name: t('profitCalculator.crops.tomato'),
      grade: 'Grade-A Export Quality',
      origin: 'Kolar Mandi Hub, KA',
      price: '₹20/kg',
      unit: '20kg Ventilated Crates',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=500',
      harvested: t('home.harvestedToday'),
      shelfLife: '7-10 Days',
    },
    {
      id: 'prod-3',
      name: t('profitCalculator.crops.wheat'),
      grade: 'Grade-A Golden Grain',
      origin: 'Sehore Belt, MP',
      price: '₹32/kg',
      unit: '50kg Jute Bags',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=500',
      harvested: t('home.curedCleaned'),
      shelfLife: '12 Months',
    },
    {
      id: 'prod-4',
      name: t('profitCalculator.crops.basmati'),
      grade: 'Grade-A Long Grain',
      origin: 'Karnal Belt, HR',
      price: '₹48/kg',
      unit: 'Bulk Lots & Retail',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500',
      harvested: t('home.aromaticHarvest'),
      shelfLife: '18 Months',
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ai-assistant?prompt=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[72vh] flex flex-col justify-center px-margin-mobile md:px-margin-desktop py-14 sm:py-20 bg-surface overflow-hidden">
        {/* Farmland Background Texture with Soft Blur */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 font-mono">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>{t('home.heroBadge')}</span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary mb-5 max-w-3xl tracking-tight leading-tight">
              {t('home.heroTitle')}
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl font-normal leading-relaxed mb-6">
              {t('home.heroSubtitle')}
            </p>

            {/* Interactive Search Console Card */}
            <div className="bg-surface p-4 sm:p-5 rounded-[24px] max-w-2xl soil-shadow flex flex-col gap-4 border border-surface-variant">
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3 border focus-within:border-primary border-transparent transition-colors"
              >
                <Search className="w-5 h-5 text-primary shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base text-on-surface placeholder:text-on-surface-variant/70 outline-none"
                />
                <button
                  type="submit"
                  className="bg-primary text-on-primary p-2.5 rounded-lg flex-shrink-0 hover:bg-[#124b37] transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {/* Quick Action Chips */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/farmer/batches"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-secondary" />
                  {t('home.diagnoseQualityChip')}
                </Link>
                <Link
                  to="/market-prices"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  {t('home.mandiPricesChip')}
                </Link>
                <Link
                  to="/weather"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <CloudSun className="w-4 h-4 text-secondary" />
                  {t('home.agroWeatherChip')}
                </Link>
                <Link
                  to="/ai-assistant"
                  className="px-3.5 py-2 bg-surface-container hover:bg-surface-variant transition-colors rounded-[12px] text-xs font-semibold text-secondary border border-surface-variant flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-secondary" />
                  {t('home.askKhetiAiChip')}
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

      {/* Trust & Network Stats Banner */}
      <section className="py-6 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-[20px] p-5 border border-surface-variant soil-shadow flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <BadgePercent className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary block leading-none">
                {t('home.trustStats.zeroMiddleman')}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {t('home.trustStats.zeroMiddlemanLabel')}
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-[20px] p-5 border border-surface-variant soil-shadow flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary block leading-none">
                {t('home.trustStats.traceable')}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {t('home.trustStats.traceableLabel')}
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-[20px] p-5 border border-surface-variant soil-shadow flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary block leading-none">
                {t('home.trustStats.apmcMandis')}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {t('home.trustStats.apmcMandisLabel')}
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-[20px] p-5 border border-surface-variant soil-shadow flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-primary block leading-none">
                {t('home.trustStats.instantGrading')}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {t('home.trustStats.instantGradingLabel')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Pathways Grid */}
      <section className="py-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary font-mono block">
            {t('home.gateways.sectionTitle')}
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            {t('home.gateways.sectionSubtitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gateway 1: Farmers */}
          <div className="bg-surface rounded-[24px] p-6 border border-surface-variant soil-shadow flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-5">
                <Sprout className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                {t('home.gateways.farmerCategory')}
              </span>
              <h3 className="font-display font-bold text-xl text-primary mt-1 mb-2">
                {t('home.gateways.farmerTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                {t('home.gateways.farmerDesc')}
              </p>
              <ul className="flex flex-col gap-2 text-xs text-on-surface-variant mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('home.gateways.farmerPoint1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('home.gateways.farmerPoint2')}</span>
                </li>
              </ul>
            </div>
            <Link to="/farmer/listings">
              <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-1.5">
                <span>{t('home.gateways.farmerCta')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Gateway 2: Agribusiness & B2B */}
          <div className="bg-surface rounded-[24px] p-6 border border-surface-variant soil-shadow flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#08241a] text-white flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-amber-300" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                {t('home.gateways.businessCategory')}
              </span>
              <h3 className="font-display font-bold text-xl text-primary mt-1 mb-2">
                {t('home.gateways.businessTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                {t('home.gateways.businessDesc')}
              </p>
              <ul className="flex flex-col gap-2 text-xs text-on-surface-variant mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('home.gateways.businessPoint1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('home.gateways.businessPoint2')}</span>
                </li>
              </ul>
            </div>
            <Link to="/marketplace?type=b2b">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5">
                <span>{t('home.gateways.businessCta')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Gateway 3: Consumers */}
          <div className="bg-surface rounded-[24px] p-6 border border-surface-variant soil-shadow flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#2e1d0f] text-white flex items-center justify-center mb-5">
                <ShoppingBag className="w-6 h-6 text-amber-300" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                {t('home.gateways.consumerCategory')}
              </span>
              <h3 className="font-display font-bold text-xl text-primary mt-1 mb-2">
                {t('home.gateways.consumerTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                {t('home.gateways.consumerDesc')}
              </p>
              <ul className="flex flex-col gap-2 text-xs text-on-surface-variant mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('home.gateways.consumerPoint1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('home.gateways.consumerPoint2')}</span>
                </li>
              </ul>
            </div>
            <Link to="/marketplace">
              <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5">
                <span>{t('home.gateways.consumerCta')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Net Realization Calculator */}
      <section className="py-10 px-margin-mobile md:px-margin-desktop bg-background max-w-container-max mx-auto">
        <FarmProfitCalculator />
      </section>

      {/* Live Produce Showcase (Active Farm Listings) */}
      <section className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-secondary font-mono block">
              {t('home.directFromSoil')}
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
              {t('home.activeVerifiedLots')}
            </h2>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1 transition-colors"
          >
            <span>{t('home.viewAllListings')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_PRODUCE.map((crop) => (
            <div
              key={crop.id}
              className="bg-surface rounded-[20px] overflow-hidden border border-surface-variant soil-shadow flex flex-col justify-between group hover:border-primary/40 transition-all"
            >
              <div>
                <div className="h-44 w-full relative overflow-hidden bg-surface-container">
                  <img
                    src={crop.image}
                    alt={crop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-[#08241a]/90 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {crop.grade}
                  </div>
                </div>

                <div className="p-4">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-secondary block">
                    {crop.origin}
                  </span>
                  <h3 className="font-display font-bold text-base text-primary mt-0.5 line-clamp-1">
                    {crop.name}
                  </h3>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-variant text-xs">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block uppercase font-mono">
                        {t('home.directPrice')}
                      </span>
                      <span className="font-bold font-mono text-base text-primary">{crop.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-on-surface-variant block uppercase font-mono">
                        {t('home.freshness')}
                      </span>
                      <span className="font-semibold text-emerald-700 text-xs">{crop.harvested}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Link to="/marketplace">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    {t('home.viewBatchTraceability')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid Feature Section */}
      <section className="py-12 md:py-16 px-margin-mobile md:px-margin-desktop bg-background max-w-container-max mx-auto">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary font-mono block mb-1">
            {t('home.coreTechnology')}
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-primary">
            {t('home.precisionAgroTitle')}
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5 max-w-xl">
            {t('home.precisionAgroDesc')}
          </p>
        </div>

        {/* 12-Column Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter auto-rows-[250px]">
          {/* AI Produce Quality Assessor (Large 8-col Bento Tile) */}
          <div className="col-span-1 md:col-span-8 row-span-2 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group grain-overlay soil-shadow">
            <div className="relative z-10 md:w-3/5">
              <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center mb-5 border border-surface-tint/20 text-primary">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-2xl text-primary mb-2">
                {t('home.bentoAiQualityTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant mb-5 leading-relaxed">
                {t('home.bentoAiQualityDesc')}
              </p>

              <ul className="flex flex-col gap-2 mb-6">
                <li className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {t('home.bentoAiFeature1')}
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {t('home.bentoAiFeature2')}
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {t('home.bentoAiFeature3')}
                </li>
              </ul>

              <Link to="/farmer/batches">
                <Button variant="primary" size="md" className="flex items-center gap-1.5">
                  <span>{t('home.bentoStartAssessment')}</span>
                  <ArrowRight className="w-4 h-4" />
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 font-mono">
                  {t('home.recentScan')}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs font-bold text-primary">
                    {t('home.gradeAPrimeQuality')}
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
                <div className="w-10 h-10 rounded-xl bg-surface/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-on-primary" />
                </div>
                <span className="bg-surface-tint/30 px-2 py-0.5 rounded-[4px] text-[11px] font-bold text-on-primary font-mono">
                  {t('home.farmRegion')}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">
                {t('home.bentoBatchTraceTitle')}
              </h3>
              <p className="text-xs text-on-primary/70">{t('home.bentoBatchTraceDesc')}</p>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-display font-bold text-4xl text-secondary-fixed">
                100%
              </span>
              <span className="text-xs text-on-primary/70 mb-1">{t('home.directFarmOrigin')}</span>
            </div>
          </div>

          {/* Market Intelligence Tile (Small 4-col Bento Tile) */}
          <div className="col-span-1 md:col-span-4 row-span-1 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 flex flex-col justify-between soil-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center mb-4 text-secondary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-primary mb-1">
                {t('home.bentoMarketPriceTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('home.bentoMarketPriceDesc')}
              </p>
            </div>

            <Link
              to="/market-prices"
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1 mt-4"
            >
              <span>{t('home.bentoViewMandiTrends')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Marketplace B2C & B2B (6-col Bento Tile) */}
          <div className="col-span-1 md:col-span-6 row-span-1 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 flex flex-col justify-between soil-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                  {t('home.directCommerce')}
                </span>
                <h3 className="font-display font-semibold text-xl text-primary mt-1">
                  {t('home.bentoDualMarketTitle')}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm">
                  {t('home.bentoDualMarketDesc')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-primary shrink-0">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <Link to="/marketplace" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              <span>{t('home.exploreActiveProduce')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Smart Logistics & Delivery Fleet (6-col Bento Tile) */}
          <div className="col-span-1 md:col-span-6 row-span-1 bg-surface-container-low rounded-[24px] border border-surface-variant p-6 flex flex-col justify-between soil-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                  {t('home.transportNetwork')}
                </span>
                <h3 className="font-display font-semibold text-xl text-primary mt-1">
                  {t('home.bentoLogisticsTitle')}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm">
                  {t('home.bentoLogisticsDesc')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-secondary shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <Link to="/marketplace" className="text-xs font-semibold text-secondary flex items-center gap-1 hover:underline">
              <span>{t('home.trackDispatches')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
