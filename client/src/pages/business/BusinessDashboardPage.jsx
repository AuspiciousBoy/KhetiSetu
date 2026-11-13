import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, FileText } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';
import InvoiceModal from '../../components/orders/InvoiceModal';

const BusinessDashboardPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

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
            {t('businessDashboard.commercialProcurement')}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            {t('businessDashboard.buyerConsole')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('businessDashboard.buyerSubtitle')}
          </p>
        </div>

        <Link to="/marketplace?type=b2b">
          <Button variant="primary" size="md" className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            <span>{t('businessDashboard.browseBulkListings')}</span>
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            {t('businessDashboard.totalPurchaseVolume')}
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2">
            ₹{orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-secondary mt-1">{t('businessDashboard.directFarmProcurement')}</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            {t('businessDashboard.bulkOrdersFulfilled')}
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2">
            {orders.length}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">{t('businessDashboard.traceableConsignments')}</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
            {t('businessDashboard.verifiedSuppliers')}
          </span>
          <div className="font-display font-bold text-3xl text-primary mt-2">
            {t('businessDashboard.farmsCount', { count: 8 })}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">{t('businessDashboard.cooperativesNote')}</p>
        </Card>
      </div>

      {/* Bulk Purchase Consignments */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant/60">
          <h3 className="font-display font-semibold text-xl text-primary">
            {t('businessDashboard.recentBulkConsignments')}
          </h3>
          <Badge variant="warning">{t('businessDashboard.b2bWholesaleBadge')}</Badge>
        </div>

        {loading ? (
          <Skeleton className="h-48 rounded-[16px]" />
        ) : orders.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">
            {t('businessDashboard.noBulkOrders')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{t('businessDashboard.orderIdCol')}</th>
                  <th className="py-3 px-4">{t('businessDashboard.growerCol')}</th>
                  <th className="py-3 px-4">{t('businessDashboard.produceLotCol')}</th>
                  <th className="py-3 px-4">{t('businessDashboard.totalCol')}</th>
                  <th className="py-3 px-4">{t('businessDashboard.statusCol')}</th>
                  <th className="py-3 px-4 text-right">{t('businessDashboard.actionCol')}</th>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="flex items-center gap-1 text-xs py-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>Invoice</span>
                        </Button>
                        <Link to={`/business/orders/${ord._id}`}>
                          <Button variant="ghost" size="sm">
                            {t('businessDashboard.trackFreight')}
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
};

export default BusinessDashboardPage;
