import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingDown, TrendingUp, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const CROPS = [
  { id: 'onion', name: 'Nashik Red Onion (प्याज)', pricePerQtl: 2600, unit: 'qtl', defaultQty: 100 },
  { id: 'tomato', name: 'Hybrid Red Tomato (टमाटर)', pricePerQtl: 2000, unit: 'qtl', defaultQty: 80 },
  { id: 'potato', name: 'Jyoti / Agra Potato (आलू)', pricePerQtl: 1600, unit: 'qtl', defaultQty: 150 },
  { id: 'wheat', name: 'Sharbati Wheat (गेहूं)', pricePerQtl: 3200, unit: 'qtl', defaultQty: 120 },
  { id: 'basmati', name: '1121 Basmati Paddy (धान)', pricePerQtl: 4800, unit: 'qtl', defaultQty: 90 },
  { id: 'mustard', name: 'Yellow Mustard (सरसों)', pricePerQtl: 5600, unit: 'qtl', defaultQty: 60 },
];

const FarmProfitCalculator = () => {
  const [selectedCropId, setSelectedCropId] = useState('onion');
  const [quantityQtl, setQuantityQtl] = useState(100);

  const currentCrop = useMemo(() => {
    return CROPS.find((c) => c.id === selectedCropId) || CROPS[0];
  }, [selectedCropId]);

  const calculations = useMemo(() => {
    const grossMarketValue = quantityQtl * currentCrop.pricePerQtl;

    // Traditional Route Cuts
    const mandiCommission = grossMarketValue * 0.07; // 7% commission/arhatiya
    const freightOverhead = grossMarketValue * 0.11; // 11% inefficient multi-hop transport
    const spoilageWastage = grossMarketValue * 0.12; // 12% transit decay & shrinkage
    const traditionalNet = grossMarketValue - mandiCommission - freightOverhead - spoilageWastage;

    // KhetiSetu Direct Route
    const platformHandling = grossMarketValue * 0.025; // Transparent 2.5% platform handling
    const directColdLogistics = grossMarketValue * 0.05; // 5% direct farm-to-buyer route
    const aiQualityBonus = grossMarketValue * 0.08; // 8% Grade-A certified buyer premium
    const khetisetuNet = grossMarketValue - platformHandling - directColdLogistics + aiQualityBonus;

    const extraEarnings = Math.max(0, khetisetuNet - traditionalNet);
    const percentageIncrease = ((extraEarnings / traditionalNet) * 100).toFixed(1);

    return {
      grossMarketValue,
      traditional: {
        commission: mandiCommission,
        freight: freightOverhead,
        spoilage: spoilageWastage,
        net: traditionalNet,
      },
      khetisetu: {
        handling: platformHandling,
        logistics: directColdLogistics,
        bonus: aiQualityBonus,
        net: khetisetuNet,
      },
      extraEarnings,
      percentageIncrease,
    };
  }, [currentCrop, quantityQtl]);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Card className="bg-surface rounded-[24px] border border-surface-variant p-6 sm:p-8 soil-shadow">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-surface-variant/70">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary font-mono flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-secondary" />
            Farm Gate Value Realization
          </span>
          <h3 className="font-display font-bold text-2xl text-primary mt-1">
            Compare Your Net Realization: Traditional Mandi vs KhetiSetu Direct
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            See how much middleman commission, transit spoilage, and multi-hop freight cuts into your harvest profits.
          </p>
        </div>

        <div className="shrink-0 bg-primary/10 border border-primary/20 rounded-[16px] px-4 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
            +₹
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Avg. Farmer Gain
            </span>
            <p className="font-display font-bold text-lg text-primary leading-tight">
              +{calculations.percentageIncrease}% Net In Hand
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Crop Selector Chips */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              1. Select Harvest Crop
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CROPS.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => {
                    setSelectedCropId(crop.id);
                    setQuantityQtl(crop.defaultQty);
                  }}
                  className={`px-3 py-2.5 rounded-[12px] text-xs font-medium text-left border transition-all flex flex-col ${
                    selectedCropId === crop.id
                      ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                      : 'bg-surface-container hover:bg-surface-variant text-on-surface border-surface-variant'
                  }`}
                >
                  <span className="truncate">{crop.name}</span>
                  <span
                    className={`text-[10px] font-mono mt-0.5 ${
                      selectedCropId === crop.id ? 'text-on-primary/80' : 'text-on-surface-variant'
                    }`}
                  >
                    Benchmark ₹{crop.pricePerQtl.toLocaleString('en-IN')}/qtl
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Slider */}
          <div className="bg-surface-container rounded-[16px] p-4 border border-surface-variant/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                2. Harvest Quantity
              </label>
              <div className="flex items-center gap-1 bg-surface px-2.5 py-1 rounded-[8px] border border-surface-variant font-mono font-bold text-xs text-primary">
                <span>{quantityQtl}</span>
                <span className="text-on-surface-variant font-normal">Quintals</span>
                <span className="text-[10px] text-on-surface-variant/70 font-normal">
                  ({(quantityQtl * 100).toLocaleString('en-IN')} kg)
                </span>
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={quantityQtl}
              onChange={(e) => setQuantityQtl(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer h-2 bg-surface-variant rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-mono mt-1">
              <span>10 qtl</span>
              <span>150 qtl</span>
              <span>300 qtl</span>
              <span>500 qtl</span>
            </div>
          </div>

          {/* Quick Realization Summary Pill */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-3 text-xs text-emerald-950 flex items-center justify-between">
            <div>
              <span className="font-bold block">Gross Harvest Valuation</span>
              <span className="text-[11px] text-emerald-800">
                At benchmark mandi price without deductions
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-900">
              {formatINR(calculations.grossMarketValue)}
            </span>
          </div>
        </div>

        {/* Right Comparison Display (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Traditional Mandi Card */}
            <div className="rounded-[18px] p-4 bg-rose-50/50 border border-rose-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 font-mono">
                    Traditional Mandi
                  </span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>

                <div className="flex flex-col gap-2 text-xs mb-4">
                  <div className="flex justify-between text-rose-900/80">
                    <span>Arhatiya / Commission (7%)</span>
                    <span className="font-mono font-semibold text-rose-700">
                      -{formatINR(calculations.traditional.commission)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-900/80">
                    <span>Multi-hop Transit Freight (11%)</span>
                    <span className="font-mono font-semibold text-rose-700">
                      -{formatINR(calculations.traditional.freight)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-900/80">
                    <span>Transit Spoilage & Weigh Loss (12%)</span>
                    <span className="font-mono font-semibold text-rose-700">
                      -{formatINR(calculations.traditional.spoilage)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-800/80 block">
                  Farmer In-Pocket Realization
                </span>
                <span className="font-display font-bold text-xl text-rose-950 font-mono">
                  {formatINR(calculations.traditional.net)}
                </span>
                <span className="text-[10px] text-rose-700 block mt-0.5">
                  Only ~70% of gross crop value realized
                </span>
              </div>
            </div>

            {/* KhetiSetu Direct Card */}
            <div className="rounded-[18px] p-4 bg-[#08241a] text-[#fdf9f0] border border-[#1b4334] flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    KhetiSetu Direct
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    +{calculations.percentageIncrease}% Gain
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs mb-4">
                  <div className="flex justify-between text-[#c4b59f]">
                    <span>Platform Tech Fee (2.5%)</span>
                    <span className="font-mono text-white/90">
                      -{formatINR(calculations.khetisetu.handling)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#c4b59f]">
                    <span>Direct Farm Logistics (5%)</span>
                    <span className="font-mono text-white/90">
                      -{formatINR(calculations.khetisetu.logistics)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>AI Grade-A Quality Bonus (+8%)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{formatINR(calculations.khetisetu.bonus)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1b4334]">
                <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">
                  Farmer In-Pocket Realization
                </span>
                <span className="font-display font-bold text-2xl text-emerald-300 font-mono">
                  {formatINR(calculations.khetisetu.net)}
                </span>
                <span className="text-[10px] text-white/70 block mt-0.5">
                  Direct transfer into farmer bank account
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Net Gain Banner */}
          <div className="bg-surface-container rounded-[16px] p-4 border border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-primary block">
                Additional Net Profit In Your Pocket:
              </span>
              <span className="font-display font-bold text-2xl text-primary font-mono">
                +{formatINR(calculations.extraEarnings)}
              </span>
              <span className="text-[11px] text-on-surface-variant block">
                Zero middleman commissions • Direct buyer connection • Traceable farm produce
              </span>
            </div>

            <Link to="/farmer/listings">
              <Button variant="primary" size="md" className="shrink-0 w-full sm:w-auto flex items-center gap-1.5">
                <span>Sell Harvest Now</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FarmProfitCalculator;
