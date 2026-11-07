import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const MarketIntelligencePage = () => {
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [quantityKg, setQuantityKg] = useState(1000);
  const [priceHistory, setPriceHistory] = useState(null);
  const [smartRecommendations, setSmartRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const [historyRes, recRes] = await Promise.all([
        apiClient.get(`/market/prices/${selectedCrop}/history?days=30`),
        apiClient.get(`/market/recommendation?crop=${selectedCrop}&quantity=${quantityKg}`),
      ]);
      setPriceHistory(historyRes.data.data);
      setSmartRecommendations(recRes.data.data);
    } catch (err) {
      console.error('Failed to load market analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [selectedCrop]);

  const handleRecalculate = (e) => {
    e.preventDefault();
    fetchMarketData();
  };

  // Format Recharts data series
  const chartData =
    priceHistory?.history?.map((pt) => ({
      date: new Date(pt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      price: pt.pricePerKg,
      market: pt.market,
    })) || [];

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            Marketplace Analytics
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            APMC Mandi Price Analytics & Forecasting
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Algorithmic 30-day price trends and transparent Net-Return Mandi optimization
          </p>
        </div>

        {/* Crop Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice'].map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-4 py-2 rounded-[12px] text-xs font-semibold transition-all ${
                selectedCrop === crop
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface hover:bg-surface-variant border border-surface-variant'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-72 rounded-[24px]" />
          <Skeleton className="h-64 rounded-[24px]" />
        </div>
      ) : (
        <>
          {/* Top Row: Current Price vs Predicted Price + AI Explanation Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <Card className="md:col-span-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
                  Current Benchmark Price
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-display font-bold text-4xl text-primary">
                    ₹{priceHistory?.currentPrice}
                  </span>
                  <span className="text-xs text-on-surface-variant">/ kg (Avg)</span>
                </div>
              </div>

              <div className="pt-6 border-t border-surface-variant/60 mt-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
                    Algorithmic 15-Day Forecast
                  </span>
                  <Badge variant={priceHistory?.changePercent >= 0 ? 'success' : 'warning'}>
                    {priceHistory?.changePercent >= 0 ? '+' : ''}
                    {priceHistory?.changePercent}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-2xl text-secondary">
                    ₹{priceHistory?.predictedPrice}
                  </span>
                  <span className="text-xs text-on-surface-variant">/ kg (WMA Model)</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-1">
                  Computed via Weighted Moving Average and seasonal momentum.
                </p>
              </div>
            </Card>

            <Card className="md:col-span-8 bg-surface-container-low p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
                    Market Intelligence Summary
                  </span>
                </div>
                <h3 className="font-display font-semibold text-lg text-primary mb-2">
                  Commercial Outlook for {selectedCrop}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {priceHistory?.explanation}
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-surface-container border border-surface-variant/70 text-[11px] text-on-surface-variant mt-4">
                <span className="font-bold text-primary block mb-0.5">Note for Growers:</span>
                Prices reflect official APMC Mandi arrivals. For Grade-A sorted produce, KhetiSetu marketplace listings typically yield 10-15% above standard un-graded auction lots.
              </div>
            </Card>
          </div>

          {/* Historical Price Chart matching Agri-Modernism specification */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant/60">
              <div>
                <h3 className="font-display font-semibold text-xl text-primary">
                  30-Day Historical Price Movement (₹ / kg)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Deep Forest trend line with soft sand gridlines per DESIGN.md
                </p>
              </div>
              <Badge variant="primary">Agmarknet Index</Badge>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#ece8df" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#727974" fontSize={11} tickLine={false} />
                  <YAxis stroke="#727974" fontSize={11} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fdf9f0',
                      borderColor: '#e6e2d9',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 16px rgba(120,88,56,0.08)',
                    }}
                  />
                  {/* Deep Forest Line from Design System */}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#08241a"
                    strokeWidth={2.5}
                    dot={{ fill: '#08241a', r: 3 }}
                    activeDot={{ r: 6, fill: '#e78353' }} // Terracotta anomaly dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Smart Mandi Recommender Table */}
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-surface-variant/60">
              <div>
                <h3 className="font-display font-semibold text-xl text-primary">
                  Smart Market Recommendation (Net Return Optimization)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Ranked by realistic Net Return = (Gross Revenue) - (Logistics Freight) - (Mandi Cess)
                </p>
              </div>

              {/* Quantity Form */}
              <form onSubmit={handleRecalculate} className="flex items-center gap-2">
                <span className="text-xs font-medium text-on-surface-variant">Batch Load:</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-24 bg-surface-container rounded-[8px] py-1.5 px-3 text-xs border border-surface-variant font-semibold"
                />
                <span className="text-xs text-on-surface-variant">kg</span>
                <Button type="submit" variant="secondary" size="sm">
                  Recalculate
                </Button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Rank / Mandi</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4">Mandi Rate</th>
                    <th className="py-3 px-4">Gross Revenue</th>
                    <th className="py-3 px-4">Transport Freight</th>
                    <th className="py-3 px-4 font-bold text-primary">Est. Net Return</th>
                    <th className="py-3 px-4 text-right">Effective Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {smartRecommendations?.markets?.map((mandi, idx) => (
                    <tr
                      key={mandi.mandiName}
                      className={
                        mandi.isRecommended
                          ? 'bg-primary/5 font-medium'
                          : 'hover:bg-surface-container/50 transition-colors'
                      }
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {mandi.isRecommended ? (
                            <Badge variant="success">★ BEST OPTION</Badge>
                          ) : (
                            <span className="font-bold text-on-surface-variant">#{idx + 1}</span>
                          )}
                          <span className="font-semibold text-primary">{mandi.mandiName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{mandi.distanceKm} km</td>
                      <td className="py-3.5 px-4 font-medium">₹{mandi.mandiPricePerKg}/kg</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        ₹{mandi.grossRevenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-error font-medium">
                        -₹{mandi.estimatedTransportCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary text-sm">
                        ₹{mandi.estimatedNetReturn.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-display font-bold text-secondary text-sm">
                        ₹{mandi.effectiveNetPerKg} / kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-[12px] bg-surface-container text-[11px] text-on-surface-variant italic">
              💡 {smartRecommendations?.methodologyNote}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default MarketIntelligencePage;
