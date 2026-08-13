-- ============================================================
-- Smart Oasis ITAM — Full Database Schema
-- نظام إدارة الأصول التقنية — واحة الذكاء
-- ============================================================

-- ==================== ENUMS ====================

CREATE TYPE asset_type AS ENUM ('Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Phone', 'Tablet', 'Other');
CREATE TYPE asset_status AS ENUM ('Assigned', 'Available', 'Maintenance', 'Missing');
CREATE TYPE user_role AS ENUM ('admin', 'helpdesk');

-- ==================== TABLES ====================

-- Departments (الأقسام)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees (الموظفون)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_department ON employees(department_id);

-- Assets (الأصول)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type asset_type NOT NULL DEFAULT 'Other',
  brand TEXT,
  model TEXT,
  serial TEXT UNIQUE,
  asset_tag TEXT NOT NULL UNIQUE,
  status asset_status NOT NULL DEFAULT 'Available',
  employee_id UUID REFERENCES employees(id) ON DELETE RESTRICT,
  date_assigned TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_employee ON assets(employee_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_asset_tag ON assets(asset_tag);

-- Audit Logs (سجل الحركة)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_status asset_status,
  new_status asset_status,
  old_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  new_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  performed_by UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_asset ON audit_logs(asset_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- User Profiles (ملفات المستخدمين) — extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'helpdesk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== TRIGGER: Auto Audit Log ====================

CREATE OR REPLACE FUNCTION fn_audit_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (asset_id, action, old_status, new_status, old_employee_id, new_employee_id, note)
    VALUES (
      NEW.id,
      CASE
        WHEN NEW.status = 'Assigned' THEN 'تسليم جهاز'
        WHEN NEW.status = 'Available' THEN 'إرجاع جهاز'
        WHEN NEW.status = 'Maintenance' THEN 'نقل للصيانة'
        WHEN NEW.status = 'Missing' THEN 'إبلاغ عن فقدان'
        ELSE 'تغيير حالة'
      END,
      OLD.status,
      NEW.status,
      OLD.employee_id,
      NEW.employee_id,
      'تغيير تلقائي عبر النظام'
    );
  -- Log employee assignment changes (without status change)
  ELSIF OLD.employee_id IS DISTINCT FROM NEW.employee_id THEN
    INSERT INTO audit_logs (asset_id, action, old_status, new_status, old_employee_id, new_employee_id, note)
    VALUES (
      NEW.id,
      CASE
        WHEN NEW.employee_id IS NULL THEN 'إلغاء تسليم'
        WHEN OLD.employee_id IS NULL THEN 'تسليم جهاز'
        ELSE 'نقل جهاز بين موظفين'
      END,
      OLD.status,
      NEW.status,
      OLD.employee_id,
      NEW.employee_id,
      'تغيير تلقائي عبر النظام'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_asset_changes
  AFTER UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_asset_changes();

-- ==================== TRIGGER: Auto-create profile on signup ====================

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'helpdesk')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION fn_handle_new_user();

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, only update their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Departments: all authenticated can read; admin can write
CREATE POLICY "departments_select" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_insert" ON departments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "departments_update" ON departments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "departments_delete" ON departments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Employees: all authenticated can read; admin can write
CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert" ON employees FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'helpdesk')));
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'helpdesk')));
CREATE POLICY "employees_delete" ON employees FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Assets: all authenticated can read; admin & helpdesk can write
CREATE POLICY "assets_select" ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "assets_insert" ON assets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'helpdesk')));
CREATE POLICY "assets_update" ON assets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'helpdesk')));
CREATE POLICY "assets_delete" ON assets FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Audit Logs: all authenticated can read; system inserts via trigger (SECURITY DEFINER)
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'helpdesk')));

-- ==================== VIEWS ====================

-- Dashboard stats view
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  COUNT(*) AS total_assets,
  COUNT(*) FILTER (WHERE status = 'Assigned') AS assigned_count,
  COUNT(*) FILTER (WHERE status = 'Available') AS available_count,
  COUNT(*) FILTER (WHERE status = 'Maintenance') AS maintenance_count,
  COUNT(*) FILTER (WHERE status = 'Missing') AS missing_count
FROM assets;

-- Assets per department view
CREATE OR REPLACE VIEW v_assets_per_department AS
SELECT
  d.id AS department_id,
  d.name AS department_name,
  COUNT(a.id) AS asset_count
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
LEFT JOIN assets a ON a.employee_id = e.id
GROUP BY d.id, d.name
ORDER BY asset_count DESC;

-- Employee device count view
CREATE OR REPLACE VIEW v_employee_device_count AS
SELECT
  e.id AS employee_id,
  e.name AS employee_name,
  e.job_title,
  d.name AS department_name,
  COUNT(a.id) AS device_count
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
LEFT JOIN assets a ON a.employee_id = e.id
GROUP BY e.id, e.name, e.job_title, d.name;

-- Stale assignments (> 500 days)
CREATE OR REPLACE VIEW v_stale_assignments AS
SELECT
  a.id, a.asset_tag, a.serial, a.type, a.brand, a.model,
  a.status, a.date_assigned,
  e.name AS employee_name,
  d.name AS department_name,
  EXTRACT(DAY FROM (now() - a.date_assigned)) AS days_assigned
FROM assets a
LEFT JOIN employees e ON e.id = a.employee_id
LEFT JOIN departments d ON d.id = e.department_id
WHERE a.status = 'Assigned'
  AND a.date_assigned IS NOT NULL
  AND a.date_assigned < now() - INTERVAL '500 days';

-- Attention alerts: Missing, Maintenance, or stale
CREATE OR REPLACE VIEW v_attention_alerts AS
SELECT
  a.id, a.asset_tag, a.serial, a.type, a.brand, a.model,
  a.status, a.date_assigned,
  e.name AS employee_name,
  d.name AS department_name,
  CASE
    WHEN a.status = 'Missing' THEN 'مفقود'
    WHEN a.status = 'Maintenance' THEN 'في الصيانة'
    WHEN a.status = 'Assigned' AND a.date_assigned < now() - INTERVAL '500 days' THEN 'تسليم قديم'
    ELSE 'تنبيه'
  END AS alert_type,
  CASE
    WHEN a.status = 'Missing' THEN 'danger'
    WHEN a.status = 'Maintenance' THEN 'warning'
    ELSE 'info'
  END AS severity
FROM assets a
LEFT JOIN employees e ON e.id = a.employee_id
LEFT JOIN departments d ON d.id = e.department_id
WHERE a.status IN ('Missing', 'Maintenance')
   OR (a.status = 'Assigned' AND a.date_assigned < now() - INTERVAL '500 days');
