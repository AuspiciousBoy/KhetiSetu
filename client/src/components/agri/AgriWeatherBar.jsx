import React from 'react';
import { Link } from 'react-router-dom';
import { Tractor, Thermometer, Droplets, Wind, CloudRain, ArrowRight } from 'lucide-react';

const AgriWeatherBar = () => {
  return (
    <div className="bg-surface rounded-[20px] border border-surface-variant p-4 sm:p-5 soil-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Agronomic Field Advisory */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Tractor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary font-mono">
                Field Conditions Advisory
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Spraying Favorable
              </span>
            </div>
            <p className="text-xs text-on-surface font-medium mt-0.5">
              Low wind (6 km/h) & 0% rain probability over next 18 hours. Ideal window for foliar fertilizer & bio-pesticide application.
            </p>
          </div>
        </div>

        {/* Right: Microclimate Telemetry Grid */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-1 lg:pb-0 scrollbar-none font-mono text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <Thermometer className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">Soil Temp</span>
              <span className="font-bold text-on-surface">24.2°C</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Droplets className="w-4 h-4 text-sky-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">Rel. Humidity</span>
              <span className="font-bold text-on-surface">54%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Wind className="w-4 h-4 text-teal-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">Wind Speed</span>
              <span className="font-bold text-on-surface">6 km/h NW</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CloudRain className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">Rain Forecast</span>
              <span className="font-bold text-emerald-700">0.0 mm</span>
            </div>
          </div>

          <Link
            to="/weather"
            className="shrink-0 text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1 font-sans pl-2 border-l border-surface-variant transition-colors"
          >
            <span>7-Day Radar</span>
            <ArrowRight className="w-3.5 h-3.5 text-secondary" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AgriWeatherBar;
