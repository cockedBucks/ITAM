'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import type { Asset, Department, Employee, AssetType, AssetStatus } from '@/types/database';
import { ASSET_TYPE_AR, ASSET_STATUS_AR } from '@/types/database';
import { Save, Plus } from 'lucide-react';
import { generateAssetTag } from '@/lib/utils';

interface AssetFormModalProps {
  asset: Asset | null; // null = add mode
  departments: Department[];
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssetFormModal({
  asset,
  departments,
  employees,
  onClose,
  onSuccess,
}: AssetFormModalProps) {
  const isEdit = !!asset;
  const [form, setForm] = useState({
    asset_tag: asset?.asset_tag || generateAssetTag(),
    type: (asset?.type || 'Laptop') as AssetType,
    brand: asset?.brand || '',
    model: asset?.model || '',
    serial: asset?.serial || '',
    status: (asset?.status || 'Available') as AssetStatus,
    employee_id: asset?.employee_id || '',
    notes: asset?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      asset_tag: form.asset_tag,
      type: form.type,
      brand: form.brand || null,
      model: form.model || null,
      serial: form.serial || null,
      status: form.status,
      employee_id: form.employee_id || null,
      notes: form.notes || null,
      date_assigned:
        form.status === 'Assigned' && form.employee_id
          ? new Date().toISOString()
          : null,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase
        .from('assets')
        .update(payload)
        .eq('id', asset!.id));
    } else {
      ({ error } = await supabase.from('assets').insert(payload));
    }

    if (error) {
      if (error.message.includes('duplicate')) {
        showToast('رقم الأصل أو الرقم التسلسلي مكرر', 'error');
      } else {
        showToast(`فشل ${isEdit ? 'تعديل' : 'إضافة'} الأصل`, 'error');
      }
    } else {
      showToast(`تم ${isEdit ? 'تعديل' : 'إضافة'} الأصل بنجاح`, 'success');
      onSuccess();
    }
    setLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'تعديل الأصل' : 'إضافة أصل جديد'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Asset Tag */}
          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              رقم الأصل *
            </label>
            <input
              value={form.asset_tag}
              onChange={(e) => updateField('asset_tag', e.target.value)}
              className="input-field font-mono text-cyan-glow"
              required
              dir="ltr"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              النوع *
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="select-field"
            >
              {Object.entries(ASSET_TYPE_AR).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              العلامة التجارية
            </label>
            <input
              value={form.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="Dell, HP, Lenovo..."
              className="input-field"
              dir="ltr"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              الموديل
            </label>
            <input
              value={form.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="Latitude 5540..."
              className="input-field"
              dir="ltr"
            />
          </div>

          {/* Serial */}
          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              الرقم التسلسلي
            </label>
            <input
              value={form.serial}
              onChange={(e) => updateField('serial', e.target.value)}
              placeholder="SN-XXXXXXXXXX"
              className="input-field font-mono"
              dir="ltr"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              الحالة *
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="select-field"
            >
              {Object.entries(ASSET_STATUS_AR).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Employee */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              الموظف المسلّم إليه
            </label>
            <select
              value={form.employee_id}
              onChange={(e) => updateField('employee_id', e.target.value)}
              className="select-field"
            >
              <option value="">— بدون موظف —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              ملاحظات
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="ملاحظات إضافية عن الأصل..."
              className="input-field h-20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            إلغاء
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {isEdit ? <Save size={16} /> : <Plus size={16} />}
            {isEdit ? 'حفظ التعديلات' : 'إضافة الأصل'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
