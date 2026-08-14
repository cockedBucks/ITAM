'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import CampusMapView from '@/components/tree/CampusMapView';
import type { Department, Employee, Asset } from '@/types/database';

interface TreeData {
  departments: (Department & {
    employees: (Employee & { assets: Asset[] })[];
  })[];
}

export default function MapPage() {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTree() {
      const { data: depts } = await supabase
        .from('departments')
        .select('*')
        .order('name');

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

  return (
    <div className="-m-4 lg:-m-8 h-screen relative overflow-hidden">
      <CampusMapView treeData={treeData} />
    </div>
  );
}

