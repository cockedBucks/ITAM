'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  UserCheck,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Layers,
  PieChart as PieIcon,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
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
  AreaChart,
  Area,
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
  Assigned: '#38bdf8',   // Sky Blue
  Available: '#34d399',  // Emerald
  Maintenance: '#fbbf24',// Amber
  Missing: '#fb7185',    // Rose
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
};

// Apple-style Glass Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#070d18]/95 backdrop-blur-2xl border border-cyan-500/30 p-3 rounded-2xl shadow-2xl text-right">
        {label && <p className="text-xs font-bold text-cyan-400 mb-1">{label}</p>}
        <div className="flex items-center justify-between gap-3 text-xs font-mono text-white">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: payload[0].color || '#22d3ee' }} />
            {payload[0].name || 'العدد'}:
          </span>
          <span className="font-bold text-cyan-300">{payload[0].value} جهاز</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deptData, setDeptData] = useState<AssetsPerDepartment[]>([]);
  const [alerts, setAlerts] = useState<AttentionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: statsData } = await supabase
          .from('v_dashboard_stats')
          .select('*')
          .single();

        const { data: deptDataRes } = await supabase
          .from('v_assets_per_department')
          .select('*');

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

  const totalAssets = stats?.total_assets || 1;

  const statusDistribution = stats
    ? [
        { name: ASSET_STATUS_AR.Assigned, value: stats.assigned_count, color: STATUS_COLORS.Assigned },
        { name: ASSET_STATUS_AR.Available, value: stats.available_count, color: STATUS_COLORS.Available },
        { name: ASSET_STATUS_AR.Maintenance, value: stats.maintenance_count, color: STATUS_COLORS.Maintenance },
        { name: ASSET_STATUS_AR.Missing, value: stats.missing_count, color: STATUS_COLORS.Missing },
      ]
    : [];

  const kpis = [
    {
      title: 'إجمالي الأجهزة',
      value: stats?.total_assets || 0,
      percentage: 100,
      icon: Monitor,
      color: '#38bdf8',
      bgGlow: 'from-cyan-500/20 to-blue-600/5',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'الأجهزة المسلّمة',
      value: stats?.assigned_count || 0,
      percentage: Math.round(((stats?.assigned_count || 0) / totalAssets) * 100),
      icon: UserCheck,
      color: '#60a5fa',
      bgGlow: 'from-blue-500/20 to-indigo-600/5',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'المتاحة بالمخزن',
      value: stats?.available_count || 0,
      percentage: Math.round(((stats?.available_count || 0) / totalAssets) * 100),
      icon: CheckCircle2,
      color: '#34d399',
      bgGlow: 'from-emerald-500/20 to-teal-600/5',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'في ورشة الصيانة',
      value: stats?.maintenance_count || 0,
      percentage: Math.round(((stats?.maintenance_count || 0) / totalAssets) * 100),
      icon: Wrench,
      color: '#fbbf24',
      bgGlow: 'from-amber-500/20 to-orange-600/5',
      borderColor: 'border-amber-500/30',
    },
    {
      title: 'بلاغات المفقودات',
      value: stats?.missing_count || 0,
      percentage: Math.round(((stats?.missing_count || 0) / totalAssets) * 100),
      icon: AlertTriangle,
      color: '#fb7185',
      bgGlow: 'from-rose-500/20 to-pink-600/5',
      borderColor: 'border-rose-500/30',
    },
  ];

  return (
    <div className="relative space-y-8 min-h-screen pb-12 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-wide flex items-center gap-3">
            لوحة التحكم الرئيسية
          </h1>
          <p className="text-xs text-oasis-400 mt-1">
            متابعة فورية وتحليلات شاملة لأصول البنية التحتية لشركة واحة الذكاء
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#090d16]/80 backdrop-blur-xl border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <Sparkles size={14} className="animate-spin-slow text-cyan-400" />
            <span>نظام ITAM</span>
          </div>
        </div>
      </div>

      {/* ═══ Bento Grid Apple KPIs ═══ */}
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
              whileHover={{ scale: 1.03, y: -4 }}
              className={`relative rounded-3xl bg-[#090d16]/70 backdrop-blur-2xl border ${kpi.borderColor} p-5 overflow-hidden shadow-xl transition-all duration-300 group`}
            >
              {/* Ambient Glass Glow */}
              <div className={`absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br ${kpi.bgGlow} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-oasis-400">{kpi.title}</span>
                  <div
                    className="p-2.5 rounded-2xl backdrop-blur-md border border-white/10 transition-transform group-hover:rotate-12"
                    style={{ background: `${kpi.color}15`, color: kpi.color }}
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-3xl font-black font-mono tracking-tight text-white">
                      {kpi.value.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-[10px] font-mono text-oasis-400">
                      {kpi.percentage}%
                    </span>
                  </div>

                  {/* Progress Meter Bar */}
                  <div className="w-full h-1.5 rounded-full bg-oasis-900 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, kpi.percentage)}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: kpi.color }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ Apple Glass Charts Section ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Assets per Department (Bar Chart - 7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-7 rounded-3xl bg-[#090d16]/70 backdrop-blur-2xl border border-cyan-500/20 p-6 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-cyan-400" />
                توزيع الأجهزة حسب الأقسام
              </h2>
              <p className="text-xs text-oasis-400 mt-0.5">إجمالي الأصول الموزعة بين الإدارات</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              {deptData.length} أقسام
            </span>
          </div>

          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredBarIndex(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="department_name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: 'rgba(34, 211, 238, 0.05)', radius: 12 }}
                />
                <Bar
                  dataKey="asset_count"
                  name="الأصول"
                  radius={[10, 10, 3, 3]}
                  maxBarSize={38}
                  animationDuration={1000}
                >
                  {deptData.map((entry, index) => {
                    const isHovered = hoveredBarIndex === index || String(hoveredBarIndex) === String(index);
                    const isAnyHovered = hoveredBarIndex !== null;
                    return (
                      <Cell
                        key={`bar-cell-${index}`}
                        fill={isHovered ? 'url(#barGradientHover)' : 'url(#barGradient)'}
                        opacity={isAnyHovered ? (isHovered ? 1 : 0.35) : 1}
                        style={{
                          filter: isHovered
                            ? 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.9))'
                            : 'none',
                          transition: 'all 0.25s ease-in-out',
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution (Pie Donut Chart - 5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-5 rounded-3xl bg-[#090d16]/70 backdrop-blur-2xl border border-cyan-500/20 p-6 shadow-2xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon size={18} className="text-cyan-400" />
                نسب حالات الأصول
              </h2>
              <p className="text-xs text-oasis-400 mt-0.5">التصنيف التشغيلي الشامل</p>
            </div>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="relative h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1000}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter: activeIndex === index ? `drop-shadow(0 0 12px ${entry.color})` : undefined,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-mono text-white">
                {totalAssets}
              </span>
              <span className="text-[10px] text-oasis-400 font-medium">إجمالي الأصول</span>
            </div>
          </div>

          {/* Legend Pills */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5">
            {statusDistribution.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-oasis-300 font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══ Attention Alerts Apple Table ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-3xl bg-[#090d16]/70 backdrop-blur-2xl border border-cyan-500/20 p-6 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">تنبيهات المتابعة العاجلة</h2>
              <p className="text-xs text-oasis-400 mt-0.5">الأصول التي تتطلب اتخاذ إجراء فوري</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
            {alerts.length} تنبيه نشط
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck size={48} className="mx-auto text-emerald-400/40 mb-3 animate-pulse" />
            <p className="text-sm text-oasis-300 font-medium">جميع الأصول في حالة جيدة مستقرة — لا توجد تنبيهات</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-oasis-400 font-semibold">
                  <th className="p-3.5">رقم الأصل</th>
                  <th className="p-3.5">النوع</th>
                  <th className="p-3.5">العلامة والتسلسل</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">نوع التنبيه</th>
                  <th className="p-3.5">الموظف المسؤول</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alerts.map((alert, i) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-cyan-500/5 transition-colors duration-150"
                  >
                    <td className="p-3.5 font-mono font-bold text-cyan-300">{alert.asset_tag}</td>
                    <td className="p-3.5 text-oasis-200">{ASSET_TYPE_AR[alert.type as AssetType]}</td>
                    <td className="p-3.5 text-oasis-300">{alert.brand} {alert.model}</td>
                    <td className="p-3.5">
                      <StatusBadge status={alert.status} size="sm" />
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
                          alert.severity === 'danger'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : alert.severity === 'warning'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {alert.alert_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-oasis-200">{alert.employee_name || '—'}</td>
                    <td className="p-3.5 text-oasis-300">{alert.department_name || '—'}</td>
                    <td className="p-3.5 font-mono text-oasis-500 text-[11px]">
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
  );
}
