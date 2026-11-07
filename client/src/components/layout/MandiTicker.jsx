import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';

const MANDI_ITEMS = [
  { crop: 'Nashik Red Onion', price: '₹2,450/qtl', change: '+3.2%', isUp: true, mandi: 'Lasalgaon' },
  { crop: 'Kolar Hybrid Tomato', price: '₹1,820/qtl', change: '-1.5%', isUp: false, mandi: 'Azadpur' },
  { crop: 'Agra Jyoti Potato', price: '₹1,480/qtl', change: '+0.8%', isUp: true, mandi: 'Vashi' },
  { crop: 'MP Sharbati Wheat', price: '₹3,150/qtl', change: '+1.2%', isUp: true, mandi: 'Khanna' },
  { crop: 'Basmati 1121 Paddy', price: '₹4,650/qtl', change: '+2.0%', isUp: true, mandi: 'Karnal' },
  { crop: 'Latur Yellow Soybean', price: '₹4,820/qtl', change: '-0.5%', isUp: false, mandi: 'Latur' },
  { crop: 'Unjha Cumin (Jeera)', price: '₹24,800/qtl', change: '+1.8%', isUp: true, mandi: 'Unjha' },
  { crop: 'Ganganagar Mustard', price: '₹5,620/qtl', change: '+0.4%', isUp: true, mandi: 'Jaipur' },
];

const MandiTicker = () => {
  return (
    <div className="bg-[#051c14] text-[#fdf9f0] border-b border-[#0f3d2e] py-1.5 px-3 text-xs overflow-hidden select-none">
      <div className="max-w-container-max mx-auto flex items-center justify-between gap-4">
        {/* Mandi Live Label */}
        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-[#1e4d3c]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-mono font-bold text-[11px] tracking-wider uppercase text-emerald-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            Live Mandi Ticker
          </span>
        </div>

        {/* Scrolling or Flex Commodity Items */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none whitespace-nowrap py-0.5 font-mono text-[11px]">
          {MANDI_ITEMS.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 shrink-0">
              <span className="text-[#d8cdb8] font-sans font-medium">{item.crop}:</span>
              <span className="font-bold text-white">{item.price}</span>
              <span
                className={`flex items-center text-[10px] font-bold ${
                  item.isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {item.isUp ? '▲' : '▼'} {item.change}
              </span>
              <span className="text-[#8e7e68] text-[9px]">({item.mandi})</span>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <Link
          to="/market-prices"
          className="shrink-0 pl-3 border-l border-[#1e4d3c] text-[11px] font-semibold text-emerald-300 hover:text-white flex items-center gap-1 transition-colors hidden sm:flex"
        >
          <span>All Mandis</span>
          <ArrowRight className="w-3 h-3 text-emerald-400" />
        </Link>
      </div>
    </div>
  );
};

export default MandiTicker;
