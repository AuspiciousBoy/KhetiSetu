import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overviewRes, usersRes, logsRes] = await Promise.all([
        apiClient.get('/admin/overview'),
        apiClient.get('/admin/users?limit=15'),
        apiClient.get('/admin/audit-logs?limit=20'),
      ]);

      setOverview(overviewRes.data.data);
      setUsers(usersRes.data.data);
      setAuditLogs(logsRes.data.data);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, {
        isActive: !currentStatus,
      });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-28 rounded-[24px]" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            {t('adminDashboard.controlPlane')}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            {t('adminDashboard.operationsSecurity')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('adminDashboard.adminSubtitle')}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-surface-container rounded-full p-1 border border-surface-variant text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            {t('adminDashboard.tabOverview')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'users'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            {t('adminDashboard.tabUsers')}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'audit'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            {t('adminDashboard.tabAudit')}
          </button>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
                {t('adminDashboard.registeredUsers')}
              </span>
              <div className="font-display font-bold text-3xl text-primary mt-2">
                {overview?.metrics?.totalUsers}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {t('adminDashboard.usersBreakdown', {
                  farmers: overview?.metrics?.totalFarmers,
                  businesses: overview?.metrics?.totalBusinesses,
                })}
              </p>
            </Card>

            <Card>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
                {t('adminDashboard.activeProducts')}
              </span>
              <div className="font-display font-bold text-3xl text-primary mt-2">
                {overview?.metrics?.totalActiveProducts}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {t('adminDashboard.batchesTracked', { count: overview?.metrics?.totalBatchesTracked })}
              </p>
            </Card>

            <Card>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
                {t('adminDashboard.grossTurnover')}
              </span>
              <div className="font-display font-bold text-3xl text-primary mt-2">
                ₹{(overview?.metrics?.totalGrossRevenue || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-secondary mt-1">
                {t('adminDashboard.completedOrders', { count: overview?.metrics?.totalOrders })}
              </p>
            </Card>

            <Card>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-md">
                {t('adminDashboard.aiConsultations')}
              </span>
              <div className="font-display font-bold text-3xl text-primary mt-2">
                {overview?.metrics?.aiConsultationsCount}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                {t('adminDashboard.multilingualConversations')}
              </p>
            </Card>
          </div>

          {/* System Health Status Banner */}
          <Card className="p-6 bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-4 border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-primary text-sm">
                  {t('adminDashboard.systemHealth', { status: overview?.systemHealth?.databaseStatus })}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {t('adminDashboard.envInfo', {
                    env: overview?.systemHealth?.nodeEnvironment,
                    heap: overview?.systemHealth?.memoryUsageMb,
                    uptime: Math.round((overview?.systemHealth?.serverUptimeSeconds || 0) / 60),
                  })}
                </p>
              </div>
            </div>
            <Badge variant="success">{t('adminDashboard.allSystemsNominal')}</Badge>
          </Card>
        </div>
      )}

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <Card className="p-8">
          <h3 className="font-display font-semibold text-xl text-primary mb-6 pb-4 border-b border-surface-variant/60">
            {t('adminDashboard.usersGovernance')}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{t('adminDashboard.userCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.roleCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.verifiedCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.statusCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.createdDateCol')}</th>
                  <th className="py-3 px-4 text-right">{t('adminDashboard.actionCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container/50">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-primary block">{u.fullName}</span>
                      <span className="text-[11px] text-on-surface-variant">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="warning">{u.role}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isEmailVerified ? (
                        <span className="text-primary font-semibold">{t('adminDashboard.verifiedBadge')}</span>
                      ) : (
                        <span className="text-on-surface-variant">{t('adminDashboard.pendingBadge')}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.isActive ? 'success' : 'error'}>
                        {u.isActive ? 'ACTIVE' : 'LOCKED'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant={u.isActive ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                        >
                          {u.isActive ? t('adminDashboard.lockAccount') : t('adminDashboard.unlockAccount')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Security Audit Logs Tab Content */}
      {activeTab === 'audit' && (
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant/60">
            <div>
              <h3 className="font-display font-semibold text-xl text-primary">
                {t('adminDashboard.auditTrailTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t('adminDashboard.auditTrailSubtitle')}
              </p>
            </div>
            <Badge variant="primary">{t('adminDashboard.nonRepudiationBadge')}</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-surface-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{t('adminDashboard.timestampCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.actionCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.actorCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.resourceCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.resultCol')}</th>
                  <th className="py-3 px-4">{t('adminDashboard.requestIdCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-container/50">
                    <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()} {new Date(log.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-on-surface">
                      {log.actorEmail || 'System / Anonymous'}
                    </td>
                    <td className="py-3 px-4 text-secondary">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.result === 'SUCCESS'
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : log.result === 'BLOCKED'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant/70 text-[10px] truncate max-w-xs">
                      {log.requestId || 'n/a'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboardPage;
