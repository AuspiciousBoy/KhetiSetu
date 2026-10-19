import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const FarmerDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, batchesRes, weatherRes] = await Promise.all([
          apiClient.get('/farmer/analytics'),
          apiClient.get('/farmer/batches?limit=5'),
          apiClient.get('/weather?district=Pune'),
        ]);

        setAnalytics(analyticsRes.data.data);
        setBatches(batchesRes.data.data);
        setWeather(weatherRes.data.data);
      } catch (err) {
        console.error('Failed to load farmer dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-28 rounded-[24px]" count={4} />
        </div>
        <Skeleton className="h-72 rounded-[24px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            Farmer Control Center
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            Sahyadri Organic Agro Farm
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Pune District, Maharashtra • Grade-A Harvest Dispatch Queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/farmer/batches">
            <Button variant="primary" size="md">
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              New Harvest Batch
            </Button>
          </Link>
          <Link to="/farmer/ai">
            <Button variant="secondary" size="md">
              <span className="material-symbols-outlined text-[18px]">psychiatry</span>
              Kheti AI Doctor
            </Button>
          </Link>
        </div>
      </div>

      {/* Bento Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
              Gross Realized Revenue
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">currency_rupee</span>
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-primary">
              ₹{(analytics?.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-secondary mt-1">Directly credited to verified account</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
              Active Produce Batches
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-primary">
              {analytics?.batchesCount || 0}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Traceable farm-gate batches</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
              Marketplace Listings
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">storefront</span>
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-primary">
              {analytics?.activeListingsCount || 0}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Live B2C and B2B produce lots</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
              Fulfillment Orders
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-primary">
              {analytics?.totalOrdersCount || 0}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              {analytics?.pendingOrdersCount || 0} pending dispatch
            </p>
          </div>
        </Card>
      </div>

      {/* Middle Row: Weather Advisory Card (bg-primary with grain) + AI Quality Promotion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weather Tile matching code.html */}
        <div className="lg:col-span-5 bg-primary text-on-primary rounded-[24px] p-8 flex flex-col justify-between grain-overlay soil-shadow">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[24px]">sunny</span>
              </div>
              <span className="bg-surface-tint/40 px-3 py-1 rounded-[6px] text-xs font-bold text-on-primary">
                {weather?.location?.district || 'Pune'} District
              </span>
            </div>
            <span className="font-display font-bold text-5xl text-secondary-fixed block mb-1">
              {weather?.current?.temperatureC || 28}°C
            </span>
            <p className="text-sm text-on-primary/80 font-medium">
              {weather?.current?.condition || 'Clear & Sunny'} • Humidity {weather?.current?.humidityPercent || 50}%
            </p>
          </div>

          <div className="pt-6 border-t border-outline-variant/30 mt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-on-primary-container mb-2">
              Agricultural Advisory:
            </p>
            <p className="text-xs text-on-primary/90 leading-relaxed">
              {weather?.advisories?.[0]?.message ||
                'Optimal dry canopy conditions present. Ideal window for early morning harvest and produce packing.'}
            </p>
          </div>
        </div>

        {/* AI Quality Banner */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-[24px] border border-surface-variant p-8 flex flex-col justify-between soil-shadow">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary text-[22px]">psychiatry</span>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
                Post-Harvest Quality Assessment
              </span>
            </div>
            <h3 className="font-display font-semibold text-2xl text-primary mb-2">
              Verify Produce Grade Before Mandi Dispatch
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-lg mb-6">
              Use KhetiSetu's AI produce model to check cosmetic blemishes, estimate shelf life, and confirm Grade-A standard. Boost mandi bargaining power by up to 15%.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/farmer/batches">
              <Button variant="primary" size="md">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                Upload Harvest Image
              </Button>
            </Link>
            <Link to="/farmer/market">
              <Button variant="secondary" size="md">
                Smart Mandi Recommender
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Batches Table */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant/60">
          <div>
            <h3 className="font-display font-semibold text-xl text-primary">
              Recent Harvest Batches
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Traceable farm batches awaiting marketplace listing or dispatch
            </p>
          </div>
          <Link to="/farmer/batches" className="text-xs font-semibold text-secondary hover:underline">
            View All Batches →
          </Link>
        </div>

        {batches.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">
            No produce batches registered yet. Click "New Harvest Batch" above to add your first lot.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Crop</th>
                  <th className="py-3 px-4">Harvest Date</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Quality Grade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {batch.batchId}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-on-surface">
                      {batch.cropName}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {new Date(batch.harvestDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {batch.availableQuantity} {batch.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          batch.qualityGrade === 'GOOD_QUALITY'
                            ? 'success'
                            : batch.qualityGrade === 'APPROACHING_SHELF_LIFE'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {batch.qualityGrade.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-secondary">
                        {batch.listingStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/farmer/batches`}>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FarmerDashboardPage;
