'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  GitBranch,
  Building2,
  User,
  Monitor,
  ChevronDown,
  ChevronLeft,
  Laptop,
  Smartphone,
  Tablet,
  Printer,
  Mouse,
  Keyboard,
  MonitorSmartphone,
} from 'lucide-react';
import type { Department, Employee, Asset, AssetType } from '@/types/database';
import { ASSET_TYPE_AR } from '@/types/database';
import { cn } from '@/lib/utils';

const typeIcons: Record<AssetType, typeof Monitor> = {
  Laptop: Laptop,
  Monitor: MonitorSmartphone,
  Keyboard: Keyboard,
  Mouse: Mouse,
  Printer: Printer,
  Phone: Smartphone,
  Tablet: Tablet,
  Other: Monitor,
};

interface TreeData {
  departments: (Department & {
    employees: (Employee & { assets: Asset[] })[];
  })[];
}

function TreeNode({
  label,
  icon: Icon,
  iconColor,
  children,
  defaultOpen = false,
  badge,
  depth = 0,
}: {
  label: string;
  icon: typeof Building2;
  iconColor: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = !!children;

  return (
    <div className={cn('animate-fade-in', depth > 0 && 'border-r-2 border-oasis-800 mr-4')}>
      <button
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200',
          hasChildren && 'hover:bg-oasis-800/50 cursor-pointer',
          !hasChildren && 'cursor-default'
        )}
      >
        {hasChildren && (
          <span className="text-oasis-500 transition-transform duration-200">
            {isOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        <div className={cn('p-1.5 rounded-lg', iconColor)}>
          <Icon size={16} />
        </div>
        <span className="text-sm font-medium text-oasis-200 flex-1">{label}</span>
        {badge}
      </button>
      {isOpen && hasChildren && (
        <div className="pr-6 animate-slide-up">{children}</div>
      )}
    </div>
  );
}

export default function TreePage() {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTree() {
      // Load all departments
      const { data: depts } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      // Load all employees with their assets
      const { data: emps } = await supabase
        .from('employees')
        .select('*, assets(*)')
        .order('name');

      if (depts && emps) {
        const departments = depts.map((dept: any) => ({
          ...dept,
          employees: emps
            .filter((emp: any) => emp.department_id === dept.id)
            .map((emp: any) => ({
              ...emp,
              assets: emp.assets || [],
            })),
        }));
        setTreeData({ departments });
      }
      setLoading(false);
    }
    loadTree();
  }, []);

  if (loading) return <PageLoader />;

  const totalAssets = treeData?.departments.reduce(
    (sum, dept) =>
      sum + dept.employees.reduce((s, emp) => s + emp.assets.length, 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GitBranch size={26} className="text-cyan-glow" />
          العرض الهرمي
        </h1>
        <p className="text-sm text-oasis-400 mt-1">
          هيكل المؤسسة — الأقسام والموظفون والأجهزة
        </p>
      </div>

      {/* Tree */}
      <div className="card p-6">
        {/* Root: Smart Oasis */}
        <TreeNode
          label="Smart Oasis — واحة الذكاء"
          icon={Building2}
          iconColor="bg-gradient-to-bl from-cyan-glow/20 to-teal-glow/20 text-cyan-glow"
          defaultOpen={true}
          badge={
            <span className="badge bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20">
              {totalAssets} جهاز
            </span>
          }
        >
          {treeData?.departments.map((dept) => {
            const deptAssetCount = dept.employees.reduce(
              (s, emp) => s + emp.assets.length,
              0
            );
            return (
              <TreeNode
                key={dept.id}
                label={dept.name}
                icon={Building2}
                iconColor="bg-teal-glow/10 text-teal-glow"
                defaultOpen={false}
                depth={1}
                badge={
                  <span className="text-xs text-oasis-500">
                    {dept.employees.length} موظف • {deptAssetCount} جهاز
                  </span>
                }
              >
                {dept.employees.map((emp) => (
                  <TreeNode
                    key={emp.id}
                    label={`${emp.name}${emp.job_title ? ` — ${emp.job_title}` : ''}`}
                    icon={User}
                    iconColor="bg-blue-500/10 text-blue-400"
                    defaultOpen={false}
                    depth={2}
                    badge={
                      emp.assets.length > 0 ? (
                        <span className="badge badge-assigned text-[10px]">
                          {emp.assets.length} جهاز
                        </span>
                      ) : (
                        <span className="text-xs text-oasis-600">بدون أجهزة</span>
                      )
                    }
                  >
                    {emp.assets.length > 0 &&
                      emp.assets.map((asset: Asset) => {
                        const AssetIcon = typeIcons[asset.type] || Monitor;
                        return (
                          <div
                            key={asset.id}
                            className="flex items-center gap-3 px-4 py-2.5 mr-6 border-r-2 border-oasis-800 animate-fade-in"
                          >
                            <div className="p-1 rounded-md bg-oasis-800">
                              <AssetIcon size={14} className="text-oasis-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="mono-tag text-xs">
                                  {asset.asset_tag}
                                </span>
                                <span className="text-xs text-oasis-400">
                                  {asset.brand} {asset.model}
                                </span>
                              </div>
                              <span className="text-[10px] text-oasis-500">
                                {ASSET_TYPE_AR[asset.type]}
                                {asset.serial && ` • ${asset.serial}`}
                              </span>
                            </div>
                            <StatusBadge status={asset.status} size="sm" />
                          </div>
                        );
                      })}
                  </TreeNode>
                ))}
              </TreeNode>
            );
          })}
        </TreeNode>
      </div>
    </div>
  );
}
