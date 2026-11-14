import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Package,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Image as ImageIcon,
  X,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton, EmptyState, ErrorState } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const FarmerOrdersPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Dispatch Modal State
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [dispatchLocation, setDispatchLocation] = useState('Farm Gate Depot');
  const [dispatchNote, setDispatchNote] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);
  const [previewingOrder, setPreviewingOrder] = useState(null);

  // Decline Order Modal State
  const [declineModalOrder, setDeclineModalOrder] = useState(null);
  const [declineReason, setDeclineReason] = useState('Payment screenshot is fake / altered');
  const [customDeclineText, setCustomDeclineText] = useState('');
  const [declining, setDeclining] = useState(false);

  const fetchFarmerOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/orders/farmer-orders?limit=50');
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to load farmer fulfillment orders', err);
      setError(err.response?.data?.error?.message || t('common.noData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmerOrders();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUpdateStatus = async (orderId, newStatus, location, note) => {
    setActionLoadingId(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        location: location || 'Farm Gate Dispatch Point',
        note: note || `Status progressed to ${newStatus}`,
      });

      // Update local state immediately
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === orderId || ord.orderId === orderId) {
            return { ...ord, status: newStatus };
          }
          return ord;
        })
      );

      const toastMap = {
        CONFIRMED: t('farmerOrders.orderConfirmedToast'),
        PACKED: t('farmerOrders.orderPackedToast'),
        OUT_FOR_DELIVERY: t('farmerOrders.orderDispatchedToast'),
        DELIVERED: t('farmerOrders.orderDeliveredToast'),
      };
      showToast(toastMap[newStatus] || `Order ${newStatus}`);

      if (dispatchModalOrder) {
        setDispatchModalOrder(null);
        setDispatchNote('');
      }
    } catch (err) {
      console.error('Failed to update order status', err);
      alert(err.response?.data?.error?.message || t('farmerOrders.statusUpdateFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineOrder = async () => {
    if (!declineModalOrder) return;
    const finalReason =
      declineReason === 'OTHER'
        ? customDeclineText.trim() || 'Declined by farmer'
        : declineReason;

    setDeclining(true);
    try {
      await apiClient.patch(`/orders/${declineModalOrder._id}/status`, {
        status: 'CANCELLED',
        location: 'Farm Gate',
        note: `Declined by farmer: ${finalReason}`,
      });

      // Update local state immediately
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === declineModalOrder._id || ord.orderId === declineModalOrder.orderId) {
            return {
              ...ord,
              status: 'CANCELLED',
              paymentStatus: 'PAYMENT_REJECTED',
              cancelledReason: `Declined by farmer: ${finalReason}`,
            };
          }
          return ord;
        })
      );

      showToast('Order declined and stock restored to inventory');
      setDeclineModalOrder(null);
      setCustomDeclineText('');
    } catch (err) {
      console.error('Failed to decline order', err);
      alert(err.response?.data?.error?.message || 'Failed to decline order');
    } finally {
      setDeclining(false);
    }
  };

  // Filter & Search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab status filter
      if (activeTab === 'PLACED' && order.status !== 'PLACED') return false;
      if (activeTab === 'CONFIRMED' && order.status !== 'CONFIRMED') return false;
      if (activeTab === 'PACKED' && order.status !== 'PACKED') return false;
      if (activeTab === 'IN_TRANSIT' && order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'ASSIGNED') return false;
      if (activeTab === 'DELIVERED' && order.status !== 'DELIVERED') return false;
      if (activeTab === 'CANCELLED' && order.status !== 'CANCELLED') return false;

      // Text search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchOrderId = order.orderId?.toLowerCase().includes(q);
      const matchBuyerName =
        order.buyerId?.fullName?.toLowerCase().includes(q) ||
        order.deliveryAddress?.fullName?.toLowerCase().includes(q);
      const matchBusinessName = order.businessProfile?.businessName?.toLowerCase().includes(q);
      const matchCity =
        order.deliveryAddress?.city?.toLowerCase().includes(q) ||
        order.deliveryAddress?.district?.toLowerCase().includes(q);
      const matchCrop = order.items?.some(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.cropName?.toLowerCase().includes(q)
      );

      return matchOrderId || matchBuyerName || matchBusinessName || matchCity || matchCrop;
    });
  }, [orders, activeTab, searchQuery]);

  // Metrics
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter((o) =>
    ['PLACED', 'CONFIRMED', 'PACKED'].includes(o.status)
  ).length;
  const totalRealizedValue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.farmerSubtotal !== undefined ? o.farmerSubtotal : o.total || 0), 0);
  const b2bOrdersCount = orders.filter(
    (o) => o.buyerRole === 'BUSINESS' || o.buyerId?.role === 'BUSINESS'
  ).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return <Badge variant="warning">{t('common.placed')}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">{t('common.confirmed')}</Badge>;
      case 'PACKED':
        return <Badge variant="default">{t('common.packed')}</Badge>;
      case 'ASSIGNED':
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="primary">{t('common.outForDelivery')}</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">{t('common.delivered')}</Badge>;
      case 'CANCELLED':
        return <Badge variant="error">{t('common.cancelled')}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#08241a] text-emerald-300 border border-emerald-500/40 px-5 py-3 rounded-[12px] shadow-lg flex items-center gap-3 animate-fade-in font-medium text-xs sm:text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            {t('farmerOrders.badge')}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            {t('farmerOrders.title')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('farmerOrders.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={fetchFarmerOrders}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('farmerOrders.refreshBtn')}</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            {t('farmerOrders.totalIncoming')}
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2 font-mono">
            {totalOrdersCount}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {t('farmerOrders.allTab')}
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            {t('farmerOrders.pendingFulfillment')}
          </span>
          <div className="font-display font-bold text-3xl text-amber-700 mt-2 font-mono">
            {pendingCount}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {t('farmerOrders.placedTab')} & {t('farmerOrders.packedTab')}
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            {t('farmerOrders.totalGrossValue')}
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2 font-mono">
            ₹{totalRealizedValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-secondary mt-1">
            {t('farmerDashboard.creditedDirectly')}
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            {t('farmerOrders.b2bShare')}
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2 font-mono">
            {b2bOrdersCount}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {b2bOrdersCount > 0
              ? `${Math.round((b2bOrdersCount / (totalOrdersCount || 1)) * 100)}% of total volume`
              : 'Direct Farm Bulk'}
          </p>
        </Card>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-variant pb-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: t('farmerOrders.allTab') },
            { id: 'PLACED', label: t('farmerOrders.placedTab') },
            { id: 'CONFIRMED', label: t('farmerOrders.confirmedTab') },
            { id: 'PACKED', label: t('farmerOrders.packedTab') },
            { id: 'IN_TRANSIT', label: t('farmerOrders.inTransitTab') },
            { id: 'DELIVERED', label: t('farmerOrders.deliveredTab') },
            { id: 'CANCELLED', label: t('farmerOrders.cancelledTab') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-variant/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('farmerOrders.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
      </div>

      {/* Orders List Content */}
      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-44 rounded-[20px]" count={3} />
        </div>
      ) : error ? (
        <ErrorState
          title={t('common.status')}
          message={error}
          onRetry={fetchFarmerOrders}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10 text-secondary" />}
          title={t('farmerOrders.noOrdersTitle')}
          description={t('farmerOrders.noOrdersDesc')}
          action={
            <Link to="/farmer/listings">
              <Button variant="primary" size="md">
                {t('farmerDashboard.marketplaceListings')}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {filteredOrders.map((order) => {
            const isB2B =
              order.buyerRole === 'BUSINESS' ||
              order.buyerId?.role === 'BUSINESS' ||
              Boolean(order.businessProfile);
            const buyerName =
              order.businessProfile?.businessName ||
              order.buyerId?.fullName ||
              order.deliveryAddress?.fullName ||
              'Verified Buyer';
            const contactPerson = order.buyerId?.fullName || order.deliveryAddress?.fullName;
            const contactPhone = order.deliveryAddress?.phone || order.buyerId?.phone;
            const contactEmail = order.buyerId?.email;
            const orderTotal =
              order.farmerSubtotal !== undefined ? order.farmerSubtotal : order.total;

            return (
              <Card key={order._id} className="p-6 flex flex-col gap-6 soil-shadow">
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-surface-variant/60 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-bold text-primary">
                      {order.orderId}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString()} •{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isB2B ? (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{t('farmerOrders.b2bBuyer')}</span>
                      </Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{t('farmerOrders.b2cBuyer')}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Middle Grid: Buyer Details & Destination Address */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface-container-low p-4 rounded-[16px] border border-surface-variant/50">
                  {/* Buyer Identity */}
                  <div className="md:col-span-6 flex flex-col gap-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-secondary font-label-sm">
                      {t('farmerOrders.buyerCol')}
                    </span>
                    <div className="font-display font-bold text-sm text-primary flex items-center gap-2">
                      {buyerName}
                      {order.businessProfile?.gstNumber && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                          {t('farmerOrders.gstinLabel')}: {order.businessProfile.gstNumber}
                        </span>
                      )}
                    </div>
                    {isB2B && contactPerson && contactPerson !== buyerName && (
                      <p className="text-on-surface-variant">
                        👤 Contact: <span className="font-medium text-on-surface">{contactPerson}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-on-surface-variant pt-1">
                      {contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-secondary" />
                          <a href={`tel:${contactPhone}`} className="hover:underline text-primary font-mono font-medium">
                            {contactPhone}
                          </a>
                        </span>
                      )}
                      {contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-secondary" />
                          <a href={`mailto:${contactEmail}`} className="hover:underline text-primary truncate max-w-[180px]">
                            {contactEmail}
                          </a>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery Destination */}
                  <div className="md:col-span-6 flex flex-col gap-1.5 text-xs border-t md:border-t-0 md:border-l border-surface-variant/60 pt-3 md:pt-0 md:pl-6">
                    <span className="text-[10px] uppercase font-bold text-secondary font-label-sm">
                      {t('farmerOrders.deliveryAddressHeading')}
                    </span>
                    <div className="flex items-start gap-1.5 text-on-surface">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-primary">
                          {order.deliveryAddress?.fullName || contactPerson}
                        </p>
                        <p className="text-on-surface-variant">
                          {order.deliveryAddress?.line1}
                          {order.deliveryAddress?.line2 ? `, ${order.deliveryAddress.line2}` : ''}
                        </p>
                        <p className="text-on-surface-variant">
                          {order.deliveryAddress?.city}, {order.deliveryAddress?.state} -{' '}
                          <span className="font-mono font-medium">{order.deliveryAddress?.pincode}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary font-label-sm block mb-2">
                    {t('farmerOrders.orderItemsHeading')}
                  </span>
                  <div className="overflow-x-auto rounded-[12px] border border-surface-variant/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container font-semibold text-on-surface-variant uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">{t('farmerDashboard.cropCol')}</th>
                          <th className="py-2.5 px-3">{t('farmerOrders.batchCodeLabel')}</th>
                          <th className="py-2.5 px-3">{t('farmerOrders.qtyLabel')}</th>
                          <th className="py-2.5 px-3">{t('farmerOrders.unitPriceLabel')}</th>
                          <th className="py-2.5 px-3 text-right">{t('farmerOrders.totalPriceLabel')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-variant/40 bg-white">
                        {order.items?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-low/50">
                            <td className="py-3 px-3 font-medium text-primary">
                              {item.title}
                            </td>
                            <td className="py-3 px-3 font-mono text-on-surface-variant">
                              <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-primary border border-surface-variant/60">
                                {item.batchCode || (typeof item.batchId === 'object' && item.batchId?.batchId) || (item.batchId ? `BATCH-${String(item.batchId).slice(-6).toUpperCase()}` : 'DIRECT-HARVEST')}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-on-surface font-mono">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 px-3 font-mono text-on-surface-variant">
                              ₹{item.unitPrice} / {item.unit}
                            </td>
                            <td className="py-3 px-3 text-right font-display font-bold text-primary font-mono text-sm">
                              ₹{item.lineTotal?.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Footer & Action Controls */}
                <div className="flex flex-col gap-3 pt-4 border-t border-surface-variant/60">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container/40 p-3 rounded-xl border border-surface-variant/60">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant font-medium">Produce Subtotal:</span>
                        <span className="font-mono font-bold text-xs text-primary">₹{order.subtotal?.toLocaleString('en-IN') || orderTotal?.toLocaleString('en-IN')}</span>
                        <span className="text-on-surface-variant/40">•</span>
                        <span className="text-xs text-on-surface-variant font-medium">Delivery ({order.distanceKm || 15} km):</span>
                        <span className="font-mono font-bold text-xs text-primary">₹{order.deliveryFee || 0}</span>
                        <span className="text-on-surface-variant/40">•</span>
                        <span className="text-xs text-on-surface-variant font-medium">GST (5%):</span>
                        <span className="font-mono font-bold text-xs text-primary">₹{order.tax || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-display font-bold text-base text-primary font-mono">
                          Total: ₹{order.total?.toLocaleString('en-IN') || orderTotal?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300 font-mono">
                          40% Advance Paid: ₹{(order.advanceAmount || Math.round((order.total || orderTotal) * 0.40)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-300 font-mono">
                          60% Due: ₹{(order.pendingAmount || ((order.total || orderTotal) - Math.round((order.total || orderTotal) * 0.40))).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Payment Screenshot Proof Preview Status */}
                    {order.paymentProofUrl ? (
                      <div className="flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/30 p-1.5 px-2.5 rounded-xl border border-emerald-500/30">
                        <img
                          src={order.paymentProofUrl}
                          alt="Proof Thumbnail"
                          onClick={() => {
                            setProofPreviewUrl(order.paymentProofUrl);
                            setPreviewingOrder(order);
                          }}
                          className="w-9 h-9 object-cover rounded-lg cursor-pointer border border-emerald-500/40 hover:opacity-80 transition-opacity shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProofPreviewUrl(order.paymentProofUrl);
                            setPreviewingOrder(order);
                          }}
                          className="text-xs text-emerald-800 dark:text-emerald-300 hover:underline font-bold flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>View Proof</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-container border border-surface-variant text-[11px] text-on-surface-variant">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>No Payment Screenshot Attached</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Order Placed: {new Date(order.createdAt).toLocaleString('en-IN')}
                    </span>

                  {/* Status Progression Controls for Farmer */}
                  <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
                    {/* Always visible View Proof button when screenshot exists */}
                    {order.paymentProofUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProofPreviewUrl(order.paymentProofUrl);
                          setPreviewingOrder(order);
                        }}
                        className="flex items-center gap-1.5 text-xs text-primary border-primary/40 hover:bg-primary/10"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                        <span>View Proof</span>
                      </Button>
                    )}

                    {order.status === 'PLACED' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoadingId === order._id}
                          onClick={() => handleUpdateStatus(order._id, 'CONFIRMED')}
                          className="flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{t('farmerOrders.confirmOrderBtn')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoadingId === order._id}
                          onClick={() => setDeclineModalOrder(order)}
                          className="flex items-center gap-1.5 text-error border-error/40 hover:bg-error/10 hover:border-error"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline Order</span>
                        </Button>
                      </div>
                    )}

                    {order.status === 'CANCELLED' && (
                      <div className="flex items-center gap-1.5 text-[11px] text-error font-medium bg-error/10 px-2.5 py-1 rounded-lg border border-error/20">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{order.cancelledReason || 'Order Cancelled'}</span>
                      </div>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoadingId === order._id}
                        onClick={() => handleUpdateStatus(order._id, 'PACKED')}
                        className="flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900 text-white"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>{t('farmerOrders.markPackedBtn')}</span>
                      </Button>
                    )}

                    {order.status === 'PACKED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoadingId === order._id}
                        onClick={() => setDispatchModalOrder(order)}
                        className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t('farmerOrders.dispatchBtn')}</span>
                      </Button>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={actionLoadingId === order._id}
                        onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                        className="flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('farmerOrders.markDeliveredBtn')}</span>
                      </Button>
                    )}

                    {/* View Tracking / Milestones */}
                    <Link to={`/farmer/orders/${order._id}`}>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t('farmerOrders.trackDeliveryBtn')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* Dispatch Confirmation Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 shadow-2xl border border-surface-variant flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
              <div className="flex items-center gap-2 text-primary font-display font-bold text-lg">
                <Truck className="w-5 h-5 text-emerald-700" />
                <span>{t('farmerOrders.dispatchModalTitle')}</span>
              </div>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="text-on-surface-variant hover:text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3 rounded-[12px] bg-surface-container-low border border-surface-variant/50">
                <span className="font-mono font-bold text-primary block">
                  {dispatchModalOrder.orderId}
                </span>
                <p className="text-on-surface-variant mt-0.5">
                  Destination: {dispatchModalOrder.deliveryAddress?.city},{' '}
                  {dispatchModalOrder.deliveryAddress?.state} (
                  {dispatchModalOrder.deliveryAddress?.pincode})
                </p>
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">
                  {t('farmerOrders.dispatchLocationLabel')}
                </label>
                <input
                  type="text"
                  value={dispatchLocation}
                  onChange={(e) => setDispatchLocation(e.target.value)}
                  placeholder="e.g. Sahyadri Farm Gate Dispatch Point / Pune Cold Hub"
                  className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">
                  {t('farmerOrders.dispatchNoteLabel')}
                </label>
                <textarea
                  rows={2}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="e.g. Dispatched via temperature-controlled transport. Direct transit to buyer."
                  className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-variant/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDispatchModalOrder(null)}
              >
                {t('farmerOrders.cancelBtn')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoadingId === dispatchModalOrder._id}
                onClick={() =>
                  handleUpdateStatus(
                    dispatchModalOrder._id,
                    'OUT_FOR_DELIVERY',
                    dispatchLocation,
                    dispatchNote
                  )
                }
                className="bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                {t('farmerOrders.confirmDispatchBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Proof Screenshot Fullscreen Preview Modal */}
      {proofPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-5 border border-surface-variant flex flex-col gap-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
              <span className="font-display font-bold text-sm text-primary flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-secondary" />
                <span>Buyer 40% Advance Payment Proof Screenshot</span>
              </span>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black/90 flex items-center justify-center max-h-[70vh]">
              <img
                src={proofPreviewUrl}
                alt="Payment Proof Full"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs pt-1 border-t border-surface-variant/60">
              <a
                href={proofPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Open Original Image</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {previewingOrder && previewingOrder.status === 'PLACED' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const targetId = previewingOrder._id;
                        setProofPreviewUrl(null);
                        setPreviewingOrder(null);
                        handleUpdateStatus(targetId, 'CONFIRMED');
                      }}
                      className="flex items-center gap-1 text-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verify & Accept</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const target = previewingOrder;
                        setProofPreviewUrl(null);
                        setPreviewingOrder(null);
                        setDeclineModalOrder(target);
                      }}
                      className="flex items-center gap-1 text-xs text-error border-error/40 hover:bg-error/10"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProofPreviewUrl(null);
                    setPreviewingOrder(null);
                  }}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Farmer Decline / Reject Order Modal */}
      {declineModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 border border-surface-variant flex flex-col gap-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
              <div className="flex items-center gap-2 text-error font-display font-bold text-base sm:text-lg">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Decline Order #{declineModalOrder.orderId}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeclineModalOrder(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error">
              <p className="font-semibold mb-0.5">Fake or unverified payment protection</p>
              <p className="text-[11px] leading-relaxed text-on-surface-variant">
                Declining this order will mark payment as rejected and immediately release reserved stock back to your available inventory.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <label className="font-bold text-primary block">Select Decline Reason:</label>
              {[
                'Payment screenshot is fake / altered',
                'Advance payment was not received in UPI/bank account',
                'Unreadable / blurry proof screenshot',
                'Produce stock unavailable or compromised',
                'OTHER',
              ].map((reasonKey) => (
                <label
                  key={reasonKey}
                  className="flex items-center gap-2 p-2 rounded-lg border border-surface-variant/60 hover:bg-surface-container/50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="declineReason"
                    value={reasonKey}
                    checked={declineReason === reasonKey}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-primary">
                    {reasonKey === 'OTHER' ? 'Type custom reason...' : reasonKey}
                  </span>
                </label>
              ))}

              {declineReason === 'OTHER' && (
                <textarea
                  required
                  rows={2}
                  value={customDeclineText}
                  onChange={(e) => setCustomDeclineText(e.target.value)}
                  placeholder="Type specific reason for declining this order..."
                  className="w-full p-2.5 text-xs rounded-xl border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-error"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeclineModalOrder(null)}
                disabled={declining}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={declining}
                disabled={declining || (declineReason === 'OTHER' && !customDeclineText.trim())}
                onClick={handleDeclineOrder}
                className="bg-error hover:bg-error/90 text-white flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Decline</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerOrdersPage;
