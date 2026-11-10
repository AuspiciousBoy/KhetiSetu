import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton, EmptyState } from '../../components/ui/Skeleton';

const ConsumerDashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
          Consumer Portal
        </span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
          My Farm-Direct Orders
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Track harvest dispatches, cold-chain delivery milestones, and batch quality
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-[24px]" count={3} />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="shopping_basket"
          title="No orders placed yet"
          description="Browse direct farm listings on the marketplace to purchase seasonal harvest lots."
          action={
            <Link to="/marketplace">
              <Button variant="primary" size="md">
                Browse Marketplace
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
                    Order #{order.orderId}
                  </span>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} • Fulfilled by {order.farmerId?.fullName || 'Sahyadri Organic Farm'}
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
                  <span className="text-xs text-on-surface-variant">Grand Total: </span>
                  <span className="font-display font-bold text-lg text-primary">
                    ₹{order.total}
                  </span>
                  <span className="text-[10px] text-on-surface-variant ml-1">
                    (incl. ₹{order.deliveryFee} freight & tax)
                  </span>
                </div>

                {order.deliveryId && (
                  <Link to={`/consumer/orders/${order._id}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Delivery Milestones</span>
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsumerDashboardPage;
