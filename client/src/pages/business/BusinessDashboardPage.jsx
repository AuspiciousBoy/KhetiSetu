import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const BusinessDashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessOrders = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/orders/my-orders');
        setOrders(res.data.data);
      } catch (err) {
        console.error('Failed to load business procurement', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessOrders();
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            Commercial Procurement
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            Business Buyer Console
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Procure farm-direct truckload lots, schedule cold freight, and trace APMC batch certificates
          </p>
        </div>

        <Link to="/marketplace?type=b2b">
          <Button variant="primary" size="md" className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            <span>Browse Bulk Listings</span>
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            Total Purchase Volume
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2">
            ₹{orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-secondary mt-1">Direct-from-farm procurement</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            Bulk Orders Fulfilled
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2">
            {orders.length}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Traceable commercial consignments</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            Verified Suppliers
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2">
            8 Farms
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Maharashtra & MP grower cooperatives</p>
        </Card>
      </div>

      {/* Bulk Purchase Consignments */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant/60">
          <h3 className="font-display font-semibold text-xl text-primary">
            Recent Bulk Procurement Consignments
          </h3>
          <Badge variant="warning">B2B Wholesale</Badge>
        </div>

        {loading ? (
          <Skeleton className="h-48 rounded-[16px]" />
        ) : orders.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">
            No bulk orders submitted yet. Visit the B2B Wholesale Marketplace to initiate procurement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Fulfilling Grower</th>
                  <th className="py-3 px-4">Produce Lot</th>
                  <th className="py-3 px-4">Consignment Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-surface-container/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{ord.orderId}</td>
                    <td className="py-3.5 px-4 font-medium">{ord.farmerId?.fullName || 'Sahyadri Farm'}</td>
                    <td className="py-3.5 px-4">{ord.items?.[0]?.title}</td>
                    <td className="py-3.5 px-4 font-bold text-primary">₹{ord.total}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="success">{ord.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/consumer/orders/${ord._id}`}>
                        <Button variant="ghost" size="sm">
                          Track Freight
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

export default BusinessDashboardPage;
