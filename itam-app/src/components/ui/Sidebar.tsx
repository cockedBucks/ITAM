'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Monitor,
  Users,
  GitBranch,
  History,
  LogOut,
  Menu,
  X,
  Shield,
  Headset,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/assets', label: 'إدارة الأصول', icon: Monitor },
  { href: '/employees', label: 'الموظفون والأقسام', icon: Users },
  { href: '/tree', label: 'العرض الهرمي', icon: GitBranch },
  { href: '/history', label: 'سجل الحركة', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data as Profile);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-xl bg-oasis-800 border border-oasis-700 text-oasis-300 hover:text-white transition-colors"
        aria-label="فتح القائمة"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-screen w-[280px] bg-oasis-900/95 backdrop-blur-xl border-l border-oasis-800 flex flex-col transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Close button (mobile) */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 left-4 p-1.5 rounded-lg text-oasis-400 hover:text-white hover:bg-oasis-800 transition-colors"
          aria-label="إغلاق القائمة"
        >
          <X size={20} />
        </button>

        {/* Logo / Brand */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-bl from-cyan-glow to-teal-glow flex items-center justify-center shadow-lg shadow-cyan-glow/20">
              <Monitor size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Smart Oasis</h1>
              <p className="text-[11px] text-oasis-500">IT Portal — إدارة الأصول</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'sidebar-link',
                  isActive && 'active'
                )}
              >
                <item.icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-oasis-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-bl from-cyan-glow/20 to-teal-glow/20 border border-cyan-glow/30 flex items-center justify-center">
              {profile?.role === 'admin' ? (
                <Shield size={16} className="text-cyan-glow" />
              ) : (
                <Headset size={16} className="text-teal-glow" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-oasis-200 truncate">
                {profile?.full_name || userEmail || 'المستخدم'}
              </p>
              <p className="text-[11px] text-oasis-500">
                {profile?.role === 'admin' ? 'مدير النظام' : 'الدعم الفني'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-oasis-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
