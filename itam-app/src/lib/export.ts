// src/lib/export.ts
// CSV export utility with UTF-8 BOM for Arabic support
import { Asset, ASSET_TYPE_AR, ASSET_STATUS_AR } from '@/types/database';

export function exportAssetsToCSV(assets: Asset[], filename?: string) {
  // UTF-8 BOM for proper Arabic display in Excel
  const BOM = '\uFEFF';

  const headers = [
    'رقم الأصل',
    'النوع',
    'العلامة التجارية',
    'الموديل',
    'الرقم التسلسلي',
    'الحالة',
    'الموظف',
    'القسم',
    'تاريخ التسليم',
    'ملاحظات',
  ];

  const rows = assets.map((asset) => [
    asset.asset_tag,
    ASSET_TYPE_AR[asset.type],
    asset.brand || '',
    asset.model || '',
    asset.serial || '',
    ASSET_STATUS_AR[asset.status],
    asset.employee?.name || '',
    asset.employee?.department?.name || '',
    asset.date_assigned
      ? new Date(asset.date_assigned).toLocaleDateString('ar-SA')
      : '',
    asset.notes || '',
  ]);

  const csvContent =
    BOM +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `smart-oasis-assets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
