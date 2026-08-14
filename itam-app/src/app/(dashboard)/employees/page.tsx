'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  Users,
  Building2,
  Plus,
  Edit3,
  Trash2,
  Save,
  Monitor,
  UserPlus,
  Search,
} from 'lucide-react';
import type { Department, Employee } from '@/types/database';

export default function EmployeesPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<(Employee & { device_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');

  // Modal states
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  // Form states
  const [empForm, setEmpForm] = useState({
    name: '', department_id: '', job_title: '', email: '', phone: '',
  });
  const [deptName, setDeptName] = useState('');

  const [empSearch, setEmpSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const supabase = createClient();
  const { showToast } = useToast();

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
      (emp.job_title || '').toLowerCase().includes(empSearch.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(empSearch.toLowerCase());
    const matchesDept = !selectedDept || emp.department?.name === selectedDept;
    return matchesSearch && matchesDept;
  });

  const loadData = async () => {
    const [{ data: depts }, { data: emps }] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('v_employee_device_count').select('*').order('employee_name'),
    ]);
    if (depts) setDepartments(depts as Department[]);
    if (emps) setEmployees(emps.map((e: any) => ({
      id: e.employee_id,
      name: e.employee_name,
      department_id: '',
      job_title: e.job_title,
      email: null,
      phone: null,
      created_at: '',
      department: { id: '', name: e.department_name, created_at: '' },
      device_count: e.device_count,
    })) as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Department CRUD
  const handleSaveDept = async () => {
    if (!deptName.trim()) return;
    let error;
    if (editDept) {
      ({ error } = await supabase.from('departments').update({ name: deptName }).eq('id', editDept.id));
    } else {
      ({ error } = await supabase.from('departments').insert({ name: deptName }));
    }
    if (error) {
      showToast(error.message.includes('duplicate') ? 'اسم القسم موجود بالفعل' : 'فشل حفظ القسم', 'error');
    } else {
      showToast(`تم ${editDept ? 'تعديل' : 'إضافة'} القسم بنجاح`, 'success');
      setShowDeptModal(false);
      setEditDept(null);
      setDeptName('');
      loadData();
    }
  };

  const handleDeleteDept = async (dept: Department) => {
    if (!confirm(`هل أنت متأكد من حذف قسم "${dept.name}"؟`)) return;
    const { error } = await supabase.from('departments').delete().eq('id', dept.id);
    if (error) {
      showToast('لا يمكن حذف القسم — يوجد موظفون مرتبطون به', 'error');
    } else {
      showToast('تم حذف القسم بنجاح', 'success');
      loadData();
    }
  };

  // Employee CRUD
  const handleSaveEmp = async () => {
    if (!empForm.name.trim() || !empForm.department_id) {
      showToast('يرجى إدخال الاسم واختيار القسم', 'warning');
      return;
    }
    let error;
    const payload = {
      name: empForm.name,
      department_id: empForm.department_id,
      job_title: empForm.job_title || null,
      email: empForm.email || null,
      phone: empForm.phone || null,
    };
    if (editEmp) {
      ({ error } = await supabase.from('employees').update(payload).eq('id', editEmp.id));
    } else {
      ({ error } = await supabase.from('employees').insert(payload));
    }
    if (error) {
      showToast('فشل حفظ بيانات الموظف', 'error');
    } else {
      showToast(`تم ${editEmp ? 'تعديل' : 'إضافة'} الموظف بنجاح`, 'success');
      setShowEmpModal(false);
      setEditEmp(null);
      setEmpForm({ name: '', department_id: '', job_title: '', email: '', phone: '' });
      loadData();
    }
  };

  const handleDeleteEmp = async (emp: Employee) => {
    if (!confirm(`هل أنت متأكد من حذف "${emp.name}"؟`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', emp.id);
    if (error) {
      showToast('لا يمكن حذف الموظف — يوجد أجهزة مسلّمة إليه', 'error');
    } else {
      showToast('تم حذف الموظف بنجاح', 'success');
      loadData();
    }
  };

  const openEditEmp = async (empView: any) => {
    // Fetch full employee data
    const { data } = await supabase.from('employees').select('*').eq('id', empView.id).single();
    if (data) {
      const emp = data as Employee;
      setEditEmp(emp);
      setEmpForm({
        name: emp.name,
        department_id: emp.department_id,
        job_title: emp.job_title || '',
        email: emp.email || '',
        phone: emp.phone || '',
      });
      setShowEmpModal(true);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={26} className="text-cyan-glow" />
            الموظفون والأقسام
          </h1>
          <p className="text-sm text-oasis-400 mt-1">إدارة الموظفين وأقسام المؤسسة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-oasis-800 pb-0">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'employees'
              ? 'border-cyan-glow text-cyan-glow'
              : 'border-transparent text-oasis-400 hover:text-oasis-200'
            }`}
        >
          <Users size={16} className="inline ml-2" />
          الموظفون ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'departments'
              ? 'border-cyan-glow text-cyan-glow'
              : 'border-transparent text-oasis-400 hover:text-oasis-200'
            }`}
        >
          <Building2 size={16} className="inline ml-2" />
          الأقسام ({departments.length})
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="input-field pr-4 pl-10 text-right w-full"
                  dir="rtl"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-oasis-500 pointer-events-none" />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="select-field text-right w-full sm:w-48"
                dir="rtl"
              >
                <option value="">جميع الأقسام</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Action button */}
            <button
              onClick={() => {
                setEditEmp(null);
                setEmpForm({ name: '', department_id: '', job_title: '', email: '', phone: '' });
                setShowEmpModal(true);
              }}
              className="btn-primary shrink-0 w-full md:w-auto"
            >
              <UserPlus size={16} />
              إضافة موظف
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>القسم</th>
                  <th>المسمى الوظيفي</th>
                  <th>الأجهزة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-medium text-oasis-200">{emp.name}</td>
                    <td className="text-oasis-400">{emp.department?.name}</td>
                    <td className="text-oasis-400">{emp.job_title || '—'}</td>
                    <td>
                      <span className={`badge ${emp.device_count > 0 ? 'badge-assigned' : 'bg-oasis-800 text-oasis-500 border border-oasis-700'}`}>
                        <Monitor size={12} />
                        {emp.device_count} جهاز
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditEmp(emp)} className="btn-ghost p-1.5" title="تعديل">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDeleteEmp(emp)} className="btn-ghost p-1.5" title="حذف">
                          <Trash2 size={15} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditDept(null);
                setDeptName('');
                setShowDeptModal(true);
              }}
              className="btn-primary"
            >
              <Plus size={16} />
              إضافة قسم
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="card-hover p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-glow/10 text-cyan-glow">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{dept.name}</h3>
                      <p className="text-xs text-oasis-500">
                        {employees.filter((e) => e.department?.name === dept.name).length} موظف
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditDept(dept);
                        setDeptName(dept.name);
                        setShowDeptModal(true);
                      }}
                      className="btn-ghost p-1.5"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteDept(dept)}
                      className="btn-ghost p-1.5"
                    >
                      <Trash2 size={15} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Employee Modal */}
      {showEmpModal && (
        <Modal
          isOpen={true}
          onClose={() => { setShowEmpModal(false); setEditEmp(null); }}
          title={editEmp ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-oasis-300 mb-2">الاسم الكامل *</label>
              <input value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-oasis-300 mb-2">القسم *</label>
              <select value={empForm.department_id} onChange={(e) => setEmpForm({ ...empForm, department_id: e.target.value })} className="select-field">
                <option value="">اختر القسم...</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-oasis-300 mb-2">المسمى الوظيفي</label>
              <input value={empForm.job_title} onChange={(e) => setEmpForm({ ...empForm, job_title: e.target.value })} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-oasis-300 mb-2">البريد الإلكتروني</label>
                <input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-oasis-300 mb-2">الهاتف</label>
                <input value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} className="input-field" dir="ltr" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowEmpModal(false); setEditEmp(null); }} className="btn-secondary flex-1">إلغاء</button>
              <button onClick={handleSaveEmp} className="btn-primary flex-1">
                <Save size={16} /> {editEmp ? 'حفظ التعديلات' : 'إضافة الموظف'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <Modal
          isOpen={true}
          onClose={() => { setShowDeptModal(false); setEditDept(null); }}
          title={editDept ? 'تعديل القسم' : 'إضافة قسم جديد'}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-oasis-300 mb-2">اسم القسم *</label>
              <input value={deptName} onChange={(e) => setDeptName(e.target.value)} className="input-field" placeholder="مثال: قسم تقنية المعلومات" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeptModal(false); setEditDept(null); }} className="btn-secondary flex-1">إلغاء</button>
              <button onClick={handleSaveDept} className="btn-primary flex-1">
                <Save size={16} /> {editDept ? 'حفظ' : 'إضافة'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
