import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Sparkles,
  IndianRupee,
  Boxes,
  Store,
  Truck,
  Sun,
  Camera,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const FarmerDashboardPage = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, batchesRes, weatherRes, ordersRes] = await Promise.all([
          apiClient.get('/farmer/analytics'),
          apiClient.get('/farmer/batches?limit=5'),
          apiClient.get('/weather?district=Pune'),
          apiClient.get('/orders/farmer-orders?limit=5'),
        ]);

        setAnalytics(analyticsRes.data.data);
        setBatches(batchesRes.data.data);
        setWeather(weatherRes.data.data);
        setOrders(ordersRes.data.data || []);
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
            {t('farmerDashboard.controlCenter')}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            Sahyadri Organic Agro Farm
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('farmerDashboard.farmSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/farmer/batches">
            <Button variant="primary" size="md" className="flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>{t('farmerDashboard.newBatchBtn')}</span>
            </Button>
          </Link>
          <Link to="/farmer/ai">
            <Button variant="secondary" size="md" className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span>{t('farmerDashboard.khetiAiDoctorBtn')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Bento Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
              {t('farmerDashboard.grossRevenue')}
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary">
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-primary font-mono">
              ₹{(analytics?.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-secondary mt-1">{t('farmerDashboard.creditedDirectly')}</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
              {t('farmerDashboard.activeBatches')}
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-secondary">
              <Boxes className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-primary font-mono">
              {analytics?.batchesCount || 0}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">{t('farmerDashboard.traceableBatchesSub')}</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
              {t('farmerDashboard.marketplaceListings')}
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary">
              <Store className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-primary font-mono">
              {analytics?.activeListingsCount || 0}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">{t('farmerDashboard.liveListingsSub')}</p>
          </div>
        </Card>

        <Link to="/farmer/orders" className="block group">
          <Card className="flex flex-col justify-between h-full group-hover:border-secondary transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
                {t('farmerDashboard.fulfillmentOrders')}
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                <Truck className="w-4 h-4 text-inherit" />
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-3xl text-primary font-mono">
                {analytics?.totalOrdersCount || 0}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {t('farmerDashboard.pendingDispatch', { count: analytics?.pendingOrdersCount || 0 })}
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Middle Row: Weather Advisory Card + AI Quality Promotion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weather Tile */}
        <div className="lg:col-span-5 bg-primary text-on-primary rounded-[24px] p-8 flex flex-col justify-between grain-overlay soil-shadow">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-surface/10 flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-300" />
              </div>
              <span className="bg-surface-tint/40 px-3 py-1 rounded-[6px] text-xs font-bold text-on-primary font-mono">
                {t('farmerDashboard.districtLabel', { district: weather?.location?.district || 'Pune' })}
              </span>
            </div>
            <span className="font-display font-bold text-5xl text-secondary-fixed block mb-1 font-mono">
              {weather?.current?.temperatureC || 28}°C
            </span>
            <p className="text-sm text-on-primary/80 font-medium">
              {weather?.current?.condition || 'Clear & Sunny'} • {t('farmerDashboard.humidityLabel')} {weather?.current?.humidityPercent || 50}%
            </p>
          </div>

          <div className="pt-6 border-t border-outline-variant/30 mt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-on-primary-container mb-2">
              {t('farmerDashboard.agriculturalAdvisory')}
            </p>
            <p className="text-xs text-on-primary/90 leading-relaxed">
              {weather?.advisories?.[0]?.message || t('farmerDashboard.defaultAdvisory')}
            </p>
          </div>
        </div>

        {/* AI Quality Banner */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-[24px] border border-surface-variant p-8 flex flex-col justify-between soil-shadow">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-secondary" />
              <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
                {t('farmerDashboard.qualityAssessmentTitle')}
              </span>
            </div>
            <h3 className="font-display font-semibold text-2xl text-primary mb-2">
              {t('farmerDashboard.verifyGradeHeading')}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-lg mb-6">
              {t('farmerDashboard.verifyGradeDesc')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/farmer/batches">
              <Button variant="primary" size="md" className="flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>{t('farmerDashboard.uploadHarvestBtn')}</span>
              </Button>
            </Link>
            <Link to="/market-prices">
              <Button variant="secondary" size="md">
                {t('farmerDashboard.smartMandiBtn')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Fulfillment Orders Table */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant/60">
          <div>
            <h3 className="font-display font-semibold text-xl text-primary">
              {t('farmerDashboard.recentOrdersTitle')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t('farmerDashboard.recentOrdersSubtitle')}
            </p>
          </div>
          <Link to="/farmer/orders" className="text-xs font-semibold text-secondary hover:underline">
            {t('farmerDashboard.viewAllOrders')}
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">
            {t('farmerDashboard.noOrdersOnDashboard')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{t('farmerOrders.orderIdCol')}</th>
                  <th className="py-3 px-4">{t('farmerOrders.buyerCol')}</th>
                  <th className="py-3 px-4">{t('farmerOrders.itemsCol')}</th>
                  <th className="py-3 px-4">{t('farmerOrders.destinationCol')}</th>
                  <th className="py-3 px-4">{t('farmerOrders.amountCol')}</th>
                  <th className="py-3 px-4">{t('farmerOrders.statusCol')}</th>
                  <th className="py-3 px-4 text-right">{t('farmerOrders.actionCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {orders.map((ord) => {
                  const isB2B =
                    ord.buyerRole === 'BUSINESS' ||
                    ord.buyerId?.role === 'BUSINESS' ||
                    Boolean(ord.businessProfile);
                  const buyerDisplayName =
                    ord.businessProfile?.businessName ||
                    ord.buyerId?.fullName ||
                    ord.deliveryAddress?.fullName ||
                    'Buyer';
                  const orderVal =
                    ord.farmerSubtotal !== undefined ? ord.farmerSubtotal : ord.total;

                  return (
                    <tr key={ord._id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {ord.orderId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-primary">{buyerDisplayName}</span>
                          {isB2B && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                              B2B
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        {ord.items?.[0]?.title}
                        {ord.items?.length > 1 && ` +${ord.items.length - 1} more`}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        {ord.deliveryAddress?.city}, {ord.deliveryAddress?.state}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        ₹{orderVal?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            ord.status === 'DELIVERED'
                              ? 'success'
                              : ord.status === 'CANCELLED'
                              ? 'error'
                              : ord.status === 'PLACED'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to="/farmer/orders">
                          <Button variant="ghost" size="sm">
                            {t('farmerDashboard.detailsBtn')}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Batches Table */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant/60">
          <div>
            <h3 className="font-display font-semibold text-xl text-primary">
              {t('farmerDashboard.recentBatchesTitle')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t('farmerDashboard.recentBatchesSubtitle')}
            </p>
          </div>
          <Link to="/farmer/batches" className="text-xs font-semibold text-secondary hover:underline">
            {t('farmerDashboard.viewAllBatches')}
          </Link>
        </div>

        {batches.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">
            {t('farmerDashboard.noBatchesMsg')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{t('farmerDashboard.batchIdCol')}</th>
                  <th className="py-3 px-4">{t('farmerDashboard.cropCol')}</th>
                  <th className="py-3 px-4">{t('farmerDashboard.harvestDateCol')}</th>
                  <th className="py-3 px-4">{t('farmerDashboard.stockCol')}</th>
                  <th className="py-3 px-4">{t('farmerDashboard.qualityGradeCol')}</th>
                  <th className="py-3 px-4">{t('farmerDashboard.statusCol')}</th>
                  <th className="py-3 px-4 text-right">{t('farmerDashboard.actionCol')}</th>
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
                          {t('farmerDashboard.detailsBtn')}
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
