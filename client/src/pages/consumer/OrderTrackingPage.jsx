import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const OrderTrackingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine the correct back link based on user role
  const ordersBackLink = user?.role === 'BUSINESS' ? '/business/orders'
    : user?.role === 'FARMER' ? '/farmer/orders'
    : '/consumer/orders';

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        console.error('Failed to load order', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const milestones = [
    { key: 'PLACED', label: t('orderTracking.milestones.placed'), desc: t('orderTracking.milestones.placedDesc') },
    { key: 'CONFIRMED', label: t('orderTracking.milestones.confirmed'), desc: t('orderTracking.milestones.confirmedDesc') },
    { key: 'PACKED', label: t('orderTracking.milestones.packed'), desc: t('orderTracking.milestones.packedDesc') },
    { key: 'ASSIGNED', label: t('orderTracking.milestones.assigned'), desc: t('orderTracking.milestones.assignedDesc') },
    { key: 'OUT_FOR_DELIVERY', label: t('orderTracking.milestones.inTransit'), desc: t('orderTracking.milestones.inTransitDesc') },
    { key: 'DELIVERED', label: t('orderTracking.milestones.delivered'), desc: t('orderTracking.milestones.deliveredDesc') },
  ];

  const currentStatusIndex = milestones.findIndex((m) => m.key === order?.status);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <Skeleton className="h-64 rounded-[24px]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-sm text-on-surface-variant">{t('orderTracking.detailsUnavailable')}</p>
        <Link to={ordersBackLink} className="text-xs text-primary font-bold underline mt-2 block">
          {t('orderTracking.returnToOrders')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <Link to={ordersBackLink} className="text-xs text-secondary font-semibold hover:underline mb-2 inline-block">
          {t('orderTracking.backToOrders')}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-2xl text-primary">
            {t('orderTracking.deliveryTracking', { orderId: order.orderId })}
          </h1>
          <Badge variant="success">{order.status.replace(/_/g, ' ')}</Badge>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          {t('orderTracking.fulfilledFrom', {
            grower: order.farmerId?.fullName,
            city: order.deliveryAddress?.city,
            state: order.deliveryAddress?.state,
          })}
        </p>
      </div>

      {/* Chronological Timeline Card */}
      <Card className="p-8">
        <h3 className="font-display font-semibold text-lg text-primary mb-6 pb-3 border-b border-surface-variant/60">
          {t('orderTracking.progressionTitle')}
        </h3>

        <div className="relative pl-6 flex flex-col gap-8">
          <div className="absolute left-[33px] top-3 bottom-3 w-[2px] bg-surface-variant" />

          {milestones.map((m, idx) => {
            const isCompleted = idx <= currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;

            return (
              <div key={m.key} className="relative flex items-start gap-5">
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-primary ring-4 ring-primary/20'
                      : isCompleted
                      ? 'bg-primary'
                      : 'bg-surface-variant'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCompleted ? 'bg-white' : 'bg-surface-container'
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <span
                    className={`text-sm font-display font-semibold block ${
                      isCompleted ? 'text-primary' : 'text-on-surface-variant/70'
                    }`}
                  >
                    {m.label}
                  </span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">
                    {m.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Destination & Order Items Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-6">
          <span className="text-[10px] uppercase font-bold text-secondary block mb-2">
            {t('orderTracking.deliveryDestination')}
          </span>
          <p className="text-xs font-semibold text-primary">{order.deliveryAddress?.fullName}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{order.deliveryAddress?.line1}</p>
          <p className="text-xs text-on-surface-variant">
            {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">📞 {order.deliveryAddress?.phone}</p>
        </Card>

        <Card className="p-6">
          <span className="text-[10px] uppercase font-bold text-secondary block mb-2">
            {t('orderTracking.orderFulfillment')}
          </span>
          <p className="text-xs text-on-surface-variant">
            {t('orderTracking.fulfillmentMode')} <span className="font-semibold text-primary">{t('orderTracking.directFarmBooking')}</span>
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {t('orderTracking.dispatchStatus')} <span className="font-semibold text-primary">{order.status}</span>
          </p>
          <p className="text-base font-display font-bold text-primary mt-2">
            {t('orderTracking.orderValue')} ₹{order.total}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
