import React from 'react';
import { Link } from 'react-router-dom';

const AgriWeatherBar = () => {
  return (
    <div className="bg-surface rounded-[20px] border border-surface-variant p-4 sm:p-5 soil-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Agronomic Field Advisory */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <span className="material-symbols-outlined text-[22px]">agriculture</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary font-mono">
                Field Conditions Advisory
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
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
            <span className="material-symbols-outlined text-[18px] text-amber-600">thermostat</span>
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">Soil Temp</span>
              <span className="font-bold text-on-surface">24.2°C</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[18px] text-sky-600">humidity_mid</span>
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">Rel. Humidity</span>
              <span className="font-bold text-on-surface">54%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[18px] text-teal-600">air</span>
            <div>
              <span className="text-[10px] text-on-surface-variant block uppercase font-sans">Wind Speed</span>
              <span className="font-bold text-on-surface">6 km/h NW</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[18px] text-indigo-600">water_drop</span>
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
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AgriWeatherBar;
