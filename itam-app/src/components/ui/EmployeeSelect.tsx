'use client';

import { useState, useMemo } from 'react';
import type { Employee } from '@/types/database';
import { Search, User, Building2, Check, X, Briefcase } from 'lucide-react';

interface EmployeeSelectProps {
  employees: Employee[];
  selectedId: string;
  onSelect: (employeeId: string) => void;
  label?: string;
  placeholder?: string;
  excludeId?: string;
  maxItems?: number;
}

export default function EmployeeSelect({
  employees,
  selectedId,
  onSelect,
  label = 'اختر الموظف',
  placeholder = 'ابحث بالاسم، القسم، المسمى الوظيفي...',
  excludeId,
  maxItems = 4,
}: EmployeeSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Available employees (filtered by excluded ID if any)
  const availableEmployees = useMemo(() => {
    if (!excludeId) return employees;
    return employees.filter((emp) => emp.id !== excludeId);
  }, [employees, excludeId]);

  // Extract unique departments for filter pills
  const departments = useMemo(() => {
    const deptMap = new Map<string, string>();
    availableEmployees.forEach((emp) => {
      if (emp.department?.id && emp.department?.name) {
        deptMap.set(emp.department.id, emp.department.name);
      }
    });
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [availableEmployees]);

  // Filtered list based on search and department
  const filteredEmployees = useMemo(() => {
    return availableEmployees.filter((emp) => {
      const matchesDept =
        selectedDept === 'ALL' || emp.department_id === selectedDept;

      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        (emp.department?.name && emp.department.name.toLowerCase().includes(q)) ||
        (emp.job_title && emp.job_title.toLowerCase().includes(q)) ||
        (emp.email && emp.email.toLowerCase().includes(q));

      return matchesDept && matchesSearch;
    });
  }, [availableEmployees, searchTerm, selectedDept]);

  // Find currently selected employee object
  const selectedEmployee = useMemo(() => {
    return employees.find((emp) => emp.id === selectedId);
  }, [employees, selectedId]);

  return (
    <div className="space-y-2.5">
      {label && (
        <label className="block text-xs font-semibold text-oasis-200">
          {label}
        </label>
      )}

      {/* Selected Employee Banner (if selected) */}
      {selectedEmployee && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-white backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-cyan-500/20">
              {selectedEmployee.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-cyan-200 truncate">
                  {selectedEmployee.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  محدد
                </span>
              </div>
              <p className="text-[10px] text-oasis-400 truncate">
                {selectedEmployee.department?.name || 'بدون قسم'} {selectedEmployee.job_title ? `• ${selectedEmployee.job_title}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect('')}
            className="p-1 rounded-lg text-oasis-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="إلغاء الاختيار"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-oasis-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-9 pl-8 py-1.5 rounded-lg bg-[#090d16]/90 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-oasis-500 transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-oasis-400 hover:text-white"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Department Filter Chips (Flex-Wrap so ALL departments are visible) */}
      {departments.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setSelectedDept('ALL')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              selectedDept === 'ALL'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'bg-white/5 text-oasis-400 hover:bg-white/10 hover:text-oasis-200 border border-white/5'
            }`}
          >
            الكل ({availableEmployees.length})
          </button>

          {departments.map((dept) => {
            const count = availableEmployees.filter((e) => e.department_id === dept.id).length;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedDept(dept.id)}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  selectedDept === dept.id
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-white/5 text-oasis-400 hover:bg-white/10 hover:text-oasis-200 border border-white/5'
                }`}
              >
                {dept.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable Employees List (All employees scrollable) */}
      <div className="max-h-[220px] overflow-y-auto space-y-1 border border-white/5 rounded-xl p-1.5 bg-[#050811]/60 pr-1 scrollbar-thin">
        {filteredEmployees.length === 0 ? (
          <div className="py-4 text-center text-xs text-oasis-400">
            <User size={20} className="mx-auto mb-1 opacity-30 text-cyan-400" />
            <p>لا يوجد موظفين مطابقين</p>
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const isSelected = emp.id === selectedId;
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => onSelect(emp.id)}
                className={`w-full text-right p-1.5 rounded-lg border transition-all duration-150 flex items-center justify-between gap-2 group ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                    : 'bg-white/[0.02] border-white/5 text-oasis-300 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-[11px] font-bold ${
                      isSelected
                        ? 'bg-cyan-500 text-black'
                        : 'bg-white/5 text-cyan-300 border border-white/10'
                    }`}
                  >
                    {emp.name.slice(0, 2)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate group-hover:text-cyan-200">
                      {emp.name}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] text-oasis-400">
                      {emp.department?.name && (
                        <span className="flex items-center gap-0.5">
                          <Building2 size={9} className="text-cyan-400" />
                          {emp.department.name}
                        </span>
                      )}
                      {emp.job_title && (
                        <span className="flex items-center gap-0.5 text-oasis-500">
                          <Briefcase size={9} />
                          {emp.job_title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
