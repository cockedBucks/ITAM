'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import KPICard from '@/components/ui/KPICard';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  Monitor,
  UserCheck,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type {
  DashboardStats,
  AssetsPerDepartment,
  AttentionAlert,
  AssetStatus,
} from '@/types/database';
import { ASSET_STATUS_AR, ASSET_TYPE_AR, AssetType } from '@/types/database';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<AssetStatus, string> = {
  Assigned: '#3B82F6',
  Available: '#10B981',
  Maintenance: '#F59E0B',
  Missing: '#EF4444',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deptData, setDeptData] = useState<AssetsPerDepartment[]>([]);
  const [alerts, setAlerts] = useState<AttentionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Fetch dashboard stats
        const { data: statsData } = await supabase
          .from('v_dashboard_stats')
          .select('*')
          .single();

        // Fetch assets per department
        const { data: deptDataRes } = await supabase
          .from('v_assets_per_department')
          .select('*');

        // Fetch attention alerts
        const { data: alertsData } = await supabase
          .from('v_attention_alerts')
          .select('*')
          .limit(20);

        if (statsData) setStats(statsData as DashboardStats);
        if (deptDataRes) setDeptData(deptDataRes as AssetsPerDepartment[]);
        if (alertsData) setAlerts(alertsData as AttentionAlert[]);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return <PageLoader />;

  const statusDistribution = stats
    ? [
        { name: ASSET_STATUS_AR.Assigned, value: stats.assigned_count, color: STATUS_COLORS.Assigned },
        { name: ASSET_STATUS_AR.Available, value: stats.available_count, color: STATUS_COLORS.Available },
        { name: ASSET_STATUS_AR.Maintenance, value: stats.maintenance_count, color: STATUS_COLORS.Maintenance },
        { name: ASSET_STATUS_AR.Missing, value: stats.missing_count, color: STATUS_COLORS.Missing },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp size={26} className="text-cyan-glow" />
            لوحة التحكم
          </h1>
          <p className="text-sm text-oasis-400 mt-1">نظرة عامة على أصول واحة الذكاء التقنية</p>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="إجمالي الأجهزة"
          value={stats?.total_assets || 0}
          icon={Monitor}
          color="cyan"
          delay={0}
        />
        <KPICard
          title="مسلّمة"
          value={stats?.assigned_count || 0}
          icon={UserCheck}
          color="blue"
          delay={100}
        />
        <KPICard
          title="متاحة"
          value={stats?.available_count || 0}
          icon={CheckCircle2}
          color="emerald"
          delay={200}
        />
        <KPICard
          title="في الصيانة"
          value={stats?.maintenance_count || 0}
          icon={Wrench}
          color="amber"
          delay={300}
        />
        <KPICard
          title="مفقودة"
          value={stats?.missing_count || 0}
          icon={AlertTriangle}
          color="red"
          delay={400}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets per Department */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-6">الأجهزة حسب القسم</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  dataKey="department_name"
                  type="category"
                  tick={{ fill: '#CBD5E1', fontSize: 12 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#E2E8F0',
                    direction: 'rtl',
                  }}
                  labelStyle={{ color: '#06B6D4', fontWeight: 'bold' }}
                  formatter={(value: unknown) => [`${value} جهاز`, 'العدد']}
                />
                <Bar
                  dataKey="asset_count"
                  fill="url(#barGradient)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={32}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-6">توزيع الحالات</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#E2E8F0',
                    direction: 'rtl',
                  }}
                  formatter={(value: unknown) => [`${value} جهاز`, 'العدد']}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-sm text-oasis-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attention Alerts */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={20} className="text-amber-400" />
          <h2 className="text-lg font-bold text-white">تنبيهات المتابعة</h2>
          <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {alerts.length} تنبيه
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500/30 mb-4" />
            <p className="text-oasis-400">لا توجد تنبيهات حالياً — جميع الأصول بحالة جيدة</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الأصل</th>
                  <th>النوع</th>
                  <th>العلامة التجارية</th>
                  <th>الحالة</th>
                  <th>نوع التنبيه</th>
                  <th>الموظف</th>
                  <th>القسم</th>
                  <th>تاريخ التسليم</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="mono-tag">{alert.asset_tag}</td>
                    <td>{ASSET_TYPE_AR[alert.type as AssetType]}</td>
                    <td>{alert.brand} {alert.model}</td>
                    <td>
                      <StatusBadge status={alert.status} size="sm" />
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          alert.severity === 'danger'
                            ? 'badge-missing'
                            : alert.severity === 'warning'
                            ? 'badge-maintenance'
                            : 'badge-assigned'
                        }`}
                      >
                        {alert.alert_type}
                      </span>
                    </td>
                    <td>{alert.employee_name || '—'}</td>
                    <td>{alert.department_name || '—'}</td>
                    <td className="text-oasis-400 text-xs">
                      {formatDate(alert.date_assigned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
