'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { exportAssetsToCSV } from '@/lib/export';
import {
  Monitor,
  Search,
  Plus,
  Download,
  QrCode,
  ScanLine,
  ArrowRightLeft,
  Edit3,
  Trash2,
  Filter,
} from 'lucide-react';
import type { Asset, Employee, Department, AssetType, AssetStatus } from '@/types/database';
import { ASSET_TYPE_AR, ASSET_STATUS_AR } from '@/types/database';
import AssignModal from '@/components/assets/AssignModal';
import QRModal from '@/components/assets/QRModal';
import QRScanner from '@/components/assets/QRScanner';
import AssetFormModal from '@/components/assets/AssetFormModal';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');

  // Modal states
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const supabase = createClient();
  const { showToast } = useToast();

  const loadAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*, employee:employees(*, department:departments(*))')
      .order('created_at', { ascending: false });

    if (data) setAssets(data as Asset[]);
    if (error) showToast('خطأ في تحميل الأصول', 'error');
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*, department:departments(*)')
      .order('name');
    if (data) setEmployees(data as Employee[]);
  };

  const loadDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data as Department[]);
  };

  useEffect(() => {
    Promise.all([loadAssets(), loadEmployees(), loadDepartments()]).then(() =>
      setLoading(false)
    );
  }, []);

  // Filter logic
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        asset.asset_tag.toLowerCase().includes(searchLower) ||
        (asset.serial && asset.serial.toLowerCase().includes(searchLower)) ||
        (asset.brand && asset.brand.toLowerCase().includes(searchLower)) ||
        (asset.model && asset.model.toLowerCase().includes(searchLower)) ||
        (asset.employee?.name && asset.employee.name.includes(search));

      const matchesType = !filterType || asset.type === filterType;
      const matchesStatus = !filterStatus || asset.status === filterStatus;
      const matchesDept =
        !filterDept || asset.employee?.department?.id === filterDept;

      return matchesSearch && matchesType && matchesStatus && matchesDept;
    });
  }, [assets, search, filterType, filterStatus, filterDept]);

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`هل أنت متأكد من حذف الأصل ${asset.asset_tag}؟`)) return;
    const { error } = await supabase.from('assets').delete().eq('id', asset.id);
    if (error) {
      showToast('فشل حذف الأصل — قد يكون مرتبطاً بسجلات أخرى', 'error');
    } else {
      showToast('تم حذف الأصل بنجاح', 'success');
      loadAssets();
    }
  };

  const handleScanResult = (tag: string) => {
    setSearch(tag);
    setShowScanner(false);
    showToast(`تم مسح: ${tag}`, 'info');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Monitor size={26} className="text-cyan-glow" />
            إدارة الأصول
          </h1>
          <p className="text-sm text-oasis-400 mt-1">
            {filteredAssets.length} من {assets.length} أصل
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowScanner(true)} className="btn-secondary">
            <ScanLine size={16} />
            ماسح QR
          </button>
          <button onClick={() => exportAssetsToCSV(filteredAssets)} className="btn-secondary">
            <Download size={16} />
            تصدير CSV
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            <Plus size={16} />
            إضافة أصل
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3 text-sm text-oasis-400">
          <Filter size={16} />
          <span>تصفية النتائج</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-oasis-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، الرقم التسلسلي، رقم الأصل..."
              className="input-field pr-10"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field"
          >
            <option value="">جميع الأنواع</option>
            {Object.entries(ASSET_TYPE_AR).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-field"
          >
            <option value="">جميع الحالات</option>
            {Object.entries(ASSET_STATUS_AR).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="select-field"
          >
            <option value="">جميع الأقسام</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الأصل</th>
              <th>النوع</th>
              <th>العلامة التجارية</th>
              <th>الرقم التسلسلي</th>
              <th>الحالة</th>
              <th>الموظف</th>
              <th>القسم</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-oasis-500">
                  لا توجد نتائج مطابقة للبحث
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td className="mono-tag font-semibold">{asset.asset_tag}</td>
                  <td>{ASSET_TYPE_AR[asset.type]}</td>
                  <td>
                    <span className="text-oasis-200">{asset.brand}</span>
                    {asset.model && (
                      <span className="text-oasis-500 text-xs mr-1">
                        {asset.model}
                      </span>
                    )}
                  </td>
                  <td className="mono-tag">{asset.serial || '—'}</td>
                  <td>
                    <StatusBadge status={asset.status} size="sm" />
                  </td>
                  <td>{asset.employee?.name || '—'}</td>
                  <td className="text-oasis-400 text-xs">
                    {asset.employee?.department?.name || '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAssignAsset(asset)}
                        className="btn-ghost p-1.5"
                        title="تسليم / إرجاع"
                      >
                        <ArrowRightLeft size={15} className="text-teal-glow" />
                      </button>
                      <button
                        onClick={() => setQrAsset(asset)}
                        className="btn-ghost p-1.5"
                        title="رمز QR"
                      >
                        <QrCode size={15} className="text-cyan-glow" />
                      </button>
                      <button
                        onClick={() => setEditAsset(asset)}
                        className="btn-ghost p-1.5"
                        title="تعديل"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(asset)}
                        className="btn-ghost p-1.5"
                        title="حذف"
                      >
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {assignAsset && (
        <AssignModal
          asset={assignAsset}
          employees={employees}
          onClose={() => setAssignAsset(null)}
          onSuccess={() => {
            setAssignAsset(null);
            loadAssets();
          }}
        />
      )}

      {qrAsset && (
        <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />
      )}

      {showScanner && (
        <QRScanner
          onClose={() => setShowScanner(false)}
          onScan={handleScanResult}
        />
      )}

      {(showAddForm || editAsset) && (
        <AssetFormModal
          asset={editAsset}
          departments={departments}
          employees={employees}
          onClose={() => {
            setShowAddForm(false);
            setEditAsset(null);
          }}
          onSuccess={() => {
            setShowAddForm(false);
            setEditAsset(null);
            loadAssets();
          }}
        />
      )}
    </div>
  );
}
