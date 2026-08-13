import Sidebar from '@/components/ui/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:mr-[280px] p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
