'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
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
import InteractiveTechBg from '@/components/ui/InteractiveTechBg';

const STATUS_COLORS: Record<AssetStatus, string> = {
  Assigned: '#3B82F6',
  Available: '#10B981',
  Maintenance: '#F59E0B',
  Missing: '#EF4444',
};

const glowGradients = {
  cyan: 'from-cyan-glow/15 via-transparent to-transparent',
  blue: 'from-blue-500/15 via-transparent to-transparent',
  emerald: 'from-emerald-500/15 via-transparent to-transparent',
  amber: 'from-amber-500/15 via-transparent to-transparent',
  red: 'from-red-500/15 via-transparent to-transparent',
};

const borderGlows = {
  cyan: 'hover:border-cyan-glow/30 hover:shadow-cyan-glow/5',
  blue: 'hover:border-blue-500/30 hover:shadow-blue-500/5',
  emerald: 'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
  amber: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
  red: 'hover:border-red-500/30 hover:shadow-red-500/5',
};

const textColors = {
  cyan: 'text-cyan-glow',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90 } },
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

  const kpis = [
    { title: 'إجمالي الأجهزة', value: stats?.total_assets || 0, icon: Monitor, color: 'cyan' as const },
    { title: 'المسلّمة', value: stats?.assigned_count || 0, icon: UserCheck, color: 'blue' as const },
    { title: 'المتاحة', value: stats?.available_count || 0, icon: CheckCircle2, color: 'emerald' as const },
    { title: 'في الصيانة', value: stats?.maintenance_count || 0, icon: Wrench, color: 'amber' as const },
    { title: 'المفقودة', value: stats?.missing_count || 0, icon: AlertTriangle, color: 'red' as const },
  ];

  return (
    <div className="relative space-y-8 min-h-screen">
      {/* Background canvas */}
      <InteractiveTechBg />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#020617_90%)] pointer-events-none z-1" />

      <div className="relative z-10 space-y-8">
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

        {/* Bento Grid KPIs */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative rounded-2xl bg-transparent p-5 overflow-hidden"
              >
                {/* Ambient glow */}
                <div className={`absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br ${glowGradients[kpi.color]} rounded-full blur-2xl opacity-40`} />

                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-sm text-oasis-400 mb-2">{kpi.title}</p>
                    <p className={`text-4xl font-bold font-mono tracking-tight ${textColors[kpi.color]}`}>
                      {kpi.value.toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-oasis-800/80 border border-oasis-700/50 ${textColors[kpi.color]}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets per Department */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-transparent p-6"
          >
            <h2 className="text-lg font-bold text-white mb-6">الأجهزة حسب القسم</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="horizontal">
                  <XAxis
                    dataKey="department_name"
                    tick={{ fill: '#CBD5E1', fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid #1E293B',
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
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-transparent p-6"
          >
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
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid #1E293B',
                      borderRadius: '12px',
                      color: '#E2E8F0',
                      direction: 'rtl',
                    }}
                    formatter={(value: unknown) => [`${value} جهاز`, 'العدد']}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-oasis-300 mr-2">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Attention Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-transparent p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-amber-400 animate-bounce-soft" />
            <h2 className="text-lg font-bold text-white">تنبيهات المتابعة</h2>
            <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 font-mono">
              {alerts.length} تنبيه
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500/30 mb-4 animate-glow-pulse" />
              <p className="text-oasis-400">لا توجد تنبيهات حالياً — جميع الأصول بحالة جيدة</p>
            </div>
          ) : (
            <div className="table-container border-oasis-800 bg-oasis-950/20">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-oasis-800">
                    <th className="py-4">رقم الأصل</th>
                    <th className="py-4">النوع</th>
                    <th className="py-4">العلامة التجارية</th>
                    <th className="py-4">الحالة</th>
                    <th className="py-4">نوع التنبيه</th>
                    <th className="py-4">الموظف</th>
                    <th className="py-4">القسم</th>
                    <th className="py-4">تاريخ التسليم</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-oasis-800/40 hover:bg-oasis-800/20 transition-colors">
                      <td className="mono-tag font-semibold font-mono py-4">{alert.asset_tag}</td>
                      <td>{ASSET_TYPE_AR[alert.type as AssetType]}</td>
                      <td>{alert.brand} {alert.model}</td>
                      <td>
                        <StatusBadge status={alert.status} size="sm" />
                      </td>
                      <td>
                        <span
                          className={`badge ${alert.severity === 'danger'
                              ? 'badge-missing'
                              : alert.severity === 'warning'
                                ? 'badge-maintenance'
                                : 'badge-assigned'
                            } font-medium`}
                        >
                          {alert.alert_type}
                        </span>
                      </td>
                      <td>{alert.employee_name || '—'}</td>
                      <td>{alert.department_name || '—'}</td>
                      <td className="text-oasis-400 text-xs font-mono">
                        {formatDate(alert.date_assigned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
