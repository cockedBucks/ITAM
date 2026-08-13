'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import type { Asset, Employee } from '@/types/database';
import { ASSET_TYPE_AR } from '@/types/database';
import { ArrowRightLeft, UserCheck, RotateCcw } from 'lucide-react';

interface AssignModalProps {
  asset: Asset;
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignModal({
  asset,
  employees,
  onClose,
  onSuccess,
}: AssignModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    asset.employee_id || ''
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();

  const isAssigned = asset.status === 'Assigned' && asset.employee_id;

  const handleAssign = async () => {
    if (!selectedEmployee) {
      showToast('يرجى اختيار الموظف', 'warning');
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from('assets')
      .update({
        employee_id: selectedEmployee,
        status: 'Assigned',
        date_assigned: new Date().toISOString(),
        notes: notes || asset.notes,
      })
      .eq('id', asset.id);

    if (error) {
      showToast('فشل تسليم الجهاز', 'error');
    } else {
      showToast('تم تسليم الجهاز بنجاح', 'success');
      onSuccess();
    }
    setLoading(false);
  };

  const handleReturn = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('assets')
      .update({
        employee_id: null,
        status: 'Available',
        date_assigned: null,
        notes: notes || asset.notes,
      })
      .eq('id', asset.id);

    if (error) {
      showToast('فشل إرجاع الجهاز', 'error');
    } else {
      showToast('تم إرجاع الجهاز بنجاح', 'success');
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="تسليم وإرجاع الجهاز"
      size="md"
    >
      {/* Asset Info */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="mono-tag text-base font-bold">{asset.asset_tag}</span>
          <StatusBadge status={asset.status} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-oasis-500">النوع: </span>
            <span className="text-oasis-200">{ASSET_TYPE_AR[asset.type]}</span>
          </div>
          <div>
            <span className="text-oasis-500">العلامة: </span>
            <span className="text-oasis-200">{asset.brand} {asset.model}</span>
          </div>
          <div>
            <span className="text-oasis-500">التسلسلي: </span>
            <span className="mono-tag">{asset.serial || '—'}</span>
          </div>
          {asset.employee && (
            <div>
              <span className="text-oasis-500">المسلّم إليه: </span>
              <span className="text-oasis-200">{asset.employee.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Section */}
      {isAssigned ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-sm text-amber-400">
              هذا الجهاز مسلّم حالياً إلى <strong>{asset.employee?.name}</strong>.
              يمكنك إرجاعه أو نقله لموظف آخر.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات عن الإرجاع..."
              className="input-field h-20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReturn}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              <RotateCcw size={16} />
              إرجاع الجهاز
            </button>
            <button
              onClick={() => {
                if (selectedEmployee) handleAssign();
                else showToast('اختر موظفاً لنقل الجهاز إليه', 'warning');
              }}
              disabled={loading || !selectedEmployee}
              className="btn-primary flex-1"
            >
              <ArrowRightLeft size={16} />
              نقل لموظف آخر
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              نقل إلى موظف آخر
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="select-field"
            >
              <option value="">اختر الموظف...</option>
              {employees
                .filter((emp) => emp.id !== asset.employee_id)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department?.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              تسليم إلى
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="select-field"
            >
              <option value="">اختر الموظف...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-oasis-300 mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات عن التسليم..."
              className="input-field h-20 resize-none"
            />
          </div>

          <button
            onClick={handleAssign}
            disabled={loading || !selectedEmployee}
            className="btn-primary w-full"
          >
            <UserCheck size={16} />
            تسليم الجهاز
          </button>
        </div>
      )}
    </Modal>
  );
}
