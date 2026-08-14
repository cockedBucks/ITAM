'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  History,
  ArrowLeftRight,
  UserCheck,
  RotateCcw,
  Wrench,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { AuditLog, AssetStatus } from '@/types/database';
import { formatDateTime, timeAgo } from '@/lib/utils';

const actionIcons: Record<string, typeof ArrowLeftRight> = {
  'تسليم جهاز': UserCheck,
  'إرجاع جهاز': RotateCcw,
  'نقل للصيانة': Wrench,
  'إبلاغ عن فقدان': AlertTriangle,
  'نقل جهاز بين موظفين': ArrowLeftRight,
  'إلغاء تسليم': RotateCcw,
  'تغيير حالة': RefreshCw,
};

const actionColors: Record<string, string> = {
  'تسليم جهاز': 'text-blue-400 bg-blue-500/10',
  'إرجاع جهاز': 'text-emerald-400 bg-emerald-500/10',
  'نقل للصيانة': 'text-amber-400 bg-amber-500/10',
  'إبلاغ عن فقدان': 'text-red-400 bg-red-500/10',
  'نقل جهاز بين موظفين': 'text-purple-400 bg-purple-500/10',
  'إلغاء تسليم': 'text-oasis-400 bg-oasis-700',
  'تغيير حالة': 'text-cyan-glow bg-cyan-glow/10',
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  const filteredLogs = logs.filter((log) => {
    const assetTag = (log.asset as any)?.asset_tag || '';
    const assetInfo = `${(log.asset as any)?.brand || ''} ${(log.asset as any)?.model || ''}`;
    const oldEmp = (log.old_employee as any)?.name || '';
    const newEmp = (log.new_employee as any)?.name || '';
    const note = log.note || '';
    const action = log.action || '';

    const query = searchQuery.toLowerCase();
    return (
      assetTag.toLowerCase().includes(query) ||
      assetInfo.toLowerCase().includes(query) ||
      oldEmp.toLowerCase().includes(query) ||
      newEmp.toLowerCase().includes(query) ||
      note.toLowerCase().includes(query) ||
      action.toLowerCase().includes(query)
    );
  });

  const loadLogs = async () => {
    let query = supabase
      .from('audit_logs')
      .select(
        '*, asset:assets(asset_tag, type, brand, model), old_employee:employees!audit_logs_old_employee_id_fkey(name), new_employee:employees!audit_logs_new_employee_id_fkey(name)'
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterAction) {
      query = query.eq('action', filterAction);
    }

    const { data } = await query;
    if (data) setLogs(data as AuditLog[]);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();

    // Real-time subscription
    const channel = supabase
      .channel('audit-log-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterAction]);

  if (loading) return <PageLoader />;

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <History size={26} className="text-cyan-glow" />
            سجل الحركة
          </h1>
          <p className="text-sm text-oasis-400 mt-1">
            تتبع جميع عمليات التسليم والإرجاع والتغييرات
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pr-4 pl-10 text-right w-full"
              dir="rtl"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-oasis-500 pointer-events-none" />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="select-field w-full sm:w-auto"
          >
            <option value="">جميع الحركات</option>
            {Object.keys(actionIcons).map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <button onClick={() => loadLogs()} className="btn-secondary shrink-0 w-full sm:w-auto">
            <RefreshCw size={16} />
            تحديث
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock size={48} className="mx-auto text-oasis-700 mb-4" />
            <p className="text-oasis-400">لا توجد سجلات حركة مطابقة</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const Icon = actionIcons[log.action] || RefreshCw;
            const color = actionColors[log.action] || 'text-oasis-400 bg-oasis-700';

            return (
              <div
                key={log.id}
                className="card p-4 hover:border-oasis-700 transition-colors animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Action Icon */}
                  <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">
                        {log.action}
                      </span>
                      {log.asset && (
                        <span className="mono-tag">
                          {(log.asset as any).asset_tag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                      {/* Status Change */}
                      {log.old_status && log.new_status && log.old_status !== log.new_status && (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={log.old_status} size="sm" />
                          <ArrowLeftRight size={12} className="text-oasis-500" />
                          <StatusBadge status={log.new_status} size="sm" />
                        </div>
                      )}

                      {/* Employee Info */}
                      {log.new_employee && (
                        <span className="text-oasis-400">
                          ← <span className="text-oasis-200">{(log.new_employee as any).name}</span>
                        </span>
                      )}
                      {log.old_employee && log.new_employee && (
                        <span className="text-oasis-500">
                          (من: {(log.old_employee as any).name})
                        </span>
                      )}
                    </div>

                    {/* Note */}
                    {log.note && (
                      <p className="text-xs text-oasis-500 mt-1.5">
                        {log.note}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-left shrink-0">
                    <p className="text-xs text-oasis-500">
                      {timeAgo(log.created_at)}
                    </p>
                    <p className="text-[10px] text-oasis-600 mt-0.5">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
