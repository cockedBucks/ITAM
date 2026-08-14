'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Map,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import Logo from '@/components/ui/Logo';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/assets', label: 'إدارة الأصول', icon: Monitor },
  { href: '/employees', label: 'الموظفون والأقسام', icon: Users },
  { href: '/tree', label: 'العرض الهرمي', icon: GitBranch },
  { href: '/map', label: 'خريطة الحرم', icon: Map },
  { href: '/history', label: 'سجل الحركة', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
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
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Hamburger Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-xl bg-oasis-900 border border-oasis-700 text-oasis-300 hover:text-white transition-colors shadow-lg"
        aria-label="فتح القائمة"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-screen w-[230px] flex flex-col transition-transform duration-300 ease-in-out select-none overflow-hidden',
          'bg-[#030712]/70 backdrop-blur-2xl border-l border-cyan-500/15 shadow-[0_0_50px_rgba(6,182,212,0.1)]',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Smooth Blending Color Layer Orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-0 w-44 h-44 bg-purple-600/15 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-52 h-52 bg-teal-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Close Button (Mobile) */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 left-4 p-1.5 rounded-lg text-oasis-400 hover:text-white hover:bg-oasis-800/60 transition-colors"
          aria-label="إغلاق القائمة"
        >
          <X size={20} />
        </button>

        {/* Logo / Brand Header */}
        <div className="p-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-center gap-3">
            <div className="shrink-0 flex items-center justify-center">
              <Logo size={46} className="text-cyan-glow drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" animated={false} />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-widest bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                ITAM
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'relative group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                    : 'text-oasis-400 hover:text-white hover:bg-white/5 hover:border hover:border-white/10'
                )}
              >
                <item.icon
                  size={17}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-cyan-400' : 'text-oasis-400 group-hover:text-cyan-300'
                  )}
                />
                <span className="truncate">{item.label}</span>

                {/* Active Indicator Glow Pill */}
                {isActive && (
                  <div className="absolute left-1.5 w-1.5 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User / Profile Footer */}
        <div className="p-3.5 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-bl from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
              {profile?.role === 'admin' ? (
                <Shield size={14} className="text-cyan-400" />
              ) : (
                <Headset size={14} className="text-teal-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {profile?.full_name || userEmail || 'المستخدم'}
              </p>
              <p className="text-[10px] text-oasis-500 truncate">
                {profile?.role === 'admin' ? 'مدير النظام' : 'الدعم الفني'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-oasis-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all rounded-xl border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
