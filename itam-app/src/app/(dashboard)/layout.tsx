'use client';

import Sidebar from '@/components/ui/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import InteractiveTechBg from '@/components/ui/InteractiveTechBg';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen">
        <InteractiveTechBg />
        <Sidebar />
        <main className="relative z-10 flex-1 transition-all duration-300 ease-in-out p-4 lg:p-8 overflow-x-hidden lg:mr-[230px]">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
