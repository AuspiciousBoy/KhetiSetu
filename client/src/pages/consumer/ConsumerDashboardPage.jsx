import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, FileText } from 'lucide-react';
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

  useEffect(() => {
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

    fetchOrders();
  }, []);

  return (
    <div className="flex flex-col gap-8">
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
            <Card key={order._id} className="p-6 flex flex-col gap-4">
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

                <div className="flex items-center gap-3">
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

              {/* Order Footer & Total */}
              <div className="pt-3 border-t border-surface-variant/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant">{t('consumerDashboard.grandTotal')} </span>
                  <span className="font-display font-bold text-lg text-primary">
                    ₹{order.total}
                  </span>
                  <span className="text-[10px] text-on-surface-variant ml-1">
                    {t('consumerDashboard.freightTaxNote', { fee: order.deliveryFee })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
