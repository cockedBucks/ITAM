// src/types/database.ts
// Smart Oasis ITAM — Database Types

export type AssetType = 'Laptop' | 'Monitor' | 'Keyboard' | 'Mouse' | 'Printer' | 'Phone' | 'Tablet' | 'Other';
export type AssetStatus = 'Assigned' | 'Available' | 'Maintenance' | 'Missing';
export type UserRole = 'admin' | 'helpdesk';

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  department_id: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  // Joined fields
  department?: Department;
  device_count?: number;
}

export interface Asset {
  id: string;
  type: AssetType;
  brand: string | null;
  model: string | null;
  serial: string | null;
  asset_tag: string;
  status: AssetStatus;
  employee_id: string | null;
  date_assigned: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  employee?: Employee;
}

export interface AuditLog {
  id: string;
  asset_id: string | null;
  action: string;
  old_status: AssetStatus | null;
  new_status: AssetStatus | null;
  old_employee_id: string | null;
  new_employee_id: string | null;
  performed_by: string | null;
  note: string | null;
  created_at: string;
  // Joined fields
  asset?: Asset;
  old_employee?: Employee;
  new_employee?: Employee;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  total_assets: number;
  assigned_count: number;
  available_count: number;
  maintenance_count: number;
  missing_count: number;
}

export interface AssetsPerDepartment {
  department_id: string;
  department_name: string;
  asset_count: number;
}

export interface AttentionAlert {
  id: string;
  asset_tag: string;
  serial: string | null;
  type: AssetType;
  brand: string | null;
  model: string | null;
  status: AssetStatus;
  date_assigned: string | null;
  employee_name: string | null;
  department_name: string | null;
  alert_type: string;
  severity: 'danger' | 'warning' | 'info';
}

// Tree view types
export interface TreeDepartment {
  id: string;
  name: string;
  employees: TreeEmployee[];
}

export interface TreeEmployee {
  id: string;
  name: string;
  job_title: string | null;
  assets: Asset[];
}

// Arabic label maps
export const ASSET_TYPE_AR: Record<AssetType, string> = {
  Laptop: 'لابتوب',
  Monitor: 'شاشة',
  Keyboard: 'لوحة مفاتيح',
  Mouse: 'فأرة',
  Printer: 'طابعة',
  Phone: 'هاتف',
  Tablet: 'جهاز لوحي',
  Other: 'أخرى',
};

export const ASSET_STATUS_AR: Record<AssetStatus, string> = {
  Assigned: 'مسلّمة',
  Available: 'متاحة',
  Maintenance: 'في الصيانة',
  Missing: 'مفقودة',
};

export const USER_ROLE_AR: Record<UserRole, string> = {
  admin: 'مدير النظام',
  helpdesk: 'الدعم الفني',
};
