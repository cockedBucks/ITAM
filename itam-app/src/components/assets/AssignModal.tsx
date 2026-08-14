'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import EmployeeSelect from '@/components/ui/EmployeeSelect';
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
      size="lg"
    >
      {/* Asset Info Header */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="mono-tag text-base font-bold">{asset.asset_tag}</span>
          <StatusBadge status={asset.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-oasis-500">النوع: </span>
            <span className="text-oasis-200 font-medium">{ASSET_TYPE_AR[asset.type]}</span>
          </div>
          <div>
            <span className="text-oasis-500">العلامة: </span>
            <span className="text-oasis-200 font-medium">{asset.brand} {asset.model}</span>
          </div>
          <div>
            <span className="text-oasis-500">التسلسلي: </span>
            <span className="mono-tag">{asset.serial || '—'}</span>
          </div>
          {asset.employee && (
            <div>
              <span className="text-oasis-500">المسلّم إليه: </span>
              <span className="text-cyan-300 font-bold">{asset.employee.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Section */}
      {isAssigned ? (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <p className="text-amber-300">
              هذا الجهاز مسلّم حالياً إلى <strong className="text-white">{asset.employee?.name}</strong>.
              يمكنك إرجاعه للمخزن أو اختيار موظف جديد لنقل ملكية الجهاز إليه.
            </p>
          </div>

          <EmployeeSelect
            employees={employees}
            selectedId={selectedEmployee}
            onSelect={setSelectedEmployee}
            label="اختر موظفاً لنقل الجهاز إليه"
            excludeId={asset.employee_id || undefined}
            maxItems={4}
          />

          <div>
            <label className="block text-xs font-semibold text-oasis-300 mb-1.5">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات عن عملية النقل أو الإرجاع..."
              className="input-field h-16 text-xs resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReturn}
              disabled={loading}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold"
            >
              <RotateCcw size={16} />
              إرجاع الجهاز للمخزن
            </button>
            <button
              onClick={() => {
                if (selectedEmployee && selectedEmployee !== asset.employee_id) handleAssign();
                else showToast('اختر موظفاً آخر لنقل الجهاز إليه', 'warning');
              }}
              disabled={loading || !selectedEmployee || selectedEmployee === asset.employee_id}
              className="btn-primary flex-1 py-2.5 text-xs font-bold"
            >
              <ArrowRightLeft size={16} />
              تأكيد نقل الجهاز
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <EmployeeSelect
            employees={employees}
            selectedId={selectedEmployee}
            onSelect={setSelectedEmployee}
            label="تسليم الجهاز إلى موظف"
            maxItems={4}
          />

          <div>
            <label className="block text-xs font-semibold text-oasis-300 mb-1.5">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات عن تسليم الجهاز..."
              className="input-field h-16 text-xs resize-none"
            />
          </div>

          <button
            onClick={handleAssign}
            disabled={loading || !selectedEmployee}
            className="btn-primary w-full py-2.5 text-xs font-bold"
          >
            <UserCheck size={16} />
            تأكيد تسليم الجهاز
          </button>
        </div>
      )}
    </Modal>
  );
}
