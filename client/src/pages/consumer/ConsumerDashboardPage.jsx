import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, FileText, XCircle, AlertTriangle, AlertCircle, X, CheckCircle, RotateCcw } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton, EmptyState } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';
import InvoiceModal from '../../components/orders/InvoiceModal';

const ConsumerDashboardPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Cancel & Refund Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/orders/my-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to load user orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    if (!cancelReason.trim()) {
      setCancelError('Please type the reason for cancelling this order.');
      return;
    }

    try {
      setSubmittingCancel(true);
      setCancelError(null);
      await apiClient.post(`/orders/${cancellingOrder._id}/cancel`, {
        reason: cancelReason.trim(),
      });

      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === cancellingOrder._id
            ? {
                ...ord,
                status: 'CANCELLED',
                refundStatus: 'REFUND_REQUESTED',
                cancelledReason: cancelReason.trim(),
                cancelledBy: 'BUYER',
              }
            : ord
        )
      );

      showToast(`Order #${cancellingOrder.orderId} cancelled and refund requested successfully.`);
      setCancellingOrder(null);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel order', err);
      setCancelError(err.response?.data?.error?.message || 'Failed to cancel order.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleRequestRefund = async (orderId) => {
    try {
      await apiClient.post(`/orders/${orderId}/request-refund`);
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId
            ? { ...ord, refundStatus: 'REFUND_REQUESTED', refundRequestedAt: new Date() }
            : ord
        )
      );
      showToast('Advance payment refund request recorded successfully.');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit refund request.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-primary text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
          {t('consumerDashboard.portalBadge')}
        </span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
          {t('consumerDashboard.pageTitle')}
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {t('consumerDashboard.pageSubtitle')}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-[24px]" count={3} />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="shopping_basket"
          title={t('consumerDashboard.noOrdersTitle')}
          description={t('consumerDashboard.noOrdersDesc')}
          action={
            <Link to="/marketplace">
              <Button variant="primary" size="md">
                {t('consumerDashboard.browseMarketplace')}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <Card key={order._id} className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-surface-variant/60 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">
                    {t('consumerDashboard.orderNumber', { orderId: order.orderId })}
                  </span>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {t('consumerDashboard.placedBy', {
                      date: new Date(order.createdAt).toLocaleDateString(),
                      grower: order.farmerId?.fullName || 'Sahyadri Organic Farm',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {order.refundStatus === 'REFUND_REQUESTED' && (
                    <Badge variant="warning">Refund Requested</Badge>
                  )}
                  <Badge
                    variant={
                      order.status === 'DELIVERED'
                        ? 'success'
                        : order.status === 'CANCELLED'
                        ? 'error'
                        : 'warning'
                    }
                  >
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {/* Order Items */}
              <div className="flex flex-col gap-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-primary">
                      {item.title} × {item.quantity} {item.unit}
                    </span>
                    <span className="font-semibold text-on-surface">
                      ₹{item.lineTotal}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cancellation Reason & Refund Notice */}
              {order.status === 'CANCELLED' && (
                <div className="text-xs text-on-surface-variant bg-surface-container/60 p-3.5 rounded-xl border border-surface-variant/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-error font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Order Cancelled</span>
                    </div>

                    {order.refundStatus === 'REFUND_PROCESSED' || order.paymentStatus === 'REFUNDED' ? (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Refund Processed (₹{(order.advanceAmount || Math.round((order.total || 0) * 0.40)).toLocaleString('en-IN')})</span>
                      </div>
                    ) : order.refundStatus === 'REFUND_REQUESTED' ? (
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-300">
                        Refund Processing (₹{(order.advanceAmount || Math.round((order.total || 0) * 0.40)).toLocaleString('en-IN')})
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRequestRefund(order._id)}
                        className="flex items-center gap-1 text-xs py-1 px-2.5 bg-amber-700 hover:bg-amber-800 text-white"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Request Refund</span>
                      </Button>
                    )}
                  </div>

                  {order.cancelledReason && (
                    <p className="text-[11px] text-on-surface italic">
                      Reason: "{order.cancelledReason}"
                    </p>
                  )}
                </div>
              )}

              {/* Order Footer & Total */}
              <div className="pt-3 border-t border-surface-variant/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-on-surface-variant">{t('consumerDashboard.grandTotal')} </span>
                  <span className="font-display font-bold text-lg text-primary">
                    ₹{order.total}
                  </span>
                  <span className="text-[10px] text-on-surface-variant ml-1">
                    {t('consumerDashboard.freightTaxNote', { fee: order.deliveryFee })}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {['PLACED', 'CONFIRMED'].includes(order.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCancellingOrder(order);
                        setCancelReason('');
                        setCancelError(null);
                      }}
                      className="flex items-center gap-1.5 text-xs py-1 text-error border-error/30 hover:bg-error/10 hover:border-error"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel & Refund</span>
                    </Button>
                  )}

                  {order.status === 'CANCELLED' && order.refundStatus === 'NONE' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRequestRefund(order._id)}
                      className="flex items-center gap-1.5 text-xs py-1 bg-amber-700 hover:bg-amber-800 text-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request Refund</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="flex items-center gap-1.5 text-xs py-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>View Invoice</span>
                  </Button>

                  {order.deliveryId && (
                    <Link to={`/consumer/orders/${order._id}`}>
                      <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t('consumerDashboard.trackMilestones')}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Order & Request Refund Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl max-w-md w-full p-4 sm:p-6 border border-surface-variant shadow-2xl flex flex-col gap-4 relative my-auto">
            <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
              <div className="flex items-center gap-2 text-primary font-display font-bold text-sm sm:text-lg">
                <AlertTriangle className="w-5 h-5 text-error shrink-0" />
                <span>Cancel Order & Refund</span>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex flex-col gap-1">
              <p className="font-semibold">Order #{cancellingOrder.orderId}</p>
              <p className="text-[11px] text-on-surface-variant">
                You are requesting cancellation for this direct farm consignment. The 40% advance payment will be flagged for refund.
              </p>
            </div>

            {cancelError && (
              <div className="p-2.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Type Reason for Cancellation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Changed delivery address, ordered duplicate items, delivery date delayed, etc."
                  className="w-full p-3 rounded-xl border border-surface-variant bg-surface text-on-surface text-xs focus:outline-none focus:border-error"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancellingOrder(null)}
                  disabled={submittingCancel}
                >
                  Keep Order
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submittingCancel}
                  disabled={submittingCancel || !cancelReason.trim()}
                  className="bg-error hover:bg-error/90 text-white flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Cancellation & Request Refund</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
};

export default ConsumerDashboardPage;
